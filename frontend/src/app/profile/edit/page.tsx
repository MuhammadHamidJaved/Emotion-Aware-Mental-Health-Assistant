'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ArrowLeft, Save, Phone, Clock, List } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import ProtectedPage from '@/components/ProtectedPage';

export default function EditProfilePage() {
  const { user, updateProfile, isLoading } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [mentalConcerns, setMentalConcerns] = useState('');
  const [journalingGoals, setJournalingGoals] = useState('');
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const nameFromUser =
      user.full_name ||
      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
      user.email.split('@')[0];

    setFullName(nameFromUser);
    setBio(user.bio || '');
    setPreviewUrl(user.profile_picture || null);
    setDateOfBirth(user.date_of_birth || '');
    setPhoneNumber(user.phone_number || '');
    setPreferredTime(user.preferred_journal_time || '');
    setEnableBiometric(!!user.enable_biometric);
    setEnableNotifications(
      typeof user.enable_notifications === 'boolean' ? user.enable_notifications : true,
    );
    if (user.mental_health_concerns && user.mental_health_concerns.length > 0) {
      setMentalConcerns(user.mental_health_concerns.join(', '));
    }
    if (user.journaling_goals && user.journaling_goals.length > 0) {
      setJournalingGoals(user.journaling_goals.join(', '));
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !fullName.trim()) return;
    setIsSaving(true);
    try {
      const formData = new FormData();

      const [firstName, ...rest] = fullName.trim().split(' ');
      const lastName = rest.join(' ');

      formData.append('first_name', firstName || '');
      formData.append('last_name', lastName || '');
      formData.append('bio', bio);
      if (dateOfBirth) {
        formData.append('date_of_birth', dateOfBirth);
      }
      if (phoneNumber) {
        formData.append('phone_number', phoneNumber);
      }
      if (preferredTime) {
        formData.append('preferred_journal_time', preferredTime);
      }
      if (mentalConcerns) {
        formData.append('mental_health_concerns', mentalConcerns);
      }
      if (journalingGoals) {
        formData.append('journaling_goals', journalingGoals);
      }
      formData.append('enable_biometric', String(enableBiometric));
      formData.append('enable_notifications', String(enableNotifications));

      if (avatarFile) {
        formData.append('profile_picture', avatarFile);
      }

      await updateProfile(formData);
      router.push('/profile');
    } catch (error: any) {
      alert(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedPage>
      <div className="max-w-2xl mx-auto space-y-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to profile
          </button>
          <h1 className="text-2xl font-bold text-neutral-900">Edit Profile</h1>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {/* Avatar Section */}
          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-white">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{fullName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg"
                  onClick={() => document.getElementById('edit-profile-avatar-input')?.click()}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  id="edit-profile-avatar-input"
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

              <div className="text-sm">
                <p className="font-medium text-neutral-900 mb-1">Profile photo</p>
                <p className="text-xs text-neutral-500">Upload a clear photo of yourself. JPG, PNG or GIF, up to 2MB.</p>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div className="p-6 space-y-5">
            {/* Basic info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Date of birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Preferred check-in time
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Evenings, 9:00 PM"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
              />
            </div>

            {/* Mental health concerns & goals */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1.5">
                  <List className="w-4 h-4 text-neutral-400" />
                  Mental health focus areas
                </label>
                <p className="text-xs text-neutral-500 mb-2">
                  Separate with commas, e.g. anxiety, stress, sleep.
                </p>
                <textarea
                  value={mentalConcerns}
                  onChange={(e) => setMentalConcerns(e.target.value)}
                  rows={2}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 flex items-center gap-1.5">
                  <List className="w-4 h-4 text-neutral-400" />
                  Wellness goals
                </label>
                <p className="text-xs text-neutral-500 mb-2">
                  Separate with commas, e.g. daily reflection, gratitude.
                </p>
                <textarea
                  value={journalingGoals}
                  onChange={(e) => setJournalingGoals(e.target.value)}
                  rows={2}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid md:grid-cols-2 gap-3">
              <label className="flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-neutral-900">Biometric login</div>
                  <div className="text-xs text-neutral-500">Face ID / fingerprint</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableBiometric((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableBiometric ? 'bg-indigo-600' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableBiometric ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-neutral-900">Notifications</div>
                  <div className="text-xs text-neutral-500">Reminders & updates</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableNotifications((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableNotifications ? 'bg-indigo-600' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enableNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-4 bg-neutral-50 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading || !fullName.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
    </ProtectedPage>
  );
}


