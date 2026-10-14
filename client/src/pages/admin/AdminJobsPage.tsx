import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/States";
import { titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { jobsService } from "../../services/jobs.service";
import { adminService } from "../../services/platform.service";

export function AdminJobsPage() {
  const queryClient = useQueryClient();
  const jobs = useQuery({
    queryKey: queryKeys.jobs({ admin: true }),
    queryFn: () => jobsService.search({ page: 1, limit: 50 }).then((r) => r.jobs),
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "publish" | "reject" | "close" }) => {
      if (action === "publish") return adminService.publishJob(id);
      if (action === "reject") return adminService.rejectJob(id);
      return adminService.closeJob(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.jobs({ admin: true }) }),
  });

  if (jobs.isLoading) return <Spinner />;

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Jobs moderation</h1>
      <p className="text-muted">Publish, reject, or close listings.</p>
      <div className="mt-5 space-y-3">
        {(jobs.data ?? []).map((job) => (
          <div
            key={job._id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-4 ring-1 ring-line"
          >
            <div>
              <p className="font-bold">{job.title}</p>
              <p className="text-sm text-muted">{job.location}</p>
            </div>
            <Badge>{titleCase(job.status)}</Badge>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => act.mutate({ id: job._id, action: "publish" })}>
                Publish
              </Button>
              <Button size="sm" variant="outline" onClick={() => act.mutate({ id: job._id, action: "reject" })}>
                Reject
              </Button>
              <Button size="sm" variant="ghost" onClick={() => act.mutate({ id: job._id, action: "close" })}>
                Close
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
