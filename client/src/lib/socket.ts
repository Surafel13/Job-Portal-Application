import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./api";

let socketInstance: Socket | null = null;

function resolveSocketUrl(): string {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL as string;
  }
  if (import.meta.env.VITE_API_URL) {
    try {
      return new URL(import.meta.env.VITE_API_URL, window.location.origin).origin;
    } catch {
      return window.location.origin;
    }
  }
  return window.location.origin;
}

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(resolveSocketUrl(), {
      auth: (cb) => {
        cb({ token: getAccessToken() || "" });
      },
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("Socket connect error:", err.message);
    });
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
}
