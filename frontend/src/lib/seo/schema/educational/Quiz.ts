import { Schema } from '@/types/seo';
import { toISO8601Duration } from '@/lib/seo/utils/validators';

interface QuizData {
  name: string;
  description: string;
  courseName?: string;
  numberOfQuestions?: number;
  timeRequiredMinutes?: number;
}

export function generateQuizSchema(quiz: QuizData): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: quiz.name,
    description: quiz.description,
    educationalLevel: 'Intermediate',
    assesses: 'Investment knowledge',
    educationalUse: 'Assessment',
    learningResourceType: 'Quiz',
    ...(quiz.courseName && {
      isPartOf: {
        '@type': 'Course',
        name: quiz.courseName,
      },
    }),
    numberOfQuestions: quiz.numberOfQuestions || 10,
    timeRequired: toISO8601Duration(quiz.timeRequiredMinutes) || 'PT10M',
  };
}
