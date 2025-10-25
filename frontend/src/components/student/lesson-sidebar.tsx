'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { SectionWithProgress } from '@/types/student';
import { cn } from '@/lib/utils';

interface LessonSidebarProps {
  sections: SectionWithProgress[];
  currentLessonId?: string;
  courseId: string;
}

export function LessonSidebar({ sections, currentLessonId, courseId }: LessonSidebarProps) {
  const t = useTranslations('student');
  const params = useParams();
  const locale = params.locale as string;

  const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const completedLessons = sections.reduce(
    (sum, section) => sum + section.lessons.filter((l) => l.isCompleted).length,
    0
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('curriculum')}</h2>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {completedLessons}/{totalLessons} {t('lessons')}
          </span>
          <span>{Math.round((completedLessons / totalLessons) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
            style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="border-b border-gray-200">
            <div className="bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {t('section')} {section.position}: {section.title}
              </h3>
              {section.description && (
                <p className="mt-1 text-xs text-gray-600">{section.description}</p>
              )}
            </div>
            <div>
              {section.lessons.map((lesson, lessonIndex) => {
                const isActive = lesson.id === currentLessonId;
                return (
                  <Link
                    key={lesson.id}
                    href={`/${locale}/student/courses/${courseId}/lessons/${lesson.id}`}
                    className={cn(
                      'flex items-start gap-3 border-l-4 p-4 transition-colors hover:bg-gray-50',
                      isActive
                        ? 'border-primary-500 bg-primary-50'
                        : lesson.isCompleted
                          ? 'border-green-500'
                          : 'border-transparent'
                    )}
                  >
                    <div className="flex-shrink-0">
                      {lesson.isCompleted ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-medium',
                            isActive
                              ? 'border-primary-500 bg-primary-500 text-white'
                              : 'border-gray-300 text-gray-500'
                          )}
                        >
                          {lesson.position}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium line-clamp-2',
                          isActive ? 'text-primary-700' : 'text-gray-900'
                        )}
                      >
                        {lesson.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        {lesson.type === 'VIDEO' && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                            {lesson.duration ? `${lesson.duration}m` : 'Video'}
                          </span>
                        )}
                        {lesson.type === 'ARTICLE' && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Article
                          </span>
                        )}
                        {lesson.hasQuiz && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Quiz
                          </span>
                        )}
                        {lesson.fileCount > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {lesson.fileCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
