import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ErrorState, Spinner } from "../../components/ui/States";
import { formatDate, titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { jobsService } from "../../services/jobs.service";
import { adminService } from "../../services/platform.service";
import type { Job } from "../../types/models";

export function AdminJobsPage() {
  const queryClient = useQueryClient();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const jobs = useQuery({
    queryKey: queryKeys.jobs({ admin: true }),
    queryFn: () => jobsService.search({ page: 1, limit: 50 }).then((r) => r.jobs),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => {
      setActiveActionId(id);
      return adminService.suspendJob(id);
    },
    onSuccess: () => {
      setErrorMessage("");
      return queryClient.invalidateQueries({ queryKey: queryKeys.jobs({ admin: true }) });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to suspend job.");
    },
    onSettled: () => {
      setActiveActionId(null);
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => {
      setActiveActionId(id);
      return adminService.unsuspendJob(id);
    },
    onSuccess: () => {
      setErrorMessage("");
      return queryClient.invalidateQueries({ queryKey: queryKeys.jobs({ admin: true }) });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to unsuspend job.");
    },
    onSettled: () => {
      setActiveActionId(null);
    },
  });

  const handleSuspend = (job: Job) => {
    const confirmed = window.confirm(
      `Are you sure you want to suspend the listing "${job.title}"?`
    );
    if (confirmed) {
      suspendMutation.mutate(job._id);
    }
  };

  const handleUnsuspend = (job: Job) => {
    const confirmed = window.confirm(
      `Are you sure you want to unsuspend the listing "${job.title}"?`
    );
    if (confirmed) {
      unsuspendMutation.mutate(job._id);
    }
  };

  const getStatusBadgeTone = (status: string) => {
    switch (status) {
      case "active":
      case "published":
        return "green";
      case "suspended":
        return "rose";
      case "pending":
        return "amber";
      default:
        return "slate";
    }
  };

  if (jobs.isLoading) return <Spinner />;

  if (jobs.isError) {
    return (
      <ErrorState
        message={jobs.error?.message ?? "Unable to load job listings."}
        onRetry={() => void jobs.refetch()}
      />
    );
  }

  const jobList = jobs.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-extrabold">Jobs moderation</h1>
        <p className="mt-1 text-sm text-muted">
          Review details, suspend policy-violating listings, or restore suspended jobs.
        </p>
      </div>

      {/* Global Error Message */}
      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {errorMessage}
        </p>
      ) : null}

      {/* Main List Area */}
      {jobList.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-muted">No job listings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobList.map((job) => {
            const isProcessing = activeActionId === job._id;
            const isSuspended = job.status === "rejected";

            return (
              <div
                key={job._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-4 ring-1 ring-line"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{job.title}</p>
                  <p className="text-sm text-muted">
                    {job.location || "Location not specified"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={getStatusBadgeTone(job.status)}>
                    {titleCase(job.status)}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedJob(job)}
                    >
                      <Eye className="mr-1.5 h-4 w-4" />
                      View Details
                    </Button>

                    {isSuspended ? (
                      <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleUnsuspend(job)}
                      >
                        {isProcessing && unsuspendMutation.isPending
                          ? "Unsuspending…"
                          : "Unsuspend"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        disabled={isProcessing}
                        onClick={() => handleSuspend(job)}
                      >
                        {isProcessing && suspendMutation.isPending
                          ? "Suspending…"
                          : "Suspend"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl ring-1 ring-line">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedJob.title}</h2>
                <p className="text-sm text-muted">
                  {selectedJob.location || "Location not provided"} ·{" "}
                  {titleCase(selectedJob.employmentType ?? "N/A")}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-ink"
                onClick={() => setSelectedJob(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge tone={getStatusBadgeTone(selectedJob.status)}>
                  {titleCase(selectedJob.status)}
                </Badge>
                {selectedJob.experienceLevel ? (
                  <Badge tone="blue">{titleCase(selectedJob.experienceLevel)}</Badge>
                ) : null}
              </div>

              <div>
                <h3 className="font-semibold text-ink">Description</h3>
                <p className="mt-1 whitespace-pre-wrap leading-6 text-muted">
                  {selectedJob.description || "No description provided."}
                </p>
              </div>

              {selectedJob.requirements?.length ? (
                <div>
                  <h3 className="font-semibold text-ink">Requirements</h3>
                  <ul className="mt-1 list-disc pl-5 space-y-1 text-muted">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedJob.responsibilities?.length ? (
                <div>
                  <h3 className="font-semibold text-ink">Responsibilities</h3>
                  <ul className="mt-1 list-disc pl-5 space-y-1 text-muted">
                    {selectedJob.responsibilities.map((resp, idx) => (
                      <li key={idx}>{resp}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedJob.createdAt ? (
                <p className="pt-2 text-xs text-muted">
                  Posted on {formatDate(selectedJob.createdAt)}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
              <Button variant="outline" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
