import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { config } from '../../config';
import { verifyAccessToken } from '../../utils/jwt';
import { setSocketServer } from '../../application/services/trip.service';
import { TripService } from '../../application/services/trip.service';
import { AuthenticatedUser } from '../../types';

interface AuthenticatedSocket extends Socket {
  user: AuthenticatedUser;
  activeSchoolId?: string | null;
}

const tripService = new TripService();

export function initializeSocket(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
  });

  setSocketServer(io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string;
      if (!token) {
        next(new Error('Authentication required'));
        return;
      }

      const payload = verifyAccessToken(token);
      const authSocket = socket as AuthenticatedSocket;
      authSocket.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        schoolId: payload.schoolId,
      };

      const handshakeSchoolId = socket.handshake.auth?.schoolId as string | undefined;
      if (payload.role === 'SUPER_ADMIN' && handshakeSchoolId) {
        authSocket.activeSchoolId = handshakeSchoolId;
      } else {
        authSocket.activeSchoolId = payload.schoolId;
      }

      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { user, activeSchoolId } = authSocket;

    if (user.role === 'SCHOOL_ADMIN' && user.schoolId) {
      socket.join(`school:${user.schoolId}`);
    } else if (user.role === 'SUPER_ADMIN' && activeSchoolId) {
      socket.join(`school:${activeSchoolId}`);
    } else if (user.role === 'DRIVER') {
      socket.join(`driver:${user.id}`);
    } else if (user.role === 'PARENT') {
      socket.join(`parent:${user.id}`);
    }

    socket.on('subscribe:trip', async (data: { tripId: string }) => {
      socket.join(`trip:${data.tripId}`);
      socket.emit('subscribed', { room: `trip:${data.tripId}` });
    });

    socket.on('unsubscribe:trip', (data: { tripId: string }) => {
      socket.leave(`trip:${data.tripId}`);
    });

    socket.on('location:update', async (data, callback) => {
      if (user.role !== 'DRIVER' || !user.schoolId) {
        callback?.({ success: false, error: 'Forbidden' });
        return;
      }

      try {
        await tripService.updateLocation(user.schoolId, user.id, data.tripId, {
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading,
          speed: data.speed,
          accuracy: data.accuracy,
          recordedAt: data.recordedAt ? new Date(data.recordedAt) : undefined,
        });
        callback?.({ success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Update failed';
        callback?.({ success: false, error: message });
      }
    });
  });

  return io;
}
