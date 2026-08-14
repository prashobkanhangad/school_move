import { prisma } from '../../infrastructure/database/prisma';
import {
  CreateSchoolData,
  ISchoolRepository,
} from '../../domain/interfaces/school.repository';
import { School } from '@prisma/client';
import { PaginationParams, PaginatedResult } from '../../types';
import { buildPaginatedResult, getSkip } from '../../utils/pagination';

export class SchoolRepository implements ISchoolRepository {
  async create(data: CreateSchoolData): Promise<School> {
    return prisma.school.create({ data });
  }

  async findById(id: string): Promise<School | null> {
    return prisma.school.findUnique({ where: { id } });
  }

  async findByCode(code: string): Promise<School | null> {
    return prisma.school.findUnique({ where: { code } });
  }

  async update(id: string, data: Partial<School>): Promise<School> {
    return prisma.school.update({ where: { id }, data });
  }

  async findMany(params: PaginationParams): Promise<PaginatedResult<School>> {
    const [items, total] = await Promise.all([
      prisma.school.findMany({
        skip: getSkip(params.page, params.limit),
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.school.count(),
    ]);
    return buildPaginatedResult(items, total, params);
  }
}
