import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { JobCard } from "../components/jobs/JobCard";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, Spinner } from "../components/ui/States";
import {
  catalogService,
  jobsService,
  savedJobsService,
} from "../services/jobs.service";
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

type JobsTab = "all" | "recommended" | "remote" | "urgent";

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
  const tab = (params.get("tab") as JobsTab) || "all";

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const setTab = (nextTab: JobsTab) => {
    const next = new URLSearchParams(params);
    if (nextTab === "all") next.delete("tab");
    else next.set("tab", nextTab);
    next.delete("page");
    setParams(next);
  };

  const clearAll = () => setParams({});

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
    mutationFn: async ({
      jobId,
      saved: isSaved,
    }: {
      jobId: string;
      saved: boolean;
    }) => {
      if (isSaved) await savedJobsService.remove(jobId);
      else await savedJobsService.save(jobId);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs }),
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
      if (experienceLevel && job.experienceLevel !== experienceLevel)
        return false;

      if (categoryId) {
        const id =
          typeof job.categoryId === "string"
            ? job.categoryId
            : job.categoryId._id;
        if (id !== categoryId) return false;
      }

      if (workMode === "remote" && !isRemote(job)) return false;
      if (workMode === "onsite" && isRemote(job)) return false;

      if (
        location &&
        !job.location.toLowerCase().includes(location.toLowerCase())
      ) {
        return false;
      }

      if (
        keyword &&
        !semantic &&
        !`${job.title} ${job.description}`
          .toLowerCase()
          .includes(keyword.toLowerCase())
      ) {
        return false;
      }

      // Tab filters (client-side)
      if (tab === "recommended" && !recommendedIds.has(job._id)) return false;
      if (tab === "remote" && !isRemote(job)) return false;
      if (tab === "urgent") {
        const urgent =
          (job as Job & { isUrgent?: boolean; urgent?: boolean }).isUrgent ||
          (job as Job & { isUrgent?: boolean; urgent?: boolean }).urgent;
        if (!urgent) return false;
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
    tab,
    recommendedIds,
  ]);

  const total = Number(
    search.data?.meta && "total" in search.data.meta
      ? search.data.meta.total
      : jobs.length,
  );

  const limit = 20;
  const totalPages =
    search.data?.meta && "total" in search.data.meta
      ? Math.max(1, Math.ceil(Number(search.data.meta.total) / limit))
      : undefined;

  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (keyword) chips.push({ key: "keyword", label: `“${keyword}”` });
    if (location) chips.push({ key: "location", label: location });
    if (employmentType)
      chips.push({
        key: "employmentType",
        label: employmentType.replace("-", " "),
      });
    if (experienceLevel)
      chips.push({ key: "experienceLevel", label: experienceLevel });
    if (workMode) chips.push({ key: "workMode", label: workMode });
    if (categoryId) {
      const name =
        categories.data?.find((c) => c._id === categoryId)?.name ?? "Category";
      chips.push({ key: "categoryId", label: name });
    }
    if (semantic) chips.push({ key: "semantic", label: "AI search" });
    return chips;
  }, [
    keyword,
    location,
    employmentType,
    experienceLevel,
    workMode,
    categoryId,
    semantic,
    categories.data,
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Hero */}
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-brand-600 via-indigo-500 to-violet-500 p-6 text-white shadow-lg shadow-brand-600/20 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">Job search</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
              Discover {total.toLocaleString()} jobs
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/80 md:text-base">
              Find roles that match your skills, location, and career goals.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2.5 self-start rounded-full bg-white/15 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/20 md:self-auto">
            <input
              type="checkbox"
              checked={semantic}
              onChange={(e) =>
                setFilter("semantic", e.target.checked ? "1" : "")
              }
              className="h-4 w-4 rounded border-white/40"
            />
            AI semantic search
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Compact Filters Sidebar */}
        <aside className="h-fit rounded-3xl bg-white p-4 shadow-sm ring-1 ring-line lg:sticky lg:top-6 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="font-bold text-sm">Filters</h2>
            <button
              type="button"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              onClick={clearAll}
            >
              Clear all
            </button>
          </div>

          <FilterGroup label="Keyword">
            <input
              value={keyword}
              onChange={(e) => setFilter("keyword", e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-xs outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              placeholder="Title or skill"
            />
          </FilterGroup>

          <FilterGroup label="Job type">
            <div className="space-y-1.5">
              {types.map((type) => (
                <Check
                  key={type}
                  label={type}
                  checked={employmentType === type}
                  onChange={() =>
                    setFilter(
                      "employmentType",
                      employmentType === type ? "" : type,
                    )
                  }
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Experience level">
            <div className="space-y-1.5">
              {levels.map((level) => (
                <Check
                  key={level}
                  label={level}
                  checked={experienceLevel === level}
                  onChange={() =>
                    setFilter(
                      "experienceLevel",
                      experienceLevel === level ? "" : level,
                    )
                  }
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Location">
            <input
              value={location}
              onChange={(e) => setFilter("location", e.target.value)}
              className="mb-2 w-full rounded-xl border border-line px-3 py-2 text-xs outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              placeholder="City or remote"
            />
            <div className="space-y-1.5">
              <Check
                label="Remote"
                checked={workMode === "remote"}
                onChange={() =>
                  setFilter("workMode", workMode === "remote" ? "" : "remote")
                }
              />
              <Check
                label="On-site"
                checked={workMode === "onsite"}
                onChange={() =>
                  setFilter("workMode", workMode === "onsite" ? "" : "onsite")
                }
              />
            </div>
          </FilterGroup>

          <FilterGroup label="Category">
            <select
              value={categoryId}
              onChange={(e) => setFilter("categoryId", e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-xs outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All categories</option>
              {(categories.data ?? []).map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FilterGroup>
        </aside>

        {/* Results */}
        <section className="min-w-0">
          <JobsTabs
            active={tab}
            onChange={setTab}
            showRecommended={user?.role === "worker"}
          />

          {/* Active filter chips */}
          {activeFilters.length > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeFilters.map((chip) => (
                <FilterChip
                  key={chip.key}
                  label={chip.label}
                  onRemove={() => setFilter(chip.key, "")}
                />
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Clear all
              </button>
            </div>
          ) : null}

          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {search.isLoading
                ? "Searching…"
                : `${jobs.length.toLocaleString()} result${jobs.length === 1 ? "" : "s"}`}
              {page > 1 ? ` · Page ${page}` : null}
            </p>
          </div>

          {search.isLoading ? <Spinner label="Finding jobs" /> : null}

          {search.isError ? (
            <ErrorState
              message={(search.error as Error).message}
              onRetry={() => void search.refetch()}
            />
          ) : null}

          {!search.isLoading && !search.isError ? (
            <>
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

              {jobs.length === 0 ? (
                <EmptyState
                  title="No jobs match these filters"
                  description="Try clearing filters or turning on AI semantic search."
                />
              ) : null}

              {jobs.length > 0 ? (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    variant="secondary"
                    disabled={page <= 1}
                    onClick={() => setFilter("page", String(page - 1))}
                  >
                    Previous
                  </Button>
                  {totalPages ? (
                    <span className="text-sm text-muted">
                      Page {page} of {totalPages}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">Page {page}</span>
                  )}
                  <Button
                    variant="secondary"
                    disabled={
                      totalPages ? page >= totalPages : jobs.length < limit
                    }
                    onClick={() => setFilter("page", String(page + 1))}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Subcomponents
───────────────────────────────────────────── */

function JobsTabs({
  active,
  onChange,
  showRecommended,
}: {
  active: JobsTab;
  onChange: (tab: JobsTab) => void;
  showRecommended: boolean;
}) {
  const tabs: Array<{ id: JobsTab; label: string }> = [
    { id: "all", label: "All jobs" },
    ...(showRecommended
      ? [{ id: "recommended" as const, label: "Recommended" }]
      : []),
    { id: "remote", label: "Remote" },
    { id: "urgent", label: "Urgent" },
  ];

  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25"
                : "bg-white text-ink ring-1 ring-line hover:bg-surface"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold capitalize text-brand-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-brand-100"
        aria-label={`Remove ${label} filter`}
      >
        <span className="block leading-none">×</span>
      </button>
    </span>
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
    <div className="mb-5 last:mb-0">
      <p className="mb-2.5 text-sm font-bold text-ink">{label}</p>
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
    <label className="flex cursor-pointer items-center gap-2.5 text-sm capitalize text-muted transition hover:text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
      />
      {label.replace("-", " ")}
    </label>
  );
}
