import { Link } from "react-router";
import { cn } from "../../lib/cn";

export function Logo({
  light = false,
  className,
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 font-extrabold", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-500/30">
        JV
      </span>
      <span className={light ? "text-white" : "text-ink"}>JobVerse</span>
    </Link>
  );
}
