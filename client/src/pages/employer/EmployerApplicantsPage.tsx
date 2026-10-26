import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  MessageSquare,
  UserRound,
  Users,
  Briefcase,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States";
import { Select } from "../../components/ui/Input";
import { formatDate, titleCase } from "../../lib/format";
import { findMyEmployer } from "../../lib/job";
import { queryKeys } from "../../lib/queryKeys";
import {
  applicationService,
  catalogService,
  jobsService,
} from "../../services/jobs.service";
import { useAuthStore } from "../../store/authStore";
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

function getApplicantData(applicantId: string | Applicant) {
  if (typeof applicantId === "string") return { user: undefined, userId: "" };
  const linkedUser =
    typeof applicantId.userId === "object"
      ? (applicantId.userId as User)
      : undefined;
  const userId =
    typeof applicantId.userId === "string"
      ? applicantId.userId
      : (linkedUser?._id ?? "");
  return { applicant: applicantId, user: linkedUser, userId };
}

export function EmployerApplicantsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobId, setJobId] = useState("");

  const employers = useQuery({
    queryKey: queryKeys.employers,
    queryFn: () => catalogService.employers().then((r) => r.data ?? []),
  });
  const company = findMyEmployer(employers.data ?? [], user?._id);
  const jobs = useQuery({
    queryKey: queryKeys.employerJobs(company?._id ?? "none"),
    enabled: Boolean(company?._id),
    queryFn: () =>
      jobsService.byCompany(company!._id).then((r) => r.data ?? []),
  });

  const requestedJobId = searchParams.get("jobId") ?? "";
  const selected = jobId || requestedJobId || jobs.data?.[0]?._id || "";
  const applications = useQuery({
    queryKey: queryKeys.jobApplications(selected),
    enabled: Boolean(selected),
    queryFn: () => applicationService.byJob(selected).then((r) => r.data ?? []),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationService.updateStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobApplications(selected),
      }),
  });

  const list = useMemo(() => applications.data ?? [], [applications.data]);
  const selectedJob = jobs.data?.find((job) => job._id === selected);

  if (employers.isLoading || jobs.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <Spinner label="Loading applicants..." />
      </div>
    );
  }

  if (employers.isError || jobs.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          message={
            employers.error?.message ??
            jobs.error?.message ??
            "Unable to load your jobs."
          }
          onRetry={() => {
            void employers.refetch();
            void jobs.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Top Header & Job Filter Section */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
            Recruitment
          </span>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Candidate Applications
          </h1>
          <p className="mt-1 text-sm text-muted">
            Review applicant profiles, check attached resumes, and manage
            interview statuses.
          </p>
        </div>

        <div className="w-full sm:max-w-xs">
          <label
            htmlFor="applicant-job-filter"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted"
          >
            Filter by job listing
          </label>
          <Select
            id="applicant-job-filter"
            value={selected}
            disabled={!jobs.data?.length}
            onChange={(event) => {
              setJobId(event.target.value);
              setSearchParams(
                event.target.value ? { jobId: event.target.value } : {},
              );
            }}
          >
            {(jobs.data ?? []).map((job) => (
              <option key={job._id} value={job._id}>
                {job.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Selected Job Info Bar */}
      {selectedJob ? (
        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line text-sm text-muted sm:px-6">
          <Briefcase className="h-4 w-4 text-brand-600" />
          <span className="font-bold text-ink">{selectedJob.title}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-ink">
            <Users className="h-3.5 w-3.5 text-muted" /> {list.length}{" "}
            {list.length === 1 ? "application" : "applications"}
          </span>
        </div>
      ) : null}

      {applications.isLoading ? (
        <div className="py-16">
          <Spinner label="Loading applications..." />
        </div>
      ) : null}

      {applications.isError ? (
        <div className="mt-6">
          <ErrorState
            message={applications.error.message}
            onRetry={() => void applications.refetch()}
          />
        </div>
      ) : null}

      {/* Applications List */}
      <div className="mt-6 space-y-4">
        {list.map((app) => {
          const data = getApplicantData(app.applicantId);
          const resume =
            typeof app.resumeId === "object"
              ? (app.resumeId as Resume)
              : undefined;
          const detailsUrl = `/employer/applications/${app._id}?jobId=${encodeURIComponent(selected)}`;

          return (
            <article
              key={app._id}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line transition-all hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                {/* Left side: Candidate Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    {data.userId ? (
                      <Link
                        to={`/employer/workers/${data.userId}`}
                        className="text-lg font-extrabold text-ink transition-colors hover:text-brand-700"
                      >
                        {data.user?.fullName ?? "View worker profile"}
                      </Link>
                    ) : (
                      <p className="text-lg font-extrabold text-ink">
                        Applicant {app._id.slice(-6)}
                      </p>
                    )}
                    <Badge
                      tone={
                        app.status === "accepted" ||
                        app.status === "shortlisted"
                          ? "green"
                          : app.status === "rejected"
                            ? "rose"
                            : app.status === "interview"
                              ? "blue"
                              : "amber"
                      }
                    >
                      {titleCase(app.status)}
                    </Badge>
                  </div>

                  <p className="mt-1 text-xs font-medium text-muted">
                    {data.user?.location ||
                      data.applicant?.location ||
                      "Location not provided"}
                    {" · Applied "}
                    {formatDate(app.appliedAt ?? app.createdAt)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {resume ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-ink ring-1 ring-line/60">
                        <FileText className="h-3.5 w-3.5 text-brand-600" />{" "}
                        {resume.originalName}
                      </span>
                    ) : null}
                  </div>

                  {app.coverLetter ? (
                    <p className="mt-4 line-clamp-2 max-w-3xl text-sm leading-relaxed text-muted bg-surface/50 p-3.5 rounded-2xl ring-1 ring-line/50">
                      "{app.coverLetter}"
                    </p>
                  ) : (
                    <p className="mt-4 text-xs italic text-muted">
                      No cover letter included.
                    </p>
                  )}
                </div>

                {/* Right side: Actions & Status Manager */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-line lg:border-t-0 lg:pt-0 lg:flex-col lg:items-end">
                  <div className="w-full sm:w-48">
                    <label
                      htmlFor={`status-${app._id}`}
                      className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted"
                    >
                      Status
                    </label>
                    <Select
                      id={`status-${app._id}`}
                      value={app.status}
                      disabled={update.isPending}
                      onChange={(event) =>
                        update.mutate({
                          id: app._id,
                          status: event.target.value as ApplicationStatus,
                        })
                      }
                      className="text-xs py-1.5"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {titleCase(status)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-2">
                    <Link to={detailsUrl} className="flex-1 sm:flex-none">
                      <Button size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link
                      to={`/messages?applicationId=${app._id}&jobId=${selected}`}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label="Message applicant"
                        className="gap-1.5"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="sm:hidden">Message</span>
                      </Button>
                    </Link>
                    {data.userId ? (
                      <Link to={`/employer/workers/${data.userId}`}>
                        <Button
                          size="sm"
                          variant="secondary"
                          aria-label="View worker profile"
                          className="gap-1.5"
                        >
                          <UserRound className="h-4 w-4" />
                          <span className="sm:hidden">Profile</span>
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!applications.isLoading && !applications.isError && !list.length ? (
        <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-line text-center">
          <EmptyState
            title={
              jobs.data?.length
                ? "No applications for this job yet"
                : "No job listings available"
            }
            description={
              jobs.data?.length
                ? "Once candidates submit applications, their profiles, resumes, and cover letters will appear here."
                : "Create a job listing to start receiving candidate applications."
            }
          />
        </div>
      ) : null}

      {update.isError ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700"
        >
          {update.error.message}
        </p>
      ) : null}
    </div>
  );
}
