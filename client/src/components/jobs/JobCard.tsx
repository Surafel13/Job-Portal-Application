import { Bookmark, MapPin } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Badge } from "../ui/Badge";
import { formatSalary, titleCase } from "../../lib/format";
import { categoryOf, companyOf, isRemote, isUrgent } from "../../lib/job";
import type { Job } from "../../types/models";
import { cn } from "../../lib/cn";

export function JobCard({
  job,
  recommended,
  saved,
  onSave,
}: {
  job: Job;
  recommended?: boolean;
  saved?: boolean;
  onSave?: () => void;
}) {
  const company = companyOf(job);
  const category = categoryOf(job);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 font-bold text-brand-700">
            {(company?.name ?? job.title).slice(0, 1)}
          </div>
          <div>
            <Link to={`/jobs/${job._id}`} className="font-bold text-ink hover:text-brand-700">
              {job.title}
            </Link>
            <p className="text-sm text-muted">{company?.name ?? "Company"}</p>
          </div>
        </div>
        {onSave ? (
          <button
            onClick={onSave}
            className={cn(
              "rounded-full p-2 hover:bg-brand-50",
              saved && "text-brand-600",
            )}
            aria-label="Save job"
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {recommended ? <Badge>Recommended</Badge> : null}
        {isRemote(job) ? <Badge tone="green">Remote</Badge> : null}
        {isUrgent(job) ? <Badge tone="pink">Urgent</Badge> : null}
        {category ? <Badge tone="slate">{category.name}</Badge> : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {job.location}
        </span>
        <span>{titleCase(job.employmentType)}</span>
        <span className="font-semibold text-emerald-600">{formatSalary(job.salary)}</span>
      </div>
    </motion.article>
  );
}
