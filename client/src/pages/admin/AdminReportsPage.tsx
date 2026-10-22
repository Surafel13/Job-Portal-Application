import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
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
const statusLabel = (s: ReportStatus) =>
  s === "rejected" ? "Dismissed" : titleCase(s);

const person = (ref?: string | PersonRef): PersonRef | null =>
  !ref ? null : typeof ref === "string" ? { _id: ref } : ref;
const personName = (p: PersonRef | null) =>
  p?.fullName ?? (p ? `User ${p._id.slice(-6)}` : "—");

type Action = "review" | "resolve" | "dismiss" | "delete";

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
    const base: Record<ReportStatus, number> = {
      pending: 0,
      reviewing: 0,
      resolved: 0,
      rejected: 0,
    };
    for (const r of all) base[r.status] += 1;
    return base;
  }, [all]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((r) => {
      if (status && r.status !== status) return false;
      if (type && r.resourceType !== type) return false;
      if (reason && r.reason !== reason) return false;
      if (needle) {
        const reporter = person(r.reporterId);
        const hay = [
          r.description,
          r.reason,
          r.resourceId,
          reporter?.fullName,
          reporter?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [all, status, type, reason, q]);

  const selected = all.find((r) => r._id === selectedId) ?? null;

  type ReportActionResponse = {
    data?: Report;
    message: string;
    meta?: Record<string, unknown>;
  };

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
    onSuccess: (_res, vars) => {
      const messages: Record<Action, string> = {
        review: "Review started.",
        resolve: "Report resolved.",
        dismiss: "Report dismissed.",
        delete: "Report deleted.",
      };

      setNotice(messages[vars.action]);
      setFormError("");
      setDecision("");

      if (vars.action === "delete") setSelectedId(null);

      void queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    },
    onError: (error: Error) => {
      setNotice("");
      setFormError(error.message);
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });

  const run = (action: Action) => {
    if (!selected) return;
    setFormError("");
    setNotice("");

    if (action === "resolve" || action === "dismiss") {
      const text = decision.trim();
      if (!text) return setFormError("A decision note is required.");
      if (text.length > 2000)
        return setFormError("Decision must be 2000 characters or fewer.");
      act.mutate({ id: selected._id, action, text });
      return;
    }
    if (
      action === "delete" &&
      !window.confirm("Permanently delete this report?")
    )
      return;
    act.mutate({ id: selected._id, action });
  };

  const select = (id: string) => {
    setSelectedId(id);
    setDecision("");
    setFormError("");
    setNotice("");
  };

  if (reports.isLoading) return <Spinner label="Loading reports" />;
  if (reports.isError) {
    return (
      <ErrorState
        message={(reports.error as Error).message}
        onRetry={() => void reports.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Reports</h1>
        <p className="text-muted">
          Review, resolve, or dismiss user-submitted reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(status === s ? "" : s)}
            className={`rounded-3xl bg-white p-5 text-left ring-1 transition hover:shadow-md ${
              status === s ? "ring-2 ring-brand-600" : "ring-line"
            }`}
          >
            <p className="text-sm text-muted">{statusLabel(s)}</p>
            <p className="mt-2 text-3xl font-extrabold">{counts[s]}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center rounded-full border border-line bg-white px-3 py-2">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reporter, description, resource ID"
            className="ml-2 w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | ReportStatus)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as "" | ReportResourceType)}
          >
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {titleCase(t)}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-52">
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">All reasons</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {titleCase(r)}
              </option>
            ))}
          </Select>
        </div>
        {(status || type || reason || q) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatus("");
              setType("");
              setReason("");
              setQ("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-3">
          {filtered.map((r) => {
            const reporter = person(r.reporterId);
            return (
              <button
                key={r._id}
                onClick={() => select(r._id)}
                className={`block w-full rounded-3xl bg-white p-4 text-left ring-1 transition hover:shadow-md ${
                  selectedId === r._id ? "ring-2 ring-brand-600" : "ring-line"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={tone[r.status]}>{statusLabel(r.status)}</Badge>
                    <Badge tone="slate">{titleCase(r.resourceType)}</Badge>
                    <Badge tone="rose">{titleCase(r.reason)}</Badge>
                  </div>
                  <span className="text-xs text-muted">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {r.description || "No description provided."}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Reported by {personName(reporter)}
                </p>
              </button>
            );
          })}
          {filtered.length === 0 ? (
            <EmptyState
              title="No reports found"
              description={
                all.length === 0
                  ? "No reports have been submitted yet."
                  : "No reports match the current filters."
              }
            />
          ) : null}
        </section>

        <aside className="h-fit rounded-3xl bg-white p-5 ring-1 ring-line lg:sticky lg:top-24">
          {!selected ? (
            <p className="py-10 text-center text-sm text-muted">
              Select a report to review it.
            </p>
          ) : (
            <ReportDetail
              report={selected}
              decision={decision}
              onDecision={setDecision}
              busy={act.isPending}
              error={formError}
              notice={notice}
              canDelete={isSuperAdmin}
              onAction={run}
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
  onDecision: (v: string) => void;
  busy: boolean;
  error: string;
  notice: string;
  canDelete: boolean;
  onAction: (a: Action) => void;
}) {
  const reporter = person(report.reporterId);
  const reviewer = person(report.adminId);
  const open = report.status === "pending" || report.status === "reviewing";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-bold">Report details</h2>
        <Badge tone={tone[report.status]}>{statusLabel(report.status)}</Badge>
      </div>

      <dl className="space-y-3 text-sm">
        <Row label="Reason" value={titleCase(report.reason)} />
        <Row label="Reported" value={formatDate(report.createdAt)} />
        <div>
          <dt className="text-xs uppercase text-muted">Reporter</dt>
          <dd>
            {personName(reporter)}
            {reporter?.email ? (
              <span className="block text-xs text-muted">{reporter.email}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted">
            Reported {report.resourceType}
          </dt>
          <dd className="break-all">
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
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted">Description</dt>
          <dd className="whitespace-pre-wrap text-muted">
            {report.description || "No description provided."}
          </dd>
        </div>
        {!open ? (
          <>
            <div>
              <dt className="text-xs uppercase text-muted">Decision</dt>
              <dd className="whitespace-pre-wrap">
                {report.adminDecision ?? "—"}
              </dd>
            </div>
            <Row label="Reviewed by" value={personName(reviewer)} />
            <Row label="Reviewed on" value={formatDate(report.reviewedAt)} />
          </>
        ) : null}
      </dl>

      {open ? (
        <div className="space-y-3 border-t border-line pt-4">
          {report.status === "pending" ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={busy}
              onClick={() => onAction("review")}
            >
              Start review
            </Button>
          ) : null}
          <Field label="Decision note (required to resolve or dismiss)">
            <Textarea
              rows={4}
              maxLength={2000}
              value={decision}
              onChange={(e) => onDecision(e.target.value)}
              placeholder="Explain the outcome…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={busy} onClick={() => onAction("resolve")}>
              Resolve
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => onAction("dismiss")}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      {canDelete ? (
        <Button
          variant="danger"
          size="sm"
          className="w-full"
          disabled={busy}
          onClick={() => onAction("delete")}
        >
          <Trash2 className="h-4 w-4" /> Delete report
        </Button>
      ) : null}

      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      {notice ? <p className="text-sm text-brand-700">{notice}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
