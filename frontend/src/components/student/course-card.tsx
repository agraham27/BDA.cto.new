'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { EnrolledCourse } from '@/types/student';
import { Button } from '@/components/ui';

interface CourseCardProps {
  course: EnrolledCourse;
  locale: string;
}

export function CourseCard({ course, locale }: CourseCardProps) {
  const t = useTranslations('student');

  const progressPercentage = Math.round(course.progress);

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100">
            <span className="text-4xl font-bold text-primary-600">
              {course.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center gap-2 text-sm text-white">
            <span className="rounded bg-white/20 px-2 py-1 text-xs font-medium backdrop-blur-sm">
              {course.level}
            </span>
            <span className="text-xs">
              {course.completedLessons}/{course.totalLessons} {t('lessons')}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-2">
              {course.title}
            </h3>
            <p className="mb-3 text-sm text-gray-600 line-clamp-2">{course.description}</p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          {course.instructor.avatarUrl ? (
            <img
              src={course.instructor.avatarUrl}
              alt={course.instructor.name}
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
              {course.instructor.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="truncate">{course.instructor.name}</span>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{t('progress')}</span>
            <span className="font-semibold text-primary-600">{progressPercentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {course.lastAccessedLesson && (
          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <p className="mb-1 text-xs font-medium text-gray-500">{t('continue_learning')}</p>
            <p className="text-sm font-medium text-gray-900 line-clamp-1">
              {course.lastAccessedLesson.title}
            </p>
            <p className="text-xs text-gray-500">{course.lastAccessedLesson.sectionTitle}</p>
          </div>
        )}

        <Link href={`/${locale}/student/courses/${course.id}`}>
          <Button variant="primary" className="w-full">
            {course.lastAccessedLesson ? t('continue_learning') : t('start_course')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
