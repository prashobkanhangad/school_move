import { prisma } from '../../infrastructure/database/prisma';
import {
  CreateUserData,
  IUserRepository,
  UserListFilters,
} from '../../domain/interfaces/user.repository';
import { User, UserRole } from '@prisma/client';
import { PaginationParams, PaginatedResult } from '../../types';
import { buildPaginatedResult, getSkip } from '../../utils/pagination';

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByIdAndSchool(id: string, schoolId: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, schoolId } });
  }

  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async findManyBySchool(
    schoolId: string,
    role: UserRole,
    params: PaginationParams,
    filters?: UserListFilters
  ): Promise<PaginatedResult<User>> {
    const where = {
      schoolId,
      role,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' as const } },
          { lastName: { contains: filters.search, mode: 'insensitive' as const } },
          { email: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: getSkip(params.page, params.limit),
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(items, total, params);
  }
}
