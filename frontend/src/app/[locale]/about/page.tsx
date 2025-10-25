import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { Card, CardContent } from '@/components/ui/card';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'navigation' });

  return {
    title: t('about'),
    description: 'Learn about Big Dipper Academy, our mission, and our commitment to excellence in education.',
  };
}

export default async function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'navigation' });

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-semibold text-gray-900">{t('about')}</h1>
          <p className="mt-4 text-lg text-gray-600">
            Learn about the Big Dipper education platform
          </p>
        </div>

        <Card variant="elevated">
          <CardContent className="space-y-6 py-8">
            <div>
              <h2 className="mb-4 text-3xl font-semibold text-gray-900">Our Mission</h2>
              <p className="text-gray-600">
                Hoc Vien Big Dipper is dedicated to nurturing the next generation of space explorers through
                innovative education programs that combine science, technology, and creativity.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-3xl font-semibold text-gray-900">Technology Stack</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Next.js 14 with App Router for server-side rendering and routing</li>
                <li>TypeScript for type-safe development</li>
                <li>Tailwind CSS for modern, responsive design</li>
                <li>React Query for efficient data fetching and caching</li>
                <li>JWT-based authentication for secure access</li>
                <li>Internationalization support for Vietnamese and English</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-4 text-3xl font-semibold text-gray-900">Features</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">Student Portal</h3>
                  <p className="text-sm text-gray-600">
                    Dedicated space for students to access courses, track progress, and engage with content.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">Admin Dashboard</h3>
                  <p className="text-sm text-gray-600">
                    Comprehensive management tools for instructors and administrators.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">Responsive Design</h3>
                  <p className="text-sm text-gray-600">
                    Optimized experience across all devices from mobile to desktop.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">Real-time Updates</h3>
                  <p className="text-sm text-gray-600">
                    Stay connected with instant notifications and live data synchronization.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
