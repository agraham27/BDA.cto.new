'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  DataTable,
  Input,
  Modal,
  SimpleSelect,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { Course } from '@/types/course';

interface EnrollmentSummary {
  id: string;
  course: Course;
  progress: number;
  status: 'active' | 'completed' | 'dropped';
  lastAccessed: string;
}

const availableCourses: Course[] = [
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
];

const mockEnrollments: EnrollmentSummary[] = [
  {
    id: 'enroll-1',
    course: availableCourses[0],
    progress: 65,
    status: 'active',
    lastAccessed: '2024-03-15T10:30:00Z',
  },
];

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const userId = params.id as string;

  const [user, setUser] = useState({
    id: userId,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'student' as 'student' | 'instructor' | 'admin',
    avatar: undefined as string | undefined,
  });

  const [enrollments, setEnrollments] = useState<EnrollmentSummary[]>(mockEnrollments);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [progressModal, setProgressModal] = useState<{ open: boolean; enrollment: EnrollmentSummary | null }>(
    {
      open: false,
      enrollment: null,
    }
  );
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [newRole, setNewRole] = useState(user.role);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    variant: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', variant: 'success' });

  const availableCoursesForEnrollment = useMemo(
    () => availableCourses.filter((course) => !enrollments.some((enrollment) => enrollment.course.id === course.id)),
    [enrollments]
  );

  const enrollmentColumns: DataTableColumn<EnrollmentSummary>[] = [
    {
      key: 'course',
      header: 'Course',
      cell: (enrollment) => (
        <div>
          <p className="font-semibold text-gray-900">{enrollment.course.title}</p>
          <p className="text-xs text-gray-500">{enrollment.course.level.toUpperCase()} • {enrollment.course.status}</p>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      cell: (enrollment) => (
        <div className="w-48">
          <div className="h-2 rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-primary-600" style={{ width: `${enrollment.progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-500">{enrollment.progress}% complete</p>
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
      key: 'lastAccessed',
      header: 'Last Accessed',
      cell: (enrollment) => (
        <span className="text-sm text-gray-600">
          {new Date(enrollment.lastAccessed).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (enrollment) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProgressModal({ open: true, enrollment })}
          >
            Update Progress
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={() => handleRemoveEnrollment(enrollment.id)}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  const handleRoleUpdate = async () => {
    setRoleUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    setUser((prev) => ({ ...prev, role: newRole }));
    setAlert({ show: true, message: 'Role updated successfully', variant: 'success' });
    setRoleUpdating(false);

    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const handleEnrollment = () => {
    if (!selectedCourse) return;

    const course = availableCourses.find((c) => c.id === selectedCourse);
    if (!course) return;

    const newEnrollment: EnrollmentSummary = {
      id: `enroll-${Date.now()}`,
      course,
      progress: 0,
      status: 'active',
      lastAccessed: new Date().toISOString(),
    };

    setEnrollments((prev) => [...prev, newEnrollment]);
    setSelectedCourse('');
    setAlert({ show: true, message: 'Enrollment added successfully', variant: 'success' });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const handleRemoveEnrollment = (id: string) => {
    setEnrollments((prev) => prev.filter((enrollment) => enrollment.id !== id));
    setAlert({ show: true, message: 'Enrollment removed successfully', variant: 'success' });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const handleProgressUpdate = (progress: number, status: 'active' | 'completed' | 'dropped') => {
    if (!progressModal.enrollment) return;

    setEnrollments((prev) =>
      prev.map((enrollment) =>
        enrollment.id === progressModal.enrollment?.id
          ? {
              ...enrollment,
              progress,
              status,
              lastAccessed: new Date().toISOString(),
            }
          : enrollment
      )
    );

    setAlert({ show: true, message: 'Progress updated successfully', variant: 'success' });
    setProgressModal({ open: false, enrollment: null });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const handleAvatarUpload = async () => {
    setUploadingAvatar(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setUploadingAvatar(false);
    setAlert({ show: true, message: 'Avatar updated successfully', variant: 'success' });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/admin/users`)}
            className="mb-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Back to users
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
          <p className="mt-1 text-sm text-gray-600">Manage profile, enrollments, and progress</p>
        </div>
        <Button variant="ghost" onClick={handleAvatarUpload} disabled={uploadingAvatar}>
          {uploadingAvatar ? 'Uploading...' : 'Update Avatar'}
        </Button>
      </div>

      {alert.show && (
        <Alert variant={alert.variant}>{alert.message}</Alert>
      )}

      <Card>
        <CardHeader title="Profile Details" />
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
              <Input value={user.name} readOnly />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <Input value={user.email} readOnly />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
              <SimpleSelect
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                options={[
                  { value: 'student', label: 'Student' },
                  { value: 'instructor', label: 'Instructor' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
            </div>
            <Button variant="primary" onClick={handleRoleUpdate} disabled={roleUpdating}>
              {roleUpdating ? 'Saving...' : 'Update Role'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Manual Enrollment" />
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SimpleSelect
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              options={[
                { value: '', label: 'Select course' },
                ...availableCoursesForEnrollment.map((course) => ({
                  value: course.id,
                  label: course.title,
                })),
              ]}
            />
            <Button variant="primary" onClick={handleEnrollment} disabled={!selectedCourse}>
              Enroll User
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Manually enroll the user into additional courses. Enrollment updates occur instantly.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Learning Progress" />
        <CardContent>
          <DataTable data={enrollments} columns={enrollmentColumns} emptyMessage="No enrollments found" />
        </CardContent>
      </Card>

      <Modal
        isOpen={progressModal.open}
        onClose={() => setProgressModal({ open: false, enrollment: null })}
        title="Update Progress"
      >
        <ProgressForm
          enrollment={progressModal.enrollment}
          onSubmit={handleProgressUpdate}
          onCancel={() => setProgressModal({ open: false, enrollment: null })}
        />
      </Modal>
    </div>
  );
}

function ProgressForm({
  enrollment,
  onSubmit,
  onCancel,
}: {
  enrollment: EnrollmentSummary | null;
  onSubmit: (progress: number, status: 'active' | 'completed' | 'dropped') => void;
  onCancel: () => void;
}) {
  const [progress, setProgress] = useState(enrollment?.progress ?? 0);
  const [status, setStatus] = useState<'active' | 'completed' | 'dropped'>(enrollment?.status ?? 'active');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (progress < 0 || progress > 100) {
      setError('Progress must be between 0 and 100');
      return;
    }
    onSubmit(progress, status);
  };

  if (!enrollment) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Progress (%)</label>
        <Input
          type="number"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          min="0"
          max="100"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
        <SimpleSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'dropped', label: 'Dropped' },
          ]}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save
        </Button>
      </div>
    </form>
  );
}
