'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Cloud, HardDrive, MapPin, Bell, Fingerprint, Brain, Mic, Video, Shield } from 'lucide-react'

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
  const [step, setStep] = useState(1)
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'storage',
      title: 'Data Storage',
      description: 'Choose where to store your journal entries',
      icon: <Cloud className="w-6 h-6" />,
      required: true,
      enabled: false
    },
    {
      id: 'emotion-detection',
      title: 'Emotion Detection',
      description: 'Enable AI-powered emotion analysis from your entries',
      icon: <Brain className="w-6 h-6" />,
      required: false,
      enabled: true
    },
    {
      id: 'voice',
      title: 'Voice Recording',
      description: 'Record voice journal entries with emotion detection',
      icon: <Mic className="w-6 h-6" />,
      required: false,
      enabled: true
    },
    {
      id: 'video',
      title: 'Video Recording',
      description: 'Record video entries with facial emotion analysis',
      icon: <Video className="w-6 h-6" />,
      required: false,
      enabled: false
    },
    {
      id: 'location',
      title: 'Location Access',
      description: 'Add location context to your journal entries',
      icon: <MapPin className="w-6 h-6" />,
      required: false,
      enabled: false
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Get reminders and insights about your emotional well-being',
      icon: <Bell className="w-6 h-6" />,
      required: false,
      enabled: true
    },
    {
      id: 'biometric',
      title: 'Biometric Lock',
      description: 'Secure your journal with fingerprint or face recognition',
      icon: <Fingerprint className="w-6 h-6" />,
      required: false,
      enabled: false
    }
  ])

  const [storageChoice, setStorageChoice] = useState<'cloud' | 'local' | 'hybrid'>('hybrid')

  const togglePermission = (id: string) => {
    setPermissions(permissions.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ))
  }

  const handleComplete = () => {
    // Save preferences to localStorage or API
    const preferences = {
      storage: storageChoice,
      permissions: permissions.reduce((acc, p) => ({ ...acc, [p.id]: p.enabled }), {})
    }
    localStorage.setItem('userPreferences', JSON.stringify(preferences))
    localStorage.setItem('onboardingComplete', 'true')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Step {step} of 2</span>
            <span className="text-sm text-neutral-600">{step === 1 ? '50%' : '100%'}</span>
          </div>
          <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 ? (
          /* Step 1: Storage Choice */
          <div>
            <h1 className="text-3xl font-bold mb-2">Choose Your Storage</h1>
            <p className="text-neutral-600 mb-8">
              Select how you'd like to store your journal data
            </p>

            <div className="space-y-4 mb-8">
              {/* Cloud Storage */}
              <button
                onClick={() => setStorageChoice('cloud')}
                className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                  storageChoice === 'cloud'
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white border border-neutral-200 rounded-lg">
                      <Cloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Cloud Storage</h3>
                      <p className="text-sm text-neutral-600">
                        Sync across all devices, encrypted and backed up automatically
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          Auto-sync
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Encrypted
                        </span>
                      </div>
                    </div>
                  </div>
                  {storageChoice === 'cloud' && (
                    <Check className="w-6 h-6 text-black flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Local Storage */}
              <button
                onClick={() => setStorageChoice('local')}
                className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                  storageChoice === 'local'
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white border border-neutral-200 rounded-lg">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Local Storage</h3>
                      <p className="text-sm text-neutral-600">
                        Keep all data on this device only, complete privacy
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          Private
                        </span>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                          No sync
                        </span>
                      </div>
                    </div>
                  </div>
                  {storageChoice === 'local' && (
                    <Check className="w-6 h-6 text-black flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* Hybrid */}
              <button
                onClick={() => setStorageChoice('hybrid')}
                className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                  storageChoice === 'hybrid'
                    ? 'border-black bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white border border-neutral-200 rounded-lg">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Hybrid Storage (Recommended)</h3>
                      <p className="text-sm text-neutral-600">
                        Local first with optional cloud backup, best of both worlds
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          Flexible
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Secure
                        </span>
                      </div>
                    </div>
                  </div>
                  {storageChoice === 'hybrid' && (
                    <Check className="w-6 h-6 text-black flex-shrink-0" />
                  )}
                </div>
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-4 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
            >
              Continue
            </button>
          </div>
        ) : (
          /* Step 2: Permissions */
          <div>
            <h1 className="text-3xl font-bold mb-2">Customize Your Experience</h1>
            <p className="text-neutral-600 mb-8">
              Enable features that matter to you. You can change these later in settings.
            </p>

            <div className="space-y-3 mb-8">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-start justify-between p-4 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-neutral-50 rounded-lg mt-1">
                      {permission.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{permission.title}</h3>
                        {permission.required && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600">{permission.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !permission.required && togglePermission(permission.id)}
                    disabled={permission.required}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      permission.enabled ? 'bg-black' : 'bg-neutral-300'
                    } ${permission.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        permission.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-4 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
