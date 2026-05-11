'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import ProtectedPage from '@/components/ProtectedPage';
import PageHeading from '@/components/PageHeading';
import { useAuth } from '@/contexts/auth-context';
import {
  apiGetNotifications,
  apiGetUnreadCount,
  apiMarkNotificationAsRead,
  apiDeleteNotification,
  apiClearAllNotifications,
  type Notification,
} from '@/lib/api';

export default function NotificationsPage() {
  const { getAccessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (filter === 'all') {
        fetchNotifications();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = getAccessToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const data = await apiGetNotifications(token, 100, filter === 'unread');
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const data = await apiGetUnreadCount(token);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const token = getAccessToken();
      if (!token) return;

      await apiMarkNotificationAsRead(token, notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
      alert('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      await apiMarkNotificationAsRead(token, undefined, true);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      alert('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      const token = getAccessToken();
      if (!token) return;

      await apiDeleteNotification(token, notificationId);
      
      // Update local state
      const deleted = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deleted && !deleted.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      alert('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
      return;
    }

    try {
      const token = getAccessToken();
      if (!token) return;

      await apiClearAllNotifications(token);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      alert('Failed to clear notifications');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'session_reminder':
        return '📝';
      case 'mood_insight':
        return '🧠';
      case 'weekly_report':
        return '📊';
      case 'streak_alert':
        return '🔥';
      case 'ai_suggestion':
        return '💡';
      case 'recommendation':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'session_reminder':
        return 'Session Reminder';
      case 'mood_insight':
        return 'Mood Insight';
      case 'weekly_report':
        return 'Weekly Report';
      case 'streak_alert':
        return 'Streak Alert';
      case 'ai_suggestion':
        return 'AI Suggestion';
      case 'recommendation':
        return 'Recommendation';
      default:
        return 'Notification';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const subtitleShort =
    unreadCount > 0
      ? `${unreadCount} unread · ${notifications.length} total`
      : notifications.length > 0
        ? `All caught up · ${notifications.length} saved`
        : 'Inbox is empty'

  return (
    <ProtectedPage>
      <div className="space-y-0">
        <PageHeading icon={Bell} title="Notifications" subtitle={subtitleShort} dense />

        {/* Filters + bulk actions — single compact toolbar */}
        <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 py-2 border-b border-gray-100 bg-neutral-50/80 flex flex-wrap items-center justify-between gap-2">
          <div
            className="inline-flex rounded-lg border border-gray-200/90 bg-white p-0.5 shadow-sm"
            role="group"
            aria-label="Filter notifications"
          >
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === 'all' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              All <span className="tabular-nums opacity-80">({notifications.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === 'unread' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Unread <span className="tabular-nums opacity-80">({unreadCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
                aria-label="Mark all as read"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                title="Clear all notifications"
                aria-label="Clear all notifications"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-red-200/80 bg-white text-xs font-medium text-red-600 hover:bg-red-50/80 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 space-y-3">

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-7 h-7 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        )}

        {/* Notifications List */}
        {!isLoading && (
          <>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-10 px-2">
                <Bell className="w-12 h-12 mx-auto text-neutral-200 mb-3" strokeWidth={1.25} />
                <h3 className="text-base font-semibold text-neutral-900 mb-1">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  {filter === 'unread'
                    ? "You're all caught up."
                    : 'New alerts will show up here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`group rounded-xl border transition-colors cursor-pointer ${
                      notification.is_read
                        ? 'bg-white border-neutral-200/90 hover:border-neutral-300'
                        : 'bg-sky-50/80 border-sky-200/90 hover:border-sky-300'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-2.5 sm:gap-3 p-3 sm:p-3.5">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/90 text-base shadow-sm ring-1 ring-black/5"
                        aria-hidden
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <h3 className="text-sm font-semibold text-neutral-900 leading-snug">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="shrink-0 rounded-full bg-sky-600 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-white">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
                            <span className="rounded-md bg-neutral-100/90 px-1.5 py-0.5 font-medium text-neutral-600">
                              {getNotificationTypeLabel(notification.type)}
                            </span>
                            <span className="tabular-nums text-neutral-400">{formatTime(notification.created_at)}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            {!notification.is_read && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-white/90 hover:text-neutral-800"
                                title="Mark as read"
                                aria-label="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(notification.id)}
                              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                              aria-label="Delete notification"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </ProtectedPage>
  );
}


