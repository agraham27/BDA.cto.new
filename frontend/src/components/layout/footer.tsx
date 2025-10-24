'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function Footer() {
  const t = useTranslations('footer');
  const params = useParams();
  const locale = params.locale as string;

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-2xl">⭐</div>
              <span className="text-lg font-semibold text-gray-900">Big Dipper</span>
            </div>
            <p className="mt-3 text-sm text-gray-600">{t('tagline')}</p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">{t('company')}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={`/${locale}/about`} className="text-gray-600 hover:text-primary-600 transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/careers`} className="text-gray-600 hover:text-primary-600 transition-colors">
                  {t('careers')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className="text-gray-600 hover:text-primary-600 transition-colors">
                  {t('blog')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">{t('resources')}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={`/${locale}/docs`} className="text-gray-600 hover:text-primary-600 transition-colors">
                  {t('docs')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/support`} className="text-gray-600 hover:text-primary-600 transition-colors">
                  {t('support')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">{t('legal')}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={`/${locale}/privacy`} className="text-gray-600 hover:text-primary-600 transition-colors">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="text-gray-600 hover:text-primary-600 transition-colors">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-gray-600 hover:text-primary-600 transition-colors">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Hoc Vien Big Dipper. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
