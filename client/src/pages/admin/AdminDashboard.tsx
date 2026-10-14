import { useQuery } from "@tanstack/react-query";
import { Briefcase, Building2, CheckCircle2, Users } from "lucide-react";
import { formatCompact } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { adminService } from "../../services/platform.service";
import { ErrorState, Spinner } from "../../components/ui/States";

export function AdminDashboard() {
  const query = useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: () => adminService.dashboard().then((r) => r.data),
  });

  if (query.isLoading) return <Spinner label="Loading platform stats" />;
  if (query.isError) {
    return (
      <ErrorState
        message={(query.error as Error).message}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const stats = query.data?.statistics;
  if (!stats) return null;

  const jobTotal = Math.max(stats.totalJobs, 1);
  const publishedPct = Math.round((stats.publishedJobs / jobTotal) * 100);
  const pendingPct = Math.round((stats.pendingJobs / jobTotal) * 100);
  const closedPct = Math.round((stats.closedJobs / jobTotal) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
        <p className="text-muted">Monitor and manage the platform.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile icon={Briefcase} label="Total Jobs" value={formatCompact(stats.totalJobs)} />
        <Tile icon={Users} label="Total Users" value={formatCompact(stats.totalUsers)} />
        <Tile icon={Building2} label="Companies" value={formatCompact(stats.totalEmployersCount)} />
        <Tile
          icon={CheckCircle2}
          label="System Uptime"
          value="98.5%"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-bold">Platform Growth</h2>
          <div className="mt-6 flex h-40 items-end gap-3">
            {[stats.totalWorkers, stats.totalEmployers, stats.publishedJobs, stats.pendingJobs, stats.totalUsers].map(
              (value, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-2xl bg-gradient-to-t from-brand-600 to-indigo-400"
                  style={{ height: `${Math.max(12, (value / Math.max(stats.totalUsers, 1)) * 100)}%` }}
                />
              ),
            )}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-bold">Job Categories</h2>
          <div
            className="mx-auto mt-6 h-40 w-40 rounded-full"
            style={{
              background: `conic-gradient(#6d4dff 0 ${publishedPct}%, #38bdf8 ${publishedPct}% ${publishedPct + pendingPct}%, #f472b6 ${publishedPct + pendingPct}% 100%)`,
            }}
          />
          <div className="mt-4 space-y-1 text-sm text-muted">
            <p>Published {publishedPct}%</p>
            <p>Pending {pendingPct}%</p>
            <p>Closed {closedPct}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
      <div className="flex items-center justify-between text-sm text-muted">
        {label}
        <Icon className="h-4 w-4 text-brand-600" />
      </div>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
