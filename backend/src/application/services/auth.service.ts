import bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { RefreshTokenRepository } from '../../infrastructure/repositories/refresh-token.repository';
import { DeviceTokenRepository } from '../../infrastructure/repositories/device-token.repository';
import { AppError, ErrorCodes } from '../../utils/errors';
import { hashToken } from '../../utils/crypto';
import {
  getAccessTokenExpiresInSeconds,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { prisma } from '../../infrastructure/database/prisma';

export class AuthService {
  constructor(
    private readonly userRepo = new UserRepository(),
    private readonly refreshTokenRepo = new RefreshTokenRepository(),
    private readonly deviceTokenRepo = new DeviceTokenRepository()
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid credentials', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(ErrorCodes.INACTIVE_RESOURCE, 'Account is inactive', 422);
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    const tokens = await this.issueTokens(user.id, user.email, user.role, user.schoolId);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    const stored = await this.refreshTokenRepo.findByHash(tokenHash);

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid refresh token', 401);
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid refresh token', 401);
    }

    await this.refreshTokenRepo.revoke(stored.id);
    return this.issueTokens(user.id, user.email, user.role, user.schoolId);
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.refreshTokenRepo.findByHash(tokenHash);
    if (stored) {
      await this.refreshTokenRepo.revoke(stored.id);
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: { select: { id: true, name: true, code: true } },
        driverProfile: true,
        parentProfile: true,
      },
    });

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async registerDeviceToken(userId: string, fcmToken: string, platform: string) {
    return this.deviceTokenRepo.upsert(userId, fcmToken, platform);
  }

  async removeDeviceToken(fcmToken: string) {
    await this.deviceTokenRepo.deactivate(fcmToken);
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    schoolId: string | null
  ) {
    const accessToken = signAccessToken({
      sub: userId,
      email,
      role: role as 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'DRIVER' | 'PARENT',
      schoolId,
    });

    const refreshToken = signRefreshToken(userId);
    const tokenHash = hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.refreshTokenRepo.create(userId, tokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: getAccessTokenExpiresInSeconds(),
    };
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId: string | null;
    avatarUrl: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      schoolId: user.schoolId,
      avatarUrl: user.avatarUrl,
    };
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
