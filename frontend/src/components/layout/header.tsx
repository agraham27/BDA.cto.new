'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

import { MainNavigation } from '../navigation/main-navigation';
import { Button } from '../ui/button';

export function Header() {
  const t = useTranslations('navigation');
  const params = useParams();
  const locale = params.locale as string;
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="text-2xl font-semibold text-primary-600">⭐</div>
          <span className="text-xl font-semibold text-gray-900">Big Dipper</span>
        </Link>

        <MainNavigation />

        <div className="flex items-center gap-3">
          {!isAuthenticated && !isLoading && (
            <Button asChild variant="primary" size="sm">
              <Link href={`/${locale}/auth/login`}>{t('login')}</Link>
            </Button>
          )}
          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                {t('logout')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
