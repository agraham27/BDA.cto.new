import { Course, Lesson, Quiz, LessonFile } from './course';

export interface EnrolledCourse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  level: string;
  language: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  enrolledAt: string;
  lastAccessedLesson?: {
    id: string;
    title: string;
    sectionTitle: string;
  } | null;
  instructor: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface CourseWithProgress {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  level: string;
  language: string;
  estimatedDuration?: number;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  enrolledAt: string;
  instructor: {
    id: string;
    name: string;
    avatarUrl?: string;
    headline?: string;
    bio?: string;
  };
  sections: SectionWithProgress[];
}

export interface SectionWithProgress {
  id: string;
  title: string;
  description?: string;
  position: number;
  lessons: LessonWithProgress[];
}

export interface LessonWithProgress {
  id: string;
  title: string;
  summary?: string;
  type: 'ARTICLE' | 'VIDEO' | 'QUIZ';
  duration?: number;
  position: number;
  videoUrl?: string;
  hasQuiz: boolean;
  fileCount: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface LessonDetail {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  type: 'ARTICLE' | 'VIDEO' | 'QUIZ';
  position: number;
  section: {
    id: string;
    title: string;
  };
  course: {
    id: string;
    title: string;
  };
  quiz?: Quiz;
  files: {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    category: string;
  }[];
  progress: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    startedAt?: string;
    completedAt?: string;
  };
}

export interface StudentProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface StudentStats {
  totalCourses: number;
  completedCourses: number;
  activeCourses: number;
  totalLessonsCompleted: number;
  completionRate: number;
  averageProgress: number;
}

export interface QuizAnswer {
  [questionId: string]: string;
}

export interface QuizResult {
  quizId: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  results: {
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
  }[];
}
