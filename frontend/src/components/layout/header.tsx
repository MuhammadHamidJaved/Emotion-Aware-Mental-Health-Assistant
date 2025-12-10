'use client'

import { Bell, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth-context'
import NotificationDropdown from '@/components/NotificationDropdown'

export function Header() {
  const { user } = useAuth()
  const initials =
    user && (user.first_name || user.last_name)
      ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
      : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Search */}
      <div className="flex flex-1 items-center space-x-4">
        <div className="relative w-96 max-w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search entries, tags, insights..."
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationDropdown />
        
        {/* Profile */}
        <button className="flex items-center space-x-2 rounded-lg p-1.5 hover:bg-gray-100">
          <Avatar 
            src={undefined}
            alt={user?.email ?? 'User'}
            fallback={initials}
            size="sm"
          />
        </button>
      </div>
    </header>
  )
}
