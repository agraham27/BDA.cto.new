import { apiClient } from './client';
import type {
  EnrolledCourse,
  CourseWithProgress,
  LessonDetail,
  StudentProfile,
  StudentStats,
  QuizAnswer,
  QuizResult,
} from '@/types/student';

export async function fetchEnrolledCourses(locale?: string) {
  const { data } = await apiClient.get<{ data: EnrolledCourse[] }>('/api/student/courses', {
    headers: locale ? { 'Accept-Language': locale } : undefined,
  });
  return data.data;
}

export async function fetchCourseWithProgress(courseId: string, locale?: string) {
  const { data } = await apiClient.get<{ data: CourseWithProgress }>(
    `/api/student/courses/${courseId}`,
    {
      headers: locale ? { 'Accept-Language': locale } : undefined,
    }
  );
  return data.data;
}

export async function fetchLesson(courseId: string, lessonId: string, locale?: string) {
  const { data } = await apiClient.get<{ data: LessonDetail }>(
    `/api/student/courses/${courseId}/lessons/${lessonId}`,
    {
      headers: locale ? { 'Accept-Language': locale } : undefined,
    }
  );
  return data.data;
}

export async function markLessonComplete(courseId: string, lessonId: string) {
  const { data } = await apiClient.post<{ data: { courseProgress: number } }>(
    '/api/student/progress',
    {
      courseId,
      lessonId,
    }
  );
  return data.data.courseProgress;
}

export async function fetchStudentProfile() {
  const { data } = await apiClient.get<{ data: StudentProfile }>('/api/student/profile');
  return data.data;
}

export async function updateStudentProfile(payload: Partial<StudentProfile>) {
  const { data } = await apiClient.put<{ data: StudentProfile }>('/api/student/profile', payload);
  return data.data;
}

export async function fetchStudentStats() {
  const { data } = await apiClient.get<{ data: StudentStats }>('/api/student/stats');
  return data.data;
}

export async function submitQuiz(quizId: string, answers: QuizAnswer) {
  const { data } = await apiClient.post<{ data: QuizResult }>(
    `/api/student/quizzes/${quizId}/submit`,
    {
      answers,
    }
  );
  return data.data;
}
