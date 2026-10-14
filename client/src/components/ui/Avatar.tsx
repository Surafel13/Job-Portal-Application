import { getInitials } from "../../lib/format";
import { cn } from "../../lib/cn";

export function Avatar({
  name,
  src,
  className,
}: {
  name?: string;
  src?: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "avatar"}
        className={cn("h-10 w-10 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-indigo-600 text-sm font-bold text-white",
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
