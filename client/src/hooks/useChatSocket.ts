import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "../store/authStore";
import { queryKeys } from "../lib/queryKeys";
import type { Conversation, Message, User } from "../types/models";
import type { PaginationMeta } from "../types/api";

function entityId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as { _id?: unknown })._id;
    return id == null ? undefined : String(id);
  }
  return String(value);
}

function appendMessage(
  old: { messages: Message[]; meta?: PaginationMeta } | undefined,
  message: Message,
) {
  if (!old) return { messages: [message], meta: { page: 1, limit: 30 } };
  const exists = old.messages.some((m) => m._id === message._id);
  if (exists) return old;
  return {
    ...old,
    messages: [...old.messages, message],
  };
}

export function useInboxSocket() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const invalidateInbox = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversationsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessagesCount });
    };

    socket.on("conversation_message", invalidateInbox);
    socket.on("conversation_updated", invalidateInbox);

    return () => {
      socket.off("conversation_message", invalidateInbox);
      socket.off("conversation_updated", invalidateInbox);
    };
  }, [user?._id, queryClient]);
}

export function useChatSocket(activeConversationId?: string | null) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConversationIdRef = useRef(activeConversationId);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!user?._id) return;

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      setIsConnected(true);
      socket.emit("get_online_users", (ids: string[]) => {
        if (Array.isArray(ids)) {
          setOnlineUserIds(new Set(ids));
        }
      });
      if (activeConversationIdRef.current) {
        socket.emit("join_conversation", activeConversationIdRef.current);
      }
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

    const onConversationMessage = ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: Message;
    }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversationsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessagesCount });

      if (conversationId === activeConversationIdRef.current && message) {
        queryClient.setQueryData(
          queryKeys.conversationMessages(conversationId),
          (old: { messages: Message[]; meta?: PaginationMeta } | undefined) =>
            appendMessage(old, message),
        );
      }
    };

    const onConversationUpdated = (conversation: Conversation) => {
      if (!conversation?._id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversationsAll });
        return;
      }
      queryClient.setQueryData(queryKeys.conversation(conversation._id), conversation);
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversationsAll });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("online_users", onOnlineUsers);
    socket.on("user_online", onUserOnline);
    socket.on("user_offline", onUserOffline);
    socket.on("conversation_message", onConversationMessage);
    socket.on("conversation_updated", onConversationUpdated);

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
      socket.off("conversation_updated", onConversationUpdated);
    };
  }, [user?._id, queryClient]);

  useEffect(() => {
    if (!activeConversationId || !user?._id) return;

    const socket = getSocket();
    socket.emit("join_conversation", activeConversationId);

    const onNewMessage = (message: Message) => {
      queryClient.setQueryData(
        queryKeys.conversationMessages(activeConversationId),
        (old: { messages: Message[]; meta?: PaginationMeta } | undefined) =>
          appendMessage(old, message),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversationsAll });
    };

    const onMessagesRead = ({
      conversationId,
      readerId,
      readAt,
    }: {
      conversationId: string;
      readerId: string;
      readAt: string;
    }) => {
      if (conversationId !== activeConversationId) return;
      queryClient.setQueryData(
        queryKeys.conversationMessages(activeConversationId),
        (old: { messages: Message[]; meta?: PaginationMeta } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m) => {
              const recipientIdStr = entityId(m.recipientId);
              if (recipientIdStr === readerId) {
                return { ...m, read: true, readAt };
              }
              return m;
            }),
          };
        },
      );
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

  const emitTyping = useCallback((conversationId: string) => {
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit("typing_start", conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", conversationId);
    }, 2500);
  }, []);

  const emitStopTyping = useCallback((conversationId: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit("typing_stop", conversationId);
  }, []);

  const sendSocketMessage = useCallback(
    (
      conversationId: string,
      content: string,
    ): Promise<{ success: boolean; data?: Message; message?: string }> => {
      return new Promise((resolve) => {
        const socket = getSocket();
        if (!socket.connected) {
          resolve({ success: false, message: "Socket disconnected" });
          return;
        }

        let settled = false;
        const timer = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          resolve({ success: false, message: "Socket timeout" });
        }, 8000);

        socket.emit(
          "send_message",
          { conversationId, content },
          (response: { success: boolean; data?: Message; message?: string }) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            resolve(response ?? { success: false, message: "Empty socket response" });
          },
        );
      });
    },
    [],
  );

  const markSocketRead = useCallback((conversationId: string) => {
    const socket = getSocket();
    if (!socket.connected) return;
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

export function otherParticipantOf(
  conversation: Conversation | undefined,
  currentUserId?: string,
): User | undefined {
  if (!conversation) return undefined;
  if (conversation.otherParticipant) return conversation.otherParticipant;
  return conversation.participants?.find((p) => entityId(p) !== currentUserId);
}

export { entityId };
