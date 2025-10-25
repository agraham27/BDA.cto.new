'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { fetchEnrolledCourses } from '@/lib/api/student';
import { CourseCard } from '@/components/student/course-card';
import { Input, Card, CardHeader, CardContent, Alert } from '@/components/ui';

export default function MyCoursesPage() {
  const t = useTranslations('student');
  const params = useParams();
  const locale = params.locale as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'progress'>('recent');

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['student', 'courses'],
    queryFn: () => fetchEnrolledCourses(locale),
  });

  const filteredCourses = courses
    ?.filter((course) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        course.title.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.instructor.name.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'progress') {
        return b.progress - a.progress;
      }
      return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
    });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert variant="error" title="Error">
          Failed to load courses. Please try again later.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="page-title mb-2">{t('my_courses')}</h1>
        <p className="page-subtitle">{t('enrolled_courses')}</p>
      </div>

      {courses && courses.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <Input
                  placeholder={t('search_courses')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">{t('sort_by')}:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="recent">{t('recent')}</option>
                  <option value="alphabetical">{t('alphabetical')}</option>
                  <option value="progress">{t('progress_desc')}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : filteredCourses && filteredCourses.length > 0 ? (
        <>
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} locale={locale} />
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-10 w-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t('no_courses')}</h3>
            <p className="mb-4 text-sm text-gray-600">{t('browse_catalog')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
