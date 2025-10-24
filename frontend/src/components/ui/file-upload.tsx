'use client';

import { useRef, useState } from 'react';
import { Button } from './button';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number;
  label?: string;
  disabled?: boolean;
}

export function FileUpload({
  onUpload,
  accept,
  maxSize = 10 * 1024 * 1024,
  label = 'Choose File',
  disabled = false,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    if (maxSize && file.size > maxSize) {
      setError(`File size exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onUpload(selectedFile);

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        setSelectedFile(null);
        setProgress(0);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button
            as="span"
            variant="secondary"
            size="sm"
            disabled={disabled || uploading}
            className="cursor-pointer"
          >
            {label}
          </Button>
        </label>

        {selectedFile && (
          <div className="flex flex-1 items-center gap-3">
            <span className="text-sm text-gray-700">{selectedFile.name}</span>
            <span className="text-xs text-gray-500">
              ({(selectedFile.size / 1024).toFixed(0)} KB)
            </span>
          </div>
        )}
      </div>

      {selectedFile && !uploading && !error && (
        <div className="flex gap-2">
          <Button onClick={handleUpload} variant="primary" size="sm" disabled={uploading}>
            Upload
          </Button>
          <Button onClick={handleCancel} variant="ghost" size="sm" disabled={uploading}>
            Cancel
          </Button>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">Uploading... {progress}%</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {progress === 100 && !error && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          Upload successful!
        </div>
      )}
    </div>
  );
}
