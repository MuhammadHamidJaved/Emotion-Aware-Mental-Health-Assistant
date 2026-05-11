'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Cloud, HardDrive, MapPin, Bell, Brain, Mic, Video, Shield, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { apiCompleteOnboarding, apiGetOnboardingStatus } from '@/lib/api'

interface Permission {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  required: boolean
  enabled: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user, getAccessToken, updateProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'storage',
      title: 'Data Storage',
      description: 'Store your assistant entries securely',
      icon: <Cloud className="w-5 h-5" />,
      required: true,
      enabled: true
    },
    {
      id: 'emotion-detection',
      title: 'Emotion Detection',
      description: 'AI-powered emotion analysis from entries',
      icon: <Brain className="w-5 h-5" />,
      required: false,
      enabled: true
    },
    {
      id: 'voice',
      title: 'Voice Recording',
      description: 'Voice entries with emotion detection',
      icon: <Mic className="w-5 h-5" />,
      required: false,
      enabled: true
    },
    {
      id: 'video',
      title: 'Video Recording',
      description: 'Video entries with facial emotion analysis',
      icon: <Video className="w-5 h-5" />,
      required: false,
      enabled: false
    },
    {
      id: 'location',
      title: 'Location Access',
      description: 'Add location context to entries',
      icon: <MapPin className="w-5 h-5" />,
      required: false,
      enabled: false
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Get reminders & wellness insights',
      icon: <Bell className="w-5 h-5" />,
      required: false,
      enabled: true
    }
  ])

  const [storageChoice, setStorageChoice] = useState<'cloud' | 'local' | 'hybrid'>('hybrid')

  // Check if user already completed onboarding — if so, redirect to dashboard
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/login')
        return
      }

      // If user already completed onboarding, skip to dashboard
      if (user.onboarding_complete) {
        router.push('/dashboard')
        return
      }

      // Optionally fetch existing onboarding data to pre-populate toggles
      const token = getAccessToken()
      if (token) {
        try {
          const status = await apiGetOnboardingStatus(token)
          if (status.onboarding_complete) {
            router.push('/dashboard')
            return
          }
          // Pre-populate storage choice if previously started
          if (status.storage) {
            setStorageChoice(status.storage)
          }
          // Pre-populate permissions if previously started
          if (status.permissions && Object.keys(status.permissions).length > 0) {
            setPermissions(prev =>
              prev.map(p => ({
                ...p,
                enabled: status.permissions[p.id] !== undefined ? status.permissions[p.id] : p.enabled
              }))
            )
          }
        } catch {
          // Ignore errors — user can still proceed with defaults
        }
      }

      setIsCheckingStatus(false)
    }

    checkOnboarding()
  }, [user, getAccessToken, router])

  const togglePermission = (id: string) => {
    setPermissions(permissions.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ))
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    setError(null)

    const token = getAccessToken()
    if (!token) {
      setError('You must be logged in to complete onboarding.')
      setIsSubmitting(false)
      return
    }

    const permissionsPayload = permissions.reduce((acc, p) => ({
      ...acc,
      [p.id]: p.enabled
    }), {} as Record<string, boolean>)

    try {
      // Call the backend API
      await apiCompleteOnboarding(token, {
        storage: storageChoice,
        permissions: permissionsPayload,
      })

      // Update the user in auth context so onboarding_complete reflects in the UI
      // We update the profile to refresh the user object with the latest data
      await updateProfile({ onboarding_complete: true })

      // Also store locally for immediate redirect checks
      localStorage.setItem('onboardingComplete', 'true')

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding. Please try again.')
      setIsSubmitting(false)
    }
  }

  const storageOptions = [
    {
      key: 'cloud' as const,
      title: 'Cloud',
      desc: 'Sync across devices, auto-backup',
      icon: <Cloud className="w-5 h-5" />,
      tags: [{ label: 'Auto-sync', color: 'bg-emerald-50 text-emerald-700' }, { label: 'Encrypted', color: 'bg-blue-50 text-blue-700' }]
    },
    {
      key: 'local' as const,
      title: 'Local Only',
      desc: 'All data stays on this device',
      icon: <HardDrive className="w-5 h-5" />,
      tags: [{ label: 'Private', color: 'bg-purple-50 text-purple-700' }, { label: 'No sync', color: 'bg-amber-50 text-amber-700' }]
    },
    {
      key: 'hybrid' as const,
      title: 'Hybrid',
      desc: 'Local-first with optional cloud backup',
      icon: <Shield className="w-5 h-5" />,
      tags: [{ label: 'Recommended', color: 'bg-emerald-50 text-emerald-700' }, { label: 'Flexible', color: 'bg-blue-50 text-blue-700' }]
    }
  ]

  // Show loading while checking onboarding status
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Progress Bar */}
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">Step {step} of 2</p>
              <p className="text-xs font-medium text-gray-400">{step === 1 ? '50%' : '100%'}</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {step === 1 ? (
              <>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Choose Your Storage</h1>
                <p className="text-sm text-gray-500 mb-5">Select how your data is stored and synced.</p>

                <div className="space-y-2.5 mb-5">
                  {storageOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setStorageChoice(opt.key)}
                      className={`w-full p-3.5 rounded-xl border-2 transition-all text-left flex items-start gap-3 ${
                        storageChoice === opt.key
                          ? 'border-black bg-gray-50'
                          : 'border-gray-150 hover:border-gray-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${storageChoice === opt.key ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'} transition-colors`}>
                        {opt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-gray-900">{opt.title}</h3>
                          {storageChoice === opt.key && <Check className="w-4 h-4 text-black flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                        <div className="flex gap-1.5 mt-2">
                          {opt.tags.map((tag) => (
                            <span key={tag.label} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tag.color}`}>
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Customize Experience</h1>
                <p className="text-sm text-gray-500 mb-5">Enable features you need. Change anytime in settings.</p>

                <div className="space-y-2 mb-5">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-150 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${permission.enabled ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'} transition-colors`}>
                          {permission.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-medium text-sm text-gray-900">{permission.title}</h3>
                            {permission.required && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full">Required</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{permission.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => !permission.required && togglePermission(permission.id)}
                        disabled={permission.required}
                        className={`relative rounded-full transition-colors flex-shrink-0 ml-3 ${
                          permission.enabled ? 'bg-black' : 'bg-gray-300'
                        } ${permission.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        style={{ minWidth: '40px', height: '22px' }}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 bg-white rounded-full shadow-sm transition-transform ${
                            permission.enabled ? 'translate-x-[18px]' : 'translate-x-0'
                          }`}
                          style={{ width: '18px', height: '18px' }}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                    className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="flex-[2] py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Your preferences are saved securely and can be changed in settings.
        </p>
      </div>
    </div>
  )
}
