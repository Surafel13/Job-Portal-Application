import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { motion } from "motion/react";
import { JobCard } from "../components/jobs/JobCard";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, Spinner } from "../components/ui/States";
import { catalogService, jobsService, savedJobsService } from "../services/jobs.service";
import { queryKeys } from "../lib/queryKeys";
import { useAuthStore } from "../store/authStore";
import type { EmploymentType, ExperienceLevel, Job } from "../types/models";
import { isRemote } from "../lib/job";

const types: EmploymentType[] = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "freelance",
];

const levels: ExperienceLevel[] = ["entry", "junior", "mid", "senior", "lead"];

export function JobsPage() {
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const keyword = params.get("keyword") ?? "";
  const location = params.get("location") ?? "";
  const employmentType = params.get("employmentType") ?? "";
  const categoryId = params.get("categoryId") ?? "";
  const experienceLevel = params.get("experienceLevel") ?? "";
  const workMode = params.get("workMode") ?? "";
  const page = Number(params.get("page") ?? 1);
  const semantic = params.get("semantic") === "1";

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const categories = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => catalogService.categories().then((r) => r.data ?? []),
  });

  const search = useQuery({
    queryKey: queryKeys.jobs({
      keyword,
      location,
      employmentType,
      categoryId,
      page,
      semantic,
    }),
    queryFn: async () => {
      if (semantic && keyword.length >= 2) {
        const res = await jobsService.semanticSearch({
          q: keyword,
          location: location || undefined,
          page,
          limit: 20,
        });
        return { jobs: res.data ?? [], meta: res.meta ?? {} };
      }
      return jobsService.search({
        keyword: keyword || undefined,
        location: location || undefined,
        categoryId: categoryId || undefined,
        page,
        limit: 20,
      });
    },
  });

  const recommendations = useQuery({
    queryKey: queryKeys.recommendations,
    enabled: user?.role === "worker",
    queryFn: () => jobsService.recommendations().then((r) => r.data),
  });

  const saved = useQuery({
    queryKey: queryKeys.savedJobs,
    enabled: user?.role === "worker",
    queryFn: () => savedJobsService.list().then((r) => r.data ?? []),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ jobId, saved: isSaved }: { jobId: string; saved: boolean }) => {
      if (isSaved) await savedJobsService.remove(jobId);
      else await savedJobsService.save(jobId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs }),
  });

  const recommendedIds = new Set(
    recommendations.data?.recommendedJobs.map((item) => item.jobId) ?? [],
  );
  const savedIds = new Set(
    (saved.data ?? []).map((item) =>
      typeof item.jobId === "string" ? item.jobId : item.jobId._id,
    ),
  );

  const jobs = useMemo(() => {
    return (search.data?.jobs ?? []).filter((job) => {
      if (employmentType && job.employmentType !== employmentType) return false;
      if (experienceLevel && job.experienceLevel !== experienceLevel) return false;
      if (categoryId) {
        const id = typeof job.categoryId === "string" ? job.categoryId : job.categoryId._id;
        if (id !== categoryId) return false;
      }
      if (workMode === "remote" && !isRemote(job)) return false;
      if (workMode === "onsite" && isRemote(job)) return false;
      if (location && !job.location.toLowerCase().includes(location.toLowerCase())) {
        return false;
      }
      if (
        keyword &&
        !semantic &&
        !`${job.title} ${job.description}`.toLowerCase().includes(keyword.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [
    search.data?.jobs,
    employmentType,
    experienceLevel,
    categoryId,
    workMode,
    location,
    keyword,
    semantic,
  ]);

  const total = Number(search.data?.meta.total ?? jobs.length);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-brand-600 via-indigo-500 to-violet-500 p-6 text-white md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Discover {total.toLocaleString()} Jobs</h1>
            <p className="text-white/80">Find the best opportunities for you.</p>
          </div>
          <label className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm">
            <input
              type="checkbox"
              checked={semantic}
              onChange={(e) => setFilter("semantic", e.target.checked ? "1" : "")}
            />
            AI semantic search
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-3xl bg-white p-5 shadow-sm ring-1 ring-line">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Filters</h2>
            <button className="text-sm text-brand-600" onClick={() => setParams({})}>
              Clear all
            </button>
          </div>
          <FilterGroup label="Keyword">
            <input
              value={keyword}
              onChange={(e) => setFilter("keyword", e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
              placeholder="Title or skill"
            />
          </FilterGroup>
          <FilterGroup label="Job Type">
            {types.map((type) => (
              <Check
                key={type}
                label={type}
                checked={employmentType === type}
                onChange={() =>
                  setFilter("employmentType", employmentType === type ? "" : type)
                }
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Experience Level">
            {levels.map((level) => (
              <Check
                key={level}
                label={level}
                checked={experienceLevel === level}
                onChange={() =>
                  setFilter("experienceLevel", experienceLevel === level ? "" : level)
                }
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Location">
            <input
              value={location}
              onChange={(e) => setFilter("location", e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
              placeholder="City or remote"
            />
            <Check
              label="Remote"
              checked={workMode === "remote"}
              onChange={() => setFilter("workMode", workMode === "remote" ? "" : "remote")}
            />
            <Check
              label="On-site"
              checked={workMode === "onsite"}
              onChange={() => setFilter("workMode", workMode === "onsite" ? "" : "onsite")}
            />
          </FilterGroup>
          <FilterGroup label="Category">
            <select
              value={categoryId}
              onChange={(e) => setFilter("categoryId", e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {(categories.data ?? []).map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FilterGroup>
        </aside>

        <section>
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {["All Jobs", "Recommended", "Remote", "Urgent"].map((tab) => (
              <button
                key={tab}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-line"
              >
                {tab}
              </button>
            ))}
          </div>
          {search.isLoading ? <Spinner label="Finding jobs" /> : null}
          {search.isError ? (
            <ErrorState
              message={(search.error as Error).message}
              onRetry={() => void search.refetch()}
            />
          ) : null}
          <div className="grid gap-4">
            {jobs.map((job: Job) => (
              <JobCard
                key={job._id}
                job={job}
                recommended={recommendedIds.has(job._id)}
                saved={savedIds.has(job._id)}
                onSave={
                  user?.role === "worker"
                    ? () =>
                        saveMutation.mutate({
                          jobId: job._id,
                          saved: savedIds.has(job._id),
                        })
                    : undefined
                }
              />
            ))}
          </div>
          {!search.isLoading && jobs.length === 0 ? (
            <EmptyState
              title="No jobs match these filters"
              description="Try clearing filters or switching on semantic search."
            />
          ) : null}
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setFilter("page", String(page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setFilter("page", String(page + 1))}
            >
              Next
            </Button>
          </div>
        </section>
      </div>
      <motion.div className="hidden" />
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-sm font-bold">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm capitalize text-muted">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label.replace("-", " ")}
    </label>
  );
}
