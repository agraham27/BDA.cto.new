'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { fetchCourseWithProgress } from '@/lib/api/student';
import { LessonSidebar } from '@/components/student/lesson-sidebar';
import { Card, CardHeader, CardContent, Alert, Button } from '@/components/ui';

export default function CoursePage() {
  const t = useTranslations('student');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const courseId = params.id as string;

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['student', 'course', courseId],
    queryFn: () => fetchCourseWithProgress(courseId, locale),
  });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert variant="error" title="Error">
          Failed to load course. Please try again later.
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="h-full w-80 animate-pulse bg-gray-200" />
        <div className="flex-1 animate-pulse bg-gray-100" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert variant="error" title="Not Found">
          Course not found or you do not have access to it.
        </Alert>
      </div>
    );
  }

  const firstLesson = course.sections[0]?.lessons[0];

  const handleStartCourse = () => {
    if (firstLesson) {
      router.push(`/${locale}/student/courses/${courseId}/lessons/${firstLesson.id}`);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-80 flex-shrink-0 overflow-hidden border-r border-gray-200">
        <LessonSidebar sections={course.sections} courseId={courseId} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-6 py-8">
          <div className="mb-8">
            {course.thumbnailUrl && (
              <div className="mb-6 aspect-video w-full overflow-hidden rounded-xl">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <h1 className="mb-2 text-3xl font-bold text-gray-900">{course.title}</h1>

            <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                {course.instructor.avatarUrl ? (
                  <img
                    src={course.instructor.avatarUrl}
                    alt={course.instructor.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
                    {course.instructor.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{course.instructor.name}</span>
              </div>
              <span>•</span>
              <span>
                {course.totalLessons} {t('lessons')}
              </span>
              {course.estimatedDuration && (
                <>
                  <span>•</span>
                  <span>
                    {course.estimatedDuration} {t('minutes')}
                  </span>
                </>
              )}
            </div>

            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{t('progress')}</span>
                <span className="font-semibold text-primary-600">{course.progress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>

            {firstLesson && course.progress < 100 && (
              <Button variant="primary" size="lg" onClick={handleStartCourse} className="w-full">
                {course.progress > 0 ? t('continue_learning') : t('start_course')}
              </Button>
            )}

            {course.progress === 100 && (
              <Alert variant="success" title={t('completed')}>
                Congratulations! You have completed this course.
              </Alert>
            )}
          </div>

          <Card className="mb-8">
            <CardHeader title={t('course_overview')} />
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
            </CardContent>
          </Card>

          {course.instructor.bio && (
            <Card>
              <CardHeader title={t('about_instructor')} />
              <CardContent>
                <div className="flex items-start gap-4">
                  {course.instructor.avatarUrl ? (
                    <img
                      src={course.instructor.avatarUrl}
                      alt={course.instructor.name}
                      className="h-16 w-16 rounded-full"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-xl font-medium">
                      {course.instructor.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-semibold text-gray-900">
                      {course.instructor.name}
                    </h3>
                    {course.instructor.headline && (
                      <p className="mb-2 text-sm text-gray-600">{course.instructor.headline}</p>
                    )}
                    <p className="text-gray-700 whitespace-pre-wrap">{course.instructor.bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
