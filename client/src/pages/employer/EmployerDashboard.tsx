import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Eye, FileText, Users } from "lucide-react";
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
      <Button>Post a Job</Button>
    </Link>
  ) : (
    <Button disabled title="Your employer account must be verified first">
      Post a Job
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">
            Welcome back, {user?.fullName?.split(" ")[0]}!
          </h1>
          <p className="text-muted">
            {company
              ? `${company.name} · ${titleCase(company.verificationStatus)}`
              : "Here’s your company overview."}
          </p>
        </div>
        {postButton}
      </div>
      {!employers.isLoading && !verified ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Employers must be verified by an admin before they can post, edit, or
          publish jobs.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Briefcase} label="Active Jobs" value={active} />
        <Metric icon={FileText} label="Total Listings" value={list.length} />
        <Metric
          icon={Users}
          label="Drafts"
          value={list.filter((j) => j.status === "draft").length}
        />
        <Metric icon={Eye} label="Job Views" value={views} />
      </div>
      <section className="rounded-3xl bg-white p-5 ring-1 ring-line">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Applications Overview</h2>
          <Link to="/employer/applicants" className="text-sm text-brand-700">
            View all
          </Link>
        </div>
        {jobs.isLoading ? <Spinner /> : null}
        {list.slice(0, 6).map((job) => (
          <JobRow
            key={job._id}
            job={job}
            canManage={verified}
            busy={changeStatus.isPending}
            onStatus={(status) => changeStatus.mutate({ id: job._id, status })}
          />
        ))}
        {!jobs.isLoading && list.length === 0 ? (
          <EmptyState
            title="No jobs posted yet"
            description="Create a listing to start receiving applications."
            action={postButton}
          />
        ) : null}
      </section>
    </div>
  );
}

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
    <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-3xl font-extrabold">{value}</p>
        <Icon className="h-5 w-5 text-brand-600" />
      </div>
    </div>
  );
}

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
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-0">
      <div>
        <Link
          to={`/jobs/${job._id}`}
          className="font-semibold hover:text-brand-700"
        >
          {job.title}
        </Link>
        <p className="text-xs text-muted">{formatDate(job.createdAt)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={job.status === "published" ? "green" : "amber"}>
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
