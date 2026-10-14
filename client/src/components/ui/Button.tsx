import { cn } from "../../lib/cn";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" && "px-3.5 py-2 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" &&
          "bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:-translate-y-0.5 hover:bg-brand-700",
        variant === "secondary" &&
          "bg-white text-ink shadow-sm ring-1 ring-line hover:bg-brand-50",
        variant === "ghost" && "text-ink hover:bg-brand-50",
        variant === "outline" &&
          "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50",
        variant === "danger" && "bg-rose-500 text-white hover:bg-rose-600",
        className,
      )}
      {...props}
    />
  );
}
