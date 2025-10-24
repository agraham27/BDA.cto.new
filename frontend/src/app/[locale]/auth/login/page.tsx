import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardHeader } from '@/components/ui';

export default async function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-3xl text-white shadow-elevated">
            ⭐
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">{t('welcome_back')}</h1>
          <p className="mt-2 text-gray-600">{t('sign_in_to_continue')}</p>
        </div>

        <Card variant="elevated">
          <CardHeader title={t('sign_in')} />
          <CardContent>
            <LoginForm />
            <div className="mt-6 text-center text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link href={`/${locale}/auth/register`} className="font-medium text-primary-600 hover:text-primary-700">
                {t('create_account')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
