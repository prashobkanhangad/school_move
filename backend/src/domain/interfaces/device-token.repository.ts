import { DeviceToken } from '@prisma/client';

export interface IDeviceTokenRepository {
  upsert(userId: string, fcmToken: string, platform: string): Promise<DeviceToken>;
  deactivate(fcmToken: string): Promise<void>;
  findActiveByUserIds(userIds: string[]): Promise<DeviceToken[]>;
}
