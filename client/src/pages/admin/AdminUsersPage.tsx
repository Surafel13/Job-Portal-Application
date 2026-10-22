import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/States";
import { titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { adminService } from "../../services/platform.service";
import type { User, UserRole } from "../../types/models";

const ROLES: UserRole[] = ["worker", "employer", "admin"];

export function AdminUsersPage() {
  const [role, setRole] = useState<UserRole>("worker");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: queryKeys.usersByRole(role),
    queryFn: () => adminService.usersByRole(role).then((r) => r.data ?? []),
  });

  const suspendMutation = useMutation({
    mutationFn: (user: User) =>
      user.status === "suspended"
        ? adminService.unsuspendUser(user._id)
        : adminService.suspendUser(user._id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.usersByRole(role) }),
  });

  const filteredUsers = useMemo(() => {
    const list = usersQuery.data ?? [];
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter((user) =>
      `${user.fullName} ${user.email}`.toLowerCase().includes(query),
    );
  }, [usersQuery.data, searchQuery]);

  return (
    <div>
      {/* Header section with title and search input */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Users Management</h1>
          <p className="text-muted">Manage all platform users.</p>
        </div>
        <UserSearchInput value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Role filter buttons */}
      <div className="mt-4 flex gap-2">
        <UserRoleTabs roles={ROLES} activeRole={role} onSelectRole={setRole} />
      </div>

      {/* Loading state indicator */}
      {usersQuery.isLoading ? <Spinner /> : null}

      {/* User list container */}
      <div className="mt-5 overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        {filteredUsers.map((user) => (
          <UserRow
            key={user._id}
            user={user}
            onToggleSuspend={(u) => suspendMutation.mutate(u)}
            isMutating={
              suspendMutation.isPending &&
              suspendMutation.variables?._id === user._id
            }
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sub-Components                                */
/* -------------------------------------------------------------------------- */

interface UserSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

function UserSearchInput({ value, onChange }: UserSearchInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search"
      className="rounded-full border border-line px-4 py-2 text-sm"
    />
  );
}

interface UserRoleTabsProps {
  roles: UserRole[];
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

function UserRoleTabs({ roles, activeRole, onSelectRole }: UserRoleTabsProps) {
  return (
    <>
      {roles.map((roleItem) => {
        const isActive = activeRole === roleItem;
        return (
          <button
            key={roleItem}
            type="button"
            onClick={() => onSelectRole(roleItem)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              isActive ? "bg-brand-600 text-white" : "bg-white ring-1 ring-line"
            }`}
          >
            {roleItem}s
          </button>
        );
      })}
    </>
  );
}

interface UserRowProps {
  user: User;
  onToggleSuspend: (user: User) => void;
  isMutating?: boolean;
}

function UserRow({ user, onToggleSuspend, isMutating = false }: UserRowProps) {
  const isSuspended = user.status === "suspended";

  return (
    <div className="grid items-center gap-3 border-b border-line px-5 py-4 last:border-0 md:grid-cols-[2fr_1.4fr_1fr_1fr_auto]">
      <div>
        <p className="font-bold">{user.fullName}</p>
        <p className="text-xs text-muted">{user.email}</p>
      </div>
      <p className="text-sm capitalize text-muted">{user.role}</p>
      <Badge tone={user.status === "active" ? "green" : "rose"}>
        {titleCase(user.status)}
      </Badge>
      <p className="text-sm text-muted">{user.location ?? "—"}</p>
      <Button
        size="sm"
        variant="outline"
        disabled={isMutating}
        onClick={() => onToggleSuspend(user)}
      >
        {isSuspended ? "Unsuspend" : "Suspend"}
      </Button>
    </div>
  );
}
