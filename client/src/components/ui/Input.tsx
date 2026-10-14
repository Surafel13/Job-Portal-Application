import { cn } from "../../lib/cn";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  error,
  children,
}: {
  label?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-sm font-semibold text-ink">{label}</span>
      ) : null}
      {children}
      {error ? <span className="text-xs text-rose-500">{error}</span> : null}
    </label>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
        className,
      )}
      {...props}
    />
  );
}
