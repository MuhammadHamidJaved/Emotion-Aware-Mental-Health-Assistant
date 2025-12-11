'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Mood =
  | 'neutral'
  | 'happy'
  | 'calm'
  | 'energetic'
  | 'sad'
  | 'anxious'
  | 'angry'
  | 'loved'
  | 'confident';

type MoodContextValue = {
  mood: Mood;
  setMood: (m: Mood) => void;
};

const MoodContext = createContext<MoodContextValue | undefined>(undefined);

const STORAGE_KEY = 'emotionAI:mood';

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMoodState] = useState<Mood>('neutral');
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we're mounted before accessing localStorage
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load initial mood from localStorage
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Mood | null;
    if (stored) {
      setMoodState(stored);
      document.documentElement.setAttribute('data-mood', stored);
    } else {
      document.documentElement.setAttribute('data-mood', 'neutral');
    }
  }, [isMounted]);

  // Update HTML data attribute + persist
  const setMood = (m: Mood) => {
    setMoodState(m);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, m);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-mood', m);
    }
  };

  return <MoodContext.Provider value={{ mood, setMood }}>{children}</MoodContext.Provider>;
}

export function useMood(): MoodContextValue {
  const ctx = useContext(MoodContext);
  if (!ctx) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return ctx;
}




