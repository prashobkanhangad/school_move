import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../../utils/jwt';
import { AppError, ErrorCodes } from '../../utils/errors';
import { AuthenticatedUser } from '../../types';

export interface AuthRequest extends Request {
  user: AuthenticatedUser;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401));
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    (req as AuthRequest).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      schoolId: payload.schoolId,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (!roles.includes(user.role)) {
      next(new AppError(ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403));
      return;
    }
    next();
  };
}

export function validateBody<T>(schema: { parse: (data: unknown) => T }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery<T>(schema: { parse: (data: unknown) => T }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      (req as Request & { validatedQuery: T }).validatedQuery = schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}
