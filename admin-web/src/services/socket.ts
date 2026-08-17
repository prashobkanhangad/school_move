import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket: Socket | null = null;

function authPayload() {
  const { accessToken, activeSchoolId } = useAuthStore.getState();
  return {
    token: accessToken,
    ...(activeSchoolId ? { schoolId: activeSchoolId } : {}),
  };
}

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const url = import.meta.env.VITE_SOCKET_URL || 'https://schoolmovebackend.techweo.com';

  if (socket) {
    socket.auth = authPayload();
    socket.connect();
    return socket;
  }

  socket = io(url, {
    auth: authPayload(),
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function reconnectSocket() {
  if (!socket) {
    connectSocket();
    return;
  }
  socket.auth = authPayload();
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
