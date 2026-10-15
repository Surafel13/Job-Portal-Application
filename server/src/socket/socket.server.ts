import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { Types } from "mongoose";
import env from "../config/env.js";
import logger from "../utils/logger.js";
import { verifyAccessToken, type TokenPayload } from "../utils/token.js";
import ConversationModel from "../modules/conversation/conversation.model.js";

interface AuthenticatedSocket extends Socket {
    data: {
        user: TokenPayload;
    };
}

let ioInstance: Server | null = null;
const userSocketsMap = new Map<string, Set<string>>();

export const initSocketServer = (httpServer: HttpServer): Server => {
    const io = new Server(httpServer, {
        cors: {
            origin: [
                env.CLIENT_URL,
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
            ],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Authentication middleware
    io.use((socket, next) => {
        try {
            const rawToken =
                (socket.handshake.auth?.token as string | undefined) ||
                (socket.handshake.headers?.authorization as string | undefined);

            if (!rawToken) {
                return next(new Error("Authentication required: token missing."));
            }

            const token = rawToken.startsWith("Bearer ")
                ? rawToken.slice(7).trim()
                : rawToken.trim();

            if (!token) {
                return next(new Error("Authentication required: token empty."));
            }

            const payload = verifyAccessToken(token);
            socket.data.user = payload;
            next();
        } catch (err) {
            logger.warn("Socket connection rejected: Invalid or expired token");
            next(new Error("Authentication failed: invalid or expired token."));
        }
    });

    io.on("connection", (socketRaw) => {
        const socket = socketRaw as AuthenticatedSocket;
        const userId = socket.data.user.userId;

        logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

        // Track user socket ID
        let userSockets = userSocketsMap.get(userId);
        if (!userSockets) {
            userSockets = new Set();
            userSocketsMap.set(userId, userSockets);
        }
        const wasOffline = userSockets.size === 0;
        userSockets.add(socket.id);

        // Join personal user room
        socket.join(`user:${userId}`);

        // Broadcast online status to all if first socket for user
        if (wasOffline) {
            io.emit("user_online", { userId });
        }

        // Send current list of online users to the newly connected socket
        socket.on("get_online_users", (callback) => {
            const onlineUserIds = Array.from(userSocketsMap.keys()).filter(
                (id) => (userSocketsMap.get(id)?.size ?? 0) > 0
            );
            if (typeof callback === "function") {
                callback(onlineUserIds);
            } else {
                socket.emit("online_users", onlineUserIds);
            }
        });

        // Join conversation room with participant authorization
        socket.on("join_conversation", async (conversationId: string, callback) => {
            try {
                if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
                    callback?.({ success: false, message: "Invalid conversation ID" });
                    return;
                }

                const conversation = await ConversationModel.findById(conversationId)
                    .select("participants")
                    .lean();

                if (!conversation) {
                    callback?.({ success: false, message: "Conversation not found" });
                    return;
                }

                const isParticipant = conversation.participants.some(
                    (p) => p.toString() === userId
                );

                if (!isParticipant) {
                    callback?.({
                        success: false,
                        message: "Unauthorized: You are not a participant in this conversation",
                    });
                    return;
                }

                socket.join(`conversation:${conversationId}`);
                callback?.({ success: true });
            } catch (error: any) {
                callback?.({
                    success: false,
                    message: error.message || "Failed to join conversation room",
                });
            }
        });

        // Leave conversation room
        socket.on("leave_conversation", (conversationId: string) => {
            if (conversationId && Types.ObjectId.isValid(conversationId)) {
                socket.leave(`conversation:${conversationId}`);
            }
        });

        // Typing indicators
        socket.on("typing_start", (conversationId: string) => {
            if (conversationId) {
                socket.to(`conversation:${conversationId}`).emit("user_typing", {
                    conversationId,
                    userId,
                });
            }
        });

        socket.on("typing_stop", (conversationId: string) => {
            if (conversationId) {
                socket.to(`conversation:${conversationId}`).emit("user_stop_typing", {
                    conversationId,
                    userId,
                });
            }
        });

        // Send message via socket
        socket.on(
            "send_message",
            async (
                payload: { conversationId: string; content: string },
                callback?: (res: { success: boolean; data?: any; message?: string }) => void
            ) => {
                try {
                    const { conversationId, content } = payload;
                    const { conversationService } = await import(
                        "../modules/conversation/conversation.service.js"
                    );

                    const message = await conversationService.sendMessage(
                        userId,
                        conversationId,
                        content
                    );

                    callback?.({ success: true, data: message });
                } catch (error: any) {
                    callback?.({
                        success: false,
                        message: error.message || "Failed to send message",
                    });
                }
            }
        );

        // Mark read via socket
        socket.on(
            "mark_read",
            async (
                conversationId: string,
                callback?: (res: { success: boolean; data?: any; message?: string }) => void
            ) => {
                try {
                    const { conversationService } = await import(
                        "../modules/conversation/conversation.service.js"
                    );

                    const result = await conversationService.markConversationAsRead(
                        userId,
                        conversationId
                    );

                    callback?.({ success: true, data: result });
                } catch (error: any) {
                    callback?.({
                        success: false,
                        message: error.message || "Failed to mark conversation as read",
                    });
                }
            }
        );

        // Disconnect
        socket.on("disconnect", () => {
            logger.info(`Socket disconnected: ${socket.id} (user: ${userId})`);
            const set = userSocketsMap.get(userId);
            if (set) {
                set.delete(socket.id);
                if (set.size === 0) {
                    userSocketsMap.delete(userId);
                    io.emit("user_offline", {
                        userId,
                        lastSeen: new Date().toISOString(),
                    });
                }
            }
        });
    });

    ioInstance = io;
    return io;
};

export const getIO = (): Server | null => {
    return ioInstance;
};

export const getOnlineUserIds = (): string[] => {
    return Array.from(userSocketsMap.keys()).filter(
        (id) => (userSocketsMap.get(id)?.size ?? 0) > 0
    );
};

export const isUserOnline = (userId: string): boolean => {
    return (userSocketsMap.get(userId)?.size ?? 0) > 0;
};

export const emitNewMessage = (
    conversationId: string,
    message: any,
    recipientId: string
): void => {
    if (!ioInstance) return;

    // Emit to conversation room (so anyone currently viewing it receives it)
    ioInstance.to(`conversation:${conversationId}`).emit("new_message", message);

    // Also emit to recipient's personal room for conversation list & notification badge update
    ioInstance.to(`user:${recipientId}`).emit("conversation_message", {
        conversationId,
        message,
    });
};

export const emitMessagesRead = (
    conversationId: string,
    readerId: string,
    readAt: Date
): void => {
    if (!ioInstance) return;

    ioInstance.to(`conversation:${conversationId}`).emit("messages_read", {
        conversationId,
        readerId,
        readAt,
    });
};

export const emitConversationUpdated = (
    userId: string,
    conversation: any
): void => {
    if (!ioInstance) return;

    ioInstance.to(`user:${userId}`).emit("conversation_updated", conversation);
};
