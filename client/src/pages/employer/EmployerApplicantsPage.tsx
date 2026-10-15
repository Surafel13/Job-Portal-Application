import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { MessageSquare } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, Spinner } from "../../components/ui/States";
import { Select } from "../../components/ui/Input";
import { titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { applicationService, catalogService, jobsService } from "../../services/jobs.service";
import { useAuthStore } from "../../store/authStore";
import { findMyEmployer } from "../../lib/job";
import type { ApplicationStatus } from "../../types/models";

const statuses: ApplicationStatus[] = [
  "pending",
  "reviewing",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
];

export function EmployerApplicantsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
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

  const selected = jobId || jobs.data?.[0]?._id || "";
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

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Applicants</h1>
      <p className="text-muted">Review candidates for each listing.</p>
      <div className="mt-4 max-w-sm">
        <Select value={selected} onChange={(e) => setJobId(e.target.value)}>
          {(jobs.data ?? []).map((job) => (
            <option key={job._id} value={job._id}>
              {job.title}
            </option>
          ))}
        </Select>
      </div>
      {applications.isLoading ? <Spinner /> : null}
      <div className="mt-5 space-y-3">
        {list.map((app) => (
          <div key={app._id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-4 ring-1 ring-line">
            <div>
              <p className="font-bold">Applicant {String(app._id).slice(-6)}</p>
              <Badge>{titleCase(app.status)}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/messages?applicationId=${app._id}&jobId=${selected}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
              </Link>
              {statuses.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={app.status === status ? "primary" : "secondary"}
                  onClick={() => update.mutate({ id: app._id, status })}
                >
                  {titleCase(status)}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {!applications.isLoading && list.length === 0 ? (
        <EmptyState
          title="No applications for this job"
          description="Once workers apply, you can move them through review, interview, and offer."
        />
      ) : null}
    </div>
  );
}
