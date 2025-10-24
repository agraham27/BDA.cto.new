'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  DataTable,
  Input,
  Modal,
  Pagination,
  SimpleSelect,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { Lesson, Quiz } from '@/types/course';

const mockLessons: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Components 101',
    description: 'Basics of React components',
    order: 1,
    sectionId: 'section-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'lesson-2',
    title: 'State and Props',
    description: 'Understanding state and props',
    order: 2,
    sectionId: 'section-1',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z',
  },
];

const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Components Basics Quiz',
    description: 'Test your understanding of components',
    lessonId: 'lesson-1',
    passingScore: 70,
    timeLimit: 15,
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z',
  },
  {
    id: 'quiz-2',
    title: 'State Management Quiz',
    description: 'Check your knowledge of state and props',
    lessonId: 'lesson-2',
    passingScore: 80,
    timeLimit: 20,
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-23T10:00:00Z',
  },
];

export default function QuizzesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [quizzes, setQuizzes] = useState<Quiz[]>(mockQuizzes);
  const [lessons] = useState<Lesson[]>(mockLessons);
  const [searchTerm, setSearchTerm] = useState('');
  const [lessonFilter, setLessonFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; quiz: Quiz | null }>({
    open: false,
    quiz: null,
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    variant: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', variant: 'success' });

  const itemsPerPage = 10;

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLesson = lessonFilter === 'all' || quiz.lessonId === lessonFilter;
      return matchesSearch && matchesLesson;
    });
  }, [quizzes, searchTerm, lessonFilter]);

  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage) || 1;
  const paginatedQuizzes = filteredQuizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns: DataTableColumn<Quiz>[] = [
    {
      key: 'title',
      header: 'Quiz',
      cell: (quiz) => (
        <div>
          <p className="font-semibold text-gray-900">{quiz.title}</p>
          <p className="text-xs text-gray-500">{quiz.description}</p>
        </div>
      ),
    },
    {
      key: 'lesson',
      header: 'Lesson',
      cell: (quiz) => (
        <span className="text-sm text-gray-600">
          {lessons.find((lesson) => lesson.id === quiz.lessonId)?.title || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'passingScore',
      header: 'Passing Score',
      cell: (quiz) => <span className="text-sm text-gray-600">{quiz.passingScore}%</span>,
    },
    {
      key: 'timeLimit',
      header: 'Time Limit',
      cell: (quiz) => <span className="text-sm text-gray-600">{quiz.timeLimit} min</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (quiz) => (
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${locale}/admin/quizzes/${quiz.id}`}>Edit</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={() => setDeleteModal({ open: true, quiz })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const confirmDelete = () => {
    if (!deleteModal.quiz) return;
    setQuizzes((prev) => prev.filter((quiz) => quiz.id !== deleteModal.quiz?.id));
    setAlert({ show: true, message: 'Quiz deleted successfully', variant: 'success' });
    setDeleteModal({ open: false, quiz: null });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
          <p className="mt-1 text-sm text-gray-600">Manage quizzes and questions for lessons</p>
        </div>
        <Button asChild variant="primary" size="sm">
          <Link href={`/${locale}/admin/quizzes/new`}>Add Quiz</Link>
        </Button>
      </div>

      {alert.show && (
        <div className="mb-4">
          <Alert variant={alert.variant}>{alert.message}</Alert>
        </div>
      )}

      <Card>
        <CardHeader title="Filters" />
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SimpleSelect
              value={lessonFilter}
              onChange={(e) => setLessonFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Lessons' },
                ...lessons.map((lesson) => ({ value: lesson.id, label: lesson.title })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader title={`Quizzes (${filteredQuizzes.length})`} />
        <CardContent>
          <DataTable data={paginatedQuizzes} columns={columns} emptyMessage="No quizzes found" />
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, quiz: null })}
        title="Delete Quiz"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteModal.quiz?.title}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, quiz: null })}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
