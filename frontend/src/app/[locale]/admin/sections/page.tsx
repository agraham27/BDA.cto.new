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
import { Course, Section } from '@/types/course';

const mockCourses: Course[] = [
  {
    id: 'c-1',
    title: 'Introduction to React',
    description: 'Learn the basics of React',
    price: 299000,
    level: 'beginner',
    status: 'published',
    instructorId: '1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'c-2',
    title: 'Advanced TypeScript',
    description: 'Master TypeScript patterns',
    price: 499000,
    level: 'advanced',
    status: 'published',
    instructorId: '2',
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
  },
];

const mockSections: Section[] = [
  {
    id: 's-1',
    title: 'Getting Started',
    description: 'Introduction to the course',
    order: 1,
    courseId: 'c-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 's-2',
    title: 'Components Deep Dive',
    description: 'Understanding component composition',
    order: 2,
    courseId: 'c-1',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z',
  },
  {
    id: 's-3',
    title: 'Generics & Utility Types',
    description: 'Going deeper into TypeScript',
    order: 1,
    courseId: 'c-2',
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
  },
];

export default function SectionsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [sections, setSections] = useState<Section[]>(mockSections);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; section: Section | null }>({
    open: false,
    section: null,
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    variant: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', variant: 'success' });

  const itemsPerPage = 10;

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = courseFilter === 'all' || section.courseId === courseFilter;
      return matchesSearch && matchesCourse;
    });
  }, [sections, searchTerm, courseFilter]);

  const totalPages = Math.ceil(filteredSections.length / itemsPerPage) || 1;
  const paginatedSections = filteredSections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns: DataTableColumn<Section>[] = [
    {
      key: 'title',
      header: 'Section',
      cell: (section) => (
        <div>
          <p className="font-semibold text-gray-900">{section.title}</p>
          <p className="text-xs text-gray-500">{section.description}</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Course',
      cell: (section) => (
        <span className="text-sm text-gray-600">
          {mockCourses.find((course) => course.id === section.courseId)?.title || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      cell: (section) => <span className="text-sm text-gray-600">#{section.order}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (section) => (
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${locale}/admin/sections/${section.id}`}>Edit</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={() => setDeleteModal({ open: true, section })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const confirmDelete = () => {
    if (!deleteModal.section) return;
    setSections((prev) => prev.filter((section) => section.id !== deleteModal.section?.id));
    setAlert({ show: true, message: 'Section deleted successfully', variant: 'success' });
    setDeleteModal({ open: false, section: null });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sections</h1>
          <p className="mt-1 text-sm text-gray-600">Organize course content into sections</p>
        </div>
        <Button asChild variant="primary" size="sm">
          <Link href={`/${locale}/admin/sections/new`}>Add Section</Link>
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
              placeholder="Search sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SimpleSelect
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Courses' },
                ...mockCourses.map((course) => ({ value: course.id, label: course.title })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader title={`Sections (${filteredSections.length})`} />
        <CardContent>
          <DataTable data={paginatedSections} columns={columns} emptyMessage="No sections found" />
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, section: null })}
        title="Delete Section"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleteModal.section?.title}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, section: null })}>
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
