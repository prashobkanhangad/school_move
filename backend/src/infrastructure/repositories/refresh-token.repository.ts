import { prisma } from '../../infrastructure/database/prisma';
import { IRefreshTokenRepository } from '../../domain/interfaces/refresh-token.repository';

export class RefreshTokenRepository implements IRefreshTokenRepository {
  async create(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revoke(id: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { id } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }
}
