import { PaginationParams, PaginatedResult } from '../types';

export function parsePagination(
  page?: string,
  limit?: string
): PaginationParams {
  const parsedPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
  return { page: parsedPage, limit: parsedLimit };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  { page, limit }: PaginationParams
): PaginatedResult<T> {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
