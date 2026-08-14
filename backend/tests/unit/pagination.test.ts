import { describe, it, expect } from 'vitest';
import { parsePagination, buildPaginatedResult, getSkip } from '../../src/utils/pagination';

describe('pagination utils', () => {
  it('parsePagination defaults to page 1 and limit 20', () => {
    expect(parsePagination()).toEqual({ page: 1, limit: 20 });
  });

  it('parsePagination caps limit at 100', () => {
    expect(parsePagination('2', '500')).toEqual({ page: 2, limit: 100 });
  });

  it('parsePagination handles invalid values', () => {
    expect(parsePagination('abc', 'xyz')).toEqual({ page: 1, limit: 20 });
  });

  it('getSkip calculates offset', () => {
    expect(getSkip(3, 20)).toBe(40);
  });

  it('buildPaginatedResult computes totalPages', () => {
    const result = buildPaginatedResult([1, 2], 45, { page: 2, limit: 20 });
    expect(result.pagination.totalPages).toBe(3);
    expect(result.items).toHaveLength(2);
  });
});
