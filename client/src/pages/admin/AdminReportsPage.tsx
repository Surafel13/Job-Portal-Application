import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field, Select, Textarea } from "../../components/ui/Input";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/States";
import { formatDate, titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { reportService } from "../../services/platform.service";
import { useAuthStore } from "../../store/authStore";
import type {
  PersonRef,
  Report,
  ReportResourceType,
  ReportStatus,
} from "../../types/models";

const STATUSES: ReportStatus[] = [
  "pending",
  "reviewing",
  "resolved",
  "rejected",
];

const TYPES: ReportResourceType[] = ["user", "employer", "job", "content"];

const REASONS = [
  "spam",
  "fraud",
  "inappropriate_content",
  "misleading_information",
  "harassment",
  "scam",
  "duplicate",
  "other",
];

const tone: Record<ReportStatus, "amber" | "blue" | "green" | "slate"> = {
  pending: "amber",
  reviewing: "blue",
  resolved: "green",
  rejected: "slate",
};

const statusLabel = (status: ReportStatus) =>
  status === "rejected" ? "Dismissed" : titleCase(status);

const person = (ref?: string | PersonRef): PersonRef | null =>
  !ref ? null : typeof ref === "string" ? { _id: ref } : ref;

const personName = (p: PersonRef | null) =>
  p?.fullName ?? (p ? `User ${p._id.slice(-6)}` : "—");

type Action = "review" | "resolve" | "dismiss" | "delete";

type ReportActionResponse = {
  data?: Report;
  message: string;
  meta?: Record<string, unknown>;
};

const statusIcons = {
  pending: Clock3,
  reviewing: ShieldCheck,
  resolved: CheckCircle2,
  rejected: XCircle,
};

export function AdminReportsPage() {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === "superAdmin";

  const [status, setStatus] = useState<"" | ReportStatus>("");
  const [type, setType] = useState<"" | ReportResourceType>("");
  const [reason, setReason] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const reports = useQuery({
    queryKey: queryKeys.reports,
    queryFn: () => reportService.all().then((r) => r.data ?? []),
  });

  const all = useMemo(() => reports.data ?? [], [reports.data]);

  const counts = useMemo(() => {
    const result: Record<ReportStatus, number> = {
      pending: 0,
      reviewing: 0,
      resolved: 0,
      rejected: 0,
    };

    for (const report of all) {
      result[report.status] += 1;
    }

    return result;
  }, [all]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return all.filter((report) => {
      if (status && report.status !== status) return false;
      if (type && report.resourceType !== type) return false;
      if (reason && report.reason !== reason) return false;

      if (needle) {
        const reporter = person(report.reporterId);

        const searchable = [
          report.description,
          report.reason,
          report.resourceId,
          reporter?.fullName,
          reporter?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(needle)) return false;
      }

      return true;
    });
  }, [all, status, type, reason, q]);

  const selected = all.find((report) => report._id === selectedId) ?? null;

  const act = useMutation<
    ReportActionResponse,
    Error,
    { id: string; action: Action; text?: string }
  >({
    mutationFn: async ({ id, action, text }) => {
      if (action === "review") return reportService.start(id);
      if (action === "resolve") return reportService.resolve(id, text ?? "");
      if (action === "dismiss") return reportService.reject(id, text ?? "");
      return reportService.remove(id);
    },
    onSuccess: (_response, variables) => {
      const messages: Record<Action, string> = {
        review: "Review started.",
        resolve: "Report resolved.",
        dismiss: "Report dismissed.",
        delete: "Report deleted.",
      };

      setNotice(messages[variables.action]);
      setFormError("");
      setDecision("");

      if (variables.action === "delete") {
        setSelectedId(null);
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.reports,
      });
    },
    onError: (error) => {
      setNotice("");
      setFormError(error.message);

      void queryClient.invalidateQueries({
        queryKey: queryKeys.reports,
      });
    },
  });

  const selectReport = (id: string) => {
    setSelectedId(id);
    setDecision("");
    setFormError("");
    setNotice("");
  };

  const runAction = (action: Action) => {
    if (!selected) return;

    setFormError("");
    setNotice("");

    if (action === "resolve" || action === "dismiss") {
      const text = decision.trim();

      if (!text) {
        setFormError("A decision note is required.");
        return;
      }

      if (text.length > 2000) {
        setFormError("Decision must be 2000 characters or fewer.");
        return;
      }

      act.mutate({
        id: selected._id,
        action,
        text,
      });

      return;
    }

    if (
      action === "delete" &&
      !window.confirm("Permanently delete this report?")
    ) {
      return;
    }

    act.mutate({
      id: selected._id,
      action,
    });
  };

  const clearFilters = () => {
    setStatus("");
    setType("");
    setReason("");
    setQ("");
  };

  if (reports.isLoading) {
    return <Spinner label="Loading reports" />;
  }

  if (reports.isError) {
    return (
      <ErrorState
        message={(reports.error as Error).message}
        onRetry={() => void reports.refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            Review and manage reports submitted by users.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-white px-3 py-2">
          <p className="text-xs text-muted">Total reports</p>
          <p className="text-xl font-bold">{all.length}</p>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-3">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Status
          </span>

          {STATUSES.map((item) => {
            const Icon = statusIcons[item];
            const active = status === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(active ? "" : item)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-line text-muted hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {statusLabel(item)}
                <span
                  className={`rounded-md px-1.5 py-0.5 ${
                    active ? "bg-white" : "bg-gray-100"
                  }`}
                >
                  {counts[item]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_160px_150px_auto]">
          <div className="flex min-w-0 items-center rounded-xl border border-line px-3 py-2 focus-within:border-brand-600">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search reports..."
              aria-label="Search reports"
              className="ml-2 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>

          <Select
            value={type}
            onChange={(event) =>
              setType(event.target.value as "" | ReportResourceType)
            }
          >
            <option value="">All types</option>
            {TYPES.map((item) => (
              <option key={item} value={item}>
                {titleCase(item)}
              </option>
            ))}
          </Select>

          <Select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            <option value="">All reasons</option>
            {REASONS.map((item) => (
              <option key={item} value={item}>
                {titleCase(item)}
              </option>
            ))}
          </Select>

          <Select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "" | ReportStatus)
            }
          >
            <option value="">All statuses</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {statusLabel(item)}
              </option>
            ))}
          </Select>

          {(status || type || reason || q) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="self-center"
            >
              Clear
            </Button>
          )}
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">Submitted reports</h2>
            <span className="text-xs text-muted">
              {filtered.length} results
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No reports found"
                description={
                  all.length === 0
                    ? "No reports have been submitted yet."
                    : "Try changing your search or filters."
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filtered.map((report) => {
                const reporter = person(report.reporterId);
                const active = selectedId === report._id;

                return (
                  <button
                    key={report._id}
                    type="button"
                    onClick={() => selectReport(report._id)}
                    aria-pressed={active}
                    className={`block w-full border-l-2 px-4 py-3 text-left transition hover:bg-gray-50 ${
                      active
                        ? "border-l-brand-600 bg-brand-50/50"
                        : "border-l-transparent"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={tone[report.status]}>
                          {statusLabel(report.status)}
                        </Badge>
                        <span className="text-xs text-muted">
                          {titleCase(report.resourceType)}
                        </span>
                      </div>

                      <span className="text-xs text-muted">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold">
                      {titleCase(report.reason).replaceAll("_", " ")}
                    </p>

                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {report.description || "No description provided."}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted">
                        By {personName(reporter)}
                      </span>

                      <span className="max-w-[50%] truncate text-xs text-muted">
                        ID: {report.resourceId}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="min-w-0 rounded-2xl border border-line bg-white lg:sticky lg:top-24">
          {!selected ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <ShieldCheck className="h-5 w-5 text-muted" />
              </div>
              <h2 className="mt-3 text-sm font-semibold">Report details</h2>
              <p className="mt-1 text-sm text-muted">
                Select a report to review its details and take action.
              </p>
            </div>
          ) : (
            <ReportDetail
              key={selected._id}
              report={selected}
              decision={decision}
              onDecision={setDecision}
              busy={act.isPending}
              error={formError}
              notice={notice}
              canDelete={isSuperAdmin}
              onAction={runAction}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function ReportDetail({
  report,
  decision,
  onDecision,
  busy,
  error,
  notice,
  canDelete,
  onAction,
}: {
  report: Report;
  decision: string;
  onDecision: (value: string) => void;
  busy: boolean;
  error: string;
  notice: string;
  canDelete: boolean;
  onAction: (action: Action) => void;
}) {
  const reporter = person(report.reporterId);
  const reviewer = person(report.adminId);

  const open =
    report.status === "pending" || report.status === "reviewing";

  return (
    <div className="divide-y divide-line">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted">REPORT DETAILS</p>
          <h2 className="mt-1 break-words text-lg font-bold">
            {titleCase(report.reason).replaceAll("_", " ")}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Submitted {formatDate(report.createdAt)}
          </p>
        </div>

        <Badge tone={tone[report.status]}>{statusLabel(report.status)}</Badge>
      </div>

      <div className="space-y-4 p-4">
        <DetailRow label="Resource type" value={titleCase(report.resourceType)} />

        <div>
          <p className="text-xs font-medium text-muted">Resource ID</p>
          <p className="mt-1 break-all text-sm">
            {report.resourceType === "job" ? (
              <Link
                to={`/jobs/${report.resourceId}`}
                className="text-brand-700 hover:underline"
              >
                {report.resourceId}
              </Link>
            ) : (
              report.resourceId
            )}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted">Reported by</p>
          <p className="mt-1 text-sm font-medium">{personName(reporter)}</p>
          {reporter?.email && (
            <p className="mt-0.5 break-all text-xs text-muted">
              {reporter.email}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-muted">Description</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-muted">
            {report.description || "No description provided."}
          </p>
        </div>

        {!open && (
          <>
            <div>
              <p className="text-xs font-medium text-muted">Decision</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                {report.adminDecision || "No decision note provided."}
              </p>
            </div>

            <DetailRow
              label="Reviewed by"
              value={personName(reviewer)}
            />

            <DetailRow
              label="Reviewed on"
              value={formatDate(report.reviewedAt)}
            />
          </>
        )}
      </div>

      {open && (
        <div className="space-y-3 p-4">
          {report.status === "pending" && (
            <Button
              variant="outline"
              className="w-full"
              disabled={busy}
              onClick={() => onAction("review")}
            >
              <ShieldCheck className="h-4 w-4" />
              Start review
            </Button>
          )}

          <Field label="Decision note">
            <Textarea
              rows={3}
              maxLength={2000}
              value={decision}
              onChange={(event) => onDecision(event.target.value)}
              placeholder="Explain why this report is resolved or dismissed..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={busy}
              onClick={() => onAction("resolve")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Resolve
            </Button>

            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => onAction("dismiss")}
            >
              <XCircle className="h-4 w-4" />
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {canDelete && (
        <div className="p-4">
          <Button
            variant="danger"
            size="sm"
            className="w-full"
            disabled={busy}
            onClick={() => onAction("delete")}
          >
            <Trash2 className="h-4 w-4" />
            Delete report
          </Button>
        </div>
      )}

      {(error || notice) && (
        <div className="px-4 py-3">
          {error && (
            <p role="alert" className="text-sm text-rose-500">
              {error}
            </p>
          )}

          {notice && (
            <p role="status" className="text-sm text-brand-700">
              {notice}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 break-words text-sm">{value}</p>
    </div>
  );
}
