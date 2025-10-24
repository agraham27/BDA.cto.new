'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Courses', href: '/admin/courses', icon: '📚' },
  { label: 'Sections', href: '/admin/sections', icon: '📑' },
  { label: 'Lessons', href: '/admin/lessons', icon: '📖' },
  { label: 'Quizzes', href: '/admin/quizzes', icon: '✏️' },
  { label: 'Files', href: '/admin/files', icon: '📁' },
  { label: 'Users', href: '/admin/users', icon: '👥' },
  { label: 'Instructors', href: '/admin/instructors', icon: '👨‍🏫' },
  { label: 'Enrollments', href: '/admin/enrollments', icon: '🎓' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;

  const isActive = (href: string) => {
    if (href === `/admin`) {
      return pathname === `/${locale}/admin`;
    }
    return pathname?.startsWith(`/${locale}${href}`);
  };

  return (
    <AuthGuard
      allowedRoles={['admin']}
      redirectTo={`/${locale}/auth/login`}
      unauthorizedRedirect={`/${locale}`}
    >
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white transition-transform duration-300 ${
            sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'
          } lg:translate-x-0`}
        >
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <Link href={`/${locale}/admin`} className="flex items-center gap-2">
              <div className="text-2xl">⚙️</div>
              <span className="text-lg font-semibold text-gray-900">Admin Panel</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-gray-200 p-4">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <span className="text-lg">🏠</span>
              <span>Back to Site</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'}
                />
              </svg>
            </button>

            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/admin/settings`}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-8">{children}</main>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
