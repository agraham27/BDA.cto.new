'use client';

import { useState } from 'react';
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
import { Enrollment } from '@/types/course';

const mockEnrollments: Enrollment[] = [
  {
    id: '1',
    userId: 'user-1',
    courseId: 'course-1',
    status: 'active',
    progress: 45,
    enrolledAt: '2024-01-15T10:00:00Z',
    user: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    course: {
      id: 'course-1',
      title: 'Introduction to React',
      description: 'Learn the basics',
      price: 299000,
      level: 'beginner',
      status: 'published',
      instructorId: '1',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
    },
  },
  {
    id: '2',
    userId: 'user-2',
    courseId: 'course-2',
    status: 'completed',
    progress: 100,
    enrolledAt: '2024-01-10T10:00:00Z',
    completedAt: '2024-03-01T10:00:00Z',
    user: {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    course: {
      id: 'course-2',
      title: 'Advanced TypeScript',
      description: 'Master TypeScript patterns',
      price: 499000,
      level: 'advanced',
      status: 'published',
      instructorId: '2',
      createdAt: '2024-01-05T10:00:00Z',
      updatedAt: '2024-01-05T10:00:00Z',
    },
  },
];

export default function EnrollmentsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [enrollments, setEnrollments] = useState<Enrollment[]>(mockEnrollments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; enrollment: Enrollment | null }>({
    open: false,
    enrollment: null,
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    variant: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', variant: 'success' });

  const itemsPerPage = 10;

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch =
      enrollment.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage) || 1;
  const paginatedEnrollments = filteredEnrollments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const confirmDelete = () => {
    if (!deleteModal.enrollment) return;
    setEnrollments((prev) => prev.filter((enrollment) => enrollment.id !== deleteModal.enrollment?.id));
    setAlert({ show: true, message: 'Enrollment removed successfully', variant: 'success' });
    setDeleteModal({ open: false, enrollment: null });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const columns: DataTableColumn<Enrollment>[] = [
    {
      key: 'user',
      header: 'Student',
      cell: (enrollment) => (
        <div>
          <p className="font-semibold text-gray-900">{enrollment.user?.name}</p>
          <p className="text-xs text-gray-500">{enrollment.user?.email}</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course',
      cell: (enrollment) => (
        <p className="text-sm font-medium text-gray-900">{enrollment.course?.title}</p>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      cell: (enrollment) => (
        <div className="w-32">
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-primary-600"
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">{enrollment.progress}%</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (enrollment) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${
            enrollment.status === 'completed'
              ? 'bg-success-100 text-success-700'
              : enrollment.status === 'active'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-warning-100 text-warning-700'
          }`}
        >
          {enrollment.status}
        </span>
      ),
    },
    {
      key: 'enrolledAt',
      header: 'Enrolled',
      cell: (enrollment) => (
        <span className="text-sm text-gray-600">
          {new Date(enrollment.enrolledAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (enrollment) => (
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${locale}/admin/users/${enrollment.userId}`}>View</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={() => setDeleteModal({ open: true, enrollment })}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enrollments</h1>
        <p className="mt-1 text-sm text-gray-600">Manage student enrollments and progress</p>
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
              placeholder="Search by student or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SimpleSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'dropped', label: 'Dropped' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader title={`Enrollments (${filteredEnrollments.length})`} />
        <CardContent>
          <DataTable data={paginatedEnrollments} columns={columns} emptyMessage="No enrollments found" />
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, enrollment: null })}
        title="Remove Enrollment"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to remove <strong>{deleteModal.enrollment?.user?.name}</strong> from{' '}
            <strong>{deleteModal.enrollment?.course?.title}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, enrollment: null })}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
