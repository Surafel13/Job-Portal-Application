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

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
        throw new Error("Complete at least 80% of your profile before applying.");
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
            "Your profile must be at least 80% complete before applying. Your resume was saved to your profile."
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
      setMessage("Complete at least 80% of your worker profile before applying.");
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

  if (jobQuery.isLoading) return <Spinner label="Loading job" />;
  if (jobQuery.isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
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
      <EmptyState
        title="Job not found"
        description="This listing may have been removed."
        action={<Link to="/jobs">Back to jobs</Link>}
      />
    );
  }

  const company = companyOf(job);
  const category = categoryOf(job);
  const skills = skillsOf(job);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px] lg:px-8">
      <div>
        <button
          onClick={() => void navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </button>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-bold text-brand-700">
                {(company?.name ?? "J").slice(0, 1)}
              </div>
              <div>
                <h1 className="text-3xl font-extrabold">{job.title}</h1>
                <p className="text-muted">{company?.name ?? "Company"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{titleCase(job.employmentType)}</Badge>
                  {job.experienceLevel ? (
                    <Badge tone="slate">{titleCase(job.experienceLevel)}</Badge>
                  ) : null}
                  {category ? <Badge tone="blue">{category.name}</Badge> : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {user?.role === "worker" && (
                <Link to={`/messages?jobId=${job._id}`}>
                  <Button variant="outline" className="gap-1.5">
                    <MessageSquare className="h-4 w-4" /> Message Employer
                  </Button>
                </Link>
              )}
              <Button variant="secondary" onClick={() => save.mutate()}>
                <Bookmark className="h-4 w-4" /> Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => void navigator.clipboard.writeText(window.location.href)}
              >
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </div>

          <div className="mt-6 flex gap-6 border-b border-line text-sm font-semibold">
            {["Overview", "Responsibilities", "Requirements", "Benefits"].map((tab, i) => (
              <a
                key={tab}
                href={`#${tab.toLowerCase()}`}
                className={i === 0 ? "border-b-2 border-brand-600 py-3 text-brand-700" : "py-3 text-muted"}
              >
                {tab}
              </a>
            ))}
          </div>

          <section id="overview" className="pt-6">
            <h2 className="text-lg font-bold">Job Overview</h2>
            <p className="mt-3 whitespace-pre-wrap text-muted">{job.description}</p>
          </section>
          <section id="responsibilities" className="pt-8">
            <h2 className="text-lg font-bold">Responsibilities</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
              {job.responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section id="requirements" className="pt-8">
            <h2 className="text-lg font-bold">Requirements</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
              {job.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill._id} tone="slate">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </section>
          <section id="benefits" className="pt-8">
            <h2 className="text-lg font-bold">Company</h2>
            <p className="mt-2 text-muted">
              {company?.description ?? "Join a team building with modern technologies."}
            </p>
            {company?.website ? (
              <a className="mt-2 inline-block text-sm text-brand-700" href={company.website}>
                {company.website}
              </a>
            ) : null}
          </section>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-line">
          <p className="text-sm text-muted">Salary</p>
          <p className="text-xl font-extrabold text-emerald-600">{formatSalary(job.salary)}</p>
          <div className="mt-4 space-y-3 text-sm text-muted">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {job.location}
            </p>
            <p className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> {titleCase(job.employmentType)}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Deadline {formatDate(job.deadline)}
            </p>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-line">
          <h3 className="font-bold">Apply Now</h3>
          {user?.role !== "worker" ? (
            <p className="mt-2 text-sm text-muted">
              Sign in as a worker to submit an application.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {worker.isLoading ? (
                <p className="text-sm text-muted">Checking your profile…</p>
              ) : worker.isError ? (
                <p className="text-sm text-rose-600">
                  Could not load your worker profile.{" "}
                  <button
                    type="button"
                    className="font-semibold underline"
                    onClick={() => void worker.refetch()}
                  >
                    Retry
                  </button>
                </p>
              ) : !canApply ? (
                <p className="text-sm text-muted">
                  Your profile is {profileCompletion}% complete. Complete at
                  least 80% before applying.
                </p>
              ) : null}
              <Button
                className="w-full"
                onClick={() => {
                  setMessage("");
                  setIsApplyPanelOpen(true);
                }}
                disabled={worker.isLoading || worker.isError}
              >
                Create Application
              </Button>
            </div>
          )}
          {message ? <p className="mt-3 text-sm text-brand-700">{message}</p> : null}
        </div>
      </aside>
      <AnimatePresence>
        {isApplyPanelOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <button
              type="button"
              aria-label="Close application panel"
              className="absolute inset-0 cursor-default"
              onClick={() => {
                if (!apply.isPending) setIsApplyPanelOpen(false);
              }}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-application-title"
              className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
            >
              <header className="flex items-start justify-between border-b border-line px-5 py-5 sm:px-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                    Job application
                  </p>
                  <h2
                    id="create-application-title"
                    className="mt-1 text-xl font-extrabold text-ink sm:text-2xl"
                  >
                    Create Application
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {job.title} · {company?.name ?? "Company"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close application panel"
                  className="rounded-full p-2 text-muted transition hover:bg-surface hover:text-ink disabled:opacity-50"
                  onClick={() => setIsApplyPanelOpen(false)}
                  disabled={apply.isPending}
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              {message === "Application submitted successfully." ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                  <h3 className="mt-4 text-xl font-bold text-ink">
                    Application submitted
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-muted">
                    Your application for {job.title} has been submitted
                    successfully.
                  </p>
                  <Button
                    className="mt-6"
                    onClick={() => setIsApplyPanelOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form
                  className="flex min-h-0 flex-1 flex-col"
                  onSubmit={submitApplication}
                >
                  <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
                    <section className="rounded-2xl bg-surface p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Applying as
                          </p>
                          <p className="mt-1 font-bold text-ink">
                            {user?.fullName ?? "Worker"}
                          </p>
                          <p className="mt-0.5 text-sm text-muted">
                            {worker.data?.location ?? user?.location ?? "Location not set"}
                          </p>
                        </div>
                        <Link
                          to="/worker/profile"
                          onClick={() => setIsApplyPanelOpen(false)}
                          className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Edit profile
                        </Link>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted">Profile completion</span>
                          <span className="font-bold text-ink">
                            {profileCompletion}%
                          </span>
                        </div>
                        <div
                          className="mt-2 h-2 overflow-hidden rounded-full bg-white"
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

                    <div>
                      <Field label="Select resume">
                        <Select
                          value={resumeFile ? "" : resumeId}
                          onChange={(event) => selectResume(event.target.value)}
                          disabled={resumes.isLoading || resumes.isError}
                          required={!resumeFile}
                          aria-describedby="resume-help"
                        >
                          <option value="">Choose a saved resume</option>
                          {(resumes.data ?? []).map((resume) => (
                            <option key={resume._id} value={resume._id}>
                              {resume.originalName}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <p id="resume-help" className="mt-2 text-xs text-muted">
                        Select a resume from your profile or upload a new one below.
                      </p>
                      {resumes.isLoading ? (
                        <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          Loading your saved resumes…
                        </p>
                      ) : resumes.isError ? (
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-rose-600">
                          <span>Could not load your saved resumes.</span>
                          <button
                            type="button"
                            className="font-semibold underline"
                            onClick={() => void resumes.refetch()}
                          >
                            Retry
                          </button>
                        </div>
                      ) : (resumes.data ?? []).length === 0 ? (
                        <p className="mt-2 text-xs text-muted">
                          No saved resumes yet. Upload one below or{" "}
                          <Link
                            to="/worker/profile"
                            onClick={() => setIsApplyPanelOpen(false)}
                            className="font-semibold text-brand-700"
                          >
                            manage your profile
                          </Link>
                          .
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="application-resume-file"
                        className="mb-2 block text-sm font-semibold text-ink"
                      >
                        Upload a new resume
                      </label>
                      <label
                        htmlFor="application-resume-file"
                        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 px-4 py-4 transition hover:bg-brand-50"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700">
                          {resumeFile ? (
                            <FileText className="h-5 w-5" />
                          ) : (
                            <Upload className="h-5 w-5" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {resumeFile?.name ?? "Choose a PDF or DOCX file"}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">
                            Maximum file size: 5MB
                          </span>
                        </span>
                      </label>
                      <input
                        id="application-resume-file"
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="sr-only"
                        onChange={(event) => {
                          selectResumeFile(event.currentTarget.files?.[0]);
                          event.currentTarget.value = "";
                        }}
                      />
                      {resumeFile ? (
                        <button
                          type="button"
                          className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700"
                          onClick={() => setResumeFile(null)}
                        >
                          Remove selected file
                        </button>
                      ) : null}
                    </div>

                    <Field label="Cover letter (optional)">
                      <Textarea
                        rows={6}
                        maxLength={5000}
                        placeholder="Tell the employer why you're a good fit for this role…"
                        value={coverLetter}
                        onChange={(event) => setCoverLetter(event.target.value)}
                        className="resize-y"
                      />
                      <span className="block text-right text-xs text-muted">
                        {coverLetter.length}/5000
                      </span>
                    </Field>

                    {!canApply ? (
                      <div
                        role="alert"
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                      >
                        Your profile must be at least 80% complete to apply. Uploading a resume may complete your profile.
                        <Link
                          to="/worker/profile"
                          onClick={() => setIsApplyPanelOpen(false)}
                          className="ml-1 font-semibold underline"
                        >
                          Complete your profile
                        </Link>
                      </div>
                    ) : null}
                    {message ? (
                      <p
                        role="alert"
                        className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
                      >
                        {message}
                      </p>
                    ) : null}
                  </div>

                  <footer className="border-t border-line bg-white px-5 py-4 sm:px-7">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsApplyPanelOpen(false)}
                        disabled={apply.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          apply.isPending ||
                          (!canApply && !resumeFile) ||
                          (resumes.isLoading && !resumeFile) ||
                          (resumes.isError && !resumeFile) ||
                          (!resumeFile &&
                            !(resumes.data ?? []).some(
                              (resume) => resume._id === resumeId,
                            ))
                        }
                      >
                        {apply.isPending ? (
                          <>
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Submitting…
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </Button>
                    </div>
                  </footer>
                </form>
              )}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
