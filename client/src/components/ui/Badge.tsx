import { cn } from "../../lib/cn";
import type { ReactNode } from "react";

const tones = {
  violet: "bg-brand-100 text-brand-700",
  green: "bg-emerald-50 text-emerald-600",
  pink: "bg-pink-50 text-pink-600",
  blue: "bg-sky-50 text-sky-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-600",
  rose: "bg-rose-50 text-rose-600",
};

export function Badge({
  children,
  tone = "violet",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
