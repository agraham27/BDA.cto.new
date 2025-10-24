'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: Array<'student' | 'admin' | 'instructor'>;
  redirectTo?: string;
  unauthorizedRedirect?: string;
}

export function AuthGuard({
  children,
  allowedRoles = [],
  redirectTo = '/auth/login',
  unauthorizedRedirect = '/',
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const searchParams = new URLSearchParams();
        if (pathname) {
          searchParams.set('next', pathname);
        }
        const queryString = searchParams.toString();
        const separator = redirectTo.includes('?') ? '&' : '?';
        router.replace(`${redirectTo}${queryString ? `${separator}${queryString}` : ''}`);
      } else if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        router.replace(unauthorizedRedirect);
      }
    }
  }, [allowedRoles, isAuthenticated, isLoading, pathname, redirectTo, router, unauthorizedRedirect, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
