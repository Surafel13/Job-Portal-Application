import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Briefcase,
  Code2,
  HeartPulse,
  LineChart,
  Palette,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { catalogService, jobsService } from "../services/jobs.service";
import { queryKeys } from "../lib/queryKeys";
import { JobCard } from "../components/jobs/JobCard";
import { Spinner } from "../components/ui/States";

const chips = [
  { label: "Software", icon: Code2, tone: "bg-violet-100 text-violet-700" },
  { label: "Design", icon: Palette, tone: "bg-pink-100 text-pink-700" },
  { label: "Marketing", icon: Sparkles, tone: "bg-amber-100 text-amber-700" },
  { label: "Finance", icon: LineChart, tone: "bg-sky-100 text-sky-700" },
  { label: "Healthcare", icon: HeartPulse, tone: "bg-emerald-100 text-emerald-700" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const categories = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => catalogService.categories().then((r) => r.data ?? []),
  });

  const jobs = useQuery({
    queryKey: queryKeys.jobs({ page: 1, limit: 4 }),
    queryFn: () => jobsService.search({ page: 1, limit: 4 }),
  });

  return (
    <div>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:px-8 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered matching
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-ink md:text-6xl">
            Build Your Career with AI-Powered Job Matching
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            Discover the right jobs, get personalized recommendations, and grow your career with JobVerse.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/jobs">
              <Button size="lg">Find Jobs</Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Learn More
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-8 text-sm">
            <Stat value="100K+" label="Jobs Posted" />
            <Stat value="50K+" label="Hired" />
            <Stat value="5K+" label="Companies" />
          </div>
          <p className="mt-6 text-xs uppercase tracking-wider text-muted">
            Trusted by brands everywhere around the world
          </p>
          <div className="mt-3 flex flex-wrap gap-6 text-sm font-semibold text-slate-400">
            <span>Google</span>
            <span>Microsoft</span>
            <span>Meta</span>
            <span>Amazon</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="hero-blob absolute -inset-6 rounded-[3rem] blur-2xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-3 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80"
              alt="Professional using JobVerse"
              className="h-[420px] w-full rounded-[2rem] object-cover"
            />
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 lg:px-8">
        <div className="rounded-[2.2rem] bg-white p-4 shadow-xl shadow-brand-100/70 ring-1 ring-line">
          <p className="px-2 pb-3 text-center text-lg font-bold">Find Your Next Opportunity</p>
          <form
            className="grid gap-3 md:grid-cols-[1fr_220px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const params = new URLSearchParams();
              if (keyword) params.set("keyword", keyword);
              if (categoryId) params.set("categoryId", categoryId);
              void navigate(`/jobs?${params.toString()}`);
            }}
          >
            <div className="flex items-center gap-2 rounded-2xl bg-surface px-4">
              <Search className="h-4 w-4 text-muted" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Job title, skills, or company"
                className="h-12 w-full bg-transparent outline-none"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-12 rounded-2xl bg-surface px-4 outline-none"
            >
              <option value="">All Categories</option>
              {(categories.data ?? []).map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button type="submit" className="h-12 rounded-2xl px-8">
              Search
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 px-1">
            {chips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => void navigate(`/jobs?keyword=${chip.label}`)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${chip.tone}`}
              >
                <chip.icon className="h-4 w-4" />
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">Latest opportunities</h2>
            <p className="text-sm text-muted">Fresh published roles from the JobVerse network.</p>
          </div>
          <Link to="/jobs" className="text-sm font-semibold text-brand-700">
            View all
          </Link>
        </div>
        {jobs.isLoading ? <Spinner /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          {(jobs.data?.jobs ?? []).map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
        {!jobs.isLoading && (jobs.data?.jobs.length ?? 0) === 0 ? (
          <p className="rounded-3xl bg-white p-8 text-center text-muted">
            No published jobs yet. Check back soon.
          </p>
        ) : null}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Highlight
            icon={Briefcase}
            title="Smart matching"
            text="Recommendations use your worker profile, skills, and preferred roles."
          />
          <Highlight
            icon={Sparkles}
            title="Semantic search"
            text="Describe the role you want and let the search engine find similar jobs."
          />
          <Highlight
            icon={HeartPulse}
            title="Track every step"
            text="Applications, interviews, and saved jobs live in one worker dashboard."
          />
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-extrabold text-ink">{value}</p>
      <p className="text-muted">{label}</p>
    </div>
  );
}

function Highlight({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Briefcase;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line">
      <Icon className="h-6 w-6 text-brand-600" />
      <p className="mt-3 font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  );
}
