import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  Check,
  CheckCheck,
  MessageSquare,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/States";
import { entityId, useChatSocket } from "../hooks/useChatSocket";
import { cn } from "../lib/cn";
import { formatDate, formatTime, isSameDay, timeAgo, titleCase } from "../lib/format";
import { queryKeys } from "../lib/queryKeys";
import { conversationService } from "../services/conversation.service";
import { useAuthStore } from "../store/authStore";
import type { Conversation, Message, User } from "../types/models";
import type { PaginationMeta } from "../types/api";

export function MessagesPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get("conversationId"),
  );
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(Boolean(searchParams.get("conversationId")));

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Socket connection hook
  const {
    isUserOnline,
    typingUsers,
    emitTyping,
    emitStopTyping,
    sendSocketMessage,
    markSocketRead,
  } = useChatSocket(selectedConversationId);

  // Fetch conversations
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchFilter(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const conversationsQuery = useQuery({
    queryKey: queryKeys.conversations(searchFilter ? { search: searchFilter } : {}),
    queryFn: () =>
      conversationService.list(searchFilter ? { search: searchFilter } : undefined),
    refetchInterval: 30000,
  });

  const conversationList = conversationsQuery.data?.conversations ?? [];

  // If search params have recipientId or jobId and no conversation selected, auto-create/select
  const recipientParam = searchParams.get("recipientId");
  const jobParam = searchParams.get("jobId");
  const appParam = searchParams.get("applicationId");

  const startConversationMutation = useMutation({
    mutationFn: (payload: {
      recipientId?: string;
      jobId?: string;
      applicationId?: string;
      initialMessage?: string;
    }) => conversationService.create(payload),
    onSuccess: (res) => {
      if (res.data?._id) {
        setSelectedConversationId(res.data._id);
        setShowMobileChat(true);
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversationsAll });
        setIsNewChatModalOpen(false);
        // Clear query params to prevent re-triggering
        setSearchParams({ conversationId: res.data._id }, { replace: true });
      }
    },
  });

  const startConversation = startConversationMutation.mutate;
  const startedFromParamsKey = useRef<string | null>(null);

  useEffect(() => {
    if (!recipientParam && !jobParam && !appParam) {
      startedFromParamsKey.current = null;
      return;
    }
    const key = `${recipientParam ?? ""}:${jobParam ?? ""}:${appParam ?? ""}`;
    if (startedFromParamsKey.current === key) return;
    startedFromParamsKey.current = key;
    startConversation({
      recipientId: recipientParam || undefined,
      jobId: jobParam || undefined,
      applicationId: appParam || undefined,
    });
  }, [recipientParam, jobParam, appParam, startConversation]);

  // Determine active conversation
  const activeConversation: Conversation | undefined =
    conversationList.find((c) => c._id === selectedConversationId) ??
    (selectedConversationId ? undefined : conversationList[0]);

  const activeId = activeConversation?._id ?? selectedConversationId ?? null;

  // Active conversation details query (in case active is not in recent list)
  const conversationDetailQuery = useQuery({
    queryKey: queryKeys.conversation(activeId || ""),
    queryFn: () => conversationService.get(activeId!).then((r) => r.data),
    enabled: Boolean(activeId),
  });

  const currentConversation = activeConversation || conversationDetailQuery.data;

  // Messages query for active conversation
  const messagesQuery = useQuery({
    queryKey: queryKeys.conversationMessages(activeId || ""),
    queryFn: () => conversationService.messages(activeId!),
    enabled: Boolean(activeId),
  });

  const messages: Message[] = messagesQuery.data?.messages ?? [];

  // Available contacts for starting a conversation
  const contactsQuery = useQuery({
    queryKey: queryKeys.conversationContacts,
    queryFn: () => conversationService.contacts().then((r) => r.data ?? []),
    enabled: isNewChatModalOpen,
  });

  // Mark messages as read when opening conversation
  const markReadMutation = useMutation({
    mutationFn: (convId: string) => conversationService.markRead(convId),
    onMutate: (convId) => {
      queryClient.setQueryData(queryKeys.conversation(convId), (old: Conversation | undefined) =>
        old ? { ...old, unreadCount: 0 } : old,
      );
      queryClient.setQueriesData(
        { queryKey: queryKeys.conversationsAll },
        (old: { conversations: Conversation[]; meta?: PaginationMeta } | undefined) => {
          if (!old?.conversations) return old;
          return {
            ...old,
            conversations: old.conversations.map((conv) =>
              conv._id === convId ? { ...conv, unreadCount: 0 } : conv,
            ),
          };
        },
      );
    },
    onSuccess: (_data, convId) => {
      markSocketRead(convId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversationsAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessagesCount });
    },
  });

  const markRead = markReadMutation.mutate;
  const markingReadIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeId) {
      markingReadIdRef.current = null;
      return;
    }
    if ((currentConversation?.unreadCount ?? 0) <= 0) return;
    if (markingReadIdRef.current === activeId) return;
    markingReadIdRef.current = activeId;
    markRead(activeId, {
      onSettled: () => {
        if (markingReadIdRef.current === activeId) {
          markingReadIdRef.current = null;
        }
      },
    });
  }, [activeId, currentConversation?.unreadCount, markRead]);

  // Auto-scroll messages to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [selectedConversationId]);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length]);

  // Send message handler
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      emitStopTyping(conversationId);
      // Try socket first, fallback to REST
      const socketRes = await sendSocketMessage(conversationId, content);
      if (socketRes.success && socketRes.data) {
        return socketRes.data;
      }
      const restRes = await conversationService.sendMessage(conversationId, content);
      return restRes.data;
    },
    onSuccess: (newMessage) => {
      if (activeId && newMessage) {
        queryClient.setQueryData(
          queryKeys.conversationMessages(activeId),
          (old: { messages: Message[]; meta?: PaginationMeta } | undefined) => {
            if (!old) return { messages: [newMessage], meta: { page: 1, limit: 30 } };
            const exists = old.messages.some((m) => m._id === newMessage._id);
            if (exists) return old;
            return {
              ...old,
              messages: [...old.messages, newMessage],
            };
          },
        );
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversationsAll });
      setMessageText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
  });

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !activeId || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ conversationId: activeId, content: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    if (activeId) {
      emitTyping(activeId);
    }
    // Auto resize textarea
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  // Resolve other participant
  const loadOlderMessages = async () => {
    if (!activeId || !messagesQuery.data?.meta?.hasNextPage) return;
    const nextPage = (messagesQuery.data.meta.page ?? 1) + 1;
    const older = await conversationService.messages(activeId, {
      page: nextPage,
      limit: messagesQuery.data.meta.limit ?? 30,
    });
    queryClient.setQueryData(
      queryKeys.conversationMessages(activeId),
      (old: { messages: Message[]; meta?: PaginationMeta } | undefined) => {
        const existing = old?.messages ?? [];
        const incoming = older.messages.filter(
          (msg) => !existing.some((current) => current._id === msg._id),
        );
        return {
          messages: [...incoming, ...existing],
          meta: older.meta,
        };
      },
    );
  };

  const otherParticipant: User | undefined =
    currentConversation?.otherParticipant ||
    currentConversation?.participants?.find((p) => entityId(p) !== currentUser?._id);

  const otherUserId = otherParticipant?._id;
  const isOtherOnline = otherUserId ? isUserOnline(otherUserId) : false;
  const isOtherTyping = otherUserId ? Boolean(typingUsers[otherUserId]) : false;

  // Filter contacts in modal
  const filteredContacts = (contactsQuery.data ?? []).filter((c) => {
    const q = contactSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.context && c.context.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative flex h-[calc(100vh-8.5rem)] min-h-[550px] overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-line">
      {/* SIDEBAR: CONVERSATIONS LIST */}
      <aside
        className={cn(
          "flex w-full flex-col border-r border-line bg-surface/30 md:w-80 lg:w-96",
          showMobileChat ? "hidden md:flex" : "flex",
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-line p-5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-ink">Messages</h1>
            {conversationsQuery.data?.meta?.totalItems ? (
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                {conversationsQuery.data.meta.totalItems}
              </span>
            ) : null}
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsNewChatModalOpen(true)}
            className="h-9 gap-1.5 px-3.5 text-xs shadow-sm"
          >
            <Plus className="h-4 w-4" /> New Chat
          </Button>
        </div>

        {/* Search Input */}
        <div className="border-b border-line p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-2xl bg-white py-2 pl-10 pr-4 text-sm ring-1 ring-line shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {searchInput ? (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearchFilter("");
                }}
                className="absolute right-3.5 top-3 text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {conversationsQuery.isLoading ? (
            <div className="py-12">
              <Spinner label="Loading messages..." />
            </div>
          ) : conversationList.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 shadow-inner">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="mt-4 font-bold text-ink">No conversations yet</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Connect with {currentUser?.role === "worker" ? "employers" : "candidates"} to discuss opportunities.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewChatModalOpen(true)}
                className="mt-5 text-xs"
              >
                Start a Conversation
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-line/60">
              {conversationList.map((conv) => {
                const participant =
                  conv.otherParticipant ||
                  conv.participants?.find((p) => entityId(p) !== currentUser?._id);
                const isOnline = participant?._id ? isUserOnline(participant._id) : false;
                const isSelected = conv._id === activeId;
                const unread = conv.unreadCount ?? 0;

                const jobTitle =
                  typeof conv.jobId === "object" && conv.jobId !== null
                    ? (conv.jobId as { title?: string }).title
                    : null;

                return (
                  <button
                    key={conv._id}
                    onClick={() => {
                      setSelectedConversationId(conv._id);
                      setShowMobileChat(true);
                      setSearchParams({ conversationId: conv._id });
                    }}
                    className={cn(
                      "flex w-full items-start gap-3.5 p-4 text-left transition-colors hover:bg-white/80",
                      isSelected && "bg-white shadow-sm ring-1 ring-brand-100/80",
                    )}
                  >
                    {/* Avatar with live status dot */}
                    <div className="relative shrink-0">
                      <Avatar
                        name={participant?.fullName}
                        src={participant?.profileImage}
                        className="h-12 w-12 shadow-sm"
                      />
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white",
                          isOnline ? "bg-emerald-500" : "bg-slate-300",
                        )}
                        title={isOnline ? "Online" : "Offline"}
                      />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <p className="truncate text-sm font-bold text-ink">
                          {participant?.fullName ?? "User"}
                        </p>
                        <span className="shrink-0 text-[11px] font-medium text-muted">
                          {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ""}
                        </span>
                      </div>

                      {/* Role & Job Context */}
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                          {participant?.role ?? "User"}
                        </span>
                        {jobTitle ? (
                          <>
                            <span className="text-muted/60">•</span>
                            <span className="truncate text-[11px] text-muted">
                              {jobTitle}
                            </span>
                          </>
                        ) : null}
                      </div>

                      {/* Last message preview */}
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-xs",
                            unread > 0 ? "font-bold text-ink" : "text-muted",
                          )}
                        >
                          {conv.lastMessage?.text || "No messages yet"}
                        </p>
                        {unread > 0 ? (
                          <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white shadow-sm">
                            {unread}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* MAIN PANE: ACTIVE CONVERSATION */}
      <section
        className={cn(
          "flex flex-1 flex-col bg-white",
          !showMobileChat && "hidden md:flex",
        )}
      >
        {activeId && currentConversation ? (
          <>
            {/* Chat Top Header */}
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-line px-6 lg:px-8">
              <div className="flex items-center gap-4">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="rounded-full p-2 text-muted transition-colors hover:bg-surface hover:text-ink md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                {/* Avatar with Status */}
                <div className="relative">
                  <Avatar
                    name={otherParticipant?.fullName}
                    src={otherParticipant?.profileImage}
                    className="h-11 w-11 shadow-sm"
                  />
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                      isOtherOnline ? "bg-emerald-500" : "bg-slate-300",
                    )}
                  />
                </div>

                {/* Name & Status */}
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-extrabold text-ink sm:text-lg">
                      {otherParticipant?.fullName ?? "Conversation"}
                    </h2>
                    {otherParticipant?.role ? (
                      <Badge tone={otherParticipant.role === "employer" ? "blue" : "violet"}>
                        {titleCase(otherParticipant.role)}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-muted">
                    {isOtherTyping ? (
                      <span className="font-semibold text-brand-600 animate-pulse">Typing...</span>
                    ) : isOtherOnline ? (
                      <span className="font-semibold text-emerald-600">Online</span>
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>

              {/* Linked Job Info */}
              {currentConversation.jobId && typeof currentConversation.jobId === "object" ? (
                <div className="hidden sm:block">
                  <Link
                    to={`/jobs/${(currentConversation.jobId as { _id?: string })._id}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-line transition-colors hover:bg-brand-50"
                  >
                    <Briefcase className="h-4 w-4 text-brand-600" />
                    <span className="max-w-[200px] truncate">
                      {(currentConversation.jobId as { title?: string }).title}
                    </span>
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-thin bg-gradient-to-b from-surface/20 to-white">
              {messagesQuery.isLoading ? (
                <div className="py-16">
                  <Spinner label="Loading conversation history..." />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-600 shadow-inner">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-lg font-bold text-ink">Start the conversation</p>
                  <p className="mt-1 max-w-sm text-sm text-muted leading-relaxed">
                    Send a message to introduce yourself, clarify requirements, or schedule next steps.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messagesQuery.data?.meta?.hasNextPage ? (
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-white shadow-sm"
                        onClick={() => void loadOlderMessages()}
                      >
                        Load earlier messages
                      </Button>
                    </div>
                  ) : null}
                  {messages.map((msg, index) => {
                    const senderId = entityId(msg.senderId);
                    const isMe = senderId === currentUser?._id;
                    const prevMsg = messages[index - 1];
                    const showDateDivider =
                      !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);

                    return (
                      <div key={msg._id} className="space-y-4">
                        {/* Date Divider */}
                        {showDateDivider ? (
                          <div className="relative my-6 flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-line/60" />
                            </div>
                            <span className="relative rounded-full bg-white px-4 py-1 text-xs font-semibold text-muted shadow-sm ring-1 ring-line">
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>
                        ) : null}

                        {/* Message Bubble */}
                        <div
                          className={cn(
                            "flex items-end gap-3",
                            isMe ? "justify-end" : "justify-start",
                          )}
                        >
                          {!isMe && (
                            <Avatar
                              name={otherParticipant?.fullName}
                              src={otherParticipant?.profileImage}
                              className="h-8 w-8 shrink-0 text-xs shadow-sm"
                            />
                          )}

                          <div
                            className={cn(
                              "relative max-w-[80%] sm:max-w-md rounded-3xl px-5 py-3 shadow-sm text-sm leading-relaxed",
                              isMe
                                ? "bg-brand-600 text-white rounded-br-md"
                                : "bg-surface text-ink ring-1 ring-line/60 rounded-bl-md",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                            <div
                              className={cn(
                                "mt-1.5 flex items-center justify-end gap-1.5 text-[10px] font-medium",
                                isMe ? "text-white/80" : "text-muted",
                              )}
                            >
                              <span>{formatTime(msg.createdAt)}</span>
                              {isMe && (
                                <span>
                                  {msg.read ? (
                                    <span title="Read">
                                      <CheckCheck className="h-3.5 w-3.5 text-blue-200" />
                                    </span>
                                  ) : (
                                    <span title="Sent">
                                      <Check className="h-3 w-3 text-white/70" />
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator Bubble */}
                  {isOtherTyping && (
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={otherParticipant?.fullName}
                        src={otherParticipant?.profileImage}
                        className="h-8 w-8 shrink-0 text-xs shadow-sm"
                      />
                      <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-md bg-surface px-5 py-3.5 ring-1 ring-line/60 text-muted">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-600 [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-600 [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-600" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Bottom Message Input Bar */}
            <div className="border-t border-line bg-white p-4 sm:p-5">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={messageText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Press Enter to send)"
                    className="w-full resize-none rounded-2xl bg-surface/60 px-4 py-3 text-sm ring-1 ring-line shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32 transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="h-11 w-11 shrink-0 rounded-2xl p-0 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Desktop Empty State */
          <div className="hidden h-full flex-col items-center justify-center p-8 text-center md:flex">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-50 text-brand-600 shadow-sm">
              <MessageSquare className="h-10 w-10" />
            </div>
            <h2 className="mt-6 text-xl font-extrabold text-ink">
              Select a conversation
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted leading-relaxed">
              Choose an existing chat from the left or initiate a new conversation with a candidate or employer.
            </p>
            <Button
              className="mt-6 gap-2 shadow-sm"
              onClick={() => setIsNewChatModalOpen(true)}
            >
              <Plus className="h-4 w-4" /> Start New Conversation
            </Button>
          </div>
        )}
      </section>

      {/* NEW CONVERSATION MODAL */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-line">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-5 sm:px-8">
              <div>
                <h3 className="text-lg font-extrabold text-ink">Start New Conversation</h3>
                <p className="text-xs text-muted mt-0.5">
                  Select a contact to begin chatting
                </p>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="rounded-full p-2 text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="border-b border-line p-4 sm:px-8">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search contacts by name or role..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full rounded-2xl bg-surface/50 py-2.5 pl-10 pr-4 text-sm ring-1 ring-line focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto p-4 sm:px-8 scrollbar-thin max-h-96 divide-y divide-line/60">
              {contactsQuery.isLoading ? (
                <div className="py-12">
                  <Spinner label="Loading contacts..." />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted">
                  <p className="font-bold text-ink">No contacts found</p>
                  <p className="mt-1 text-xs leading-relaxed">
                    {currentUser?.role === "worker"
                      ? "Apply for jobs or explore listings to connect with recruiters."
                      : "Workers who apply to your job postings will appear here."}
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.applicationId}
                    onClick={() => {
                      startConversation({ recipientId: contact.userId, applicationId: contact.applicationId });
                    }}
                    className="flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors hover:bg-surface/60 px-3 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={contact.fullName}
                        src={contact.profileImage}
                        className="h-11 w-11 shrink-0 shadow-sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{contact.fullName}</p>
                        <p className="truncate text-xs text-muted">{contact.email}</p>
                        {contact.context ? (
                          <p className="mt-0.5 truncate text-[11px] font-medium text-brand-600">
                            {contact.context}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0">
                      Message
                    </Button>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
