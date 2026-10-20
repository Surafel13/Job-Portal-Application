import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { ErrorState, Spinner } from "../../components/ui/States";
import { WorkerProfileOverview } from "../../components/worker/WorkerProfileOverview";
import { queryKeys } from "../../lib/queryKeys";
import { catalogService } from "../../services/jobs.service";
import { userService, workerService } from "../../services/platform.service";

export function WorkerOverviewPage() {
  const { userId = "" } = useParams();
  const user = useQuery({
    queryKey: queryKeys.userProfile(userId),
    enabled: Boolean(userId),
    queryFn: () => userService.byId(userId).then((response) => response.data),
  });
  const worker = useQuery({
    queryKey: queryKeys.workerProfile(userId),
    enabled: Boolean(userId),
    queryFn: () => workerService.byUserId(userId).then((response) => response.data),
  });
  const categories = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => catalogService.categories().then((response) => response.data ?? []),
  });

  if (user.isLoading || worker.isLoading || categories.isLoading) return <Spinner />;
  if (user.isError || worker.isError || categories.isError) {
    return (
      <ErrorState
        message={
          user.error?.message ??
          worker.error?.message ??
          categories.error?.message ??
          "Unable to load the worker profile."
        }
        onRetry={() => {
          void user.refetch();
          void worker.refetch();
          void categories.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/employer/applicants">
        <Button variant="outline" size="sm">Back to applicants</Button>
      </Link>
      {user.data && worker.data ? (
        <WorkerProfileOverview
          user={user.data}
          profile={worker.data}
          categories={categories.data ?? []}
        />
      ) : (
        <ErrorState message="Worker profile is unavailable." />
      )}
    </div>
  );
}
