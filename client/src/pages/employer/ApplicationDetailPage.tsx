import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, MessageSquare } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ErrorState, Spinner } from "../../components/ui/States";
import { Select } from "../../components/ui/Input";
import { formatDate, titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { applicationService } from "../../services/jobs.service";
import { userService, workerService } from "../../services/platform.service";
import type { Applicant, ApplicationStatus, Resume, User } from "../../types/models";

const statuses: ApplicationStatus[] = [
  "pending",
  "reviewing",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
];

function getId(value: string | User | undefined): string {
  if (typeof value === "string") return value;
  return value?._id ?? "";
}

export function ApplicationDetailPage() {
  const { applicationId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId") ?? "";
  const queryClient = useQueryClient();
  const applications = useQuery({
    queryKey: queryKeys.jobApplications(jobId),
    enabled: Boolean(jobId),
    queryFn: () => applicationService.byJob(jobId).then((response) => response.data ?? []),
  });

  const application = applications.data?.find((item) => item._id === applicationId);
  const applicant = application && typeof application.applicantId === "object"
    ? application.applicantId as Applicant
    : undefined;
  const userId = getId(applicant?.userId);
  const applicantUser = useQuery({
    queryKey: queryKeys.userProfile(userId),
    enabled: Boolean(userId),
    queryFn: () => userService.byId(userId).then((response) => response.data),
  });
  const worker = useQuery({
    queryKey: queryKeys.workerProfile(userId),
    enabled: Boolean(userId),
    queryFn: () => workerService.byUserId(userId).then((response) => response.data),
  });
  const updateStatus = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      applicationService.updateStatus(applicationId, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.jobApplications(jobId) }),
  });

  if (!jobId) {
    return <ErrorState message="This application link is missing its job context. Open it from the applicants list." />;
  }
  if (applications.isLoading) return <Spinner label="Loading application" />;
  if (applications.isError) {
    return (
      <ErrorState
        message={applications.error.message}
        onRetry={() => void applications.refetch()}
      />
    );
  }
  if (!application || !applicant) {
    return <ErrorState message="Application not found for this job." />;
  }
  if (applicantUser.isLoading || worker.isLoading) return <Spinner label="Loading worker profile" />;
  if (applicantUser.isError || worker.isError) {
    return (
      <ErrorState
        message={applicantUser.error?.message ?? worker.error?.message ?? "Unable to load worker information."}
        onRetry={() => {
          void applicantUser.refetch();
          void worker.refetch();
        }}
      />
    );
  }

  const resume = typeof application.resumeId === "object"
    ? application.resumeId as Resume
    : undefined;
  const resumeUrl = resume?.cloudinaryUrl || resume?.filePath;
  const profileLink = userId ? `/employer/workers/${userId}` : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        to={`/employer/applicants?jobId=${encodeURIComponent(jobId)}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to applicants
      </Link>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-line">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-muted">Application details</p>
            <h1 className="mt-1 text-2xl font-extrabold">
              {profileLink && applicantUser.data ? (
                <Link to={profileLink} className="hover:text-brand-700">
                  {applicantUser.data.fullName}
                </Link>
              ) : "Worker application"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Submitted {formatDate(application.appliedAt ?? application.createdAt)}
            </p>
          </div>
          <Badge tone="blue">{titleCase(application.status)}</Badge>
        </div>

        <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <label htmlFor="application-status" className="text-xs font-bold uppercase text-muted">
              Update status
            </label>
            <Select
              id="application-status"
              className="mt-2"
              value={application.status}
              disabled={updateStatus.isPending}
              onChange={(event) => updateStatus.mutate(event.target.value as ApplicationStatus)}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>{titleCase(status)}</option>
              ))}
            </Select>
            {updateStatus.isError ? (
              <p className="mt-2 text-sm text-rose-600">{updateStatus.error.message}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {profileLink ? (
              <Link to={profileLink}>
                <Button variant="outline">View worker profile</Button>
              </Link>
            ) : null}
            <Link to={`/messages?applicationId=${application._id}&jobId=${jobId}`}>
              <Button variant="secondary">
                <MessageSquare className="h-4 w-4" /> Message worker
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl bg-white p-6 ring-1 ring-line">
          <h2 className="text-lg font-bold">Cover letter</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
            {application.coverLetter?.trim() || "No cover letter was provided."}
          </p>
        </article>
        <article className="rounded-3xl bg-white p-6 ring-1 ring-line">
          <h2 className="text-lg font-bold">Submitted resume</h2>
          {resume ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-surface p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-brand-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{resume.originalName}</p>
                  <p className="text-xs text-muted">{formatDate(resume.createdAt)}</p>
                </div>
              </div>
              {resumeUrl ? (
                <a href={resumeUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">View</Button>
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Resume details are unavailable.</p>
          )}
        </article>
      </section>

      {applicantUser.data && worker.data ? (
        <section>
          <h2 className="mb-3 text-xl font-extrabold">Worker profile</h2>
          <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <p className="mb-4 text-sm text-muted">
              <Link to={profileLink ?? "#"} className="font-semibold text-brand-700 hover:underline">
                Open {applicantUser.data.fullName}’s full profile
              </Link>
            </p>
            <p className="text-sm leading-6 text-muted">
              {worker.data.professionalSummary || applicantUser.data.bio || "No professional summary provided."}
            </p>
            {worker.data.skills.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {worker.data.skills.map((skill) => (
                  <Badge key={skill.skillId}>{skill.name}</Badge>
                ))}
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <p><span className="font-semibold">Location:</span> {worker.data.location || applicantUser.data.location || "—"}</p>
              <p><span className="font-semibold">Experience entries:</span> {worker.data.experience.length}</p>
              <p><span className="font-semibold">Education entries:</span> {worker.data.education.length}</p>
              <p><span className="font-semibold">Profile completion:</span> {worker.data.profileCompletion}%</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
