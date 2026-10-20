import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Check, Lock, Minus, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States";
import { useUsersByRole } from "../../hooks/useSuperAdminData";
import { cn } from "../../lib/cn";
import { timeAgo, titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { superAdminService } from "../../services/superAdmin.service";
import { useAuthStore } from "../../store/authStore";
import type { User, UserRole, UserStatus } from "../../types/models";

const PAGE_SIZE = 10;

const roleTabs: { id: UserRole; label: string }[] = [
  { id: "worker", label: "Workers" },
  { id: "employer", label: "Employers" },
  { id: "admin", label: "Admins" },
  { id: "superAdmin", label: "Super admins" },
];

const roleTone: Record<UserRole, "blue" | "violet" | "pink" | "amber"> = {
  worker: "blue",
  employer: "violet",
  admin: "pink",
  superAdmin: "amber",
};

const statusTone: Record<UserStatus, "green" | "rose" | "amber"> = {
  active: "green",
  suspended: "rose",
  deactivated: "amber",
};

const statuses: UserStatus[] = ["active", "suspended", "deactivated"];

/** Derived from the route guards in server/src/modules/*. Read-only. */
const matrix: { label: string; hint: string; roles: UserRole[] }[] = [
  {
    label: "Browse and search jobs",
    hint: "Public endpoints",
    roles: ["worker", "employer", "admin", "superAdmin"],
  },
  {
    label: "Apply, save jobs and manage resumes",
    hint: "/application, /saved-job, /resumes",
    roles: ["worker"],
  },
  {
    label: "Create and edit job listings",
    hint: "/jobs",
    roles: ["employer", "admin"],
  },
  {
    label: "Review applicants and update status",
    hint: "/application/job/:id",
    roles: ["employer"],
  },
  {
    label: "Submit reports",
    hint: "POST /report",
    roles: ["worker", "employer"],
  },
  {
    label: "Verify employers, moderate jobs, suspend users",
    hint: "/admin/*",
    roles: ["admin"],
  },
  {
    label: "Review and resolve reports",
    hint: "/report (admin routes)",
    roles: ["admin"],
  },
  {
    label: "View applicant profiles",
    hint: "/applicants/:id",
    roles: ["admin", "superAdmin"],
  },
  {
    label: "Reindex semantic search",
    hint: "/semantic-search/reindex",
    roles: ["admin", "superAdmin"],
  },
];

export function UserRoleManagementPage() {
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [view, setView] = useState<"users" | "roles">("users");
  const [role, setRole] = useState<UserRole>("worker");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | UserStatus>("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const byRole: Record<UserRole, ReturnType<typeof useUsersByRole>> = {
    worker: useUsersByRole("worker"),
    employer: useUsersByRole("employer"),
    admin: useUsersByRole("admin"),
    superAdmin: useUsersByRole("superAdmin"),
  };
  const active = byRole[role];

  const changeStatus = useMutation({
    mutationFn: ({ user, next }: { user: User; next: UserStatus }) =>
      superAdminService.setUserStatus(user._id, next),
    onSuccess: (_res, { user, next }) => {
      setNotice({ tone: "ok", text: `${user.fullName} is now ${next}.` });
      return queryClient.invalidateQueries({ queryKey: queryKeys.usersByRole(user.role) });
    },
    onError: (error: Error) => setNotice({ tone: "error", text: error.message }),
  });

  const remove = useMutation({
    mutationFn: (user: User) => superAdminService.deleteUser(user._id),
    onSuccess: (_res, user) => {
      setNotice({ tone: "ok", text: `${user.fullName} was deleted.` });
      return queryClient.invalidateQueries({ queryKey: queryKeys.usersByRole(user.role) });
    },
    onError: (error: Error) => setNotice({ tone: "error", text: error.message }),
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (active.data ?? []).filter((user) => {
      if (status && user.status !== status) return false;
      if (!term) return true;
      return `${user.fullName} ${user.email}`.toLowerCase().includes(term);
    });
  }, [active.data, q, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);
  const busyId = changeStatus.isPending
    ? changeStatus.variables.user._id
    : remove.isPending
      ? remove.variables._id
      : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">User & Role Management</h1>
          <p className="text-muted">Manage accounts, access status and role permissions.</p>
        </div>
        <Button
          disabled
          title="The API doesn't support creating admin accounts yet"
          aria-label="Create admin (not available yet)"
        >
          <UserPlus className="h-4 w-4" /> Create admin
        </Button>
      </div>

      <div className="flex gap-2">
        {(
          [
            { id: "users", label: "Users" },
            { id: "roles", label: "Roles & permissions" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              view === tab.id ? "bg-brand-600 text-white" : "bg-white text-muted ring-1 ring-line",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {notice ? (
        <p
          role="status"
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            notice.tone === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600",
          )}
        >
          {notice.text}
        </p>
      ) : null}

      {view === "roles" ? (
        <PermissionsMatrix />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {roleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setRole(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  role === tab.id ? "bg-brand-100 text-brand-700" : "bg-white text-muted ring-1 ring-line",
                )}
              >
                {tab.label} ({byRole[tab.id].data?.length ?? "–"})
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email"
              className="rounded-full border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400"
            />
            <Select
              className="py-2.5"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as "" | UserStatus);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {titleCase(item)}
                </option>
              ))}
            </Select>
          </div>

          {role === "admin" || role === "superAdmin" ? (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Admin accounts are provisioned with the seed script. The API doesn't expose admin
              creation or role changes yet.
            </p>
          ) : null}

          {active.isLoading ? <Spinner label="Loading users" /> : null}
          {active.isError ? (
            <ErrorState
              message={(active.error as Error).message}
              onRetry={() => void active.refetch()}
            />
          ) : null}

          {!active.isLoading && !active.isError ? (
            <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
              <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_190px] gap-3 border-b border-line px-5 py-3 text-xs font-bold text-muted md:grid">
                <span>User</span>
                <span>Role</span>
                <span>Status</span>
                <span>Last login</span>
                <span>Actions</span>
              </div>
              {items.map((user) => {
                const locked = user._id === me?._id || user.role === "superAdmin";
                const busy = busyId === user._id;
                return (
                  <div
                    key={user._id}
                    className="grid items-center gap-3 border-b border-line px-5 py-4 last:border-0 md:grid-cols-[2fr_1fr_1fr_1fr_190px]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={user.fullName} src={user.profileImage} />
                      <div className="min-w-0">
                        <p className="truncate font-bold">{user.fullName}</p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                    <div>
                      <Badge tone={roleTone[user.role]}>{titleCase(user.role)}</Badge>
                    </div>
                    <div>
                      <Badge tone={statusTone[user.status]}>{titleCase(user.status)}</Badge>
                    </div>
                    <p className="text-sm text-muted">
                      {user.lastLogin ? timeAgo(user.lastLogin) : "Never"}
                    </p>
                    {locked ? (
                      <p className="flex items-center gap-1.5 text-xs text-muted">
                        <Lock className="h-3.5 w-3.5" />
                        {user._id === me?._id ? "Your account" : "Protected"}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Select
                          className="w-32 px-3 py-1.5"
                          value={user.status}
                          disabled={busy}
                          aria-label={`Status for ${user.fullName}`}
                          onChange={(e) =>
                            changeStatus.mutate({ user, next: e.target.value as UserStatus })
                          }
                        >
                          {statuses.map((item) => (
                            <option key={item} value={item}>
                              {titleCase(item)}
                            </option>
                          ))}
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          aria-label={`Delete ${user.fullName}`}
                          onClick={() => {
                            if (window.confirm(`Delete ${user.fullName}? This can't be undone.`)) {
                              remove.mutate(user);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              {items.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No users found"
                    description="Try a different search term or clear the status filter."
                  />
                </div>
              ) : null}
              {filtered.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm text-muted">
                  <span>
                    Showing {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of{" "}
                    {filtered.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={safePage <= 1}
                      onClick={() => setPage(safePage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage(safePage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </motion.div>
  );
}

function PermissionsMatrix() {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        This matrix is read-only. It reflects the route guards currently enforced by the API, and
        super admins aren't accepted by the /admin/* routes yet.
      </p>
      <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-bold text-muted">
              <th className="px-5 py-3">Capability</th>
              {roleTabs.map((tab) => (
                <th key={tab.id} className="px-3 py-3 text-center">
                  {titleCase(tab.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <p className="font-semibold">{row.label}</p>
                  <p className="text-xs text-muted">{row.hint}</p>
                </td>
                {roleTabs.map((tab) => (
                  <td key={tab.id} className="px-3 py-3 text-center">
                    {row.roles.includes(tab.id) ? (
                      <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Allowed" />
                    ) : (
                      <Minus className="mx-auto h-4 w-4 text-slate-300" aria-label="Not allowed" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
