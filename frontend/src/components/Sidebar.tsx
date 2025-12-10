'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/sidebar-context';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  Activity,
  Brain,
  LineChart,
  MessageSquare,
  Lightbulb,
  Calendar,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Bell,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/check-in/new', label: 'Express Yourself', icon: PlusCircle },
  { href: '/check-in', label: 'Check-In History', icon: Activity },
  { href: '/insights', label: 'Insights & Analytics', icon: LineChart },
  { href: '/chat', label: 'AI Companion', icon: MessageSquare },
  { href: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { logout } = useAuth();

  // Don't show sidebar on landing, login, signup, onboarding pages
  const publicPages = ['/', '/login', '/signup', '/onboarding'];
  if (publicPages.includes(pathname)) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 rounded-lg bg-black p-2 text-white"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Logo */}
        <div className="flex h-16 flex-shrink-0 items-center border-b border-gray-200 px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
              <Brain className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && <span className="text-lg font-bold">EmotionAI</span>}
          </Link>
        </div>

        {/* Collapse Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 z-50 hidden h-6 w-6 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 lg:flex"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              // For /check-in, only match exactly (not /check-in/new or /check-in/123)
              // For /check-in/new, match exactly or with query params
              // For other routes, allow nested matches
              let isActive = false;
              if (item.href === '/check-in') {
                isActive = pathname === '/check-in';
              } else if (item.href === '/check-in/new') {
                isActive = pathname === '/check-in/new' || pathname.startsWith('/check-in/new?');
              } else {
                isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
