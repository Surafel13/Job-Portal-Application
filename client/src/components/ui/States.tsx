import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-brand-600">
      <LoaderCircle className="h-6 w-6 animate-spin" />
      <span className="text-sm font-medium">{label}…</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-white p-8 text-center">
      <p className="font-semibold text-rose-600">Something went wrong</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {onRetry ? (
        <Button className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center">
      <p className="text-lg font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
