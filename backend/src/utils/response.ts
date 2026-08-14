import { Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, ErrorCodes } from './errors';
import { ApiErrorResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: Array<{ field: string; message: string }>
): void {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message, ...(details && { details }) },
  };
  res.status(statusCode).json(body);
}

export function handleError(error: unknown, res: Response): void {
  if (error instanceof AppError) {
    sendError(res, error.code, error.message, error.statusCode, error.details);
    return;
  }

  if (error instanceof ZodError) {
    const details = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, details);
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      sendError(res, ErrorCodes.DUPLICATE_ENTRY, 'Resource already exists', 409);
      return;
    }
    if (error.code === 'P2025') {
      sendError(res, ErrorCodes.NOT_FOUND, 'Resource not found', 404);
      return;
    }
  }

  console.error('Unhandled error:', error);
  sendError(res, ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500);
}
