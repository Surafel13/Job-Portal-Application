import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDownRight,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Code2,
  HeartPulse,
  LineChart,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { catalogService, jobsService } from "../services/jobs.service";
import { queryKeys } from "../lib/queryKeys";
import { JobCard } from "../components/jobs/JobCard";
import { Spinner } from "../components/ui/States";

const chips = [
  {
    label: "Software",
    icon: Code2,
    tone: "bg-violet-100 text-violet-700",
    hover: "hover:bg-violet-600",
  },
  {
    label: "Design",
    icon: Palette,
    tone: "bg-pink-100 text-pink-700",
    hover: "hover:bg-pink-600",
  },
  {
    label: "Marketing",
    icon: Sparkles,
    tone: "bg-amber-100 text-amber-700",
    hover: "hover:bg-amber-500",
  },
  {
    label: "Finance",
    icon: LineChart,
    tone: "bg-sky-100 text-sky-700",
    hover: "hover:bg-sky-600",
  },
  {
    label: "Healthcare",
    icon: HeartPulse,
    tone: "bg-emerald-100 text-emerald-700",
    hover: "hover:bg-emerald-600",
  },
];

const companies = ["Google", "Microsoft", "Meta", "Amazon", "Netflix"];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function LandingPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

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

  const reveal = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.12 },
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
      };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (keyword.trim()) {
      params.set("keyword", keyword.trim());
    }

    if (categoryId) {
      params.set("categoryId", categoryId);
    }

    void navigate(`/jobs${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="overflow-hidden bg-[#fafaff] text-ink">
      {/* ─── HERO ─── */}
      <section className="relative isolate">
        {/* Soft ambient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 top-0 h-[28rem] w-[28rem] rounded-full bg-violet-300/25 blur-3xl" />
          <div className="absolute -right-36 top-16 h-[32rem] w-[32rem] rounded-full bg-blue-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pink-200/25 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:pb-28 lg:pt-24">
          {/* Left content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10"
          >
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-violet-200/70 bg-white/70 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm backdrop-blur-xl">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-40" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-600" />
                </span>
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered career discovery
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-8 max-w-2xl text-[2.6rem] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl xl:text-[4.25rem]"
            >
              Your next career move starts{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  here.
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.75,
                    delay: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute -bottom-1 left-0 h-1.5 w-full origin-left rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-lg text-[1.05rem] leading-8 text-slate-600 sm:text-lg"
            >
              Discover opportunities that match your skills and ambitions. Let
              AI help you find the right job, connect with employers, and build
              a career you love.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-9 flex flex-wrap gap-3.5"
            >
              <Link to="/jobs">
                <Button
                  size="lg"
                  className="group h-12 rounded-2xl px-7 shadow-lg shadow-violet-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/30"
                >
                  Explore Jobs
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link to="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 rounded-2xl border border-slate-200/80 bg-white/80 px-7 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:bg-violet-50"
                >
                  Get Started
                  <ArrowDownRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Trust row */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Personalized recommendations
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-600" />
                Secure applications
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="mt-11 grid max-w-md grid-cols-3 gap-6 border-t border-slate-200/70 pt-8"
            >
              <Stat value="AI" label="Smart matching" />
              <Stat value="24/7" label="Job discovery" />
              <Stat value="1 place" label="Career growth" />
            </motion.div>
          </motion.div>

          {/* Right visual */}
          <motion.div
            initial={
              shouldReduceMotion ? false : { opacity: 0, scale: 0.94, x: 24 }
            }
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-xl lg:ml-auto"
          >
            <div className="absolute -inset-6 rounded-[3.5rem] bg-gradient-to-br from-violet-300/35 via-blue-200/25 to-pink-200/35 blur-2xl" />

            <motion.div
              animate={
                shouldReduceMotion ? undefined : { y: [0, -10, 0] }
              }
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-white p-2.5 shadow-2xl shadow-violet-900/10 sm:rounded-[2.5rem] sm:p-3">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=85"
                  alt="Professional exploring career opportunities"
                  fetchPriority="high"
                  className="h-[360px] w-full rounded-[1.5rem] object-cover object-center sm:h-[460px] sm:rounded-[2rem]"
                />

                <div className="absolute inset-x-2.5 bottom-2.5 rounded-b-[1.5rem] bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent p-5 pt-20 text-white sm:inset-x-3 sm:bottom-3 sm:rounded-b-[2rem] sm:p-7 sm:pt-24">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-white/75 sm:text-sm">
                        Your future is waiting
                      </p>
                      <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                        Find work that matters.
                      </h2>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-xl">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating AI card */}
            <motion.div
              initial={
                shouldReduceMotion ? false : { opacity: 0, x: 18, y: 12 }
              }
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="absolute -left-2 top-7 max-w-[210px] rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-xl shadow-violet-900/10 backdrop-blur-xl sm:-left-6 sm:top-10 sm:p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">AI career assistant</p>
                  <p className="text-sm font-bold text-slate-900">
                    Smart job matches
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Personalized discovery
              </div>
            </motion.div>

            {/* Floating growth card */}
            <motion.div
              initial={
                shouldReduceMotion ? false : { opacity: 0, x: -14, y: 14 }
              }
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="absolute -right-1 bottom-11 max-w-[210px] rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-xl shadow-violet-900/10 backdrop-blur-xl sm:-right-5 sm:bottom-14 sm:p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Career growth</p>
                  <p className="text-sm font-bold text-slate-900">
                    Your next opportunity
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Decorative orb */}
            <motion.div
              animate={
                shouldReduceMotion
                  ? undefined
                  : { y: [0, -14, 0], rotate: [0, 10, 0] }
              }
              transition={{
                duration: 6.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -right-2 top-[32%] hidden h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-xl shadow-violet-500/35 sm:flex"
            >
              <Zap className="h-6 w-6" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUSTED COMPANIES ─── */}
      <section className="border-y border-slate-200/60 bg-white/60 py-8 backdrop-blur-sm">
        <motion.div
          {...reveal}
          className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Discover opportunities across the industry
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 sm:gap-x-16">
            {companies.map((company, index) => (
              <motion.span
                key={company}
                initial={
                  shouldReduceMotion ? false : { opacity: 0, y: 8 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: shouldReduceMotion ? 0 : index * 0.07,
                }}
                className="text-base font-extrabold tracking-tight text-slate-400 transition-colors duration-300 hover:text-violet-600 sm:text-lg"
              >
                {company}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── SEARCH ─── */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <motion.div {...reveal} className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-6 shadow-xl shadow-violet-900/5 ring-1 ring-slate-200/60 sm:rounded-[2.5rem] sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-violet-200/35 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-blue-200/25 blur-3xl" />

            <div className="relative">
              <div className="mb-8 text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3.5 py-1.5 text-xs font-bold text-violet-700">
                  <Search className="h-3.5 w-3.5" />
                  Your next opportunity
                </span>

                <h2 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Find your next opportunity
                </h2>

                <p className="mx-auto mt-2.5 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                  Search thousands of roles and find one that fits your
                  ambitions.
                </p>
              </div>

              <form
                onSubmit={handleSearch}
                className="grid gap-3 rounded-2xl bg-slate-50/80 p-2.5 ring-1 ring-slate-200/70 md:grid-cols-[1fr_200px_auto]"
              >
                <label className="flex min-w-0 items-center gap-3 rounded-xl bg-white px-4 ring-1 ring-transparent transition-all duration-300 focus-within:ring-violet-300">
                  <Search className="h-5 w-5 shrink-0 text-violet-500" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Job title, skills, or company"
                    aria-label="Search by job title, skills, or company"
                    className="h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </label>

                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  aria-label="Select job category"
                  className="h-12 rounded-xl bg-white px-4 text-sm text-slate-700 outline-none ring-1 ring-transparent transition-all duration-300 focus:ring-violet-300"
                >
                  <option value="">All Categories</option>
                  {(categories.data ?? []).map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <Button
                  type="submit"
                  className="h-12 rounded-xl px-7 shadow-md shadow-violet-500/20 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Search Jobs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              {/* Category chips */}
              <div className="mt-7">
                <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Explore popular categories
                </p>

                <div className="flex flex-wrap gap-2.5">
                  {chips.map((chip, index) => {
                    const Icon = chip.icon;

                    return (
                      <motion.button
                        key={chip.label}
                        type="button"
                        initial={
                          shouldReduceMotion ? false : { opacity: 0, y: 8 }
                        }
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.35,
                          delay: shouldReduceMotion ? 0 : index * 0.05,
                        }}
                        whileHover={
                          shouldReduceMotion ? undefined : { y: -3 }
                        }
                        whileTap={
                          shouldReduceMotion ? undefined : { scale: 0.96 }
                        }
                        onClick={() =>
                          void navigate(
                            `/jobs?${new URLSearchParams({
                              keyword: chip.label,
                            }).toString()}`,
                          )
                        }
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-300 hover:text-white ${chip.tone} ${chip.hover}`}
                      >
                        <Icon className="h-4 w-4" />
                        {chip.label}
                        <ArrowRight className="h-3.5 w-3.5 opacity-50" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── LATEST JOBS + FEATURES + CTA ─── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <motion.div
          {...reveal}
          className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-violet-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Fresh opportunities
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Latest opportunities
            </h2>

            <p className="mt-2.5 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Discover published roles from employers looking for their next
              great team members.
            </p>
          </div>

          <Link
            to="/jobs"
            className="group inline-flex items-center gap-2 self-start text-sm font-bold text-violet-700 transition-colors hover:text-violet-900 sm:self-auto"
          >
            Explore all jobs
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {jobs.isLoading ? (
          <div className="flex min-h-52 items-center justify-center rounded-3xl bg-white ring-1 ring-slate-200/60">
            <Spinner />
          </div>
        ) : null}

        {jobs.isError ? (
          <div className="rounded-3xl border border-rose-100 bg-white p-10 text-center">
            <p className="font-semibold text-slate-800">
              We couldn&apos;t load the latest jobs.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Please try again in a moment or explore all job listings.
            </p>
            <Link
              to="/jobs"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-violet-700"
            >
              Browse jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}

        {!jobs.isLoading && !jobs.isError ? (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.08 }}
              className="grid gap-5 md:grid-cols-2"
            >
              {(jobs.data?.jobs ?? []).map((job) => (
                <motion.div
                  key={job._id}
                  variants={itemVariants}
                  whileHover={
                    shouldReduceMotion ? undefined : { y: -5 }
                  }
                  transition={{ duration: 0.25 }}
                  className="min-w-0"
                >
                  <JobCard job={job} />
                </motion.div>
              ))}
            </motion.div>

            {(jobs.data?.jobs.length ?? 0) === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Briefcase className="h-7 w-7" />
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  Your next opportunity is coming
                </h3>

                <p className="mx-auto mt-2.5 max-w-md text-sm leading-6 text-slate-500">
                  There are no published jobs available right now. Check back
                  soon to discover new opportunities.
                </p>

                <Link to="/jobs" className="mt-6 inline-block">
                  <Button variant="secondary">
                    Explore Jobs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : null}
          </>
        ) : null}

        {/* Features */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-20 grid gap-5 md:grid-cols-3"
        >
          <Highlight
            icon={Briefcase}
            number="01"
            title="Smart job matching"
            text="Discover opportunities aligned with your worker profile, skills, and career preferences."
          />
          <Highlight
            icon={Sparkles}
            number="02"
            title="AI-powered discovery"
            text="Find relevant opportunities with semantic search and personalized recommendations."
          />
          <Highlight
            icon={HeartPulse}
            number="03"
            title="Your career, organized"
            text="Manage saved jobs, applications, interviews, and career progress from one dashboard."
          />
        </motion.div>

        {/* Final CTA */}
        <motion.div
          {...reveal}
          className="relative mt-24 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-700 px-6 py-14 text-center text-white shadow-xl shadow-violet-900/25 sm:rounded-[2.5rem] sm:px-14 sm:py-18"
        >
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-36 -right-16 h-96 w-96 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />

          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : { rotate: [0, 10, -10, 0] }
            }
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl"
          >
            <Sparkles className="h-7 w-7" />
          </motion.div>

          <h2 className="relative mt-7 text-2xl font-extrabold tracking-tight sm:text-4xl">
            Your next chapter starts today.
          </h2>

          <p className="relative mx-auto mt-4 max-w-xl text-sm leading-7 text-violet-100 sm:text-base">
            Create your profile, discover opportunities that match your
            ambitions, and take the next step in your career with JobVerse.
          </p>

          <div className="relative mt-9 flex flex-wrap justify-center gap-3.5">
            <Link to="/jobs">
              <Button
                size="lg"
                className="h-12 rounded-xl bg-white px-7 font-bold text-violet-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-violet-50"
              >
                Find Your Next Job
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link to="/register">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 rounded-xl border border-white/25 bg-white/10 px-7 font-bold text-white backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                Join JobVerse
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="group">
      <p className="text-xl font-extrabold tracking-tight text-ink transition-colors duration-300 group-hover:text-violet-700 sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
        {label}
      </p>
    </div>
  );
}

function Highlight({
  icon: Icon,
  number,
  title,
  text,
}: {
  icon: typeof Briefcase;
  number: string;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        y: -6,
        transition: { duration: 0.25 },
      }}
      className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-violet-900/5 sm:p-7"
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-100/40 blur-2xl transition-colors duration-500 group-hover:bg-violet-200/60" />

      <div className="relative flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 transition-all duration-300 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white">
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-sm font-extrabold tracking-widest text-slate-300">
          {number}
        </span>
      </div>

      <h3 className="relative mt-5 text-lg font-bold tracking-tight text-slate-900">
        {title}
      </h3>

      <p className="relative mt-2.5 text-sm leading-7 text-slate-500">
        {text}
      </p>

      <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-violet-700">
        Discover more
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </motion.div>
  );
}
