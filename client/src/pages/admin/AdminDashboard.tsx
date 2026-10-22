import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Users,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { formatCompact } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { adminService } from "../../services/platform.service";
import { ErrorState, Spinner } from "../../components/ui/States";

interface AdminStatistics {
  totalJobs: number;
  totalUsers: number;
  totalEmployersCount: number;
  totalWorkers: number;
  totalEmployers: number;
  publishedJobs: number;
  pendingJobs: number;
  closedJobs: number;
}

export function AdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: () => adminService.dashboard().then((r) => r.data),
  });

  if (isLoading) return <Spinner label="Loading platform stats" />;
  if (isError) {
    return (
      <ErrorState
        message={(error as Error).message}
        onRetry={() => void refetch()}
      />
    );
  }

  const stats = data?.statistics;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <DashboardHeader />

      {/* Top Level Metric Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Briefcase}
          label="Total Jobs"
          value={formatCompact(stats.totalJobs)}
          subtitle="All platform listings"
        />
        <StatTile
          icon={Users}
          label="Total Users"
          value={formatCompact(stats.totalUsers)}
          subtitle="Registered accounts"
        />
        <StatTile
          icon={Building2}
          label="Companies"
          value={formatCompact(stats.totalEmployersCount)}
          subtitle="Active employers"
        />
        <StatTile
          icon={CheckCircle2}
          label="System Uptime"
          value="98.5%"
          subtitle="Platform operational"
          accentColor="text-emerald-500"
        />
      </div>

      {/* Main Analytics Section */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PlatformGrowthChart stats={stats} />
        <JobCategoriesChart stats={stats} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sub-Components                                */
/* -------------------------------------------------------------------------- */

function DashboardHeader() {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted">
          Monitor key metrics, user activity, and system status.
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full w-fit sm:mt-0">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Live Data Connected
      </div>
    </div>
  );
}

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
  accentColor?: string;
}

function StatTile({
  icon: Icon,
  label,
  value,
  subtitle,
  accentColor = "text-brand-600",
}: StatTileProps) {
  return (
    <div className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="font-medium">{label}</span>
        <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
          <Icon className={`h-5 w-5 ${accentColor}`} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-extrabold tracking-tight">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

function PlatformGrowthChart({ stats }: { stats: AdminStatistics }) {
  const maxUserCount = Math.max(stats.totalUsers, 1);
  const metrics = [
    { label: "Workers", value: stats.totalWorkers },
    { label: "Employers", value: stats.totalEmployers },
    { label: "Published", value: stats.publishedJobs },
    { label: "Pending", value: stats.pendingJobs },
    { label: "Users", value: stats.totalUsers },
  ];

  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-line shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Platform Growth</h2>
          <p className="text-xs text-muted mt-0.5">
            Distribution across user and job activity
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
          <TrendingUp className="h-3.5 w-3.5" /> Growth Overview
        </div>
      </div>

      <div className="mt-8 flex h-48 items-end gap-4 px-2">
        {metrics.map((item, index) => {
          const heightPercentage = Math.max(
            12,
            (item.value / maxUserCount) * 100,
          );
          return (
            <div
              key={index}
              className="flex flex-1 flex-col items-center gap-2 h-full justify-end group"
            >
              <span className="text-[10px] font-medium text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                {formatCompact(item.value)}
              </span>
              <div
                className="w-full rounded-t-2xl bg-gradient-to-t from-brand-600 to-indigo-400 transition-all duration-300 group-hover:brightness-110"
                style={{ height: `${heightPercentage}%` }}
              />
              <span className="text-xs font-medium text-muted truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JobCategoriesChart({ stats }: { stats: AdminStatistics }) {
  const jobTotal = Math.max(stats.totalJobs, 1);
  const publishedPct = Math.round((stats.publishedJobs / jobTotal) * 100);
  const pendingPct = Math.round((stats.pendingJobs / jobTotal) * 100);
  const closedPct = Math.round((stats.closedJobs / jobTotal) * 100);

  const chartGradient = `conic-gradient(#6d4dff 0 ${publishedPct}%, #38bdf8 ${publishedPct}% ${publishedPct + pendingPct}%, #f472b6 ${publishedPct + pendingPct}% 100%)`;

  const legendItems = [
    { label: "Published", pct: publishedPct, color: "bg-[#6d4dff]" },
    { label: "Pending", pct: pendingPct, color: "bg-[#38bdf8]" },
    { label: "Closed", pct: closedPct, color: "bg-[#f472b6]" },
  ];

  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-line shadow-sm flex flex-col justify-between">
      <div>
        <h2 className="font-bold text-lg">Job Statuses</h2>
        <p className="text-xs text-muted mt-0.5">
          Ratio of active, pending, and closed listings
        </p>
      </div>

      <div className="my-6 flex items-center justify-center">
        <div
          className="h-44 w-44 rounded-full shadow-inner transition-transform hover:scale-105 duration-200"
          style={{ background: chartGradient }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        {legendItems.map((item) => (
          <div key={item.label} className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted mb-0.5">
              <span className={`h-2 w-2 rounded-full ${item.color}`} />
              <span>{item.label}</span>
            </div>
            <p className="font-bold text-sm">{item.pct}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
