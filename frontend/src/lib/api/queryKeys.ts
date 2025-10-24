export const queryKeys = {
  me: ['auth', 'me'] as const,
  students: ['students', 'list'] as const,
  studentDetail: (id: string) => ['students', id] as const,
  courses: ['courses', 'list'] as const,
  announcements: ['announcements', 'list'] as const,
};
