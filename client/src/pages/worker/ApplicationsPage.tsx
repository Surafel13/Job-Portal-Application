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

/* -------------------------------------------------------------------------- */
/*                         Constants & types                                  */
/* -------------------------------------------------------------------------- */

type TabFilter = "all" | ApplicationStatus;

interface TabConfig {
  id: TabFilter;
  label: string;
}

const TABS: TabConfig[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "interview", label: "Interview" },
  { id: "accepted", label: "Offers" },
  { id: "rejected", label: "Rejected" },
];

const STATUS_TONES: Record<
  ApplicationStatus,
  "amber" | "blue" | "violet" | "green" | "rose" | "slate"
> = {
  pending: "amber",
  reviewing: "blue",
  shortlisted: "violet",
  interview: "blue",
  accepted: "green",
  rejected: "rose",
  withdrawn: "slate",
};


/* -------------------------------------------------------------------------- */
/*                              Page                                          */
/* -------------------------------------------------------------------------- */

export function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const queryClient = useQueryClient();

  const {
    data: applications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => applicationService.my().then((res) => res.data ?? []),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => applicationService.withdraw(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    },
  });

  const filtered = useMemo(() => {
    if (activeTab === "all") return applications;
    return applications.filter((item) => item.status === activeTab);
  }, [applications, activeTab]);

  const tabCounts = useMemo(() => {
    const counts: Partial<Record<TabFilter, number>> = {
      all: applications.length,
    };
    for (const app of applications) {
      counts[app.status] = (counts[app.status] ?? 0) + 1;
    }
    return counts;
  }, [applications]);

  return (
    <div className="space-y-6">
      <ApplicationsHeader total={applications.length} />

      <ApplicationTabs
        tabs={TABS}
        activeTab={activeTab}
        counts={tabCounts}
        onSelectTab={setActiveTab}
      />

      {isLoading ? <ApplicationsSkeleton /> : null}

      {isError ? (
        <ErrorState
          message={(error as Error)?.message || "Failed to load applications."}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError ? (
        <ApplicationsList
          applications={filtered}
          onWithdraw={(id) => withdrawMutation.mutate(id)}
          withdrawingId={
            withdrawMutation.isPending ? withdrawMutation.variables : null
          }
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Header & tabs                                      */
/* -------------------------------------------------------------------------- */

function ApplicationsHeader({ total }: { total: number }) {
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        My Applications
      </h1>
      <p className="mt-1 text-sm text-muted">
        {total > 0
          ? `Tracking ${total} application${total === 1 ? "" : "s"}.`
          : "Track the status of your applications."}
      </p>
    </div>
  );
}

function ApplicationTabs({
  tabs,
  activeTab,
  counts,
  onSelectTab,
}: {
  tabs: TabConfig[];
  activeTab: TabFilter;
  counts: Partial<Record<TabFilter, number>>;
  onSelectTab: (tab: TabFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-white text-muted ring-1 ring-line hover:bg-slate-50"
            }`}
          >
            {tab.label}
            {typeof count === "number" ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         List & row                                         */
/* -------------------------------------------------------------------------- */

function ApplicationsList({
  applications,
  onWithdraw,
  withdrawingId,
}: {
  applications: Application[];
  onWithdraw: (id: string) => void;
  withdrawingId: string | null | undefined;
}) {
  if (applications.length === 0) {
    return <ApplicationsEmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-line">
      <ApplicationsTableHeader />

      <div className="divide-y divide-line">
        {applications.map((app) => (
          <ApplicationRow
            key={app._id}
            app={app}
            onWithdraw={() => onWithdraw(app._id)}
            isWithdrawing={withdrawingId === app._id}
          />
        ))}
      </div>
    </div>
  );
}

function ApplicationsTableHeader() {
  return (
    <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-line px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-muted md:grid">
      <span>Job title</span>
      <span>Company</span>
      <span>Date applied</span>
      <span>Status</span>
      <span className="pr-2 text-right">Action</span>
    </div>
  );
}

function ApplicationRow({
  app,

}: {
  app: Application;
  onWithdraw: () => void;
  isWithdrawing: boolean;
}) {
  const job = typeof app.jobId === "object" ? (app.jobId as Job) : null;
  const companyName =
    job && typeof job.companyId === "object" ? job.companyId.name : "Company";


  return (
    <div className="grid grid-cols-1 items-center gap-3 px-6 py-4 transition-colors hover:bg-slate-50/50 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:gap-4">
      {/* Job */}
      <div className="min-w-0">
        <Link
          to={job ? `/jobs/${job._id}` : "/jobs"}
          className="font-bold text-slate-900 transition-colors hover:text-brand-600"
        >
          {job?.title ?? "Job listing"}
        </Link>
        <p className="mt-0.5 text-xs text-muted md:hidden">{companyName}</p>
      </div>

      {/* Company (desktop) */}
      <p className="hidden truncate text-sm text-muted md:block">
        {companyName}
      </p>

      {/* Date */}
      <p className="text-sm text-muted">
        {formatDate(app.createdAt ?? app.appliedAt)}
      </p>

      {/* Status */}
      <div>
        <Badge tone={STATUS_TONES[app.status] ?? "slate"}>
          {titleCase(app.status)}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
        <Link to={`/messages?applicationId=${app._id}`}>
          <Button size="sm" variant="secondary" className="rounded-full px-4">
            Message
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Empty & loading                                    */
/* -------------------------------------------------------------------------- */

function ApplicationsEmptyState() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white px-6 py-12 shadow-xs ring-1 ring-line">
      <EmptyState
        title="No applications found"
        description="There are no applications matching your current filter. Browse open roles to get started."
        action={
          <Link to="/jobs">
            <Button className="rounded-full px-6">Browse jobs</Button>
          </Link>
        }
      />
    </div>
  );
}

function ApplicationsSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-line">
      <div className="hidden border-b border-line px-6 py-3.5 md:block">
        <div className="h-3 w-full max-w-md animate-pulse rounded bg-slate-100" />
      </div>

      <div className="divide-y divide-line">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-1 items-center gap-3 px-6 py-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:gap-4"
          >
            <div className="space-y-2">
              <div className="h-4 w-2/3 max-w-[220px] animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100 md:hidden" />
            </div>
            <div className="hidden h-3 w-28 animate-pulse rounded bg-slate-100 md:block" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
            <div className="flex gap-2 md:justify-end">
              <div className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
              <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Fallback for environments that prefer a spinner */}
      <div className="sr-only">
        <Spinner label="Loading applications..." />
      </div>
    </div>
  );
}
