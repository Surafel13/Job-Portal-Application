import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ErrorState, Spinner } from "../../components/ui/States";
import { Select } from "../../components/ui/Input";
import { formatDate, titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { applicationService } from "../../services/jobs.service";
import { userService, workerService } from "../../services/platform.service";
import type {
  Applicant,
  ApplicationStatus,
  Resume,
  User,
} from "../../types/models";

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
    queryFn: () =>
      applicationService.byJob(jobId).then((response) => response.data ?? []),
  });

  const application = applications.data?.find(
    (item) => item._id === applicationId,
  );
  const applicant =
    application && typeof application.applicantId === "object"
      ? (application.applicantId as Applicant)
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
    queryFn: () =>
      workerService.byUserId(userId).then((response) => response.data),
  });

  const updateStatus = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      applicationService.updateStatus(applicationId, status),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobApplications(jobId),
      }),
  });

  if (!jobId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message="This application link is missing its job context. Open it from the applicants list." />
      </div>
    );
  }

  if (applications.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
        <Spinner label="Loading application..." />
      </div>
    );
  }

  if (applications.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          message={applications.error.message}
          onRetry={() => void applications.refetch()}
        />
      </div>
    );
  }

  if (!application || !applicant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState message="Application not found for this job." />
      </div>
    );
  }

  if (applicantUser.isLoading || worker.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
        <Spinner label="Loading worker profile..." />
      </div>
    );
  }

  if (applicantUser.isError || worker.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          message={
            applicantUser.error?.message ??
            worker.error?.message ??
            "Unable to load worker information."
          }
          onRetry={() => {
            void applicantUser.refetch();
            void worker.refetch();
          }}
        />
      </div>
    );
  }

  const resume =
    typeof application.resumeId === "object"
      ? (application.resumeId as Resume)
      : undefined;
  const resumeUrl = resume?.cloudinaryUrl || resume?.filePath;
  const profileLink = userId ? `/employer/workers/${userId}` : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-8">
      {/* Navigation Link */}
      <Link
        to={`/employer/applicants?jobId=${encodeURIComponent(jobId)}`}
        className="group inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to applicants
      </Link>

      {/* Hero Application Header */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
              Application Details
            </span>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {profileLink && applicantUser.data ? (
                <Link
                  to={profileLink}
                  className="transition-colors hover:text-brand-700"
                >
                  {applicantUser.data.fullName}
                </Link>
              ) : (
                "Worker application"
              )}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Submitted on{" "}
              {formatDate(application.appliedAt ?? application.createdAt)}
            </p>
          </div>

          <div className="shrink-0">
            <Badge
              tone={
                application.status === "accepted" ||
                application.status === "shortlisted"
                  ? "green"
                  : application.status === "rejected"
                    ? "rose"
                    : application.status === "interview"
                      ? "blue"
                      : "amber"
              }
            >
              {titleCase(application.status)}
            </Badge>
          </div>
        </div>

        {/* Status Control & Quick Actions */}
        <div className="mt-6 grid gap-6 border-t border-line pt-6 sm:grid-cols-2 sm:items-end">
          <div>
            <label
              htmlFor="application-status"
              className="block text-xs font-bold uppercase tracking-wider text-muted"
            >
              Update status
            </label>
            <Select
              id="application-status"
              className="mt-2 text-sm"
              value={application.status}
              disabled={updateStatus.isPending}
              onChange={(event) =>
                updateStatus.mutate(event.target.value as ApplicationStatus)
              }
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </Select>
            {updateStatus.isError ? (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {updateStatus.error.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
            {profileLink ? (
              <Link to={profileLink}>
                <Button variant="outline" className="gap-2">
                  <UserRound className="h-4 w-4" /> View Profile
                </Button>
              </Link>
            ) : null}
            <Link
              to={`/messages?applicationId=${application._id}&jobId=${jobId}`}
            >
              <Button variant="secondary" className="gap-2">
                <MessageSquare className="h-4 w-4" /> Message
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Grid: Cover Letter & Resume */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
          <h2 className="text-lg font-bold text-ink">Cover Letter</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {application.coverLetter?.trim() ||
              "No cover letter was provided with this application."}
          </p>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
          <h2 className="text-lg font-bold text-ink">Submitted Resume</h2>
          {resume ? (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-surface/60 p-4 ring-1 ring-line/60">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">
                    {resume.originalName}
                  </p>
                  <p className="text-xs text-muted">
                    Uploaded {formatDate(resume.createdAt)}
                  </p>
                </div>
              </div>
              {resumeUrl ? (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <Button size="sm" variant="outline" className="gap-1.5">
                    View <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Resume details are unavailable.
            </p>
          )}
        </article>
      </section>

      {/* Worker Profile Overview Snapshot */}
      {applicantUser.data && worker.data ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <h2 className="text-lg font-bold text-ink">Candidate Overview</h2>
            {profileLink ? (
              <Link
                to={profileLink}
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                Full Profile →
              </Link>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              {worker.data.professionalSummary ||
                applicantUser.data.bio ||
                "No professional summary provided."}
            </p>

            {worker.data.skills.length ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {worker.data.skills.map((skill) => (
                  <Badge key={skill.skillId} tone="slate">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 rounded-2xl bg-surface/50 p-4 ring-1 ring-line/50 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted block">
                  Location
                </span>
                <span className="font-semibold text-ink flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" />
                  {worker.data.location || applicantUser.data.location || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted block">
                  Experience
                </span>
                <span className="font-semibold text-ink mt-0.5 block">
                  {worker.data.experience.length} entries
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted block">
                  Education
                </span>
                <span className="font-semibold text-ink mt-0.5 block">
                  {worker.data.education.length} entries
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted block">
                  Profile Status
                </span>
                <span className="font-semibold text-ink mt-0.5 block">
                  {worker.data.profileCompletion}% Complete
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
