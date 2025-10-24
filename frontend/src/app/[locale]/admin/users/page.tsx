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
import { User } from '@/types/auth';

interface UserWithDetails extends User {
  enrollmentsCount: number;
  lastLogin?: string;
  createdAt: string;
}

const mockUsers: UserWithDetails[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'student',
    enrollmentsCount: 3,
    lastLogin: '2024-03-15T10:30:00Z',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'instructor',
    enrollmentsCount: 0,
    lastLogin: '2024-03-14T14:20:00Z',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    enrollmentsCount: 0,
    lastLogin: '2024-03-16T09:00:00Z',
    createdAt: '2024-01-01T10:00:00Z',
  },
];

export default function UsersPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [users, setUsers] = useState<UserWithDetails[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [roleModal, setRoleModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  const [alert, setAlert] = useState<{ show: boolean; message: string; variant: 'success' | 'error' | 'info' | 'warning' }>({
    show: false,
    message: '',
    variant: 'success',
  });

  const itemsPerPage = 10;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleChangeRole = (user: UserWithDetails) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleModal(true);
  };

  const confirmChangeRole = () => {
    if (selectedUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole as any } : u))
      );
      setAlert({ show: true, message: 'User role updated successfully', variant: 'success' });
      setRoleModal(false);
      setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
    }
  };

  const handleDelete = (user: UserWithDetails) => {
    setSelectedUser(user);
    setDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setAlert({ show: true, message: 'User deleted successfully', variant: 'success' });
      setDeleteModal(false);
      setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
    }
  };

  const columns: DataTableColumn<UserWithDetails>[] = [
    {
      key: 'name',
      header: 'User',
      cell: (user) => (
        <div>
          <p className="font-semibold text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${
            user.role === 'admin'
              ? 'bg-purple-100 text-purple-700'
              : user.role === 'instructor'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
          }`}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: 'enrollmentsCount',
      header: 'Enrollments',
      cell: (user) => <span className="text-sm text-gray-600">{user.enrollmentsCount}</span>,
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      cell: (user) => (
        <span className="text-sm text-gray-600">
          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (user) => (
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${locale}/admin/users/${user.id}`}>View</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleChangeRole(user)}>
            Role
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(user)} className="text-red-600">
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
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">Manage users and their roles</p>
        </div>
        <Button asChild variant="primary" size="sm">
          <Link href={`/${locale}/admin/users/new`}>Add User</Link>
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SimpleSelect
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'student', label: 'Students' },
                { value: 'instructor', label: 'Instructors' },
                { value: 'admin', label: 'Admins' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader title={`Users (${filteredUsers.length})`} />
        <CardContent>
          <DataTable data={paginatedUsers} columns={columns} emptyMessage="No users found" />
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={roleModal} onClose={() => setRoleModal(false)} title="Change User Role">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Change role for <strong>{selectedUser?.name}</strong>
          </p>
          <SimpleSelect
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={[
              { value: 'student', label: 'Student' },
              { value: 'instructor', label: 'Instructor' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRoleModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmChangeRole}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete User">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModal(false)}>
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
