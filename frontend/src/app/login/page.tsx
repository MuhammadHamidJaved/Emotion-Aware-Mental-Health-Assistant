'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Brain } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password)

      // You can later replace this with a real flag from backend/user profile
      const onboardingComplete = localStorage.getItem('onboardingComplete')
      if (onboardingComplete === 'true') {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10 md:flex-row md:items-center md:justify-between">
        {/* Left brand panel */}
        <div className="mb-10 space-y-6 md:mb-0 md:w-1/2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">EmotionJournal</p>
              <p className="text-xs text-neutral-500">Emotion-aware mental health assistant</p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              Welcome back,
              <span className="block text-neutral-500">let&apos;s continue your journey</span>
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-neutral-600">
              Sign in to access your emotion-aware journal, personalized recommendations, and AI-powered insights
              designed to support your mental well-being.
            </p>
          </div>

          <div className="hidden gap-4 text-xs text-neutral-500 md:flex">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-neutral-900">Multimodal input</span>
              <span>Text, voice, and video entries</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-neutral-900">ML-powered insights</span>
              <span>Emotion trends over time</span>
            </div>
          </div>
        </div>

        {/* Right auth card */}
        <div className="w-full max-w-md md:w-1/2">
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm md:p-8">
            <div className="mb-6 space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Sign in</p>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Welcome back</h2>
              <p className="text-xs text-neutral-500">Use your email and password to access your account.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-neutral-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-9 py-2 text-sm text-neutral-900 outline-none ring-0 transition-colors placeholder:text-neutral-400 focus:border-neutral-900"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-neutral-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-9 py-2 pr-10 text-sm text-neutral-900 outline-none ring-0 transition-colors placeholder:text-neutral-400 focus:border-neutral-900"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border border-neutral-300 text-neutral-900"
                  />
                  <span className="text-neutral-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="font-medium text-neutral-800 underline-offset-2 hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                {isLoading ? 'Signing in...' : 'Continue'}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-neutral-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


