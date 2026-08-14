export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  ACTIVE_TRIP_EXISTS: 'ACTIVE_TRIP_EXISTS',
  NO_ACTIVE_TRIP: 'NO_ACTIVE_TRIP',
  BUS_NOT_ASSIGNED: 'BUS_NOT_ASSIGNED',
  ROUTE_MISMATCH: 'ROUTE_MISMATCH',
  INACTIVE_RESOURCE: 'INACTIVE_RESOURCE',
  POOR_GPS_ACCURACY: 'POOR_GPS_ACCURACY',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
