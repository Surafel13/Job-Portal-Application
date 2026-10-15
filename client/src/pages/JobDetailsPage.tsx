import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, Briefcase, Clock, MapPin, MessageSquare, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, Spinner } from "../components/ui/States";
import { Textarea } from "../components/ui/Input";
import { formatDate, formatSalary, titleCase } from "../lib/format";
import { categoryOf, companyOf, skillsOf } from "../lib/job";
import { queryKeys } from "../lib/queryKeys";
import {
  applicationService,
  jobsService,
  resumeService,
  savedJobsService,
} from "../services/jobs.service";
import { applicantService } from "../services/platform.service";
import { useAuthStore } from "../store/authStore";
import { ApiClientError } from "../lib/api";

export function JobDetailsPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [message, setMessage] = useState("");

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

  const apply = useMutation({
    mutationFn: async () => {
      if (!resumeId) throw new Error("Select a resume before applying.");
      try {
        await applicantService.me();
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) {
          await applicantService.create({ resumeId });
        }
      }
      return applicationService.create(id, {
        resumeId,
        coverLetter: coverLetter || undefined,
      });
    },
    onSuccess: () => {
      setMessage("Application submitted successfully.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.applications });
    },
    onError: (error: Error) => setMessage(error.message),
  });

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
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="w-full rounded-2xl border border-line px-3 py-2 text-sm"
              >
                <option value="">Select resume</option>
                {(resumes.data ?? []).map((resume) => (
                  <option key={resume._id} value={resume._id}>
                    {resume.originalName}
                  </option>
                ))}
              </select>
              <Textarea
                rows={4}
                placeholder="Short cover letter (optional)"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
              <Button className="w-full" onClick={() => apply.mutate()} disabled={apply.isPending}>
                {apply.isPending ? "Submitting…" : "Apply Now"}
              </Button>
              <Link to="/worker/profile" className="block text-center text-xs text-brand-700">
                Upload a resume from your profile if the list is empty.
              </Link>
            </div>
          )}
          {message ? <p className="mt-3 text-sm text-brand-700">{message}</p> : null}
        </div>
      </aside>
    </div>
  );
}
