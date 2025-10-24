import { getTranslations } from 'next-intl/server';

import { Alert, Button, Card, CardContent, CardHeader, DataTable } from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';

interface UpcomingLesson {
  id: string;
  title: string;
  schedule: string;
  instructor: string;
}

const lessons: UpcomingLesson[] = [
  {
    id: '1',
    title: 'Advanced Orbital Mechanics',
    schedule: 'Thứ 4, 14:00 - 16:00',
    instructor: 'TS. Nguyễn Minh Anh',
  },
  {
    id: '2',
    title: 'Spacecraft Design Workshop',
    schedule: 'Thứ 6, 9:00 - 11:00',
    instructor: 'ThS. Trần Hải Dương',
  },
];

const columns: DataTableColumn<UpcomingLesson>[] = [
  {
    key: 'title',
    header: 'Chủ đề',
    cell: (item) => (
      <div>
        <p className="font-semibold text-gray-900">{item.title}</p>
        <p className="text-xs text-gray-500">{item.instructor}</p>
      </div>
    ),
  },
  {
    key: 'schedule',
    header: 'Thời gian',
    cell: (item) => <span className="text-sm text-gray-600">{item.schedule}</span>,
  },
];

export default async function StudentDashboard() {
  const t = await getTranslations('dashboard');

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('progress')}</h1>
            <p className="page-subtitle">Theo dõi tiến độ học tập và các lớp học sắp tới</p>
          </div>
          <Button variant="primary" size="sm">
            Tải chương trình học
          </Button>
        </div>
      </div>

      <div className="content-grid">
        <div className="span-8 space-y-6">
          <Card>
            <CardHeader title={t('performance_overview')} />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-primary-50 p-4">
                  <p className="text-sm text-primary-600">Tổng số buổi học</p>
                  <p className="mt-2 text-3xl font-semibold text-primary-700">24</p>
                </div>
                <div className="rounded-xl bg-secondary-50 p-4">
                  <p className="text-sm text-secondary-600">Hoàn thành</p>
                  <p className="mt-2 text-3xl font-semibold text-secondary-700">18</p>
                </div>
                <div className="rounded-xl bg-accent-50 p-4">
                  <p className="text-sm text-accent-600">Điểm trung bình</p>
                  <p className="mt-2 text-3xl font-semibold text-accent-700">8.6</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={t('upcoming_lessons')} />
            <CardContent>
              <DataTable data={lessons} columns={columns} emptyMessage="Không có lớp học nào" />
            </CardContent>
          </Card>
        </div>

        <div className="span-4 space-y-6">
          <Alert variant="info" title="Thông báo quan trọng">
            Bài kiểm tra giữa kỳ sẽ diễn ra vào ngày 12/11. Hãy chuẩn bị đầy đủ tài liệu và tham gia đúng giờ.
          </Alert>

          <Card>
            <CardHeader title="Hoạt động gần đây" />
            <CardContent className="space-y-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">Hoàn thành bài tập "Phân tích quỹ đạo"</p>
                <p className="text-xs text-gray-400">2 giờ trước</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Tham gia buổi học "Thiết kế tàu vũ trụ"</p>
                <p className="text-xs text-gray-400">Hôm qua</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
