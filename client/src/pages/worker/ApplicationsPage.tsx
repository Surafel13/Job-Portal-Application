import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States";
import { formatDate, titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { applicationService } from "../../services/jobs.service";
import type { Application, ApplicationStatus, Job } from "../../types/models";

const tabs: Array<{ id: "all" | ApplicationStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "interview", label: "Interview" },
  { id: "accepted", label: "Offers" },
  { id: "rejected", label: "Rejected" },
];

const tones: Record<ApplicationStatus, "amber" | "blue" | "violet" | "green" | "rose" | "slate"> = {
  pending: "amber",
  reviewing: "blue",
  shortlisted: "violet",
  interview: "blue",
  accepted: "green",
  rejected: "rose",
  withdrawn: "slate",
};

export function ApplicationsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => applicationService.my().then((r) => r.data ?? []),
  });
  const withdraw = useMutation({
    mutationFn: (id: string) => applicationService.withdraw(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.applications }),
  });

  const items = useMemo(() => {
    const list = query.data ?? [];
    if (tab === "all") return list;
    return list.filter((item) => item.status === tab);
  }, [query.data, tab]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold">My Applications</h1>
      <p className="text-muted">Track the status of your applications.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === item.id ? "bg-brand-600 text-white" : "bg-white text-muted ring-1 ring-line"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {query.isLoading ? <Spinner /> : null}
      {query.isError ? (
        <ErrorState
          message={(query.error as Error).message}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      <div className="mt-5 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-line px-5 py-3 text-xs font-bold uppercase text-muted md:grid">
          <span>Job Title</span>
          <span>Company</span>
          <span>Date Applied</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {items.map((app) => (
          <ApplicationRow
            key={app._id}
            app={app}
            onWithdraw={() => withdraw.mutate(app._id)}
            withdrawing={withdraw.isPending}
          />
        ))}
        {!query.isLoading && items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No applications yet"
              description="Apply to a published job to see it here."
              action={
                <Link to="/jobs">
                  <Button>Browse jobs</Button>
                </Link>
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ApplicationRow({
  app,
  onWithdraw,
  withdrawing,
}: {
  app: Application;
  onWithdraw: () => void;
  withdrawing: boolean;
}) {
  const job = typeof app.jobId === "object" ? (app.jobId as Job) : null;
  const company = job && typeof job.companyId === "object" ? job.companyId.name : "Company";

  return (
    <div className="grid gap-2 border-b border-line px-5 py-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-center">
      <div>
        <Link to={job ? `/jobs/${job._id}` : "/jobs"} className="font-bold hover:text-brand-700">
          {job?.title ?? "Job"}
        </Link>
        <p className="text-xs text-muted md:hidden">{company}</p>
      </div>
      <p className="hidden text-sm text-muted md:block">{company}</p>
      <p className="text-sm text-muted">{formatDate(app.createdAt ?? app.appliedAt)}</p>
      <div>
        <Badge tone={tones[app.status]}>{titleCase(app.status)}</Badge>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={app.status === "accepted" || app.status === "rejected" || withdrawing}
        onClick={onWithdraw}
      >
        Withdraw
      </Button>
    </div>
  );
}
