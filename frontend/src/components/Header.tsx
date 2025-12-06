'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search, User, SmilePlus } from 'lucide-react';
import { useSidebar } from '@/contexts/sidebar-context';
import { useAuth } from '@/contexts/auth-context';
import { useMood, Mood } from '@/contexts/mood-context';

export default function Header() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const { user } = useAuth();
  const { mood, setMood } = useMood();

  // Don't show header on landing, login, signup, onboarding pages
  const publicPages = ['/', '/login', '/signup', '/onboarding'];
  if (publicPages.includes(pathname)) {
    return null;
  }

  // Get page title based on pathname
  const getPageTitle = () => {
    // Don't show title for dashboard - it has its own greeting
    if (pathname === '/dashboard') return '';
    
    const titles: Record<string, string> = {
      '/check-in': 'Check-In History',
      '/detect': 'Emotion Detection',
      '/insights': 'Analytics & Insights',
      '/chat': 'AI Wellness Companion',
      '/recommendations': 'Emotional Support',
      '/music': 'Music Therapy',
      '/exercises': 'Wellness Exercises',
      '/quotes': 'Daily Motivation',
      '/calendar': 'Mood Calendar',
      '/ml-models': 'ML Models',
      '/settings': 'Settings',
    };

    // Check for nested routes
    if (pathname.startsWith('/check-in/new')) return 'Express Yourself';
    if (pathname.startsWith('/check-in/') && pathname.includes('/edit')) return 'Edit Check-In';
    if (pathname.startsWith('/check-in/')) return 'Check-In Details';

    return titles[pathname] || 'EmotionAI';
  };

  const moodLabelMap: Record<Mood, string> = {
    neutral: 'Neutral',
    happy: 'Happy',
    calm: 'Calm',
    energetic: 'Energetic',
    sad: 'Sad',
    anxious: 'Anxious',
    angry: 'Angry',
    loved: 'Loved',
    confident: 'Confident',
  };

  const nextMoods: Mood[] = [
    'neutral',
    'happy',
    'calm',
    'energetic',
    'sad',
    'anxious',
    'angry',
    'loved',
    'confident',
  ];

  const handleCycleMood = () => {
    const idx = nextMoods.indexOf(mood);
    const next = nextMoods[(idx + 1) % nextMoods.length];
    setMood(next);
  };

  return (
    <header 
      className={`fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 z-20 transition-all duration-300 ${
        isCollapsed ? 'lg:left-20' : 'lg:left-64'
      }`}
    >
      <div className="h-full px-6 flex items-center justify-end">
        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Search className="w-5 h-5 text-gray-600" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Avatar */}
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1 hover:bg-gray-200 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
              {user ? (
                <span className="text-sm font-medium text-gray-800">
                  {(user.first_name?.[0] || user.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </span>
              ) : (
                <User className="h-4 w-4 text-gray-700" />
              )}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-medium text-gray-900 leading-tight">
                {user?.first_name || user?.full_name || 'Profile'}
              </span>
              <span className="text-[11px] text-gray-500 leading-tight">View profile</span>
            </div>
          </Link>

          {/* Mood Indicator / Theme Switcher */}
          <button
            type="button"
            onClick={handleCycleMood}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Click to cycle mood theme"
          >
            <SmilePlus className="w-4 h-4 text-gray-700" />
            <span className="text-xs font-medium text-gray-700">Mood theme:</span>
            <span className="text-sm font-semibold text-gray-900">{moodLabelMap[mood]}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
