export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  instructorId: string;
  instructor?: Instructor;
  sections?: Section[];
  enrollmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  courseId: string;
  course?: Course;
  lessons?: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  sectionId: string;
  section?: Section;
  files?: LessonFile[];
  quiz?: Quiz;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  lessonId: string;
  lesson?: Lesson;
  questions?: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  points: number;
  order: number;
  quizId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  lessonId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Instructor {
  id: string;
  userId: string;
  bio?: string;
  expertise?: string[];
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'dropped';
  progress: number;
  enrolledAt: string;
  completedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  course?: Course;
}

export interface CourseProgress {
  userId: string;
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  quizScores: Record<string, number>;
  lastAccessedAt: string;
}
