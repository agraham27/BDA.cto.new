import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'hero' });

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-5xl font-semibold tracking-tight text-gray-900 md:text-6xl">
              {t('title')}
            </h1>
            <p className="mt-6 text-lg text-gray-600 md:text-xl">{t('subtitle')}</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href={`/${locale}/programs`}>{t('cta_primary')}</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href={`/${locale}/about`}>{t('cta_secondary')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <Card variant="elevated">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-2xl text-primary-600">
                  ⚡
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">Next.js 14</h3>
                <p className="text-sm text-gray-600">
                  App Router with Server Components and React Server Actions for optimal performance
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100 text-2xl text-secondary-600">
                  🎨
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">Tailwind CSS</h3>
                <p className="text-sm text-gray-600">
                  Utility-first CSS framework with custom design system and Big Dipper branding
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-2xl text-accent-600">
                  🚀
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">TypeScript</h3>
                <p className="text-sm text-gray-600">
                  Type-safe development with full TypeScript support across the entire stack
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
