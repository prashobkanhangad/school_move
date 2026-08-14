import { User, UserRole, UserStatus } from '@prisma/client';
import { PaginationParams, PaginatedResult } from '../../types';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIdAndSchool(id: string, schoolId: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  findManyBySchool(
    schoolId: string,
    role: UserRole,
    params: PaginationParams,
    filters?: UserListFilters
  ): Promise<PaginatedResult<User>>;
}

export interface CreateUserData {
  schoolId?: string | null;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
}

export interface UserListFilters {
  status?: UserStatus;
  search?: string;
}
