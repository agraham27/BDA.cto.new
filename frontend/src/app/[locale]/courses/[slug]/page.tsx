import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { fetchPublicCourse } from '@/lib/api/public';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CoursePageProps {
  params: { locale: string; slug: string };
}

export async function generateMetadata({ params: { locale, slug } }: CoursePageProps): Promise<Metadata> {
  try {
    const { data: course } = await fetchPublicCourse(slug);
    const description = course.description || 'Learn with Big Dipper Academy';

    return {
      title: course.title,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    };
  } catch (error) {
    return {
      title: 'Course Not Found',
      description: 'The requested course could not be found.',
    };
  }
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

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

export default async function CoursePage({ params: { locale, slug } }: CoursePageProps) {
  const t = await getTranslations({ locale, namespace: 'courses' });
  
  let course;
  try {
    const response = await fetchPublicCourse(slug);
    course = response.data;
  } catch (error) {
    notFound();
  }

  const instructorName = `${course.instructor.user.firstName || ''} ${course.instructor.user.lastName || ''}`.trim() || 'Unknown Instructor';
  const description = course.description || t('no_description');
  const sections = course.sections || [];
  const totalLessons = sections.reduce((sum, section) => sum + (section.lessons?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getLevelBadgeColor(course.level)}`}>
                  {formatLevel(course.level)}
                </span>
                {course.categories.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {course.categories.map(c => c.category.name).join(', ')}
                  </span>
                )}
              </div>
              <h1 className="mb-4 text-4xl font-semibold text-gray-900 md:text-5xl">
                {course.title}
              </h1>
              <p className="text-lg text-gray-600">
                {description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {course.estimatedDuration && (
                  <div className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span>{formatDuration(course.estimatedDuration)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span>📚</span>
                  <span>{totalLessons} {t('lessons')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>👥</span>
                  <span>{course._count.enrollments} {t('students')}</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <Card variant="elevated">
                <CardContent className="p-6">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="mb-6 w-full rounded-lg"
                    />
                  ) : (
                    <div className="mb-6 flex aspect-video w-full items-center justify-center rounded-lg bg-gray-100 text-6xl">
                      📚
                    </div>
                  )}
                  <Button asChild className="w-full mb-4" size="lg">
                    <Link href={`/${locale}/auth/login`}>{t('enroll_now')}</Link>
                  </Button>
                  <p className="text-center text-sm text-gray-600">{t('enroll_description')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <section className="mb-12">
              <h2 className="mb-6 text-3xl font-semibold text-gray-900">{t('curriculum')}</h2>
              {sections.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-gray-600">
                    {t('no_curriculum')}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <Card key={section.id} variant="elevated">
                      <CardContent className="p-6">
                        <h3 className="mb-2 text-xl font-semibold text-gray-900">
                          {index + 1}. {section.title}
                        </h3>
                        {section.description && (
                          <p className="mb-4 text-sm text-gray-600">{section.description}</p>
                        )}
                        {section.lessons && section.lessons.length > 0 && (
                          <ul className="space-y-2">
                            {section.lessons.map((lesson) => (
                              <li key={lesson.id} className="flex items-center gap-3 text-sm text-gray-700">
                                <span className="text-gray-400">
                                  {lesson.type === 'VIDEO' ? '🎥' : lesson.type === 'QUIZ' ? '✏️' : '📄'}
                                </span>
                                <span>{lesson.title}</span>
                                {lesson.duration && (
                                  <span className="ml-auto text-xs text-gray-500">
                                    {formatDuration(lesson.duration)}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <section>
              <h2 className="mb-6 text-2xl font-semibold text-gray-900">{t('instructor')}</h2>
              <Card variant="elevated">
                <CardContent className="p-6">
                  <Link
                    href={`/${locale}/instructors/${course.instructor.id}`}
                    className="group block"
                  >
                    <div className="mb-4 flex items-center gap-4">
                      {course.instructor.user.avatarUrl ? (
                        <img
                          src={course.instructor.user.avatarUrl}
                          alt={instructorName}
                          className="h-16 w-16 rounded-full"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                          {instructorName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                          {instructorName}
                        </h3>
                        {course.instructor.headline && (
                          <p className="text-sm text-gray-600">{course.instructor.headline}</p>
                        )}
                      </div>
                    </div>
                    {course.instructor.bio && (
                      <p className="text-sm text-gray-600 line-clamp-3">{course.instructor.bio}</p>
                    )}
                    {course.instructor.expertise && course.instructor.expertise.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {course.instructor.expertise.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
