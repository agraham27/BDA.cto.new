'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  {
    key: 'home',
    path: '',
  },
  {
    key: 'courses',
    path: '/courses',
  },
  {
    key: 'instructors',
    path: '/instructors',
  },
  {
    key: 'blog',
    path: '/blog',
  },
  {
    key: 'about',
    path: '/about',
  },
];

export function MainNavigation() {
  const t = useTranslations('navigation');
  const params = useParams();
  const locale = params.locale as string;
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-5 md:flex">
      {navItems.map(({ key, path }) => {
        const href = `/${locale}${path}`;
        const isActive = pathname === href;

        return (
          <Link
            key={key}
            href={href}
            className={cn(
              'text-sm font-medium transition-colors',
              isActive ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'
            )}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
