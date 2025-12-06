'use client';

import { useSidebar } from '@/contexts/sidebar-context';
import { usePathname } from 'next/navigation';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

  // Public pages don't need sidebar/header spacing
  const publicPages = ['/', '/login', '/signup', '/onboarding'];
  const isPublicPage = publicPages.includes(pathname);

  return (
    <main
      className={`transition-all duration-300 ${
        isPublicPage
          ? ''
          : `pt-16 pb-4 px-4 md:px-6 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`
      }`}
    >
      <div className={isPublicPage ? '' : 'max-w-6xl mx-auto'}>{children}</div>
    </main>
  );
}
