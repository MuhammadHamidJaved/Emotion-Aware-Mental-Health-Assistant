'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { useSidebar } from '@/contexts/sidebar-context';
import { useAuth } from '@/contexts/auth-context';
import NotificationDropdown from '@/components/NotificationDropdown';
import Image from 'next/image';

export default function Header() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const { user, isLoading } = useAuth();

  // Don't show header on landing, login, signup, onboarding pages or if unauthenticated
  const publicPages = ['/', '/login', '/signup', '/onboarding', '/privacy', '/terms'];
  if (publicPages.includes(pathname) || (!isLoading && !user)) {
    return null;
  }

  return (
    <header 
      className={`fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 z-20 transition-all duration-300 ${
        isCollapsed ? 'lg:left-20' : 'lg:left-64'
      }`}
    >
      <div className="h-full pl-16 pr-4 lg:px-6 flex items-center justify-end">
        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationDropdown />

          {/* Profile Avatar */}
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1 hover:bg-gray-200 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 overflow-hidden">
              {user?.profile_picture ? (
                <Image
                  src={user.profile_picture}
                  alt={user.first_name || user.full_name || 'Profile'}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : user ? (
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
        </div>
      </div>
    </header>
  );
}
