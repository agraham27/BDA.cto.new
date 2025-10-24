'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  DataTable,
  FileUpload,
  Input,
  Pagination,
} from '@/components/ui';
import type { DataTableColumn } from '@/components/ui';
import { LessonFile } from '@/types/course';

const mockFiles: LessonFile[] = [
  {
    id: '1',
    name: 'React_Introduction.pdf',
    url: '/files/react_intro.pdf',
    type: 'application/pdf',
    size: 1024 * 512,
    lessonId: '1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '2',
    name: 'State_Management_Examples.zip',
    url: '/files/state_examples.zip',
    type: 'application/zip',
    size: 1024 * 1024 * 2,
    lessonId: '2',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z',
  },
];

export default function FilesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [files, setFiles] = useState<LessonFile[]>(mockFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    variant: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', variant: 'success' });

  const itemsPerPage = 10;

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage) || 1;
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleUpload = async (file: File) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newFile: LessonFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
      lessonId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFiles((prev) => [newFile, ...prev]);
    setAlert({ show: true, message: 'File uploaded successfully', variant: 'success' });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const handleDelete = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
    setAlert({ show: true, message: 'File deleted successfully', variant: 'success' });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const columns: DataTableColumn<LessonFile>[] = [
    {
      key: 'name',
      header: 'File',
      cell: (file) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <span className="text-lg">📄</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{file.type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      cell: (file) => <span className="text-sm text-gray-600">{formatFileSize(file.size)}</span>,
    },
    {
      key: 'createdAt',
      header: 'Uploaded',
      cell: (file) => (
        <span className="text-sm text-gray-600">
          {new Date(file.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (file) => (
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <a href={file.url} download target="_blank" rel="noopener noreferrer">
              Download
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={() => handleDelete(file.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Files</h1>
        <p className="mt-1 text-sm text-gray-600">Upload and manage course files</p>
      </div>

      {alert.show && (
        <div className="mb-4">
          <Alert variant={alert.variant}>{alert.message}</Alert>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader title="Upload File" />
        <CardContent>
          <FileUpload
            onUpload={handleUpload}
            maxSize={50 * 1024 * 1024}
            label="Choose File"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Search" />
        <CardContent>
          <Input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader title={`Files (${filteredFiles.length})`} />
        <CardContent>
          <DataTable data={paginatedFiles} columns={columns} emptyMessage="No files found" />
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
