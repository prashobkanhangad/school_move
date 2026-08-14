import { prisma } from '../../infrastructure/database/prisma';
import { IDeviceTokenRepository } from '../../domain/interfaces/device-token.repository';

export class DeviceTokenRepository implements IDeviceTokenRepository {
  async upsert(userId: string, fcmToken: string, platform: string) {
    return prisma.deviceToken.upsert({
      where: { fcmToken },
      create: { userId, fcmToken, platform },
      update: { userId, platform, isActive: true },
    });
  }

  async deactivate(fcmToken: string): Promise<void> {
    await prisma.deviceToken.updateMany({
      where: { fcmToken },
      data: { isActive: false },
    });
  }

  async findActiveByUserIds(userIds: string[]) {
    return prisma.deviceToken.findMany({
      where: { userId: { in: userIds }, isActive: true },
    });
  }
}
