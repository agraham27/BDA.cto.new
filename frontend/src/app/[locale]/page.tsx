import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { Metadata } from 'next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'hero' });
  
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'hero' });
  const tNav = await getTranslations({ locale, namespace: 'navigation' });
  const tLanding = await getTranslations({ locale, namespace: 'landing' });

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-5xl font-semibold tracking-tight text-gray-900 md:text-6xl">
              {t('title')}
            </h1>
            <p className="mt-6 text-lg text-gray-600 md:text-xl">{t('subtitle')}</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href={`/${locale}/courses`}>{t('cta_primary')}</Link>
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
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold text-gray-900 md:text-4xl">{tLanding('philosophy_title')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{tLanding('philosophy_subtitle')}</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <Card variant="elevated">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-2xl text-primary-600">
                  🌟
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">{tLanding('feature_excellence_title')}</h3>
                <p className="text-sm text-gray-600">
                  {tLanding('feature_excellence_description')}
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100 text-2xl text-secondary-600">
                  🚀
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">{tLanding('feature_innovation_title')}</h3>
                <p className="text-sm text-gray-600">
                  {tLanding('feature_innovation_description')}
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-2xl text-accent-600">
                  💡
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">{tLanding('feature_community_title')}</h3>
                <p className="text-sm text-gray-600">
                  {tLanding('feature_community_description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold text-gray-900 md:text-4xl">{tLanding('explore_title')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{tLanding('explore_subtitle')}</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link 
              href={`/${locale}/courses`}
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 text-3xl">📚</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                {tNav('courses')}
              </h3>
              <p className="text-sm text-gray-600">{tLanding('courses_description')}</p>
            </Link>

            <Link 
              href={`/${locale}/instructors`}
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 text-3xl">👨‍🏫</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                {tNav('instructors')}
              </h3>
              <p className="text-sm text-gray-600">{tLanding('instructors_description')}</p>
            </Link>

            <Link 
              href={`/${locale}/blog`}
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 text-3xl">✍️</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                {tNav('blog')}
              </h3>
              <p className="text-sm text-gray-600">{tLanding('blog_description')}</p>
            </Link>

            <Link 
              href={`/${locale}/about`}
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 text-3xl">ℹ️</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                {tNav('about')}
              </h3>
              <p className="text-sm text-gray-600">{tLanding('about_description')}</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
