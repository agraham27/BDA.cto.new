import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, DataTable } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';

interface Student {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  enrollmentDate: string;
}

const students: Student[] = [
  {
    id: '1',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@example.com',
    status: 'active',
    enrollmentDate: '15/09/2024',
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    email: 'binh.tran@example.com',
    status: 'active',
    enrollmentDate: '20/09/2024',
  },
  {
    id: '3',
    name: 'Lê Minh Châu',
    email: 'chau.le@example.com',
    status: 'inactive',
    enrollmentDate: '10/09/2024',
  },
];

const columns: DataTableColumn<Student>[] = [
  {
    key: 'name',
    header: 'Họ và tên',
    cell: (item) => (
      <div>
        <p className="font-semibold text-gray-900">{item.name}</p>
        <p className="text-xs text-gray-500">{item.email}</p>
      </div>
    ),
  },
  {
    key: 'enrollmentDate',
    header: 'Ngày ghi danh',
    cell: (item) => <span className="text-sm text-gray-600">{item.enrollmentDate}</span>,
  },
  {
    key: 'status',
    header: 'Trạng thái',
    cell: (item) => (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          item.status === 'active'
            ? 'bg-success-100 text-success-700'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {item.status === 'active' ? 'Đang học' : 'Tạm dừng'}
      </span>
    ),
  },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">Overview of your learning management system</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm">
              Export Report
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href="users/new">Add Student</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">234</p>
              <p className="mt-2 text-xs text-success-600">↑ 12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Active Courses</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">18</p>
              <p className="mt-2 text-xs text-primary-600">3 new this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">87%</p>
              <p className="mt-2 text-xs text-gray-500">System-wide average</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">₫42M</p>
              <p className="mt-2 text-xs text-success-600">↑ 8% from last month</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader title="Recent Students" />
          <CardContent>
            <DataTable data={students} columns={columns} emptyMessage="No students found" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
