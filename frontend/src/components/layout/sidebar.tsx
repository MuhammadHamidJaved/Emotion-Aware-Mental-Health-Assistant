'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CURRENT_USER } from '@/data/dummy-data'
import { 
  Home, 
  Activity, 
  BarChart3, 
  MessageCircle, 
  Target, 
  Calendar, 
  Settings, 
  LogOut,
  PlusCircle,
  Tag,
  Menu,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Check-In History', href: '/check-in', icon: Activity },
  { name: 'Insights & Analytics', href: '/insights', icon: BarChart3 },
  { name: 'Emotional Support', href: '/recommendations', icon: Target },
  { name: 'AI Companion', href: '/chat', icon: MessageCircle },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Tags', href: '/tags', icon: Tag },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      {/* Mobile hamburger button – rendered inside the header area */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={cn(
          'flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out',
          // On mobile: off-screen by default, slide in when open
          'fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">EmotionAI</span>
          </Link>
        </div>
        
        {/* User Profile Card */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Avatar 
              src={CURRENT_USER.profilePicture} 
              alt={CURRENT_USER.firstName}
              fallback={CURRENT_USER.firstName[0] + CURRENT_USER.lastName[0]}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {CURRENT_USER.firstName} {CURRENT_USER.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{CURRENT_USER.email}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const isActive = item.href === '/check-in' 
              ? pathname === '/check-in'
              : pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* Quick Actions */}
        <div className="border-t border-gray-200 p-4">
          <Button 
            variant="primary" 
            className="w-full"
            onClick={() => window.location.href = '/check-in/new'}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Express Yourself
          </Button>
        </div>
        
        {/* Logout */}
        <div className="border-t border-gray-200 p-4">
          <button
            className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            onClick={() => console.log('Logout')}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}
