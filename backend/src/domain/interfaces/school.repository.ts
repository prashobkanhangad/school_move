import { School } from '@prisma/client';
import { PaginationParams, PaginatedResult } from '../../types';

export interface ISchoolRepository {
  create(data: CreateSchoolData): Promise<School>;
  findById(id: string): Promise<School | null>;
  findByCode(code: string): Promise<School | null>;
  update(id: string, data: Partial<School>): Promise<School>;
  findMany(params: PaginationParams): Promise<PaginatedResult<School>>;
}

export interface CreateSchoolData {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  email?: string;
  timezone: string;
}
