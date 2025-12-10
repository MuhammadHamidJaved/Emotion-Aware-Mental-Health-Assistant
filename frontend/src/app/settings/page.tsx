'use client';

import { useEffect, useState } from 'react';
import { User as UserIcon, Bell, Lock, Palette, Download, Trash2, Save, Camera, Loader2 } from 'lucide-react';
import ProtectedPage from '@/components/ProtectedPage';
import {
  apiGetProfileSettings,
  apiUpdateProfileSettings,
  apiGetNotificationSettings,
  apiUpdateNotificationSettings,
  apiGetPrivacySettings,
  apiUpdatePrivacySettings,
  apiGetAppearanceSettings,
  apiUpdateAppearanceSettings,
  apiExportData,
  apiDeleteAccount,
  type ProfileSettings,
  type NotificationSettings,
  type PrivacySettings,
  type AppearanceSettings,
} from '@/lib/api';

export default function SettingsPage() {
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

  // Notification Settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    session_reminders: true,  // Changed from journal_reminders
    mood_insights: true,
    weekly_reports: false,
    streak_alerts: true,
    ai_suggestions: true,
    email_notifications: true,
    push_notifications: false,
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    data_collection: true,
    share_analytics: false,
    cloud_backup: true,
    storage_type: 'hybrid',
  });

  // Appearance Settings
  const [theme, setTheme] = useState<AppearanceSettings>({
    mood_adaptive: true,
    dark_mode: false,
    color_scheme: 'default',
  });

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
        const [profile, notificationsData, privacyData, appearanceData] = await Promise.allSettled([
          apiGetProfileSettings(accessToken),
          apiGetNotificationSettings(accessToken),
          apiGetPrivacySettings(accessToken),
          apiGetAppearanceSettings(accessToken),
        ]);

        if (profile.status === 'fulfilled') {
          const data = profile.value;
          setProfileData(data);
          setFullName(`${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email.split('@')[0]);
          setEmail(data.email);
          setBio(data.bio || '');
          setPreviewUrl(data.profile_picture || null);
        }

        if (notificationsData.status === 'fulfilled') {
          setNotifications(notificationsData.value);
        }

        if (privacyData.status === 'fulfilled') {
          setPrivacy(privacyData.value);
        }

        if (appearanceData.status === 'fulfilled') {
          setTheme(appearanceData.value);
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
        setProfileData(updated);
        setPreviewUrl(updated.profile_picture || null);
        alert('Profile updated successfully.');
      } else if (activeTab === 'notifications') {
        await apiUpdateNotificationSettings(accessToken, notifications);
        alert('Notification settings updated successfully.');
      } else if (activeTab === 'privacy') {
        await apiUpdatePrivacySettings(accessToken, privacy);
        alert('Privacy settings updated successfully.');
      } else if (activeTab === 'appearance') {
        await apiUpdateAppearanceSettings(accessToken, theme);
        alert('Appearance settings updated successfully.');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      const result = await apiExportData(accessToken);
      alert(result.message);
    } catch (error: any) {
      alert(error.message || 'Failed to request data export.');
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
      const result = await apiDeleteAccount(accessToken);
      alert(result.message);
    } catch (error: any) {
      alert(error.message || 'Failed to request account deletion.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <ProtectedPage>
      <div className="space-y-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
          <p className="text-sm text-neutral-600">Manage your account and preferences</p>
        </div>

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

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-200 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-black text-white'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="border border-gray-200 rounded-lg p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Profile Information</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Update your personal information and profile details
                    </p>
                  </div>

                  {/* Profile Picture */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold text-gray-600">
                        {previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previewUrl} alt={fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{fullName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                        onClick={() => document.getElementById('profile-avatar-input')?.click()}
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        onClick={() => document.getElementById('profile-avatar-input')?.click()}
                      >
                        Upload Photo
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  {profileData && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="font-semibold mb-4">Your Statistics</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold">{profileData.total_entries}</div>
                          <div className="text-sm text-gray-600">Total Entries</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold">{profileData.current_streak}</div>
                          <div className="text-sm text-gray-600">Day Streak</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold">-</div>
                          <div className="text-sm text-gray-600">Mood Score</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Notification Preferences</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Choose how and when you want to receive notifications
                    </p>
                  </div>

                  <div className="space-y-4">
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
                            return 'Notifications about your journaling streaks';
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
                        <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium">
                              {displayName}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {getDescription(key)}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setNotifications({ ...notifications, [key as keyof NotificationSettings]: !value });
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              value ? 'bg-black' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
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
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Privacy & Data</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Manage your data privacy and storage preferences
                    </p>
                  </div>

                  {/* Privacy Toggles */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <div className="font-medium">Data Collection</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Allow anonymous usage data collection to improve the app
                        </div>
                      </div>
                      <button
                        onClick={() => setPrivacy({ ...privacy, data_collection: !privacy.data_collection })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          privacy.data_collection ? 'bg-black' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            privacy.data_collection ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <div className="font-medium">Cloud Backup</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Automatically backup your data to the cloud
                        </div>
                      </div>
                      <button
                        onClick={() => setPrivacy({ ...privacy, cloud_backup: !privacy.cloud_backup })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          privacy.cloud_backup ? 'bg-black' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            privacy.cloud_backup ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Storage Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Storage Preference
                    </label>
                    <div className="space-y-2">
                      {['cloud', 'local', 'hybrid'].map((type) => (
                        <label key={type} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
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
                              {type === 'cloud' && 'Store all data in the cloud'}
                              {type === 'local' && 'Store all data locally on your device'}
                              {type === 'hybrid' && 'Recommended: Use both cloud and local storage'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-semibold mb-4">Data Management</h3>
                    <div className="space-y-3">
                      <button
                        onClick={handleExportData}
                        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                        onClick={handleDeleteAccount}
                        className="w-full flex items-center justify-between px-4 py-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-red-600"
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
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Appearance</h2>
                    <p className="text-sm text-gray-600 mb-6">
                      Customize the look and feel of your app
                    </p>
                  </div>

                  {/* Mood Adaptive Theme */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <div className="font-medium">Mood-Adaptive Theme</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Automatically adjust colors based on your current mood
                      </div>
                    </div>
                    <button
                      onClick={() => setTheme({ ...theme, mood_adaptive: !theme.mood_adaptive })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        theme.mood_adaptive ? 'bg-black' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          theme.mood_adaptive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Color Schemes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Base Color Scheme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['default', 'warm', 'cool'].map((scheme) => (
                        <button
                          key={scheme}
                          onClick={() => setTheme({ ...theme, color_scheme: scheme as 'default' | 'warm' | 'cool' })}
                          className={`p-4 border-2 rounded-lg capitalize transition-colors ${
                            theme.color_scheme === scheme
                              ? 'border-black bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {scheme}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-semibold mb-4">Preview</h3>
                    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
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

              {/* Save Button */}
              <div className="border-t border-gray-200 mt-8 pt-6 flex justify-end gap-3">
                <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </ProtectedPage>
  );
}
