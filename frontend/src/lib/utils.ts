import clsx, { ClassValue } from 'clsx';

export function cn(...classes: ClassValue[]) {
  return clsx(classes);
}

export async function fetchApi(path: string, options?: RequestInit) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const url = `${apiUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}
