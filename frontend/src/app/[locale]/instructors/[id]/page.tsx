import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { fetchPublicInstructor } from '@/lib/api/public';
import { Card, CardContent } from '@/components/ui/card';

interface InstructorPageProps {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params: { locale, id } }: InstructorPageProps): Promise<Metadata> {
  try {
    const { data: instructor } = await fetchPublicInstructor(id);
    const instructorName = `${instructor.user.firstName || ''} ${instructor.user.lastName || ''}`.trim();
    const description = instructor.headline || instructor.bio || `${instructorName} - Big Dipper Academy Instructor`;

    return {
      title: instructorName,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    };
  } catch (error) {
    return {
      title: 'Instructor Not Found',
      description: 'The requested instructor could not be found.',
    };
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function InstructorPage({ params: { locale, id } }: InstructorPageProps) {
  const t = await getTranslations({ locale, namespace: 'instructors' });
  
  let instructor;
  try {
    const response = await fetchPublicInstructor(id);
    instructor = response.data;
  } catch (error) {
    notFound();
  }

  const instructorName = `${instructor.user.firstName || ''} ${instructor.user.lastName || ''}`.trim() || 'Unknown Instructor';
  const courses = instructor.courses || [];
  const blogPosts = instructor.blogPosts || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {instructor.user.avatarUrl ? (
              <img
                src={instructor.user.avatarUrl}
                alt={instructorName}
                className="h-32 w-32 rounded-full object-cover"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center text-5xl">
                {instructorName.charAt(0)}
              </div>
            )}
            <div className="flex-1 text-center md:text-left">
              <h1 className="mb-2 text-4xl font-semibold text-gray-900 md:text-5xl">
                {instructorName}
              </h1>
              {instructor.headline && (
                <p className="mb-4 text-xl text-gray-600">{instructor.headline}</p>
              )}
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 md:justify-start">
                <div className="flex items-center gap-1">
                  <span>📚</span>
                  <span>{instructor._count?.courses || 0} {t('courses')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>✍️</span>
                  <span>{instructor._count?.blogPosts || 0} {t('posts')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {instructor.bio && (
              <section className="mb-12">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">{t('about')}</h2>
                <Card variant="elevated">
                  <CardContent className="p-6">
                    <p className="whitespace-pre-wrap text-gray-700">{instructor.bio}</p>
                  </CardContent>
                </Card>
              </section>
            )}

            {courses.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-6 text-2xl font-semibold text-gray-900">{t('courses_by_instructor')}</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {courses.map((course) => {
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
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-5xl">
                                📚
                              </div>
                            )}
                          </div>
                          <CardContent className="p-6">
                            <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                              {course.title}
                            </h3>
                            <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                              {description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{course._count.sections} {t('sections')}</span>
                              <span>{course._count.enrollments} {t('students')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {blogPosts.length > 0 && (
              <section>
                <h2 className="mb-6 text-2xl font-semibold text-gray-900">{t('recent_posts')}</h2>
                <div className="space-y-4">
                  {blogPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/${locale}/blog/${post.slug}`}
                      className="group block"
                    >
                      <Card variant="elevated" className="transition-shadow hover:shadow-lg">
                        <CardContent className="p-6">
                          <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="mb-3 text-sm text-gray-600">{post.excerpt}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                            {post.tags.length > 0 && (
                              <div className="flex gap-2">
                                {post.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="rounded-full bg-gray-100 px-2 py-1">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-1">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">{t('expertise')}</h2>
              <Card variant="elevated">
                <CardContent className="p-6">
                  {instructor.expertise && instructor.expertise.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {instructor.expertise.map((skill, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-primary-100 px-3 py-1.5 text-sm text-primary-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">{t('no_expertise')}</p>
                  )}
                </CardContent>
              </Card>
            </section>

            {instructor.website && (
              <section className="mt-6">
                <Card variant="elevated">
                  <CardContent className="p-6">
                    <h3 className="mb-3 font-semibold text-gray-900">{t('website')}</h3>
                    <a
                      href={instructor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 break-all"
                    >
                      {instructor.website}
                    </a>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
