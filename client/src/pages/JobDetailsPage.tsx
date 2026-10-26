import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  LoaderCircle,
  MapPin,
  MessageSquare,
  Share2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, Spinner } from "../components/ui/States";
import { Field, Select, Textarea } from "../components/ui/Input";
import { formatDate, formatSalary, titleCase } from "../lib/format";
import { categoryOf, companyOf, skillsOf } from "../lib/job";
import { queryKeys } from "../lib/queryKeys";
import {
  applicationService,
  jobsService,
  resumeService,
  savedJobsService,
} from "../services/jobs.service";
import { workerService } from "../services/platform.service";
import { useAuthStore } from "../store/authStore";
import type { Job } from "../types/models";

/* -------------------------------------------------------------------------- */
/*                         Constants                                          */
/* -------------------------------------------------------------------------- */

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const CONTENT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "responsibilities", label: "Responsibilities" },
  { id: "requirements", label: "Requirements" },
  { id: "benefits", label: "Benefits" },
] as const;

/* -------------------------------------------------------------------------- */
/*                         Page                                               */
/* -------------------------------------------------------------------------- */

export function JobDetailsPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [coverLetter, setCoverLetter] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isApplyPanelOpen, setIsApplyPanelOpen] = useState(false);

  const jobQuery = useQuery({
    queryKey: queryKeys.job(id),
    enabled: Boolean(id),
    queryFn: () => jobsService.getById(id).then((r) => r.data),
  });

  useEffect(() => {
    if (id) {
      void jobsService.incrementView(id).catch(() => undefined);
    }
  }, [id]);

  const resumes = useQuery({
    queryKey: queryKeys.resumes,
    enabled: user?.role === "worker",
    queryFn: () => resumeService.list().then((r) => r.data ?? []),
  });

  const worker = useQuery({
    queryKey: queryKeys.worker,
    enabled: user?.role === "worker",
    queryFn: () => workerService.me().then((r) => r.data),
  });

  const profileCompletion = worker.data?.profileCompletion ?? 0;
  const canApply = worker.isSuccess && profileCompletion >= 80;

  const apply = useMutation({
    mutationFn: async (input: {
      resumeId: string;
      resumeFile: File | null;
      coverLetter: string;
    }) => {
      if (!canApply && !input.resumeFile) {
        throw new Error(
          "Complete at least 80% of your profile before applying.",
        );
      }

      const uploadedResume = input.resumeFile
        ? await resumeService.upload(input.resumeFile)
        : undefined;
      const selectedResumeId = uploadedResume?.data?._id ?? input.resumeId;

      if (!selectedResumeId) {
        throw new Error("Select or upload a resume before applying.");
      }

      if (uploadedResume?.data?._id) {
        setResumeId(uploadedResume.data._id);
        setResumeFile(null);
        void queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
        void queryClient.invalidateQueries({ queryKey: queryKeys.worker });

        const updatedWorker = await workerService.me();
        queryClient.setQueryData(queryKeys.worker, updatedWorker.data);

        if ((updatedWorker.data.profileCompletion ?? 0) < 80) {
          throw new Error(
            "Your profile must be at least 80% complete before applying. Your resume was saved to your profile.",
          );
        }
      }

      return applicationService.create(id, {
        resumeId: selectedResumeId,
        coverLetter: input.coverLetter.trim() || undefined,
      });
    },
    onSuccess: () => {
      setResumeFile(null);
      setMessage("Application submitted successfully.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.worker });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  useEffect(() => {
    if (!isApplyPanelOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !apply.isPending) {
        setIsApplyPanelOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isApplyPanelOpen, apply.isPending]);

  const selectResume = (value: string) => {
    setResumeId(value);
    if (value) setResumeFile(null);
    setMessage("");
  };

  const selectResumeFile = (file?: File) => {
    setMessage("");
    if (!file) {
      setResumeFile(null);
      return;
    }

    const extension = file.name.toLowerCase().split(".").pop();
    if (
      !["pdf", "docx"].includes(extension ?? "") ||
      !ALLOWED_RESUME_TYPES.includes(file.type)
    ) {
      setResumeFile(null);
      setMessage("Choose a PDF or DOCX resume.");
      return;
    }

    if (file.size === 0 || file.size > MAX_RESUME_SIZE_BYTES) {
      setResumeFile(null);
      setMessage("Resume must be greater than 0 bytes and no larger than 5MB.");
      return;
    }

    setResumeFile(file);
    setResumeId("");
  };

  const submitApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!canApply) {
      setMessage(
        "Complete at least 80% of your worker profile before applying.",
      );
      return;
    }

    const selectedResumeExists = (resumes.data ?? []).some(
      (resume) => resume._id === resumeId,
    );
    if (!selectedResumeExists && !resumeFile) {
      setMessage("Select a resume or upload one to continue.");
      return;
    }

    if (coverLetter.trim().length > 5000) {
      setMessage("Cover letter cannot exceed 5000 characters.");
      return;
    }

    apply.mutate({ resumeId, resumeFile, coverLetter });
  };

  const save = useMutation({
    mutationFn: () => savedJobsService.save(id),
    onSuccess: () => setMessage("Job saved."),
    onError: (error: Error) => setMessage(error.message),
  });

  if (jobQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <Spinner label="Loading job details" />
      </div>
    );
  }

  if (jobQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          message={(jobQuery.error as Error).message}
          onRetry={() => void jobQuery.refetch()}
        />
      </div>
    );
  }

  const job = jobQuery.data;
  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Job not found"
          description="This listing may have been removed or is no longer available."
          action={
            <Link to="/jobs">
              <Button variant="secondary">Back to jobs</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const company = companyOf(job);
  const category = categoryOf(job);
  const skills = skillsOf(job);
  const isWorker = user?.role === "worker";
  const applicationSubmitted = message === "Application submitted successfully.";

  return (
    <div className="min-h-screen bg-surface/40 pb-16 pt-6">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <button
          type="button"
          onClick={() => void navigate(-1)}
          className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to jobs
        </button>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main Content Column */}
          <div className="min-w-0 space-y-6">
            <JobHeader
              job={job}
              companyName={company?.name}
              categoryName={category?.name}
              isWorker={isWorker}
              onSave={() => save.mutate()}
              onShare={() => void navigator.clipboard.writeText(window.location.href)}
            />

            <JobContent job={job} company={company} skills={skills} />
          </div>

          {/* Sticky Sidebar Column */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <JobMetaCard job={job} />

            <ApplyCard
              isWorker={isWorker}
              workerLoading={worker.isLoading}
              workerError={worker.isError}
              canApply={canApply}
              profileCompletion={profileCompletion}
              message={message}
              onRetryWorker={() => void worker.refetch()}
              onOpenApply={() => {
                setMessage("");
                setIsApplyPanelOpen(true);
              }}
            />
          </aside>
        </div>

        {/* Apply Drawer */}
        <AnimatePresence>
          {isApplyPanelOpen ? (
            <ApplyPanel
              job={job}
              companyName={company?.name}
              userName={user?.fullName}
              location={worker.data?.location ?? user?.location}
              profileCompletion={profileCompletion}
              canApply={canApply}
              coverLetter={coverLetter}
              resumeId={resumeId}
              resumeFile={resumeFile}
              resumes={resumes.data ?? []}
              resumesLoading={resumes.isLoading}
              resumesError={resumes.isError}
              message={message}
              applicationSubmitted={applicationSubmitted}
              isPending={apply.isPending}
              onClose={() => {
                if (!apply.isPending) setIsApplyPanelOpen(false);
              }}
              onCoverLetterChange={setCoverLetter}
              onSelectResume={selectResume}
              onSelectResumeFile={selectResumeFile}
              onClearResumeFile={() => setResumeFile(null)}
              onRetryResumes={() => void resumes.refetch()}
              onSubmit={submitApplication}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Header Component                                   */
/* -------------------------------------------------------------------------- */

function JobHeader({
  job,
  companyName,
  categoryName,
  isWorker,
  onSave,
  onShare,
}: {
  job: Job;
  companyName?: string;
  categoryName?: string;
  isWorker: boolean;
  onSave: () => void;
  onShare: () => void;
}) {
  const initial = (companyName ?? "J").slice(0, 1).toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl font-bold text-brand-700 shadow-inner sm:h-20 sm:w-20 sm:text-3xl">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {job.title}
            </h1>
            <p className="mt-1 text-base font-medium text-muted">{companyName ?? "Company"}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge>{titleCase(job.employmentType)}</Badge>
              {job.experienceLevel ? (
                <Badge tone="slate">{titleCase(job.experienceLevel)}</Badge>
              ) : null}
              {categoryName ? <Badge tone="blue">{categoryName}</Badge> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
          {isWorker ? (
            <Link to={`/messages?jobId=${job._id}`}>
              <Button variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
            </Link>
          ) : null}
          <Button variant="secondary" onClick={onSave} className="gap-2">
            <Bookmark className="h-4 w-4" />
            Save
          </Button>
          <Button variant="secondary" onClick={onShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Content sections                                   */
/* -------------------------------------------------------------------------- */

function JobContent({
  job,
  company,
  skills,
}: {
  job: Job;
  company: ReturnType<typeof companyOf>;
  skills: ReturnType<typeof skillsOf>;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
      <nav className="flex gap-8 overflow-x-auto border-b border-line text-sm font-semibold">
        {CONTENT_TABS.map((tab, index) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            className={
              index === 0
                ? "shrink-0 border-b-2 border-brand-600 pb-3 text-brand-700"
                : "shrink-0 pb-3 text-muted transition-colors hover:text-ink"
            }
          >
            {tab.label}
          </a>
        ))}
      </nav>

      <section id="overview" className="pt-8">
        <h2 className="text-xl font-bold tracking-tight text-ink">Job overview</h2>
        <p className="mt-4 whitespace-pre-wrap leading-relaxed text-muted">
          {job.description}
        </p>
      </section>

      <section id="responsibilities" className="pt-10">
        <h2 className="text-xl font-bold tracking-tight text-ink">Responsibilities</h2>
        {job.responsibilities?.length ? (
          <ul className="mt-4 list-disc space-y-3 pl-5 text-muted leading-relaxed">
            {job.responsibilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">No responsibilities listed.</p>
        )}
      </section>

      <section id="requirements" className="pt-10">
        <h2 className="text-xl font-bold tracking-tight text-ink">Requirements</h2>
        {job.requirements?.length ? (
          <ul className="mt-4 list-disc space-y-3 pl-5 text-muted leading-relaxed">
            {job.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">No requirements listed.</p>
        )}
        {skills.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill._id} tone="slate">
                {skill.name}
              </Badge>
            ))}
          </div>
        ) : null}
      </section>

      <section id="benefits" className="pt-10">
        <h2 className="text-xl font-bold tracking-tight text-ink">About the company</h2>
        <p className="mt-4 leading-relaxed text-muted">
          {company?.description ??
            "Join an innovative team building impactful modern solutions."}
        </p>
        {company?.website ? (
          <a
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
            href={company.website}
            target="_blank"
            rel="noreferrer"
          >
            Visit website →
          </a>
        ) : null}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Sidebar cards                                      */
/* -------------------------------------------------------------------------- */

function JobMetaCard({ job }: { job: Job }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line">
      <div className="border-b border-line pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Compensation</p>
        <p className="mt-1 text-2xl font-extrabold text-emerald-600">
          {formatSalary(job.salary)}
        </p>
      </div>
      <div className="mt-4 space-y-4 text-sm font-medium text-muted">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-ink">
            <MapPin className="h-4 w-4" />
          </div>
          <span>{job.location}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-ink">
            <Briefcase className="h-4 w-4" />
          </div>
          <span>{titleCase(job.employmentType)}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-ink">
            <Clock className="h-4 w-4" />
          </div>
          <span>Deadline {formatDate(job.deadline)}</span>
        </div>
      </div>
    </div>
  );
}

function ApplyCard({
  isWorker,
  workerLoading,
  workerError,
  canApply,
  profileCompletion,
  message,
  onRetryWorker,
  onOpenApply,
}: {
  isWorker: boolean;
  workerLoading: boolean;
  workerError: boolean;
  canApply: boolean;
  profileCompletion: number;
  message: string;
  onRetryWorker: () => void;
  onOpenApply: () => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line">
      <h3 className="text-lg font-bold text-ink">Ready to apply?</h3>

      {!isWorker ? (
        <p className="mt-2 text-sm text-muted">
          Please sign in with a worker account to submit your application.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {workerLoading ? (
            <p className="text-sm text-muted animate-pulse">Checking your profile eligibility…</p>
          ) : workerError ? (
            <p className="text-sm text-rose-600">
              Could not load your worker profile.{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={onRetryWorker}
              >
                Retry
              </button>
            </p>
          ) : !canApply ? (
            <div className="space-y-2">
              <p className="text-sm text-muted">
                Your profile is <span className="font-semibold text-ink">{profileCompletion}%</span> complete. You need at least 80% completion to apply.
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all"
                  style={{ width: `${Math.min(profileCompletion, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Profile verified for application
            </p>
          )}

          <Button
            className="w-full shadow-sm"
            onClick={onOpenApply}
            disabled={workerLoading || workerError}
          >
            Create application
          </Button>
        </div>
      )}

      {message && message !== "Application submitted successfully." ? (
        <p className="mt-4 text-sm font-medium text-brand-700">{message}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Apply panel (drawer)                               */
/* -------------------------------------------------------------------------- */

function ApplyPanel({
  job,
  companyName,
  userName,
  location,
  profileCompletion,
  canApply,
  coverLetter,
  resumeId,
  resumeFile,
  resumes,
  resumesLoading,
  resumesError,
  message,
  applicationSubmitted,
  isPending,
  onClose,
  onCoverLetterChange,
  onSelectResume,
  onSelectResumeFile,
  onClearResumeFile,
  onRetryResumes,
  onSubmit,
}: {
  job: Job;
  companyName?: string;
  userName?: string;
  location?: string;
  profileCompletion: number;
  canApply: boolean;
  coverLetter: string;
  resumeId: string;
  resumeFile: File | null;
  resumes: Array<{ _id: string; originalName: string }>;
  resumesLoading: boolean;
  resumesError: boolean;
  message: string;
  applicationSubmitted: boolean;
  isPending: boolean;
  onClose: () => void;
  onCoverLetterChange: (value: string) => void;
  onSelectResume: (value: string) => void;
  onSelectResumeFile: (file?: File) => void;
  onClearResumeFile: () => void;
  onRetryResumes: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const canSubmit =
    !isPending &&
    (canApply || Boolean(resumeFile)) &&
    !(resumesLoading && !resumeFile) &&
    !(resumesError && !resumeFile) &&
    (Boolean(resumeFile) ||
      resumes.some((resume) => resume._id === resumeId));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        aria-label="Close application panel"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-application-title"
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        <header className="flex items-start justify-between border-b border-line px-6 py-6 sm:px-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
              Job application
            </span>
            <h2
              id="create-application-title"
              className="mt-1 text-xl font-extrabold text-ink sm:text-2xl"
            >
              Submit Application
            </h2>
            <p className="mt-1 line-clamp-1 text-sm text-muted">
              {job.title} · {companyName ?? "Company"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close application panel"
            className="rounded-full p-2 text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-50"
            onClick={onClose}
            disabled={isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {applicationSubmitted ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-ink">
              Application submitted!
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted leading-relaxed">
              Your application for <span className="font-medium text-ink">{job.title}</span> has been successfully sent to the employer.
            </p>
            <Button className="mt-8 px-8" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
              {/* Applicant Summary Card */}
              <section className="rounded-2xl bg-surface p-5 ring-1 ring-line/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Applying as
                    </span>
                    <p className="mt-1 text-base font-bold text-ink">
                      {userName ?? "Worker"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {location ?? "Location not set"}
                    </p>
                  </div>
                  <Link
                    to="/worker/profile"
                    onClick={onClose}
                    className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                  >
                    Edit profile
                  </Link>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted">Profile completion</span>
                    <span className="font-bold text-ink">
                      {profileCompletion}%
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-white ring-1 ring-line/50"
                    role="progressbar"
                    aria-label="Worker profile completion"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={profileCompletion}
                  >
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all"
                      style={{
                        width: `${Math.min(profileCompletion, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </section>

              {/* Resume Select */}
              <div className="space-y-2">
                <Field label="Select resume">
                  <Select
                    value={resumeFile ? "" : resumeId}
                    onChange={(event) => onSelectResume(event.target.value)}
                    disabled={resumesLoading || resumesError}
                    required={!resumeFile}
                    aria-describedby="resume-help"
                  >
                    <option value="">Choose from your saved resumes</option>
                    {resumes.map((resume) => (
                      <option key={resume._id} value={resume._id}>
                        {resume.originalName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <p id="resume-help" className="text-xs text-muted">
                  Choose a previously saved resume or upload a fresh copy below.
                </p>
                {resumesLoading ? (
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    Loading saved resumes…
                  </p>
                ) : resumesError ? (
                  <div className="flex items-center justify-between gap-2 text-xs text-rose-600">
                    <span>Could not load your saved resumes.</span>
                    <button
                      type="button"
                      className="font-semibold underline"
                      onClick={onRetryResumes}
                    >
                      Retry
                    </button>
                  </div>
                ) : resumes.length === 0 ? (
                  <p className="text-xs text-muted">
                    No saved resumes found. Upload one below or{" "}
                    <Link
                      to="/worker/profile"
                      onClick={onClose}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      update your profile
                    </Link>
                    .
                  </p>
                ) : null}
              </div>

              {/* Upload New Resume */}
              <div className="space-y-2">
                <label
                  htmlFor="application-resume-file"
                  className="block text-sm font-semibold text-ink"
                >
                  Upload a new resume
                </label>
                <label
                  htmlFor="application-resume-file"
                  className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-brand-300 bg-brand-50/40 p-4 transition-colors hover:bg-brand-50/80"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm">
                    {resumeFile ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {resumeFile?.name ?? "Click to browse or drag file"}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      PDF or DOCX (Max 5MB)
                    </span>
                  </span>
                </label>
                <input
                  id="application-resume-file"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  onChange={(event) => {
                    onSelectResumeFile(event.currentTarget.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                {resumeFile ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                    onClick={onClearResumeFile}
                  >
                    Remove selected file
                  </button>
                ) : null}
              </div>

              {/* Cover Letter */}
              <Field label="Cover letter (optional)">
                <Textarea
                  rows={5}
                  maxLength={5000}
                  placeholder="Introduce yourself and highlight why you are a great fit..."
                  value={coverLetter}
                  onChange={(event) => onCoverLetterChange(event.target.value)}
                  className="resize-y"
                />
                <div className="mt-1.5 flex justify-end">
                  <span className="text-xs text-muted">
                    {coverLetter.length}/5000 characters
                  </span>
                </div>
              </Field>

              {!canApply ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed"
                >
                  <span className="font-semibold">Notice:</span> Your profile must be at least 80% complete to apply. Uploading a resume may help complete your profile requirements.
                  <div className="mt-2">
                    <Link
                      to="/worker/profile"
                      onClick={onClose}
                      className="font-semibold underline text-amber-900 hover:text-amber-950"
                    >
                      Complete your profile →
                    </Link>
                  </div>
                </div>
              ) : null}

              {message && !applicationSubmitted ? (
                <p
                  role="alert"
                  className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700"
                >
                  {message}
                </p>
              ) : null}
            </div>

            <footer className="border-t border-line bg-white px-6 py-4 sm:px-8">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit} className="gap-2">
                  {isPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit application"
                  )}
                </Button>
              </div>
            </footer>
          </form>
        )}
      </motion.aside>
    </motion.div>
  );
}
