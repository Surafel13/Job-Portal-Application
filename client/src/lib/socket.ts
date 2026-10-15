import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./api";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const token = getAccessToken();

    // Use current origin so Vite proxy forwards /socket.io to backend
    const socketUrl =
      (import.meta.env.VITE_SOCKET_URL as string | undefined) ||
      (import.meta.env.VITE_API_URL
        ? new URL(import.meta.env.VITE_API_URL, window.location.origin).origin
        : window.location.origin);

    socketInstance = io(socketUrl, {
      auth: {
        token: token || "",
      },
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("Socket connect error:", err.message);
      // Update token on retry in case it was refreshed
      const currentToken = getAccessToken();
      if (currentToken && socketInstance) {
        socketInstance.auth = { token: currentToken };
      }
    });
  }

  // Update token before connecting
  const currentToken = getAccessToken();
  if (currentToken && socketInstance) {
    socketInstance.auth = { token: currentToken };
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
