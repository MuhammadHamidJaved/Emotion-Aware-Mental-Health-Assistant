'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Brain } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function SignupPage() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions.')
      return
    }

    setIsLoading(true)

    try {
      await register({ name, email, password, confirmPassword })
      // Mark onboarding as not completed yet
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboardingComplete', 'false')
      }
      window.location.href = '/onboarding'
    } catch (err: any) {
      setError(err.message || 'Unable to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength =
    password.length === 0 ? 0 : password.length < 6 ? 25 : password.length < 10 ? 50 : password.length < 14 ? 75 : 100

  const getStrengthColor = () => {
    if (passwordStrength === 0) return '#e5e5e5'
    if (passwordStrength <= 25) return '#ef4444'
    if (passwordStrength <= 50) return '#f59e0b'
    if (passwordStrength <= 75) return '#fbbf24'
    return '#10b981'
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
              <p className="text-xs text-neutral-500">Personalized mental health companion</p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              Create your account,
              <span className="block text-neutral-500">start your emotion-aware journaling</span>
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-neutral-600">
              Join EmotionJournal to track your mood, understand emotional patterns, and receive tailored
              recommendations powered by machine learning.
            </p>
          </div>

          <div className="hidden gap-4 text-xs text-neutral-500 md:flex">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-neutral-900">Secure by design</span>
              <span>Your data stays private</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-neutral-900">Built for you</span>
              <span>Personalized wellness insights</span>
            </div>
          </div>
        </div>

        {/* Right auth card */}
        <div className="w-full max-w-md md:w-1/2">
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm md:p-8">
            <div className="mb-6 space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Get started</p>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Create your account</h2>
              <p className="text-xs text-neutral-500">It only takes a minute to set up your space.</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium text-neutral-700">
                  Full name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-9 py-2 text-sm text-neutral-900 outline-none ring-0 transition-colors placeholder:text-neutral-400 focus:border-neutral-900"
                    placeholder="Alex Johnson"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

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
                    placeholder="At least 8 characters"
                    required
                    autoComplete="new-password"
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

                {/* Password Strength */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 rounded-full bg-neutral-100">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${passwordStrength}%`,
                          backgroundColor: getStrengthColor(),
                        }}
                      />
                    </div>
                    <p className="text-xs text-neutral-500">
                      {passwordStrength <= 25 && 'Weak password'}
                      {passwordStrength > 25 && passwordStrength <= 50 && 'Fair password'}
                      {passwordStrength > 50 && passwordStrength <= 75 && 'Good password'}
                      {passwordStrength > 75 && 'Strong password'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-medium text-neutral-700">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-9 py-2 pr-10 text-sm text-neutral-900 outline-none ring-0 transition-colors placeholder:text-neutral-400 focus:border-neutral-900"
                    placeholder="Re-enter your password"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-2 pt-1 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border border-neutral-300 text-neutral-900"
                />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-6 text-center text-xs text-neutral-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

