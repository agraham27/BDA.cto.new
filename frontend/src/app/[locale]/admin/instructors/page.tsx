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
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { Instructor } from '@/types/course';

const mockInstructors: Instructor[] = [
  {
    id: '1',
    userId: 'user-1',
    bio: 'Senior developer with 10+ years of experience',
    expertise: ['React', 'TypeScript', 'Next.js'],
    user: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '2',
    userId: 'user-2',
    bio: 'Full-stack developer and educator',
    expertise: ['Node.js', 'Python', 'Database Design'],
    user: {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z',
  },
];

export default function InstructorsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [instructors, setInstructors] = useState<Instructor[]>(mockInstructors);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; instructor: Instructor | null }>({
    open: false,
    instructor: null,
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    variant: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', variant: 'success' });

  const itemsPerPage = 10;

  const filteredInstructors = instructors.filter((instructor) =>
    instructor.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInstructors.length / itemsPerPage) || 1;
  const paginatedInstructors = filteredInstructors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const confirmDelete = () => {
    if (!deleteModal.instructor) return;
    setInstructors((prev) => prev.filter((instructor) => instructor.id !== deleteModal.instructor?.id));
    setAlert({ show: true, message: 'Instructor removed successfully', variant: 'success' });
    setDeleteModal({ open: false, instructor: null });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const columns: DataTableColumn<Instructor>[] = [
    {
      key: 'name',
      header: 'Instructor',
      cell: (instructor) => (
        <div>
          <p className="font-semibold text-gray-900">{instructor.user?.name}</p>
          <p className="text-xs text-gray-500">{instructor.user?.email}</p>
        </div>
      ),
    },
    {
      key: 'bio',
      header: 'Bio',
      cell: (instructor) => (
        <p className="max-w-md text-sm text-gray-600">
          {instructor.bio || 'No bio available'}
        </p>
      ),
    },
    {
      key: 'expertise',
      header: 'Expertise',
      cell: (instructor) => (
        <div className="flex flex-wrap gap-1">
          {(instructor.expertise || []).slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="inline-flex rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700"
            >
              {skill}
            </span>
          ))}
          {(instructor.expertise || []).length > 3 && (
            <span className="text-xs text-gray-500">
              +{(instructor.expertise || []).length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (instructor) => (
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${locale}/admin/instructors/${instructor.id}`}>Edit</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={() => setDeleteModal({ open: true, instructor })}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructors</h1>
          <p className="mt-1 text-sm text-gray-600">Manage instructor profiles and courses</p>
        </div>
        <Button asChild variant="primary" size="sm">
          <Link href={`/${locale}/admin/instructors/new`}>Add Instructor</Link>
        </Button>
      </div>

      {alert.show && (
        <div className="mb-4">
          <Alert variant={alert.variant}>{alert.message}</Alert>
        </div>
      )}

      <Card>
        <CardHeader title="Search" />
        <CardContent>
          <Input
            type="text"
            placeholder="Search instructors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader title={`Instructors (${filteredInstructors.length})`} />
        <CardContent>
          <DataTable data={paginatedInstructors} columns={columns} emptyMessage="No instructors found" />
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, instructor: null })}
        title="Remove Instructor"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to remove <strong>{deleteModal.instructor?.user?.name}</strong> from instructors?
            This will not delete their user account.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, instructor: null })}>
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
