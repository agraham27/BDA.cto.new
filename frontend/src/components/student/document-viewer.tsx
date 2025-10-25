'use client';

interface DocumentViewerProps {
  url: string;
  filename: string;
}

export function DocumentViewer({ url, filename }: DocumentViewerProps) {
  const isPdf = url.endsWith('.pdf') || filename.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return (
      <iframe
        src={`${url}#toolbar=0`}
        className="h-[600px] w-full rounded-lg border border-gray-200"
        title={filename}
      />
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
      <p className="text-sm text-gray-600">Preview not available. Download the file to view.</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600"
      >
        Download {filename}
      </a>
    </div>
  );
}
