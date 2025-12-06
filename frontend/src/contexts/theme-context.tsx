'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { EmotionType } from '@/types'

interface ThemeContextType {
  currentMood: EmotionType | null
  setMoodTheme: (mood: EmotionType) => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentMood, setCurrentMood] = useState<EmotionType | null>(null)

  const setMoodTheme = (mood: EmotionType) => {
    setCurrentMood(mood)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-mood', mood)
    }
  }

  const resetTheme = () => {
    setCurrentMood(null)
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-mood')
    }
  }

  return (
    <ThemeContext.Provider value={{ currentMood, setMoodTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
