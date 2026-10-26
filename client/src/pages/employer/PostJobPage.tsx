import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LoaderCircle,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select, Textarea } from "../../components/ui/Input";
import { ErrorState, Spinner } from "../../components/ui/States";
import { findMyEmployer } from "../../lib/employer";
import { titleCase } from "../../lib/format";
import { extractPartialJobDescription } from "../../lib/partialJobDescription";
import { queryKeys } from "../../lib/queryKeys";
import { catalogService, jobsService } from "../../services/jobs.service";
import { isAbortError } from "../../lib/streamRequest";
import { useAuthStore } from "../../store/authStore";
import type {
  EducationLevel,
  EmploymentType,
  ExperienceLevel,
  Job,
} from "../../types/models";

const EMPLOYMENT_TYPES: EmploymentType[] = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "freelance",
];
const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "entry",
  "junior",
  "mid",
  "senior",
  "lead",
];
const EDUCATION_LEVELS: EducationLevel[] = [
  "high-school",
  "certificate",
  "diploma",
  "bachelor",
  "master",
  "phd",
];

const MAX_AI_SKILLS = 15;
const MIN_AI_TITLE_LENGTH = 2;
const MIN_DESCRIPTION_LENGTH = 20;

type Intent = "draft" | "publish" | "save";

interface JobFormState {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  location: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  categoryId: string;
  skills: string[];
  min: string;
  max: string;
  deadline: string;
}

/* -------------------------------------------------------------------------- */
/*                         Helpers                                            */
/* -------------------------------------------------------------------------- */

const idOf = (value: string | { _id: string }) =>
  typeof value === "string" ? value : value._id;

function splitLines(value: string) {
  const items = value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : ["See job description"];
}

function jobToForm(job?: Job): JobFormState {
  return {
    title: job?.title ?? "",
    description: job?.description ?? "",
    requirements: job?.requirements.join("\n") ?? "",
    responsibilities: job?.responsibilities.join("\n") ?? "",
    location: job?.location ?? "",
    employmentType: job?.employmentType ?? "full-time",
    experienceLevel: job?.experienceLevel ?? "mid",
    educationLevel: job?.educationLevel ?? "bachelor",
    categoryId: job ? idOf(job.categoryId) : "",
    skills: job?.skills.map(idOf) ?? [],
    min: job?.salary?.minimum?.toString() ?? "",
    max: job?.salary?.maximum?.toString() ?? "",
    deadline: job?.deadline ? job.deadline.slice(0, 10) : "",
  };
}

function buildJobPayload(form: JobFormState, currency: string) {
  return {
    title: form.title,
    description: form.description,
    requirements: splitLines(form.requirements),
    responsibilities: splitLines(form.responsibilities),
    location: form.location,
    employmentType: form.employmentType,
    experienceLevel: form.experienceLevel,
    educationLevel: form.educationLevel,
    categoryId: form.categoryId,
    skills: form.skills,
    ...(form.min || form.max
      ? {
          salary: {
            minimum: form.min ? Number(form.min) : undefined,
            maximum: form.max ? Number(form.max) : undefined,
            currency,
          },
        }
      : {}),
  };
}

/* -------------------------------------------------------------------------- */
/*                         Route components                                   */
/* -------------------------------------------------------------------------- */

export function PostJobPage() {
  return <JobForm />;
}

export function EditJobPage() {
  const { id = "" } = useParams();
  const query = useQuery({
    queryKey: queryKeys.job(id),
    enabled: Boolean(id),
    queryFn: () => jobsService.getById(id).then((r) => r.data),
  });

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <Spinner label="Loading job details" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          message={(query.error as Error | null)?.message ?? "Job not found."}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }
  return <JobForm key={query.data._id} job={query.data} />;
}

/* -------------------------------------------------------------------------- */
/*                         Form                                               */
/* -------------------------------------------------------------------------- */

