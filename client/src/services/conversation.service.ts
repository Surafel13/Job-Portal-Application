import { request } from "../lib/api";
import type { PaginationMeta } from "../types/api";
import type {
  Conversation,
  Message,
  ConversationContact,
} from "../types/models";

export const conversationService = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    request<Conversation[]>("get", "/conversations", { params }).then((res) => ({
      conversations: res.data ?? [],
      meta: (res.meta ?? { page: 1, limit: 20 }) as unknown as PaginationMeta,
    })),

  get: (conversationId: string) =>
    request<Conversation>("get", `/conversations/${conversationId}`),

  create: (payload: {
    recipientId?: string;
    jobId?: string;
    applicationId?: string;
    initialMessage?: string;
  }) => request<Conversation>("post", "/conversations", { data: payload }),

  messages: (
    conversationId: string,
    params?: { page?: number; limit?: number; before?: string },
  ) =>
    request<Message[]>("get", `/conversations/${conversationId}/messages`, {
      params,
    }).then((res) => ({
      messages: res.data ?? [],
      meta: (res.meta ?? { page: 1, limit: 30 }) as unknown as PaginationMeta,
    })),

  sendMessage: (conversationId: string, content: string) =>
    request<Message>("post", `/conversations/${conversationId}/messages`, {
      data: { content },
    }),

  markRead: (conversationId: string) =>
    request<{ modifiedCount: number; readAt: string }>(
      "patch",
      `/conversations/${conversationId}/read`,
    ),

  unreadCount: () =>
    request<{ totalUnread: number }>("get", "/conversations/unread/count"),

  contacts: () =>
    request<ConversationContact[]>("get", "/conversations/contacts"),
};
