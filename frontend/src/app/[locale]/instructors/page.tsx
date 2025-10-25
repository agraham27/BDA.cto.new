import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { fetchPublicInstructors } from '@/lib/api/public';
import { Card, CardContent } from '@/components/ui/card';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'instructors' });

  return {
    title: t('page_title'),
    description: t('page_description') || 'Meet our expert instructors dedicated to excellence in education.',
  };
}

export default async function InstructorsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'instructors' });
  
  let instructorsData;

  try {
    instructorsData = await fetchPublicInstructors({ limit: 20 });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    instructorsData = { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  const instructors = instructorsData.data;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="mb-4 text-5xl font-semibold text-gray-900">{t('page_title')}</h1>
        <p className="max-w-3xl text-lg text-gray-600">
          {t('page_subtitle')}
        </p>
      </div>

      {instructors.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 text-4xl flex items-center justify-center">
              👨‍🏫
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">{t('no_instructors')}</h3>
            <p className="text-gray-600">{t('no_instructors_description')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {instructors.map((instructor) => {
            const instructorName = `${instructor.user.firstName || ''} ${instructor.user.lastName || ''}`.trim() || 'Unknown Instructor';
            const courseCount = instructor._count?.courses || 0;
            const blogPostCount = instructor._count?.blogPosts || 0;

            return (
              <Link
                key={instructor.id}
                href={`/${locale}/instructors/${instructor.id}`}
                className="group"
              >
                <Card variant="elevated" className="h-full transition-shadow hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-4">
                      {instructor.user.avatarUrl ? (
                        <img
                          src={instructor.user.avatarUrl}
                          alt={instructorName}
                          className="h-20 w-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
                          {instructorName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600">
                          {instructorName}
                        </h3>
                        {instructor.headline && (
                          <p className="text-sm text-gray-600">{instructor.headline}</p>
                        )}
                      </div>
                    </div>
                    {instructor.bio && (
                      <p className="mb-4 line-clamp-3 text-sm text-gray-600">
                        {instructor.bio}
                      </p>
                    )}
                    {instructor.expertise && instructor.expertise.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {instructor.expertise.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-primary-100 px-3 py-1 text-xs text-primary-700"
                          >
                            {skill}
                          </span>
                        ))}
                        {instructor.expertise.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                            +{instructor.expertise.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>📚</span>
                        <span>{courseCount} {t('courses')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>✍️</span>
                        <span>{blogPostCount} {t('posts')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