function JobForm({ job }: { job?: Job }) {
  const editing = Boolean(job);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<JobFormState>(() => jobToForm(job));
  const [error, setError] = useState("");
  const [aiNotice, setAiNotice] = useState("");

  const initialDeadline = job?.deadline ? job.deadline.slice(0, 10) : "";

  const setField = <K extends keyof JobFormState>(
    key: K,
    value: JobFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  /* ---------- Reference data ---------- */

  const categories = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => catalogService.categories().then((r) => r.data ?? []),
  });
  const skillList = useQuery({
    queryKey: queryKeys.skills,
    queryFn: () => catalogService.skills().then((r) => r.data ?? []),
  });
  const employers = useQuery({
    queryKey: queryKeys.employers,
    queryFn: () => catalogService.employers().then((r) => r.data ?? []),
  });

  const company = findMyEmployer(employers.data ?? [], user?._id);
  const verified = company?.verificationStatus === "verified";
  const showUnverified = !employers.isLoading && !verified;

  const status = job?.status;
  const canPublishFromEdit =
    editing &&
    (status === "draft" || status === "closed" || status === "expired");

  const selectedSkillNames = useMemo(() => {
    const namesById = new Map(
      (skillList.data ?? []).map((skill) => [skill._id, skill.name]),
    );
    return form.skills
      .map((id) => namesById.get(id))
      .filter((name): name is string => Boolean(name));
  }, [skillList.data, form.skills]);

  /* ---------- Save / publish ---------- */

  const save = useMutation({
    mutationFn: async (intent: Intent) => {
      if (!verified) {
        throw new Error(
          "Your employer account must be verified before you can post jobs.",
        );
      }
      if (!company?._id) {
        throw new Error("No employer profile found for this account.");
      }
      if (form.description.trim().length < MIN_DESCRIPTION_LENGTH) {
        throw new Error(
          `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`,
        );
      }

      const base = buildJobPayload(form, job?.salary?.currency ?? "USD");

      if (!job) {
        return jobsService.create({
          ...base,
          companyId: company._id,
          deadline: form.deadline || undefined,
          status: intent === "publish" ? "published" : "draft",
        });
      }

      await jobsService.update(job._id, {
        ...base,
        ...(form.deadline && form.deadline !== initialDeadline
          ? { deadline: form.deadline }
          : {}),
      });
      if (intent === "publish") {
        return jobsService.updateStatus(job._id, "published");
      }
      return undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      if (job) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.job(job._id),
        });
      }
      await navigate("/employer");
    },
    onError: (err: Error) => setError(err.message),
  });

  /* ---------- AI generation ---------- */

  const abortRef = useRef<AbortController | null>(null);
  const snapshotRef = useRef<Pick<
    JobFormState,
    "description" | "requirements" | "responsibilities"
  > | null>(null);

  // Cancel any in-flight stream if the user leaves the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = useMutation({
    mutationFn: async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      snapshotRef.current = {
        description: form.description,
        requirements: form.requirements,
        responsibilities: form.responsibilities,
      };

      let raw = "";
      try {
        return await jobsService.streamDescription(
          {
            title: form.title.trim(),
            skills: selectedSkillNames,
            experienceLevel: form.experienceLevel,
            employmentType: form.employmentType,
          },
          {
            signal: controller.signal,
            onChunk: (text) => {
              if (controller.signal.aborted) return;
              raw += text;
              const partial = extractPartialJobDescription(raw);
              setForm((prev) => ({
                ...prev,
                description: partial.description,
                requirements: partial.requirements.join("\n"),
                responsibilities: partial.responsibilities.join("\n"),
              }));
            },
          },
        );
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    onSuccess: (res) => {
      snapshotRef.current = null;
      setForm((prev) => ({
        ...prev,
        description: res.description,
        requirements: res.requirements.join("\n"),
        responsibilities: res.responsibilities.join("\n"),
      }));
      setError("");
      setAiNotice(
        "AI draft generated successfully. Review and edit before publishing.",
      );
    },
    onError: (err: Error) => {
      const snapshot = snapshotRef.current;
      snapshotRef.current = null;
      if (snapshot) setForm((prev) => ({ ...prev, ...snapshot }));

      if (isAbortError(err)) {
        setError("");
        setAiNotice("Generation stopped. Previous text was restored.");
        return;
      }
      setAiNotice("");
      setError(err.message);
    },
  });

  const generateHint = !verified
    ? "Your employer account must be verified to use AI features."
    : form.title.trim().length < MIN_AI_TITLE_LENGTH
      ? "Enter a job title first."
      : selectedSkillNames.length === 0
        ? "Select at least one skill."
        : selectedSkillNames.length > MAX_AI_SKILLS
          ? `Select no more than ${MAX_AI_SKILLS} skills.`
          : "";

  const handleGenerate = () => {
    const hasContent =
      form.description.trim() ||
      form.requirements.trim() ||
      form.responsibilities.trim();

    if (
      hasContent &&
      !window.confirm(
        "Replace the current description, requirements and responsibilities with AI-generated content?",
      )
    ) {
      return;
    }

    setError("");
    setAiNotice("");
    generate.mutate();
  };

  /* ---------- Render ---------- */

  const busy = save.isPending || generate.isPending;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Form Column */}
        <form
          className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            const submitter = (event.nativeEvent as SubmitEvent).submitter;
            const intent = (submitter?.getAttribute("value") ??
              "save") as Intent;
            save.mutate(intent);
          }}
        >
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {editing ? "Edit Job Listing" : "Post a New Job"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Verified employers publish instantly, with no admin approval
              needed. You can also save as a draft to finish later.
            </p>
          </div>

          {showUnverified ? (
            <div
              role="alert"
              className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed"
            >
              <span className="font-semibold">Notice:</span> Your employer
              account must be verified by an admin before you can create, edit,
              or publish jobs.
            </div>
          ) : null}

          {status === "rejected" ? (
            <div
              role="alert"
              className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700"
            >
              This job was rejected by an administrator. You can edit it, but it
              cannot be published.
            </div>
          ) : null}

          <AiAssistPanel
            disabled={Boolean(generateHint) || generate.isPending}
            pending={generate.isPending}
            hint={generateHint}
            notice={aiNotice}
            onGenerate={handleGenerate}
            onCancel={() => abortRef.current?.abort()}
          />

          <Field label="Job Title">
            <Input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
              required
            />
          </Field>

          <Field label="Description">
            <Textarea
              rows={6}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              readOnly={generate.isPending}
              placeholder="Describe the role, responsibilities, and team culture..."
              className="resize-y"
              required
            />
          </Field>

          <Field label="Requirements (one per line)">
            <Textarea
              rows={4}
              value={form.requirements}
              onChange={(e) => setField("requirements", e.target.value)}
              readOnly={generate.isPending}
              placeholder="e.g. 5+ years experience with React&#10;Strong understanding of TypeScript"
              className="resize-y"
              required
            />
          </Field>

          <Field label="Responsibilities (one per line)">
            <Textarea
              rows={4}
              value={form.responsibilities}
              onChange={(e) => setField("responsibilities", e.target.value)}
              readOnly={generate.isPending}
              placeholder="e.g. Lead UI architecture decisions&#10;Mentor junior developers"
              className="resize-y"
              required
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="e.g. Remote, San Francisco, CA"
                required
              />
            </Field>

            <OptionSelect
              label="Employment type"
              value={form.employmentType}
              options={EMPLOYMENT_TYPES}
              onChange={(value) => setField("employmentType", value)}
            />

            <OptionSelect
              label="Experience level"
              value={form.experienceLevel}
              options={EXPERIENCE_LEVELS}
              onChange={(value) => setField("experienceLevel", value)}
            />

            <OptionSelect
              label="Education level"
              value={form.educationLevel}
              options={EDUCATION_LEVELS}
              onChange={(value) => setField("educationLevel", value)}
            />

            <Field label="Category">
              <Select
                value={form.categoryId}
                onChange={(e) => setField("categoryId", e.target.value)}
                required
              >
                <option value="">Select category</option>
                {(categories.data ?? []).map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Application deadline">
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setField("deadline", e.target.value)}
              />
            </Field>

            <Field label="Minimum salary (USD)">
              <Input
                type="number"
                value={form.min}
                onChange={(e) => setField("min", e.target.value)}
                placeholder="e.g. 80000"
              />
            </Field>

            <Field label="Maximum salary (USD)">
              <Input
                type="number"
                value={form.max}
                onChange={(e) => setField("max", e.target.value)}
                placeholder="e.g. 120000"
              />
            </Field>
          </div>

          <Field label="Required skills">
            <SkillsPicker
              skills={skillList.data ?? []}
              value={form.skills}
              max={MAX_AI_SKILLS}
              onChange={(next) => setField("skills", next)}
            />
          </Field>

          {error ? (
            <p
              role="alert"
              className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-line">
            {editing ? (
              <>
                <Button type="submit" value="save" disabled={busy || !verified}>
                  {save.isPending ? "Saving..." : "Save changes"}
                </Button>
                {canPublishFromEdit ? (
                  <Button
                    type="submit"
                    value="publish"
                    variant="secondary"
                    disabled={busy || !verified}
                  >
                    Save &amp; Publish
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <Button
                  type="submit"
                  value="publish"
                  disabled={busy || !verified}
                >
                  {save.isPending ? "Publishing..." : "Publish Job"}
                </Button>
                <Button
                  type="submit"
                  value="draft"
                  variant="secondary"
                  disabled={busy || !verified}
                >
                  Save as Draft
                </Button>
              </>
            )}
          </div>
        </form>

        {/* Sidebar Tips Column */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-700 p-6 text-white shadow-md">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-2xl shadow-inner mb-4">
              💡
            </div>
            <h3 className="text-lg font-bold">Tips for a great listing</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-white/90 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span> Use clear, concise
                requirements.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span> Set a realistic application
                deadline.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span> Select relevant skills from
                the catalog so candidate matching works correctly.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Sub-components                                     */
/* -------------------------------------------------------------------------- */

function AiAssistPanel({
  disabled,
  pending,
  hint,
  notice,
  onGenerate,
  onCancel,
}: {
  disabled: boolean;
  pending: boolean;
  hint: string;
  notice: string;
  onGenerate: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5 ring-1 ring-brand-100/50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-ink">
              AI Job Description Assistant
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Quickly generate professional descriptions, requirements, and
            responsibilities using your title, skills (1–{MAX_AI_SKILLS}),
            experience level, and employment type.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={onGenerate}
            className="gap-1.5 bg-white"
          >
            {pending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-brand-600" /> Generate
                with AI
              </>
            )}
          </Button>
          {pending ? (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Stop
            </Button>
          ) : null}
        </div>
      </div>
      {hint && !pending ? (
        <p className="mt-3 text-xs font-medium text-amber-700">{hint}</p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3 text-xs font-semibold text-brand-700">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

function OptionSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {titleCase(option)}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function SkillsPicker({
  skills,
  value,
  max,
  onChange,
}: {
  skills: { _id: string; name: string }[];
  value: string[];
  max: number;
  onChange: (value: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter(
      (skill) =>
        !selectedSet.has(skill._id) && skill.name.toLowerCase().includes(q),
    );
  }, [skills, selectedSet, query]);

  const selectedSkills = useMemo(
    () =>
      value
        .map((id) => skills.find((skill) => skill._id === id))
        .filter((skill): skill is { _id: string; name: string } =>
          Boolean(skill),
        ),
    [skills, value],
  );

  const atMax = value.length >= max;

  const add = (id: string) => {
    if (atMax || selectedSet.has(id)) return;
    onChange([...value, id]);
    setQuery("");
  };

  const remove = (id: string) => {
    onChange(value.filter((skillId) => skillId !== id));
  };

  return (
    <div className="rounded-2xl border border-line bg-surface/30 p-4">
      <div className="flex min-h-[3rem] flex-wrap gap-2">
        {selectedSkills.length === 0 ? (
          <span className="self-center text-sm text-muted">
            No skills selected yet
          </span>
        ) : (
          selectedSkills.map((skill) => (
            <span
              key={skill._id}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100"
            >
              {skill.name}
              <button
                type="button"
                aria-label={`Remove ${skill.name}`}
                className="grid h-4 w-4 place-items-center rounded-full text-brand-700/70 hover:bg-brand-100 hover:text-brand-700"
                onClick={() => remove(skill._id)}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills to add..."
            disabled={atMax}
          />
        </div>
        <span
          className={`shrink-0 text-xs font-semibold ${
            atMax ? "text-amber-700" : "text-muted"
          }`}
        >
          {value.length}/{max} selected
        </span>
      </div>

      {atMax ? (
        <p className="mt-2 text-xs font-medium text-amber-700">
          You have reached the maximum limit of {max} skills.
        </p>
      ) : null}

      <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-line bg-white shadow-sm">
        {filtered.length === 0 ? (
          <p className="px-4 py-3 text-xs text-muted">
            {query.trim()
              ? "No matching skills found."
              : "All available skills selected."}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((skill) => (
              <li key={skill._id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-brand-50/60 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={atMax}
                  onClick={() => add(skill._id)}
                >
                  <span className="font-medium text-ink">{skill.name}</span>
                  <span className="text-xs font-semibold text-brand-700">
                    + Add
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
