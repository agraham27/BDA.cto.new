import { Schema, LessonData } from '@/types/seo';
import { toISO8601Duration } from '@/lib/seo/utils/validators';

export function generateLearningResourceSchema(lesson: LessonData): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lesson.title,
    description: lesson.description,
    learningResourceType: lesson.videoUrl ? 'Video Lesson' : 'Lesson',
    educationalLevel: 'Beginner',
    inLanguage: 'vi',
    ...(lesson.courseName && {
      isPartOf: {
        '@type': 'Course',
        name: lesson.courseName,
      },
    }),
    ...(lesson.instructor && {
      author: {
        '@type': 'Person',
        name: lesson.instructor.name,
      },
    }),
    teaches: lesson.description,
    ...(lesson.duration && { timeRequired: toISO8601Duration(lesson.duration) }),
  };
}
