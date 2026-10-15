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
import { useChatSocket } from "../hooks/useChatSocket";
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
  const conversationsQuery = useQuery({
    queryKey: queryKeys.conversations({ search: searchFilter }),
    queryFn: () => conversationService.list({ search: searchFilter }),
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
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
        setIsNewChatModalOpen(false);
        // Clear query params to prevent re-triggering
        setSearchParams({ conversationId: res.data._id }, { replace: true });
      }
    },
  });

  useEffect(() => {
    if (recipientParam || jobParam || appParam) {
      startConversationMutation.mutate({
        recipientId: recipientParam || undefined,
        jobId: jobParam || undefined,
        applicationId: appParam || undefined,
      });
    }
  }, [recipientParam, jobParam, appParam, startConversationMutation]);

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
    onSuccess: () => {
      markSocketRead(activeId!);
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.unreadMessagesCount });
    },
  });

  useEffect(() => {
    if (activeId && currentConversation && (currentConversation.unreadCount ?? 0) > 0) {
      markReadMutation.mutate(activeId);
    }
  }, [activeId, currentConversation, markReadMutation]);

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
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
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
  const otherParticipant: User | undefined =
    currentConversation?.otherParticipant ||
    currentConversation?.participants?.find(
      (p) => (typeof p === "string" ? p : p._id) !== currentUser?._id,
    );

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
        <div className="flex items-center justify-between border-b border-line p-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-ink">Messages</h1>
            {conversationsQuery.data?.meta?.totalItems ? (
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                {conversationsQuery.data.meta.totalItems}
              </span>
            ) : null}
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsNewChatModalOpen(true)}
            className="h-8 gap-1 px-3 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> New Chat
          </Button>
        </div>

        {/* Search Input */}
        <div className="border-b border-line p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full rounded-2xl bg-white py-1.5 pl-9 pr-4 text-sm ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {searchFilter ? (
              <button
                onClick={() => setSearchFilter("")}
                className="absolute right-3 top-2.5 text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {conversationsQuery.isLoading ? (
            <Spinner label="Loading messages" />
          ) : conversationList.length === 0 ? (
            <div className="p-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-bold text-ink">No conversations yet</p>
              <p className="mt-1 text-xs text-muted">
                Connect with {currentUser?.role === "worker" ? "employers" : "candidates"} to discuss jobs.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewChatModalOpen(true)}
                className="mt-4 text-xs"
              >
                Start a Conversation
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-line/60">
              {conversationList.map((conv) => {
                const participant =
                  conv.otherParticipant ||
                  conv.participants?.find(
                    (p) => (typeof p === "string" ? p : p._id) !== currentUser?._id,
                  );
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
                      "flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-white",
                      isSelected && "bg-white shadow-sm ring-1 ring-brand-100",
                    )}
                  >
                    {/* Avatar with live status dot */}
                    <div className="relative shrink-0">
                      <Avatar
                        name={participant?.fullName}
                        src={participant?.profileImage}
                        className="h-11 w-11"
                      />
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
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
                        <span className="shrink-0 text-[11px] text-muted">
                          {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ""}
                        </span>
                      </div>

                      {/* Role & Job Context */}
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-[11px] font-medium capitalize text-brand-600">
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
                      <div className="mt-1 flex items-center justify-between gap-2">
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
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4 lg:px-6">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="rounded-full p-1.5 text-muted hover:bg-slate-100 md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                {/* Avatar with Status */}
                <div className="relative">
                  <Avatar
                    name={otherParticipant?.fullName}
                    src={otherParticipant?.profileImage}
                    className="h-10 w-10"
                  />
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
                      isOtherOnline ? "bg-emerald-500" : "bg-slate-300",
                    )}
                  />
                </div>

                {/* Name & Status */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-ink sm:text-base">
                      {otherParticipant?.fullName ?? "Conversation"}
                    </h2>
                    {otherParticipant?.role ? (
                      <Badge tone={otherParticipant.role === "employer" ? "blue" : "violet"}>
                        {titleCase(otherParticipant.role)}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted">
                    {isOtherTyping ? (
                      <span className="font-medium text-brand-600 animate-pulse">Typing…</span>
                    ) : isOtherOnline ? (
                      <span className="font-medium text-emerald-600">Online</span>
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span className="max-w-[180px] truncate">
                      {(currentConversation.jobId as { title?: string }).title}
                    </span>
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin bg-gradient-to-b from-surface/20 to-white">
              {messagesQuery.isLoading ? (
                <Spinner label="Loading conversation history" />
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-3xl bg-brand-50 text-brand-600">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <p className="mt-3 font-extrabold text-ink">Start the conversation</p>
                  <p className="mt-1 max-w-xs text-xs text-muted">
                    Send a message to introduce yourself or discuss job requirements and next steps.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const senderId =
                      typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
                    const isMe = senderId === currentUser?._id;
                    const prevMsg = messages[index - 1];
                    const showDateDivider =
                      !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);

                    return (
                      <div key={msg._id} className="space-y-3">
                        {/* Date Divider */}
                        {showDateDivider ? (
                          <div className="relative my-4 flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-line/60" />
                            </div>
                            <span className="relative rounded-full bg-surface px-3 py-0.5 text-[11px] font-semibold text-muted shadow-xs">
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>
                        ) : null}

                        {/* Message Bubble */}
                        <div
                          className={cn(
                            "flex items-end gap-2",
                            isMe ? "justify-end" : "justify-start",
                          )}
                        >
                          {!isMe && (
                            <Avatar
                              name={otherParticipant?.fullName}
                              src={otherParticipant?.profileImage}
                              className="h-7 w-7 shrink-0 text-xs"
                            />
                          )}

                          <div
                            className={cn(
                              "relative max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 shadow-xs text-sm leading-relaxed",
                              isMe
                                ? "bg-brand-600 text-white rounded-br-xs"
                                : "bg-slate-100 text-ink rounded-bl-xs",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                            <div
                              className={cn(
                                "mt-1 flex items-center justify-end gap-1 text-[10px]",
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
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={otherParticipant?.fullName}
                        src={otherParticipant?.profileImage}
                        className="h-7 w-7 shrink-0 text-xs"
                      />
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-xs bg-slate-100 px-4 py-3 text-muted">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted/70 [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted/70 [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted/70" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Bottom Message Input Bar */}
            <div className="border-t border-line bg-white p-3 sm:p-4">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={messageText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message… (Press Enter to send)"
                    className="w-full resize-none rounded-2xl bg-surface/60 px-4 py-2.5 text-sm ring-1 ring-line focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32"
                  />
                </div>
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="h-10 w-10 shrink-0 rounded-2xl p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Desktop Empty State */
          <div className="hidden h-full flex-col items-center justify-center p-8 text-center md:flex">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-600 shadow-sm">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-ink">
              Select a conversation
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Choose an existing chat from the left or initiate a new conversation with a candidate or employer.
            </p>
            <Button
              className="mt-5"
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
          <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-line">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line p-4">
              <div>
                <h3 className="text-lg font-extrabold text-ink">New Conversation</h3>
                <p className="text-xs text-muted">
                  Choose a contact to begin messaging
                </p>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="rounded-full p-1 text-muted hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="border-b border-line p-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search contacts…"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full rounded-2xl bg-surface/50 py-1.5 pl-9 pr-4 text-sm ring-1 ring-line focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin max-h-96">
              {contactsQuery.isLoading ? (
                <Spinner label="Loading contacts" />
              ) : filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted">
                  <p className="font-semibold text-ink">No contacts found</p>
                  <p className="mt-1 text-xs">
                    {currentUser?.role === "worker"
                      ? "Apply for jobs or search listings to connect with recruiters."
                      : "Workers who apply to your job postings will appear here."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.userId + (contact.jobId || "")}
                      onClick={() => {
                        startConversationMutation.mutate({
                          recipientId: contact.userId,
                          jobId: contact.jobId,
                          applicationId: contact.applicationId,
                        });
                      }}
                      disabled={startConversationMutation.isPending}
                      className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition hover:bg-brand-50"
                    >
                      <Avatar
                        name={contact.fullName}
                        src={contact.profileImage}
                        className="h-10 w-10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold text-ink">
                            {contact.fullName}
                          </p>
                          <Badge tone={contact.role === "employer" ? "blue" : "violet"}>
                            {titleCase(contact.role)}
                          </Badge>
                        </div>
                        {contact.context ? (
                          <p className="truncate text-xs text-muted">
                            {contact.context}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;
