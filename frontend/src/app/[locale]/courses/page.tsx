import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { fetchPublicCourses, fetchPublicCategories } from '@/lib/api/public';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'courses' });

  return {
    title: t('page_title'),
    description: t('page_description') || 'Explore our comprehensive catalog of courses designed to nurture the next generation of space explorers.',
  };
}

function getLevelBadgeColor(level: string): string {
  switch (level) {
    case 'BEGINNER':
      return 'bg-green-100 text-green-700';
    case 'INTERMEDIATE':
      return 'bg-blue-100 text-blue-700';
    case 'ADVANCED':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function formatLevel(level: string): string {
  return level.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
}

export default async function CoursesPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'courses' });
  
  let coursesData;
  let categoriesData;

  try {
    coursesData = await fetchPublicCourses({ limit: 12 });
    categoriesData = await fetchPublicCategories();
  } catch (error) {
    console.error('Error fetching courses:', error);
    coursesData = { data: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } };
    categoriesData = { data: [] };
  }

  const courses = coursesData.data;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="mb-4 text-5xl font-semibold text-gray-900">{t('page_title')}</h1>
        <p className="max-w-3xl text-lg text-gray-600">
          {t('page_subtitle')}
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 text-4xl flex items-center justify-center">
              📚
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">{t('no_courses')}</h3>
            <p className="text-gray-600">{t('no_courses_description')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const instructorName = `${course.instructor.user.firstName || ''} ${course.instructor.user.lastName || ''}`.trim() || 'Unknown Instructor';
            const thumbnailUrl = course.thumbnailUrl || '/placeholder-course.jpg';
            const description = course.description || t('no_description');

            return (
              <Link
                key={course.id}
                href={`/${locale}/courses/${course.slug}`}
                className="group"
              >
                <Card variant="elevated" className="h-full transition-shadow hover:shadow-xl">
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100">
                    {course.thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-6xl">
                        📚
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getLevelBadgeColor(course.level)}`}>
                        {formatLevel(course.level)}
                      </span>
                      {course.categories.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {course.categories[0].category.name}
                        </span>
                      )}
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 group-hover:text-primary-600">
                      {course.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                      {description}
                    </p>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-2">
                        {course.instructor.user.avatarUrl ? (
                          <img
                            src={course.instructor.user.avatarUrl}
                            alt={instructorName}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                            {instructorName.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm text-gray-600">{instructorName}</span>
                      </div>
                      {course.estimatedDuration && (
                        <span className="text-xs text-gray-500">
                          {Math.floor(course.estimatedDuration / 60)}h {course.estimatedDuration % 60}m
                        </span>
                      )}
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
