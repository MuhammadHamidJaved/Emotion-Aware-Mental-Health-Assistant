'use client'

import Link from 'next/link'
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
    <header className="sticky top-0 z-10 flex h-16 items-center justify-end border-b border-gray-200 bg-white pl-14 pr-4 md:px-6">
      <div className="flex items-center gap-3 md:gap-4">
        <NotificationDropdown />

        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          aria-label="View profile"
        >
          <Avatar
            src={user?.profile_picture ?? undefined}
            alt={user?.email ?? 'User'}
            fallback={initials}
            size="sm"
          />
          <span className="hidden min-w-0 sm:block text-left text-sm font-medium text-gray-900 truncate max-w-[10rem]">
            {user?.first_name || user?.full_name || user?.email?.split('@')[0] || 'Profile'}
          </span>
        </Link>
      </div>
    </header>
  )
}
