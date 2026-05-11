import { API_URL } from '@/lib/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register or tear down Web Push to match the user's preference (after saving settings).
 */
export async function syncWebPushSubscription(accessToken: string, enabled: boolean): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    if (enabled) {
      throw new Error('Push notifications are not supported in this browser.');
    }
    return;
  }

  const reg = await navigator.serviceWorker.register('/sw.js');

  if (!enabled) {
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await fetch(`${API_URL}/api/notifications/push/unsubscribe/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const vapidRes = await fetch(`${API_URL}/api/notifications/push/vapid-key/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!vapidRes.ok) {
    throw new Error('Could not load Web Push configuration.');
  }
  const vapidJson: { enabled?: boolean; publicKey?: string | null } = await vapidRes.json();
  if (!vapidJson.enabled || !vapidJson.publicKey) {
    throw new Error(
      'Web Push is not configured on the server. Add WEB_PUSH_PUBLIC_KEY and WEB_PUSH_PRIVATE_KEY to the backend environment.'
    );
  }

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidJson.publicKey) as BufferSource,
    });
  }

  const json = sub.toJSON();
  const subscribeRes = await fetch(`${API_URL}/api/notifications/push/subscribe/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  });
  if (!subscribeRes.ok) {
    const err = await subscribeRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to save push subscription.');
  }
}
