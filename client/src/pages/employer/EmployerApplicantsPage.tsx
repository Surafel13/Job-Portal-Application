import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, MessageSquare, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States";
import { Select } from "../../components/ui/Input";
import { formatDate, titleCase } from "../../lib/format";
import { findMyEmployer } from "../../lib/job";
import { queryKeys } from "../../lib/queryKeys";
import { applicationService, catalogService, jobsService } from "../../services/jobs.service";
import { useAuthStore } from "../../store/authStore";
import type { Applicant, ApplicationStatus, Resume, User } from "../../types/models";

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
  const linkedUser = typeof applicantId.userId === "object" ? applicantId.userId as User : undefined;
  const userId = typeof applicantId.userId === "string" ? applicantId.userId : linkedUser?._id ?? "";
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
    queryFn: () => jobsService.byCompany(company!._id).then((r) => r.data ?? []),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.jobApplications(selected) }),
  });

  const list = useMemo(() => applications.data ?? [], [applications.data]);
  const selectedJob = jobs.data?.find((job) => job._id === selected);

  if (employers.isLoading || jobs.isLoading) return <Spinner label="Loading applicants" />;
  if (employers.isError || jobs.isError) {
    return (
      <ErrorState
        message={employers.error?.message ?? jobs.error?.message ?? "Unable to load your jobs."}
        onRetry={() => {
          void employers.refetch();
          void jobs.refetch();
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Applicants</h1>
          <p className="text-muted">Review applications, resumes, and candidate profiles.</p>
        </div>
        <div className="w-full max-w-sm">
          <label htmlFor="applicant-job-filter" className="mb-1.5 block text-sm font-semibold">
            Job listing
          </label>
          <Select
            id="applicant-job-filter"
            value={selected}
            disabled={!jobs.data?.length}
            onChange={(event) => {
              setJobId(event.target.value);
              setSearchParams(event.target.value ? { jobId: event.target.value } : {});
            }}
          >
            {(jobs.data ?? []).map((job) => (
              <option key={job._id} value={job._id}>{job.title}</option>
            ))}
          </Select>
        </div>
      </div>

      {selectedJob ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="font-semibold text-ink">{selectedJob.title}</span>
          <span>·</span>
          <span>{list.length} {list.length === 1 ? "application" : "applications"}</span>
        </div>
      ) : null}

      {applications.isLoading ? <Spinner /> : null}
      {applications.isError ? (
        <div className="mt-5">
          <ErrorState
            message={applications.error.message}
            onRetry={() => void applications.refetch()}
          />
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {list.map((app) => {
          const data = getApplicantData(app.applicantId);
          const resume = typeof app.resumeId === "object" ? app.resumeId as Resume : undefined;
          const detailsUrl = `/employer/applications/${app._id}?jobId=${encodeURIComponent(selected)}`;

          return (
            <article
              key={app._id}
              className="rounded-3xl bg-white p-4 ring-1 ring-line sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  {data.userId ? (
                    <Link
                      to={`/employer/workers/${data.userId}`}
                      className="text-lg font-bold hover:text-brand-700"
                    >
                      {data.user?.fullName ?? "View worker profile"}
                    </Link>
                  ) : (
                    <p className="text-lg font-bold">Applicant {app._id.slice(-6)}</p>
                  )}
                  <p className="mt-1 text-sm text-muted">
                    {data.user?.location || data.applicant?.location || "Location not provided"}
                    {" · Applied "}
                    {formatDate(app.appliedAt ?? app.createdAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge>{titleCase(app.status)}</Badge>
                    {resume ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                        <FileText className="h-3.5 w-3.5" /> {resume.originalName}
                      </span>
                    ) : null}
                  </div>
                  {app.coverLetter ? (
                    <p className="mt-3 line-clamp-2 max-w-3xl text-sm text-muted">
                      {app.coverLetter}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm italic text-muted">No cover letter included.</p>
                  )}
                </div>

                <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto sm:justify-end">
                  <div className="min-w-40 flex-1 sm:flex-none">
                    <label htmlFor={`status-${app._id}`} className="mb-1 block text-xs font-semibold text-muted">
                      Application status
                    </label>
                    <Select
                      id={`status-${app._id}`}
                      value={app.status}
                      disabled={update.isPending}
                      onChange={(event) =>
                        update.mutate({ id: app._id, status: event.target.value as ApplicationStatus })
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>{titleCase(status)}</option>
                      ))}
                    </Select>
                  </div>
                  <Link to={detailsUrl}>
                    <Button size="sm">Application details</Button>
                  </Link>
                  <Link to={`/messages?applicationId=${app._id}&jobId=${selected}`}>
                    <Button size="sm" variant="outline" aria-label="Message applicant">
                      <MessageSquare className="h-4 w-4" />
                      <span className="sm:hidden">Message</span>
                    </Button>
                  </Link>
                  {data.userId ? (
                    <Link to={`/employer/workers/${data.userId}`}>
                      <Button size="sm" variant="secondary" aria-label="View worker profile">
                        <UserRound className="h-4 w-4" />
                        <span className="sm:hidden">Profile</span>
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!applications.isLoading && !applications.isError && !list.length ? (
        <div className="mt-5">
          <EmptyState
            title={jobs.data?.length ? "No applications for this job" : "No job listings yet"}
            description={
              jobs.data?.length
                ? "Once workers apply, their profile, resume, and application details will appear here."
                : "Create a job listing to start receiving applications."
            }
          />
        </div>
      ) : null}

      {update.isError ? (
        <p role="alert" className="mt-3 text-sm text-rose-600">{update.error.message}</p>
      ) : null}
    </div>
  );
}
