import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/States";
import { titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { catalogService } from "../../services/jobs.service";
import { adminService } from "../../services/platform.service";

export function AdminCompaniesPage() {
  const queryClient = useQueryClient();
  const employers = useQuery({
    queryKey: queryKeys.employers,
    queryFn: () => catalogService.employers().then((r) => r.data ?? []),
  });

  const verify = useMutation({
    mutationFn: (id: string) => adminService.verifyEmployer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employers }),
  });
  const reject = useMutation({
    mutationFn: (id: string) => adminService.rejectEmployer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employers }),
  });

  if (employers.isLoading) return <Spinner />;

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Companies</h1>
      <p className="text-muted">Verify or reject employer accounts.</p>
      <div className="mt-5 space-y-3">
        {(employers.data ?? []).map((employer) => (
          <div
            key={employer._id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-4 ring-1 ring-line"
          >
            <div>
              <p className="font-bold">{employer.name}</p>
              <p className="text-sm text-muted">{employer.industry ?? employer.headquarters}</p>
            </div>
            <Badge tone={employer.verificationStatus === "verified" ? "green" : "amber"}>
              {titleCase(employer.verificationStatus)}
            </Badge>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => verify.mutate(employer._id)}>
                Verify
              </Button>
              <Button size="sm" variant="outline" onClick={() => reject.mutate(employer._id)}>
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
