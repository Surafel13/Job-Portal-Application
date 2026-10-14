import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/States";
import { titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { adminService } from "../../services/platform.service";
import type { User, UserRole } from "../../types/models";

const roles: UserRole[] = ["worker", "employer", "admin"];

export function AdminUsersPage() {
  const [role, setRole] = useState<UserRole>("worker");
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();

  const users = useQuery({
    queryKey: queryKeys.usersByRole(role),
    queryFn: () => adminService.usersByRole(role).then((r) => r.data ?? []),
  });

  const suspend = useMutation({
    mutationFn: (user: User) =>
      user.status === "suspended"
        ? adminService.unsuspendUser(user._id)
        : adminService.suspendUser(user._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.usersByRole(role) }),
  });

  const filtered = useMemo(() => {
    const list = users.data ?? [];
    if (!q) return list;
    return list.filter((user) =>
      `${user.fullName} ${user.email}`.toLowerCase().includes(q.toLowerCase()),
    );
  }, [users.data, q]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Users Management</h1>
          <p className="text-muted">Manage all platform users.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="rounded-full border border-line px-4 py-2 text-sm"
        />
      </div>
      <div className="mt-4 flex gap-2">
        {roles.map((item) => (
          <button
            key={item}
            onClick={() => setRole(item)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              role === item ? "bg-brand-600 text-white" : "bg-white ring-1 ring-line"
            }`}
          >
            {item}s
          </button>
        ))}
      </div>
      {users.isLoading ? <Spinner /> : null}
      <div className="mt-5 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        {filtered.map((user) => (
          <div
            key={user._id}
            className="grid items-center gap-3 border-b border-line px-5 py-4 last:border-0 md:grid-cols-[2fr_1.4fr_1fr_1fr_auto]"
          >
            <div>
              <p className="font-bold">{user.fullName}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <p className="text-sm capitalize text-muted">{user.role}</p>
            <Badge tone={user.status === "active" ? "green" : "rose"}>{titleCase(user.status)}</Badge>
            <p className="text-sm text-muted">{user.location ?? "—"}</p>
            <Button size="sm" variant="outline" onClick={() => suspend.mutate(user)}>
              {user.status === "suspended" ? "Unsuspend" : "Suspend"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
