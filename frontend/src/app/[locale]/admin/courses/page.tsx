'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  DataTable,
  Input,
  SimpleSelect,
  Pagination,
  Modal,
  Alert,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { Course } from '@/types/course';

const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to React',
    description: 'Learn the basics of React',
    price: 299000,
    level: 'beginner',
    status: 'published',
    instructorId: '1',
    enrollmentCount: 45,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'Advanced TypeScript',
    description: 'Master TypeScript patterns',
    price: 499000,
    level: 'advanced',
    status: 'published',
    instructorId: '2',
    enrollmentCount: 23,
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
  },
  {
    id: '3',
    title: 'Node.js Fundamentals',
    description: 'Build backend with Node.js',
    price: 399000,
    level: 'intermediate',
    status: 'draft',
    instructorId: '1',
    enrollmentCount: 0,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-05T10:00:00Z',
  },
];

export default function CoursesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; course: Course | null }>({
    open: false,
    course: null,
  });
  const [alert, setAlert] = useState<{ show: boolean; message: string; variant: 'success' | 'error' | 'info' | 'warning' }>({
    show: false,
    message: '',
    variant: 'success',
  });

  const itemsPerPage = 10;

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (course: Course) => {
    setDeleteModal({ open: true, course });
  };

  const confirmDelete = () => {
    if (deleteModal.course) {
      setCourses((prev) => prev.filter((c) => c.id !== deleteModal.course!.id));
      setAlert({ show: true, message: 'Course deleted successfully', variant: 'success' });
      setDeleteModal({ open: false, course: null });

      setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
    }
  };

  const columns: DataTableColumn<Course>[] = [
    {
      key: 'title',
      header: 'Course',
      cell: (course) => (
        <div>
          <p className="font-semibold text-gray-900">{course.title}</p>
          <p className="text-xs text-gray-500">{course.description}</p>
        </div>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      cell: (course) => (
        <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize bg-blue-100 text-blue-700">
          {course.level}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (course) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${
            course.status === 'published'
              ? 'bg-success-100 text-success-700'
              : course.status === 'draft'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-red-100 text-red-600'
          }`}
        >
          {course.status}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      cell: (course) => <span className="text-sm font-medium text-gray-900">₫{course.price.toLocaleString()}</span>,
    },
    {
      key: 'enrollmentCount',
      header: 'Enrollments',
      cell: (course) => <span className="text-sm text-gray-600">{course.enrollmentCount}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (course) => (
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${locale}/admin/courses/${course.id}`}>Edit</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(course)} className="text-red-600">
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="mt-1 text-sm text-gray-600">Manage all courses in the system</p>
        </div>
        <Button asChild variant="primary" size="sm">
          <Link href={`/${locale}/admin/courses/new`}>Add Course</Link>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SimpleSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <SimpleSelect
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Levels' },
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader title={`Courses (${filteredCourses.length})`} />
        <CardContent>
          <DataTable data={paginatedCourses} columns={columns} emptyMessage="No courses found" />
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, course: null })}
        title="Delete Course"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteModal.course?.title}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, course: null })}>
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
