'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiGetCurrentUser, apiLogin, apiRegister, apiUpdateCurrentUser, storeAuthTokens, User } from '@/lib/api'

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (args: { name: string; email: string; password: string; confirmPassword: string }) => Promise<User>
  updateProfile: (payload: FormData | Partial<User>) => Promise<User>
  logout: () => void
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from existing tokens on first mount
  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
        if (!accessToken) {
          setIsLoading(false)
          return
        }

        const me = await apiGetCurrentUser(accessToken)
        setUser(me)
      } catch {
        // Tokens invalid or user fetch failed – clear them
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
        setUser(null)
        // If we fail to restore a session on a protected route, send the user to login
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserFromToken()
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiLogin(email, password)
    storeAuthTokens(data.access, data.refresh)
    setUser(data.user)
    return data.user
  }

  const register = async (args: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }): Promise<User> => {
    const [firstName, ...rest] = args.name.trim().split(' ')
    const lastName = rest.join(' ')

    const data = await apiRegister({
      first_name: firstName || '',
      last_name: lastName || '',
      email: args.email,
      password: args.password,
      confirm_password: args.confirmPassword,
    })

    storeAuthTokens(data.access, data.refresh)
    setUser(data.user)
    return data.user
  }

  const updateProfile = async (payload: FormData | Partial<User>): Promise<User> => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (!accessToken) {
      throw new Error('You must be logged in to update your profile.')
    }

    const updated = await apiUpdateCurrentUser(accessToken, payload)
    setUser(updated)
    return updated
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('onboardingComplete')
    }
    setUser(null)
    router.push('/login')
  }

  const getAccessToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  }

  const value: AuthContextValue = {
    user,
    isLoading,
    login,
    register,
    updateProfile,
    logout,
    getAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}


