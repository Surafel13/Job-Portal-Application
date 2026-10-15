import { useQuery } from "@tanstack/react-query";
import { Briefcase, Eye, FileText, Users } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, Spinner } from "../../components/ui/States";
import { formatDate, titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { catalogService, jobsService } from "../../services/jobs.service";
import { useAuthStore } from "../../store/authStore";
import { findMyEmployer } from "../../lib/job";
import type { Job } from "../../types/models";

export function EmployerDashboard() {
  const user = useAuthStore((s) => s.user);

  const employers = useQuery({
    queryKey: queryKeys.employers,
    queryFn: () => catalogService.employers().then((r) => r.data ?? []),
  });

  const company = findMyEmployer(employers.data ?? [], user?._id);

  const jobs = useQuery({
    queryKey: queryKeys.employerJobs(company?._id ?? "none"),
    enabled: Boolean(company?._id),
    queryFn: () => jobsService.byCompany(company!._id).then((r) => r.data ?? []),
  });

  const list = jobs.data ?? [];
  const active = list.filter((job) => job.status === "published").length;
  const views = list.reduce((sum, job) => sum + (job.viewCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Welcome back, {user?.fullName?.split(" ")[0]}!</h1>
          <p className="text-muted">
            {company
              ? `${company.name} · ${titleCase(company.verificationStatus)}`
              : "Here’s your company overview."}
          </p>
        </div>
        <Link to="/employer/jobs/new">
          <Button>Post a Job</Button>
        </Link>
      </div>
      {company?.verificationStatus !== "verified" ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Employers must be verified by an admin before new jobs can be published.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Briefcase} label="Active Jobs" value={active} />
        <Metric icon={FileText} label="Total Listings" value={list.length} />
        <Metric icon={Users} label="Pending Review" value={list.filter((j) => j.status === "pending").length} />
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
          <JobRow key={job._id} job={job} />
        ))}
        {!jobs.isLoading && list.length === 0 ? (
          <EmptyState
            title="No jobs posted yet"
            description="Create a listing to start receiving applications."
            action={
              <Link to="/employer/jobs/new">
                <Button>Post a Job</Button>
              </Link>
            }
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

function JobRow({ job }: { job: Job }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-0">
      <div>
        <Link to={`/jobs/${job._id}`} className="font-semibold hover:text-brand-700">
          {job.title}
        </Link>
        <p className="text-xs text-muted">{formatDate(job.createdAt)}</p>
      </div>
      <Badge tone={job.status === "published" ? "green" : "amber"}>{titleCase(job.status)}</Badge>
    </div>
  );
}
