import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Eye,
  FileText,
  Plus,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, Spinner } from "../../components/ui/States";
import { formatDate, titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { catalogService, jobsService } from "../../services/jobs.service";
import { useAuthStore } from "../../store/authStore";
import type { Job } from "../../types/models";
import { findMyEmployer } from "../../lib/employer";

export function EmployerDashboard() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const employers = useQuery({
    queryKey: queryKeys.employers,
    queryFn: () => catalogService.employers().then((r) => r.data ?? []),
  });

  const company = findMyEmployer(employers.data ?? [], user?._id);
  const verified = company?.verificationStatus === "verified";

  const jobs = useQuery({
    queryKey: queryKeys.employerJobs(company?._id ?? "none"),
    enabled: Boolean(company?._id),
    queryFn: () =>
      jobsService.byCompany(company!._id).then((r) => r.data ?? []),
  });

  const changeStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "published" | "closed";
    }) => jobsService.updateStatus(id, status),
    onSuccess: () => {
      setError("");
      return queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const list = jobs.data ?? [];
  const active = list.filter((job) => job.status === "published").length;
  const views = list.reduce((sum, job) => sum + (job.viewCount ?? 0), 0);

  const postButton = verified ? (
    <Link to="/employer/jobs/new">
      <Button className="gap-2 shadow-sm">
        <Plus className="h-4 w-4" />
        Post a Job
      </Button>
    </Link>
  ) : (
    <Button
      disabled
      title="Your employer account must be verified first"
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      Post a Job
    </Button>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-8">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Welcome back, {user?.fullName?.split(" ")[0] ?? "Employer"}!
          </h1>
          <p className="mt-1 text-sm text-muted">
            {company
              ? `${company.name} · ${titleCase(company.verificationStatus)}`
              : "Here’s your company performance overview."}
          </p>
        </div>
        <div>{postButton}</div>
      </div>

      {/* Verification Warning Alert */}
      {!employers.isLoading && !verified ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed"
        >
          <span className="font-semibold">Account Pending Verification:</span>{" "}
          Employers must be verified by an admin before they can post, edit, or
          publish job listings.
        </div>
      ) : null}

      {/* Error Alert */}
      {error ? (
        <div
          role="alert"
          className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700"
        >
          {error}
        </div>
      ) : null}

      {/* Metrics Grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Briefcase} label="Active Jobs" value={active} />
        <Metric icon={FileText} label="Total Listings" value={list.length} />
        <Metric
          icon={Users}
          label="Draft Listings"
          value={list.filter((j) => j.status === "draft").length}
        />
        <Metric icon={Eye} label="Total Job Views" value={views} />
      </div>

      {/* Applications / Jobs Overview Section */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Recent Job Listings</h2>
            <p className="text-xs text-muted mt-0.5">
              Manage and monitor your organization's open positions
            </p>
          </div>
          <Link
            to="/employer/applicants"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            View all applicants
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {jobs.isLoading ? (
          <div className="py-12">
            <Spinner label="Loading listings..." />
          </div>
        ) : null}

        <div className="divide-y divide-line">
          {list.slice(0, 6).map((job) => (
            <JobRow
              key={job._id}
              job={job}
              canManage={verified}
              busy={changeStatus.isPending}
              onStatus={(status) =>
                changeStatus.mutate({ id: job._id, status })
              }
            />
          ))}
        </div>

        {!jobs.isLoading && list.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title="No jobs posted yet"
              description="Create your first listing to start receiving qualified candidate applications."
              action={postButton}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Metric Card Component                              */
/* -------------------------------------------------------------------------- */

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line transition-all hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-3xl font-extrabold tracking-tight text-ink">
          {value}
        </p>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 shadow-inner">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Job Row Component                                  */
/* -------------------------------------------------------------------------- */

function JobRow({
  job,
  canManage,
  busy,
  onStatus,
}: {
  job: Job;
  canManage: boolean;
  busy: boolean;
  onStatus: (status: "published" | "closed") => void;
}) {
  const canPublish =
    canManage &&
    (job.status === "draft" ||
      job.status === "closed" ||
      job.status === "expired");
  const canClose = canManage && job.status === "published";

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between first:pt-0 last:pb-0">
      <div className="min-w-0 pr-4">
        <Link
          to={`/jobs/${job._id}`}
          className="font-bold text-ink transition-colors hover:text-brand-700 block truncate"
        >
          {job.title}
        </Link>
        <p className="mt-0.5 text-xs text-muted">
          Created {formatDate(job.createdAt)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Badge
          tone={
            job.status === "published"
              ? "green"
              : job.status === "closed"
                ? "slate"
                : "amber"
          }
        >
          {titleCase(job.status)}
        </Badge>

        {canManage ? (
          <Link to={`/employer/jobs/${job._id}/edit`}>
            <Button size="sm" variant="outline">
              Edit
            </Button>
          </Link>
        ) : null}

        {canPublish ? (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onStatus("published")}
          >
            Publish
          </Button>
        ) : null}

        {canClose ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => onStatus("closed")}
          >
            Close
          </Button>
        ) : null}
      </div>
    </div>
  );
}
