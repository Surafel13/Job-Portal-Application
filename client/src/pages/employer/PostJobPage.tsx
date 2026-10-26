import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select, Textarea } from "../../components/ui/Input";
import { ErrorState, Spinner } from "../../components/ui/States";
import { findMyEmployer } from "../../lib/employer";
import { titleCase } from "../../lib/format";
import { queryKeys } from "../../lib/queryKeys";
import { catalogService, jobsService } from "../../services/jobs.service";
import { useAuthStore } from "../../store/authStore";
import type {
  EducationLevel,
  EmploymentType,
  ExperienceLevel,
  Job,
} from "../../types/models";

/* -------------------------------------------------------------------------- */
/*                         Constants & types                                  */
/* -------------------------------------------------------------------------- */

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

  if (query.isLoading) return <Spinner label="Loading job" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        message={(query.error as Error | null)?.message ?? "Job not found."}
        onRetry={() => void query.refetch()}
      />
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

  const generate = useMutation({
    mutationFn: () =>
      jobsService.generateDescription({
        title: form.title.trim(),
        skills: selectedSkillNames,
        experienceLevel: form.experienceLevel,
        employmentType: form.employmentType,
      }),
    onSuccess: (res) => {
      setForm((prev) => ({
        ...prev,
        description: res.data.description,
        requirements: res.data.requirements.join("\n"),
        responsibilities: res.data.responsibilities.join("\n"),
      }));
      setError("");
      setAiNotice("AI draft generated. Review and edit it before publishing.");
    },
    onError: (err: Error) => {
      setAiNotice("");
      setError(err.message);
    },
  });

  const generateHint = !verified
    ? "Your employer account must be verified to use this."
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
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <form
        className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-line"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          const submitter = (event.nativeEvent as SubmitEvent).submitter;
          const intent = (submitter?.getAttribute("value") ?? "save") as Intent;
          save.mutate(intent);
        }}
      >
        <h1 className="text-2xl font-extrabold">
          {editing ? "Edit Job" : "Post a New Job"}
        </h1>
        <p className="text-sm text-muted">
          Verified employers publish instantly, with no admin approval needed.
          Save as a draft to finish later.
        </p>

        {showUnverified ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Your employer account must be verified by an admin before you can
            create, edit, or publish jobs.
          </p>
        ) : null}
        {status === "rejected" ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
            This job was rejected by an administrator. You can edit it, but it
            cannot be published.
          </p>
        ) : null}

        <AiAssistPanel
          disabled={Boolean(generateHint) || generate.isPending}
          pending={generate.isPending}
          hint={generateHint}
          notice={aiNotice}
          onGenerate={handleGenerate}
        />

        <Field label="Job Title">
          <Input
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            required
          />
        </Field>
        <Field label="Description">
          <Textarea
            rows={5}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            required
          />
        </Field>
        <Field label="Requirements (one per line)">
          <Textarea
            rows={4}
            value={form.requirements}
            onChange={(e) => setField("requirements", e.target.value)}
            required
          />
        </Field>
        <Field label="Responsibilities (one per line)">
          <Textarea
            rows={4}
            value={form.responsibilities}
            onChange={(e) => setField("responsibilities", e.target.value)}
            required
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
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
            label="Education"
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
          <Field label="Deadline">
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setField("deadline", e.target.value)}
            />
          </Field>
          <Field label="Min salary">
            <Input
              type="number"
              value={form.min}
              onChange={(e) => setField("min", e.target.value)}
            />
          </Field>
          <Field label="Max salary">
            <Input
              type="number"
              value={form.max}
              onChange={(e) => setField("max", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Skills">
          <select
            multiple
            className="h-32 w-full rounded-2xl border border-line p-3 text-sm"
            value={form.skills}
            onChange={(e) =>
              setField(
                "skills",
                Array.from(e.target.selectedOptions).map(
                  (option) => option.value,
                ),
              )
            }
          >
            {(skillList.data ?? []).map((skill) => (
              <option key={skill._id} value={skill._id}>
                {skill.name}
              </option>
            ))}
          </select>
        </Field>

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          {editing ? (
            <>
              <Button type="submit" value="save" disabled={busy || !verified}>
                {save.isPending ? "Saving…" : "Save changes"}
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
              <Button type="submit" value="publish" disabled={busy || !verified}>
                {save.isPending ? "Publishing…" : "Publish Job"}
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

      <aside className="rounded-3xl bg-gradient-to-b from-brand-500 to-indigo-700 p-6 text-white">
        <div className="grid h-40 place-items-center rounded-3xl bg-white/10 text-5xl">
          💼
        </div>
        <p className="mt-6 font-bold">Tips for a great listing</p>
        <p className="mt-2 text-sm text-white/80">
          Use clear requirements, a future deadline, and select skills from the
          catalog so matching works.
        </p>
      </aside>
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
}: {
  disabled: boolean;
  pending: boolean;
  hint: string;
  notice: string;
  onGenerate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold text-brand-700">
            <Sparkles className="h-4 w-4" /> AI job description
          </p>
          <p className="mt-1 text-xs text-muted">
            Uses the title, selected skills (1–{MAX_AI_SKILLS}), experience
            level and employment type. You can edit everything afterwards.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onGenerate}
        >
          {pending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            "Generate with AI"
          )}
        </Button>
      </div>
      {hint && !pending ? (
        <p className="mt-2 text-xs text-amber-700">{hint}</p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-2 text-xs font-semibold text-brand-700">
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
