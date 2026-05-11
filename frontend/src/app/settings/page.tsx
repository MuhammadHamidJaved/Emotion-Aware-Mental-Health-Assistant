'use client';

import { useEffect, useMemo, useState } from 'react';
import { User as UserIcon, Bell, Lock, Palette, Sparkles, Download, Trash2, Save, Camera, Loader2, X, Plus, Settings, CloudUpload } from 'lucide-react';
import ProtectedPage from '@/components/ProtectedPage';
import PageHeading from '@/components/PageHeading';
import { useAuth } from '@/contexts/auth-context';
import {
  apiGetProfileSettings,
  apiUpdateProfileSettings,
  apiGetNotificationSettings,
  apiUpdateNotificationSettings,
  apiGetPrivacySettings,
  apiUpdatePrivacySettings,
  apiGetAppearanceSettings,
  apiUpdateAppearanceSettings,
  apiGetRecommendationSettings,
  apiUpdateRecommendationSettings,
  apiGetRecommendationOptions,
  apiExportData,
  apiDeleteAccount,
  apiCreateCheckInEntry,
  type ProfileSettings,
  type NotificationSettings,
  type PrivacySettings,
  type AppearanceSettings,
  type RecommendationSettings,
  type RecommendationOptions,
} from '@/lib/api';
import { syncPendingLocalToCloud } from '@/lib/local-check-in-store';
import { syncWebPushSubscription } from '@/lib/web-push';

const cloneRecommendationSettings = (value: RecommendationSettings): RecommendationSettings => ({
  ...value,
  music_genres: [...value.music_genres],
  favorite_artists: [...value.favorite_artists],
});

