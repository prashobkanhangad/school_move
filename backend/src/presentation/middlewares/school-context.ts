import { Request } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError, ErrorCodes } from '../../utils/errors';
import { prisma } from '../../infrastructure/database/prisma';

/**
 * Resolve the active school for school-scoped APIs.
 * SCHOOL_ADMIN → JWT schoolId
 * SUPER_ADMIN → X-School-Id header (validated)
 */
export async function resolveSchoolId(req: Request): Promise<string> {
  const user = (req as AuthRequest).user;

  if (user.role === 'SUPER_ADMIN') {
    const raw = req.headers['x-school-id'];
    const schoolId = Array.isArray(raw) ? raw[0] : raw;
    if (!schoolId) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'X-School-Id header is required for platform admins',
        400
      );
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });
    if (!school) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'School not found', 404);
    }
    return school.id;
  }

  if (!user.schoolId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'No school associated with this account', 403);
  }

  return user.schoolId;
}

export function assertCanAccessSchool(req: Request, schoolId: string): void {
  const user = (req as AuthRequest).user;
  if (user.role === 'SUPER_ADMIN') return;
  if (user.schoolId !== schoolId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Access denied to this school', 403);
  }
}
