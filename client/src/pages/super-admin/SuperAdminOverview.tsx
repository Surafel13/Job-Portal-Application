import { motion } from "motion/react";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Hourglass,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { ErrorState, Spinner } from "../../components/ui/States";
import { superAdminNav } from "../../config/superAdminNav";
import {
  useEmployerList,
  usePublishedJobs,
  useUsersByRole,
} from "../../hooks/useSuperAdminData";
import { bucketCounts, trendPct, type SeriesPoint } from "../../lib/analytics";
import { cn } from "../../lib/cn";
import { formatCompact } from "../../lib/format";
import { useAuthStore } from "../../store/authStore";

const RANGES = [
  { days: 7, buckets: 7, label: "Last 7 days" },
  { days: 30, buckets: 10, label: "Last 30 days" },
  { days: 90, buckets: 9, label: "Last 90 days" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function SuperAdminOverview() {
  const me = useAuthStore((s) => s.user);
  const [rangeDays, setRangeDays] = useState(30);

  const workers = useUsersByRole("worker");
  const employerUsers = useUsersByRole("employer");
  const admins = useUsersByRole("admin");
  const superAdmins = useUsersByRole("superAdmin");
  const employers = useEmployerList();
  const jobs = usePublishedJobs();

  const queries = [workers, employerUsers, admins, superAdmins, employers, jobs];

  const allUsers = useMemo(
    () => [
      ...(workers.data ?? []),
      ...(employerUsers.data ?? []),
      ...(admins.data ?? []),
      ...(superAdmins.data ?? []),
    ],
    [workers.data, employerUsers.data, admins.data, superAdmins.data],
  );

  const range = RANGES.find((item) => item.days === rangeDays) ?? RANGES[1];
  const jobList = useMemo(() => jobs.data?.jobs ?? [], [jobs.data]);

  const userSeries = useMemo(
    () => bucketCounts(allUsers, range.days, range.buckets),
    [allUsers, range],
  );
  const jobSeries = useMemo(
    () => bucketCounts(jobList, range.days, range.buckets),
    [jobList, range],
  );

  if (queries.some((q) => q.isLoading)) {
    return <Spinner label="Loading platform analytics" />;
  }

  const failed = queries.find((q) => q.isError);
  if (failed) {
    return (
      <ErrorState
        message={(failed.error as Error).message}
        onRetry={() => queries.forEach((q) => void q.refetch())}
      />
    );
  }

  const employerList = employers.data ?? [];
  const totalJobs = Number(jobs.data?.meta.total ?? jobList.length);
  const verified = employerList.filter((e) => e.verificationStatus === "verified").length;
  const pending = employerList.filter((e) => e.verificationStatus === "pending").length;
  const inactiveUsers = allUsers.filter((u) => u.status !== "active").length;

  const roleBreakdown = [
    { label: "Workers", count: workers.data?.length ?? 0, color: "bg-brand-500" },
    { label: "Employers", count: employerUsers.data?.length ?? 0, color: "bg-sky-400" },
    { label: "Admins", count: admins.data?.length ?? 0, color: "bg-pink-400" },
    { label: "Super admins", count: superAdmins.data?.length ?? 0, color: "bg-amber-400" },
  ];

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">
            {greeting()}, {me?.fullName?.split(" ")[0] ?? "Super Admin"}
          </h1>
          <p className="text-muted">Full control. A safer and stronger platform.</p>
        </div>
        <p className="text-sm text-muted">{today}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          icon={Briefcase}
          label="Published Jobs"
          value={formatCompact(totalJobs)}
          delta={trendPct(jobList, 30)}
        />
        <Tile
          icon={Users}
          label="Total Users"
          value={formatCompact(allUsers.length)}
          delta={trendPct(allUsers, 30)}
        />
        <Tile
          icon={Building2}
          label="Verified Employers"
          value={formatCompact(verified)}
          delta={trendPct(employerList, 30)}
        />
        <Tile
          icon={Hourglass}
          label="Awaiting Verification"
          value={formatCompact(pending)}
          hint={pending > 0 ? "Needs review" : "All caught up"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold">Platform Overview</h2>
              <Select
                className="w-40 px-3 py-1.5"
                value={rangeDays}
                onChange={(e) => setRangeDays(Number(e.target.value))}
                aria-label="Time range"
              >
                {RANGES.map((item) => (
                  <option key={item.days} value={item.days}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-4 flex gap-5 text-xs text-muted">
              <Legend color="#6d4dff" label="New users" />
              <Legend color="#38bdf8" label="New jobs" />
            </div>
            <LineChart
              series={[
                { name: "New users", color: "#6d4dff", points: userSeries },
                { name: "New jobs", color: "#38bdf8", points: jobSeries },
              ]}
            />
            <p className="mt-2 text-xs text-muted">
              Built from account and listing creation dates. Jobs reflect the newest 100 published
              listings.
            </p>
          </section>

          <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-500 to-violet-500 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-bold">Platform Security</p>
                <p className="text-sm text-white/80">
                  {inactiveUsers === 0
                    ? "No suspended or deactivated accounts."
                    : `${inactiveUsers} account${inactiveUsers === 1 ? "" : "s"} suspended or deactivated.`}
                </p>
              </div>
            </div>
            <Link to="/super-admin/audit-logs">
              <Button variant="secondary">View security logs</Button>
            </Link>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <h2 className="font-bold">Quick Actions</h2>
            <div className="mt-4 grid gap-2">
              {superAdminNav
                .filter((item) => item.key !== "overview")
                .map((item) => (
                  <Link
                    key={item.key}
                    to={item.to}
                    className="flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:bg-brand-50"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block truncate text-xs text-muted">{item.description}</span>
                    </span>
                    {item.ready ? (
                      <ArrowUpRight className="h-4 w-4 text-muted" />
                    ) : (
                      <Badge tone="amber">In Progress</Badge>
                    )}
                  </Link>
                ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <h2 className="font-bold">Users by role</h2>
            <div className="mt-4 space-y-3">
              {roleBreakdown.map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{row.label}</span>
                    <span className="font-semibold">{row.count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className={cn("h-full rounded-full", row.color)}
                      style={{
                        width: `${allUsers.length ? Math.max(2, (row.count / allUsers.length) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  delta,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  delta?: number;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-line">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
      {delta !== undefined ? (
        <p
          className={cn(
            "mt-1 text-xs font-semibold",
            delta >= 0 ? "text-emerald-600" : "text-rose-500",
          )}
        >
          {delta >= 0 ? "+" : ""}
          {delta}% vs previous 30 days
        </p>
      ) : (
        <p className="mt-1 text-xs font-semibold text-muted">{hint}</p>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

interface ChartSeries {
  name: string;
  color: string;
  points: SeriesPoint[];
}

function LineChart({ series }: { series: ChartSeries[] }) {
  const W = 600;
  const H = 220;
  const pad = { l: 30, r: 12, t: 12, b: 28 };
  const count = series[0]?.points.length ?? 0;
  const max = Math.max(4, ...series.flatMap((s) => s.points.map((p) => p.value)));
  const x = (i: number) =>
    pad.l + (count <= 1 ? 0 : (i / (count - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const step = Math.ceil(count / 6);

  const line = (points: SeriesPoint[]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");

  const first = series[0];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-3 w-full"
      role="img"
      aria-label={series.map((s) => s.name).join(" and ") + " over time"}
    >
      <defs>
        <linearGradient id="so-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6d4dff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#6d4dff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((tick, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={y(tick)} y2={y(tick)} stroke="#ece8f8" />
          <text x={pad.l - 6} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="#6b6785">
            {tick}
          </text>
        </g>
      ))}
      {first ? (
        <path
          d={`${line(first.points)} L${x(count - 1)},${y(0)} L${x(0)},${y(0)} Z`}
          fill="url(#so-fill)"
        />
      ) : null}
      {series.map((s) => (
        <g key={s.name}>
          <path d={line(s.points)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />
          {s.points.map((p, i) => (
            <circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill="#fff" stroke={s.color} strokeWidth="2">
              <title>{`${s.name}: ${p.value} (${p.label})`}</title>
            </circle>
          ))}
        </g>
      ))}
      {first?.points.map((p, i) =>
        i % step === 0 ? (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#6b6785">
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