export default function SettingsPage() {
  const { logout, user, getAccessToken } = useAuth();
  const [syncingLocalCheckIns, setSyncingLocalCheckIns] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState<ProfileSettings | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [initialProfile, setInitialProfile] = useState<{ fullName: string; bio: string; profilePicture: string | null } | null>(null);

  // Notification Settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    session_reminders: true,  // Changed from assistant_reminders
    mood_insights: true,
    weekly_reports: false,
    streak_alerts: true,
    ai_suggestions: true,
    email_notifications: true,
    push_notifications: false,
  });
  const [initialNotifications, setInitialNotifications] = useState<NotificationSettings | null>(null);

  // Privacy Settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    data_collection: true,
    share_analytics: false,
    cloud_backup: true,
    storage_type: 'hybrid',
  });
  const [initialPrivacy, setInitialPrivacy] = useState<PrivacySettings | null>(null);

  // Appearance Settings
  const [theme, setTheme] = useState<AppearanceSettings>({
    mood_adaptive: true,
    dark_mode: false,
    color_scheme: 'default',
  });
  const [initialTheme, setInitialTheme] = useState<AppearanceSettings | null>(null);

  // Recommendation Personalization Settings
  const [recommendations, setRecommendations] = useState<RecommendationSettings>({
    music_language: '',
    music_genres: [],
    favorite_artists: [],
    market: 'US',
    fitness_level: 'moderate',
    age_group: null,
    content_language: 'en',
  });
  const [initialRecommendations, setInitialRecommendations] = useState<RecommendationSettings | null>(null);
  const [recOptions, setRecOptions] = useState<RecommendationOptions | null>(null);
  const [artistInput, setArtistInput] = useState('');

  const isActiveTabDirty = useMemo(() => {
    if (activeTab === 'profile') {
      if (!initialProfile) return false;
      return fullName !== initialProfile.fullName || bio !== initialProfile.bio || avatarFile !== null;
    }

    if (activeTab === 'notifications') {
      if (!initialNotifications) return false;
      return JSON.stringify(notifications) !== JSON.stringify(initialNotifications);
    }

    if (activeTab === 'privacy') {
      if (!initialPrivacy) return false;
      return JSON.stringify(privacy) !== JSON.stringify(initialPrivacy);
    }

    if (activeTab === 'appearance') {
      if (!initialTheme) return false;
      return JSON.stringify(theme) !== JSON.stringify(initialTheme);
    }

    if (activeTab === 'personalization') {
      if (!initialRecommendations) return false;
      return JSON.stringify(recommendations) !== JSON.stringify(initialRecommendations);
    }

    return false;
  }, [
    activeTab,
    avatarFile,
    bio,
    fullName,
    initialNotifications,
    initialPrivacy,
    initialProfile,
    initialRecommendations,
    initialTheme,
    notifications,
    privacy,
    recommendations,
    theme,
  ]);

  const canSave = !isLoading && !isSaving && isActiveTabDirty;

  // Load all settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        // Load all settings in parallel
        const [profile, notificationsData, privacyData, appearanceData, recData, recOptionsData] = await Promise.allSettled([
          apiGetProfileSettings(accessToken),
          apiGetNotificationSettings(accessToken),
          apiGetPrivacySettings(accessToken),
          apiGetAppearanceSettings(accessToken),
          apiGetRecommendationSettings(accessToken),
          apiGetRecommendationOptions(accessToken),
        ]);

        if (profile.status === 'fulfilled') {
          const data = profile.value;
          const profileFullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email.split('@')[0];
          setProfileData(data);
          setFullName(profileFullName);
          setEmail(data.email);
          setBio(data.bio || '');
          setPreviewUrl(data.profile_picture || null);
          setInitialProfile({
            fullName: profileFullName,
            bio: data.bio || '',
            profilePicture: data.profile_picture || null,
          });
        }

        if (notificationsData.status === 'fulfilled') {
          setNotifications(notificationsData.value);
          setInitialNotifications({ ...notificationsData.value });
        }

        if (privacyData.status === 'fulfilled') {
          setPrivacy(privacyData.value);
          setInitialPrivacy({ ...privacyData.value });
        }

        if (appearanceData.status === 'fulfilled') {
          setTheme(appearanceData.value);
          setInitialTheme({ ...appearanceData.value });
        }

        if (recData.status === 'fulfilled') {
          setRecommendations(recData.value);
          setInitialRecommendations(cloneRecommendationSettings(recData.value));
        }

        if (recOptionsData.status === 'fulfilled') {
          setRecOptions(recOptionsData.value);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!isActiveTabDirty) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Save based on active tab
      if (activeTab === 'profile') {
        const [firstName, ...rest] = fullName.trim().split(' ');
        const lastName = rest.join(' ');

        const formData = new FormData();
        formData.append('first_name', firstName || '');
        formData.append('last_name', lastName || '');
        formData.append('bio', bio);

        if (avatarFile) {
          formData.append('profile_picture', avatarFile);
        }

        const updated = await apiUpdateProfileSettings(accessToken, formData);
        const updatedFullName = `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || updated.email.split('@')[0];
        setProfileData(updated);
        setFullName(updatedFullName);
        setBio(updated.bio || '');
        setPreviewUrl(updated.profile_picture || null);
        setAvatarFile(null);
        setInitialProfile({
          fullName: updatedFullName,
          bio: updated.bio || '',
          profilePicture: updated.profile_picture || null,
        });
        alert('Profile updated successfully.');
      } else if (activeTab === 'notifications') {
        await apiUpdateNotificationSettings(accessToken, notifications);
        setInitialNotifications({ ...notifications });
        let pushNote = '';
        try {
          await syncWebPushSubscription(accessToken, notifications.push_notifications);
        } catch (pushErr) {
          console.error(pushErr);
          pushNote =
            pushErr instanceof Error ? pushErr.message : 'Push subscription could not be updated.';
          setError(pushNote);
        }
        alert(
          pushNote
            ? `Notification settings saved. Push: ${pushNote}`
            : 'Notification settings updated successfully.'
        );
      } else if (activeTab === 'privacy') {
        await apiUpdatePrivacySettings(accessToken, privacy);
        setInitialPrivacy({ ...privacy });
        alert('Privacy settings updated successfully.');
      } else if (activeTab === 'appearance') {
        await apiUpdateAppearanceSettings(accessToken, theme);
        setInitialTheme({ ...theme });
        alert('Appearance settings updated successfully.');
      } else if (activeTab === 'personalization') {
        await apiUpdateRecommendationSettings(accessToken, recommendations);
        setInitialRecommendations(cloneRecommendationSettings(recommendations));
        alert('Personalization settings updated successfully.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save settings. Please try again.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    if (activeTab === 'profile' && initialProfile) {
      setFullName(initialProfile.fullName);
      setBio(initialProfile.bio);
      setPreviewUrl(initialProfile.profilePicture);
      setAvatarFile(null);
      return;
    }

    if (activeTab === 'notifications' && initialNotifications) {
      setNotifications({ ...initialNotifications });
      return;
    }

    if (activeTab === 'privacy' && initialPrivacy) {
      setPrivacy({ ...initialPrivacy });
      return;
    }

    if (activeTab === 'appearance' && initialTheme) {
      setTheme({ ...initialTheme });
      return;
    }

    if (activeTab === 'personalization' && initialRecommendations) {
      setRecommendations(cloneRecommendationSettings(initialRecommendations));
    }
  };

  const handleSyncDeviceCheckInsToCloud = async () => {
    const accessToken = getAccessToken();
    if (!accessToken || !user?.id) {
      alert('You must be signed in to sync.');
      return;
    }
    setSyncingLocalCheckIns(true);
    try {
      const result = await syncPendingLocalToCloud(user.id, (payload) =>
        apiCreateCheckInEntry(accessToken, payload as Record<string, unknown>).then((e) => ({ id: e.id }))
      );
      const detail =
        result.uploaded === 0 && result.failed === 0
          ? 'No device-only check-ins were waiting to upload.'
          : `Uploaded ${result.uploaded} check-in(s) to the cloud.${result.failed ? ` ${result.failed} could not be uploaded.` : ''}`;
      if (result.errors.length) {
        alert(`${detail}\n${result.errors.slice(0, 3).join('\n')}`);
      } else {
        alert(detail);
      }
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Sync failed.');
    } finally {
      setSyncingLocalCheckIns(false);
    }
  };

  const handleExportData = async () => {
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      await apiExportData(accessToken);
      alert('Your data export has been downloaded as a JSON file.');
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to request data export.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      await apiDeleteAccount(accessToken);
      alert('Your account has been permanently deleted.');
      logout();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to request account deletion.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'personalization', label: 'Personalization', icon: Sparkles },
  ];

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <PageHeading
          icon={Settings}
          title="Settings"
          subtitle="Manage your account, privacy, and preferences"
          dense
        />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}

        {!isLoading && (
        <div className="space-y-3 sm:space-y-4">
          {/* Mobile: horizontal tab strip */}
          <div className="lg:hidden -mx-4 px-4 sm:-mx-6 sm:px-6 overflow-x-auto pb-1 scrollbar-thin [scrollbar-width:thin]">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation ${
                      active
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-neutral-200 bg-white text-gray-700 hover:bg-neutral-50'
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

        <div className="grid lg:grid-cols-4 gap-4 lg:gap-6 min-w-0">
          {/* Desktop sidebar */}
          <div className="hidden lg:block lg:col-span-1 min-w-0">
            <nav className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm" aria-label="Settings sections">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm border-b border-neutral-100 last:border-b-0 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-800 hover:bg-neutral-50'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 min-w-0">
            <div className="border border-neutral-200 rounded-xl bg-white shadow-sm p-4 sm:p-5 lg:p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Profile information</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Update your personal information and profile details
                    </p>
                  </div>

                  {/* Profile Picture */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="relative shrink-0 mx-auto sm:mx-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 rounded-full overflow-hidden flex items-center justify-center text-2xl sm:text-3xl font-bold text-gray-600 ring-2 ring-neutral-100">
                        {previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previewUrl} alt={fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{fullName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm touch-manipulation"
                        onClick={() => document.getElementById('profile-avatar-input')?.click()}
                        aria-label="Change profile photo"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="min-w-0 text-center sm:text-left flex-1">
                      <button
                        type="button"
                        className="w-full sm:w-auto px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium touch-manipulation"
                        onClick={() => document.getElementById('profile-avatar-input')?.click()}
                      >
                        Upload photo
                      </button>
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 2MB.</p>
                      <input
                        id="profile-avatar-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setAvatarFile(file);
                          if (file) {
                            setPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Full name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full min-h-11 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full min-h-11 px-3 py-2 text-sm border border-neutral-200 bg-neutral-50 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                        Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none resize-y min-h-[100px]"
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  {profileData && (
                    <div className="border-t border-neutral-200 pt-5 sm:pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Your statistics</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="text-center p-3 sm:p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                          <div className="text-xl sm:text-2xl font-bold tabular-nums">{profileData.total_entries || 0}</div>
                          <div className="text-xs sm:text-sm text-gray-600 mt-0.5">Total entries</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                          <div className="text-xl sm:text-2xl font-bold tabular-nums">{profileData.current_streak || 0}</div>
                          <div className="text-xs sm:text-sm text-gray-600 mt-0.5">Day streak</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                          <div className="text-xl sm:text-2xl font-bold tabular-nums">{profileData.longest_streak || 0}</div>
                          <div className="text-xs sm:text-sm text-gray-600 mt-0.5">Longest streak</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Notifications</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Choose how and when you want to be notified
                    </p>
                  </div>

                  <div className="space-y-0 divide-y divide-neutral-100">
                    {Object.entries(notifications).map(([key, value]) => {
                      // Format key for display (convert snake_case to Title Case)
                      const displayName = key
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                      
                      // Get description based on key
                      const getDescription = (k: string) => {
                        switch (k) {
                          case 'session_reminders':
                            return 'Reminders to log your emotional check-ins';
                          case 'mood_insights':
                            return 'Personalized insights about your mood patterns';
                          case 'weekly_reports':
                            return 'Weekly summary of your emotional wellness';
                          case 'streak_alerts':
                            return 'Notifications about your checking in streaks';
                          case 'ai_suggestions':
                            return 'Recommendations and suggestions from AI companion';
                          case 'email_notifications':
                            return 'Receive notifications via email';
                          case 'push_notifications':
                            return 'Receive push notifications on your device';
                          default:
                            return '';
                        }
                      };

                      return (
                        <div
                          key={key}
                          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3 sm:gap-4 first:pt-0"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900">{displayName}</div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-0.5">{getDescription(key)}</div>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={value}
                            onClick={() => {
                              setNotifications({ ...notifications, [key as keyof NotificationSettings]: !value });
                            }}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors touch-manipulation self-end sm:self-center ${
                              value ? 'bg-gray-900' : 'bg-neutral-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                value ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Privacy & Data Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Privacy & data</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Manage privacy and how your data is stored
                    </p>
                  </div>

                  {/* Privacy Toggles */}
                  <div className="space-y-0 divide-y divide-neutral-100 mb-6 sm:mb-8">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3 sm:gap-4 first:pt-0">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">Data collection</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                          Allow anonymous usage data to improve the app
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={privacy.data_collection}
                        onClick={() => setPrivacy({ ...privacy, data_collection: !privacy.data_collection })}
                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors touch-manipulation self-end sm:self-center ${
                          privacy.data_collection ? 'bg-gray-900' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            privacy.data_collection ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">Cloud backup</div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                          Back up your data to the cloud automatically
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={privacy.cloud_backup}
                        onClick={() => setPrivacy({ ...privacy, cloud_backup: !privacy.cloud_backup })}
                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors touch-manipulation self-end sm:self-center ${
                          privacy.cloud_backup ? 'bg-gray-900' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            privacy.cloud_backup ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Storage Type */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Storage preference
                    </label>
                    <div className="space-y-2">
                      {['cloud', 'local', 'hybrid'].map((type) => (
                        <label key={type} className="flex items-start gap-3 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50/80 touch-manipulation">
                          <input
                            type="radio"
                            name="storage"
                            value={type}
                            checked={privacy.storage_type === type}
                            onChange={(e) => setPrivacy({ ...privacy, storage_type: e.target.value as 'cloud' | 'local' | 'hybrid' })}
                            className="w-4 h-4"
                          />
                          <div>
                            <div className="font-medium capitalize">{type}</div>
                            <div className="text-sm text-gray-600">
                              {type === 'cloud' && 'Save check-ins to your account on the server'}
                              {type === 'local' && 'Save check-ins only in this browser; use “Sync device check-ins to cloud” when you want them on the server'}
                              {type === 'hybrid' && 'Save to the server and keep a backup copy on this device'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="border-t border-neutral-200 pt-5 sm:pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Data management</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <button
                        type="button"
                        disabled={syncingLocalCheckIns}
                        onClick={handleSyncDeviceCheckInsToCloud}
                        className="w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left touch-manipulation disabled:opacity-60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {syncingLocalCheckIns ? (
                            <Loader2 className="w-5 h-5 text-gray-600 shrink-0 animate-spin" />
                          ) : (
                            <CloudUpload className="w-5 h-5 text-gray-600 shrink-0" />
                          )}
                          <div className="text-left min-w-0">
                            <div className="font-medium">Sync device check-ins to cloud</div>
                            <div className="text-sm text-gray-600">
                              Upload entries that were saved only on this device (e.g. after choosing local storage) to your server account.
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportData}
                        className="w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left touch-manipulation"
                      >
                        <div className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-gray-600" />
                          <div className="text-left">
                            <div className="font-medium">Export Your Data</div>
                            <div className="text-sm text-gray-600">Download all your check-ins and data</div>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 border border-red-200 rounded-xl hover:bg-red-50/80 transition-colors text-red-600 touch-manipulation"
                      >
                        <div className="flex items-center gap-3">
                          <Trash2 className="w-5 h-5" />
                          <div className="text-left">
                            <div className="font-medium">Delete Account</div>
                            <div className="text-sm">Permanently delete your account and all data</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Appearance</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Customize how the app looks
                    </p>
                  </div>

                  {/* Mood Adaptive Theme */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3 border-b border-neutral-100 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">Mood-adaptive theme</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                        Adjust accent colors based on your current mood
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={theme.mood_adaptive}
                      onClick={() => setTheme({ ...theme, mood_adaptive: !theme.mood_adaptive })}
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors touch-manipulation self-end sm:self-center ${
                        theme.mood_adaptive ? 'bg-gray-900' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          theme.mood_adaptive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Color Schemes */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Base color scheme
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {['default', 'warm', 'cool'].map((scheme) => (
                        <button
                          key={scheme}
                          type="button"
                          onClick={() => setTheme({ ...theme, color_scheme: scheme as 'default' | 'warm' | 'cool' })}
                          className={`p-3 sm:p-4 border-2 rounded-xl capitalize text-sm font-medium transition-colors touch-manipulation ${
                            theme.color_scheme === scheme
                              ? 'border-gray-900 bg-neutral-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {scheme}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="border-t border-neutral-200 pt-5 sm:pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Preview</h3>
                    <div className="p-4 sm:p-6 border border-neutral-200 rounded-xl bg-neutral-50/80">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-black rounded-lg"></div>
                        <div>
                          <div className="font-semibold">Sample Card</div>
                          <div className="text-sm text-gray-600">This is how cards will appear</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Personalization Tab */}
              {activeTab === 'personalization' && (
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Personalization</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Tune music and content recommendations to your preferences
                    </p>
                  </div>

                  {/* Music Language */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Music language
                    </label>
                    <select
                      value={recommendations.music_language}
                      onChange={(e) => setRecommendations({ ...recommendations, music_language: e.target.value })}
                      className="w-full min-h-11 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none bg-white"
                    >
                      {recOptions?.music_languages?.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      )) || <option value="">Any Language</option>}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Songs will be biased towards this language</p>
                  </div>

                  {/* Favorite Artists */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Favorite artists (up to 3)
                    </label>
                    <div className="space-y-2">
                      {recommendations.favorite_artists.map((artist, index) => (
                        <div key={index} className="flex items-center gap-2 min-w-0">
                          <span className="flex-1 min-w-0 px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-sm truncate">
                            {artist}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = recommendations.favorite_artists.filter((_, i) => i !== index);
                              setRecommendations({ ...recommendations, favorite_artists: updated });
                            }}
                            className="p-2 shrink-0 text-gray-500 hover:text-red-600 transition-colors touch-manipulation rounded-lg hover:bg-red-50"
                            aria-label={`Remove ${artist}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {recommendations.favorite_artists.length < 3 && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="text"
                            value={artistInput}
                            onChange={(e) => setArtistInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && artistInput.trim()) {
                                e.preventDefault();
                                setRecommendations({
                                  ...recommendations,
                                  favorite_artists: [...recommendations.favorite_artists, artistInput.trim()],
                                });
                                setArtistInput('');
                              }
                            }}
                            placeholder="Artist name, then Enter"
                            className="flex-1 min-w-0 min-h-11 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (artistInput.trim()) {
                                setRecommendations({
                                  ...recommendations,
                                  favorite_artists: [...recommendations.favorite_artists, artistInput.trim()],
                                });
                                setArtistInput('');
                              }
                            }}
                            className="inline-flex items-center justify-center gap-1.5 min-h-11 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium touch-manipulation shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">~70% of music results will be from these artists</p>
                  </div>

                  {/* Music Genres */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Preferred music genres
                    </label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {(recOptions?.genres || []).map((genre) => {
                        const isSelected = recommendations.music_genres.includes(genre);
                        return (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => {
                              const updated = isSelected
                                ? recommendations.music_genres.filter((g) => g !== genre)
                                : [...recommendations.music_genres, genre];
                              setRecommendations({ ...recommendations, music_genres: updated });
                            }}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                              isSelected
                                ? 'bg-gray-900 text-white'
                                : 'bg-neutral-100 text-gray-700 hover:bg-neutral-200'
                            }`}
                          >
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Select genres to personalize mood-based music</p>
                  </div>

                  {/* Spotify Market */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Spotify market (region)
                    </label>
                    <select
                      value={recommendations.market}
                      onChange={(e) => setRecommendations({ ...recommendations, market: e.target.value })}
                      className="w-full min-h-11 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none bg-white"
                    >
                      {recOptions?.markets?.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.name} ({m.code})
                        </option>
                      )) || <option value="US">United States (US)</option>}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Affects which tracks are available in the Spotify catalog</p>
                  </div>

                  {/* Fitness Level */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Fitness level
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {(['beginner', 'moderate', 'advanced'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setRecommendations({ ...recommendations, fitness_level: level })}
                          className={`p-3 border-2 rounded-xl capitalize transition-colors text-sm font-medium touch-manipulation ${
                            recommendations.fitness_level === level
                              ? 'border-gray-900 bg-neutral-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Adjusts exercise difficulty in recommendations</p>
                  </div>

                  {/* Age Group */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Age group
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {(recOptions?.age_groups || [
                        { value: 'teen', label: 'Teen (13-17)' },
                        { value: 'young_adult', label: 'Young Adult (18-25)' },
                        { value: 'adult', label: 'Adult (26-59)' },
                        { value: 'senior', label: 'Senior (60+)' },
                      ]).map((ag) => (
                        <button
                          key={ag.value}
                          type="button"
                          onClick={() =>
                            setRecommendations({
                              ...recommendations,
                              age_group: recommendations.age_group === ag.value ? null : ag.value,
                            })
                          }
                          className={`p-3 border-2 rounded-xl transition-colors text-sm font-medium text-left touch-manipulation ${
                            recommendations.age_group === ag.value
                              ? 'border-gray-900 bg-neutral-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {ag.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Optional -- helps tailor content recommendations</p>
                  </div>

                  {/* Content Language */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Content language (quotes & text)
                    </label>
                    <select
                      value={recommendations.content_language}
                      onChange={(e) => setRecommendations({ ...recommendations, content_language: e.target.value })}
                      className="w-full min-h-11 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 outline-none bg-white"
                    >
                      <option value="en">English</option>
                      <option value="ur">Urdu</option>
                      <option value="hi">Hindi</option>
                      <option value="ar">Arabic</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Language for quotes and text-based recommendations</p>
                  </div>
                </div>
              )}

              {/* Save actions — full-width on small screens; sticky footer on narrow viewports */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-neutral-200 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 sticky bottom-0 z-10 -mx-4 px-4 pb-3 -mb-1 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:static lg:z-auto lg:mx-0 lg:px-0 lg:pb-0 lg:mb-0 lg:bg-transparent lg:backdrop-blur-none">
                <button
                  type="button"
                  onClick={handleCancelChanges}
                  disabled={!isActiveTabDirty || isSaving}
                  className="w-full sm:w-auto px-4 py-2.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
        )}
      </div>
    </ProtectedPage>
  );
}
