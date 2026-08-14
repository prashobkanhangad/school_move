import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { JwtPayload } from '../types';
import { AppError, ErrorCodes } from '../utils/errors';

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, jti: crypto.randomUUID() }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(ErrorCodes.TOKEN_EXPIRED, 'Access token expired', 401);
    }
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid access token', 401);
  }
}

export function verifyRefreshToken(token: string): { sub: string } {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as { sub: string };
  } catch {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid refresh token', 401);
  }
}

export function getAccessTokenExpiresInSeconds(): number {
  const expiresIn = config.jwt.accessExpiresIn;
  if (expiresIn.endsWith('m')) return parseInt(expiresIn, 10) * 60;
  if (expiresIn.endsWith('h')) return parseInt(expiresIn, 10) * 3600;
  if (expiresIn.endsWith('d')) return parseInt(expiresIn, 10) * 86400;
  return parseInt(expiresIn, 10);
}
