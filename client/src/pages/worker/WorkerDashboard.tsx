import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileCheck2, Gift, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { JobCard } from "../../components/jobs/JobCard";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/States";
import { queryKeys } from "../../lib/queryKeys";
import { applicationService, jobsService } from "../../services/jobs.service";
import { workerService } from "../../services/platform.service";
import { useAuthStore } from "../../store/authStore";

export function WorkerDashboard() {
  const user = useAuthStore((s) => s.user);

  const worker = useQuery({
    queryKey: queryKeys.worker,
    queryFn: () => workerService.me().then((r) => r.data),
  });

  const applications = useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => applicationService.my().then((r) => r.data ?? []),
  });

  const recommendations = useQuery({
    queryKey: queryKeys.recommendations,
    queryFn: () => jobsService.recommendations().then((r) => r.data),
    retry: false,
  });

  const jobs = useQuery({
    queryKey: queryKeys.jobs({ recommended: true }),
    queryFn: () => jobsService.search({ page: 1, limit: 8 }),
  });

  const apps = applications.data ?? [];
  const interviews = apps.filter((item) => item.status === "interview").length;
  const offers = apps.filter((item) => item.status === "accepted").length;
  const recIds = new Set(recommendations.data?.recommendedJobs.map((j) => j.jobId) ?? []);
  const recJobs = (jobs.data?.jobs ?? []).filter((job) => recIds.has(job._id)).slice(0, 4);
  const displayJobs = recJobs.length ? recJobs : (jobs.data?.jobs ?? []).slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Welcome back, {user?.fullName?.split(" ")[0]}!</h1>
        <p className="text-muted">Here’s what’s happening with your job search.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileCheck2} label="Applications" value={apps.length} />
        <StatCard icon={Briefcase} label="Saved Jobs" value="—" />
        <StatCard icon={Sparkles} label="Interviews" value={interviews} />
        <StatCard icon={Gift} label="Offers" value={offers} />
      </div>
      <div className="overflow-hidden rounded-[1.8rem] bg-gradient-to-r from-indigo-500 via-brand-500 to-violet-500 p-6 text-white md:flex md:items-center md:justify-between">
        <div>
          <p className="text-lg font-bold">
            Your profile is {worker.data?.profileCompletion ?? 0}% complete
          </p>
          <p className="text-white/80">
            Complete your profile to get better job recommendations.
          </p>
        </div>
        <Link to="/worker/profile" className="mt-4 inline-block md:mt-0">
          <Button variant="secondary">Complete Profile</Button>
        </Link>
      </div>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recommended Jobs</h2>
          <Link to="/jobs" className="text-sm font-semibold text-brand-700">
            View all
          </Link>
        </div>
        {jobs.isLoading ? <Spinner /> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {displayJobs.map((job) => (
            <JobCard key={job._id} job={job} recommended={recIds.has(job._id)} />
          ))}
        </div>
        {recommendations.isError ? (
          <p className="mt-3 text-sm text-muted">
            {(recommendations.error as Error).message}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-line">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <Icon className="h-5 w-5 text-brand-600" />
      </div>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
