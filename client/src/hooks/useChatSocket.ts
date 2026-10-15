import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "../store/authStore";
import { queryKeys } from "../lib/queryKeys";
import type { Message } from "../types/models";
import type { PaginationMeta } from "../types/api";

export function useChatSocket(activeConversationId?: string | null) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // userId -> name / placeholder

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      setIsConnected(true);
      // Fetch online users
      socket.emit("get_online_users", (ids: string[]) => {
        if (Array.isArray(ids)) {
          setOnlineUserIds(new Set(ids));
        }
      });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onOnlineUsers = (ids: string[]) => {
      if (Array.isArray(ids)) {
        setOnlineUserIds(new Set(ids));
      }
    };

    const onUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    };

    const onUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    // Global conversation message update
    const onConversationMessage = ({
      conversationId,
    }: {
      conversationId: string;
      message: Message;
    }) => {
      // Invalidate conversations list & unread count badge
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessagesCount });

      // If active conversation is not this one, also refetch notifications
      if (conversationId !== activeConversationId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("online_users", onOnlineUsers);
    socket.on("user_online", onUserOnline);
    socket.on("user_offline", onUserOffline);
    socket.on("conversation_message", onConversationMessage);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("online_users", onOnlineUsers);
      socket.off("user_online", onUserOnline);
      socket.off("user_offline", onUserOffline);
      socket.off("conversation_message", onConversationMessage);
    };
  }, [user?._id, activeConversationId, queryClient]);

  // Handle active conversation room and events
  useEffect(() => {
    if (!activeConversationId || !user?._id) return;

    const socket = getSocket();

    // Join room
    socket.emit("join_conversation", activeConversationId);

    const onNewMessage = (message: Message) => {
      // Optimistically update or invalidate message history for active conversation
      queryClient.setQueryData(
        queryKeys.conversationMessages(activeConversationId),
        (old: { messages: Message[]; meta?: PaginationMeta } | undefined) => {
          if (!old) return { messages: [message], meta: { page: 1, limit: 30 } };
          const exists = old.messages.some((m) => m._id === message._id);
          if (exists) return old;
          return {
            ...old,
            messages: [...old.messages, message],
          };
        },
      );

      // Invalidate conversations list to show updated lastMessage
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    };

    const onMessagesRead = ({
      conversationId,
      readerId,
    }: {
      conversationId: string;
      readerId: string;
      readAt: string;
    }) => {
      if (conversationId === activeConversationId) {
        queryClient.setQueryData(
          queryKeys.conversationMessages(activeConversationId),
          (old: { messages: Message[]; meta?: PaginationMeta } | undefined) => {
            if (!old) return old;
            return {
              ...old,
              messages: old.messages.map((m) => {
                const recipientIdStr =
                  typeof m.recipientId === "object" ? m.recipientId._id : m.recipientId;
                if (recipientIdStr === readerId) {
                  return { ...m, read: true };
                }
                return m;
              }),
            };
          },
        );
      }
    };

    const onUserTyping = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (conversationId === activeConversationId && userId !== user._id) {
        setTypingUsers((prev) => ({ ...prev, [userId]: "typing" }));
      }
    };

    const onUserStopTyping = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (conversationId === activeConversationId) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    };

    socket.on("new_message", onNewMessage);
    socket.on("messages_read", onMessagesRead);
    socket.on("user_typing", onUserTyping);
    socket.on("user_stop_typing", onUserStopTyping);

    return () => {
      socket.emit("leave_conversation", activeConversationId);
      socket.off("new_message", onNewMessage);
      socket.off("messages_read", onMessagesRead);
      socket.off("user_typing", onUserTyping);
      socket.off("user_stop_typing", onUserStopTyping);
      setTypingUsers({});
    };
  }, [activeConversationId, user?._id, queryClient]);

  const emitTyping = useCallback(
    (conversationId: string) => {
      const socket = getSocket();
      socket.emit("typing_start", conversationId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing_stop", conversationId);
      }, 2500);
    },
    [],
  );

  const emitStopTyping = useCallback((conversationId: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    const socket = getSocket();
    socket.emit("typing_stop", conversationId);
  }, []);

  const sendSocketMessage = useCallback(
    (
      conversationId: string,
      content: string,
    ): Promise<{ success: boolean; data?: Message; message?: string }> => {
      return new Promise((resolve) => {
        const socket = getSocket();
        socket.emit(
          "send_message",
          { conversationId, content },
          (response: { success: boolean; data?: Message; message?: string }) => {
            resolve(response);
          },
        );
      });
    },
    [],
  );

  const markSocketRead = useCallback((conversationId: string) => {
    const socket = getSocket();
    socket.emit("mark_read", conversationId);
  }, []);

  const isUserOnline = useCallback(
    (userId?: string) => {
      if (!userId) return false;
      return onlineUserIds.has(userId);
    },
    [onlineUserIds],
  );

  return {
    isConnected,
    onlineUserIds,
    isUserOnline,
    typingUsers,
    emitTyping,
    emitStopTyping,
    sendSocketMessage,
    markSocketRead,
  };
}
