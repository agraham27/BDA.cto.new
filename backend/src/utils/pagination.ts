import { PaginationParams } from './validation';

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export function buildPaginationMetadata(
  total: number,
  page: number,
  limit: number
): PaginationMetadata {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function getPaginationSkip(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    data,
    pagination: buildPaginationMetadata(total, params.page, params.limit),
  };
}
