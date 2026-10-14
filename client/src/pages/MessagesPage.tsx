import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState, Spinner } from "../components/ui/States";
import { timeAgo } from "../lib/format";
import { queryKeys } from "../lib/queryKeys";
import { notificationService } from "../services/platform.service";
import { cn } from "../lib/cn";

export function MessagesPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const notifications = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationService.my().then((r) => r.data ?? []),
  });

  const mark = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });

  const items = notifications.data ?? [];
  const active = items.find((item) => item._id === selected) ?? items[0];

  return (
    <div className="grid min-h-[70vh] overflow-hidden rounded-3xl bg-white ring-1 ring-line lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-line lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-extrabold">Messages</h1>
        </div>
        {notifications.isLoading ? <Spinner /> : null}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          {items.map((item) => (
            <button
              key={item._id}
              onClick={() => {
                setSelected(item._id);
                if (!item.isRead) mark.mutate(item._id);
              }}
              className={cn(
                "block w-full border-b border-line px-4 py-3 text-left hover:bg-surface",
                active?._id === item._id && "bg-brand-50",
              )}
            >
              <p className="font-semibold">{item.title}</p>
              <p className="truncate text-sm text-muted">{item.message}</p>
              <p className="text-xs text-muted">{timeAgo(item.createdAt)}</p>
            </button>
          ))}
        </div>
        {!notifications.isLoading && items.length === 0 ? (
          <p className="p-4 text-sm text-muted">No notifications yet.</p>
        ) : null}
      </aside>
      <section className="grid place-items-center p-8">
        {active ? (
          <div className="max-w-lg text-center">
            <p className="text-xs uppercase tracking-wide text-brand-600">{active.type}</p>
            <h2 className="mt-2 text-2xl font-extrabold">{active.title}</h2>
            <p className="mt-3 text-muted">{active.message}</p>
          </div>
        ) : (
          <EmptyState
            title="Select a conversation to start chatting"
            description="JobVerse uses notifications for application, interview, and system updates. There is no separate chat API in this backend."
          />
        )}
      </section>
    </div>
  );
}
