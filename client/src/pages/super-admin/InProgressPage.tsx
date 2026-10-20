import { motion } from "motion/react";
import { Hourglass } from "lucide-react";
import { Link, Navigate } from "react-router";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { superAdminNav } from "../../config/superAdminNav";

export function InProgressPage({ pageKey }: { pageKey: string }) {
  const item = superAdminNav.find((entry) => entry.key === pageKey);
  if (!item) return <Navigate to="/super-admin" replace />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">{item.label}</h1>
        <Badge tone="amber">In Progress</Badge>
      </div>
      <p className="-mt-3 text-muted">{item.description}</p>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-line">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <item.icon className="h-5 w-5" />
            </span>
            <h2 className="font-bold">What's planned</h2>
          </div>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
            {item.planned.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
          <Link to="/super-admin" className="mt-6 inline-block">
            <Button variant="secondary">Back to overview</Button>
          </Link>
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-line">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <Hourglass className="h-5 w-5" />
            </span>
            <h2 className="font-bold">Backend status</h2>
          </div>
          <p className="mt-4 text-sm text-muted">{item.backend}</p>
        </section>
      </div>
    </motion.div>
  );
}
