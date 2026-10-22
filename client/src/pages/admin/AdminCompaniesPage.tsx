import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ErrorState, Spinner } from "../../components/ui/States";
import { titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { catalogService } from "../../services/jobs.service";
import { adminService } from "../../services/platform.service";

export function AdminCompaniesPage() {
  const queryClient = useQueryClient();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const employers = useQuery({
    queryKey: queryKeys.employers,
    queryFn: () => catalogService.employers().then((r) => r.data ?? []),
  });

  const verify = useMutation({
    mutationFn: (id: string) => {
      setActiveActionId(id);
      return adminService.verifyEmployer(id);
    },
    onSuccess: () => {
      setErrorMessage("");
      return queryClient.invalidateQueries({ queryKey: queryKeys.employers });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to verify employer.");
    },
    onSettled: () => {
      setActiveActionId(null);
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) => {
      setActiveActionId(id);
      return adminService.rejectEmployer(id);
    },
    onSuccess: () => {
      setErrorMessage("");
      return queryClient.invalidateQueries({ queryKey: queryKeys.employers });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Failed to reject employer.");
    },
    onSettled: () => {
      setActiveActionId(null);
    },
  });

  if (employers.isLoading) return <Spinner />;

  if (employers.isError) {
    return (
      <ErrorState
        message={employers.error?.message ?? "Unable to load company profiles."}
        onRetry={() => void employers.refetch()}
      />
    );
  }

  const companyList = employers.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-extrabold">Companies</h1>
        <p className="mt-1 text-sm text-muted">Verify or reject employer accounts.</p>
      </div>

      {/* Global Action Error Alert */}
      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {errorMessage}
        </p>
      ) : null}

      {/* Main Content Area */}
      {companyList.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-muted">No companies found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companyList.map((employer) => {
            const isProcessing = activeActionId === employer._id;
            const isVerified = employer.verificationStatus === "verified";

            return (
              <div
                key={employer._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-4 ring-1 ring-line"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{employer.name}</p>
                  <p className="text-sm text-muted">
                    {employer.industry ?? employer.headquarters ?? "No location or industry provided"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge tone={isVerified ? "green" : "amber"}>
                    {titleCase(employer.verificationStatus)}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={isProcessing || isVerified}
                      onClick={() => verify.mutate(employer._id)}
                    >
                      {isProcessing && verify.isPending ? "Verifying…" : "Verify"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isProcessing}
                      onClick={() => reject.mutate(employer._id)}
                    >
                      {isProcessing && reject.isPending ? "Rejecting…" : "Reject"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
