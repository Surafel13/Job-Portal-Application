import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select, Textarea } from "../../components/ui/Input";
import { ErrorState, Spinner } from "../../components/ui/States";
import { queryKeys } from "../../lib/queryKeys";
import { catalogService, jobsService } from "../../services/jobs.service";
import { useAuthStore } from "../../store/authStore";
import { findMyEmployer } from "../../lib/employer";
import type {
  EducationLevel,
  EmploymentType,
  ExperienceLevel,
  Job,
} from "../../types/models";

const idOf = (value: string | { _id: string }) =>
  typeof value === "string" ? value : value._id;

type Intent = "draft" | "publish" | "save";

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

function JobForm({ job }: { job?: Job }) {
  const editing = Boolean(job);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(job?.title ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [requirements, setRequirements] = useState(
    job?.requirements.join("\n") ?? "",
  );
  const [responsibilities, setResponsibilities] = useState(
    job?.responsibilities.join("\n") ?? "",
  );
  const [location, setLocation] = useState(job?.location ?? "");
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    job?.employmentType ?? "full-time",
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    job?.experienceLevel ?? "mid",
  );
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(
    job?.educationLevel ?? "bachelor",
  );
  const [categoryId, setCategoryId] = useState(job ? idOf(job.categoryId) : "");
  const [skills, setSkills] = useState<string[]>(job?.skills.map(idOf) ?? []);
  const [min, setMin] = useState(job?.salary?.minimum?.toString() ?? "");
  const [max, setMax] = useState(job?.salary?.maximum?.toString() ?? "");
  const initialDeadline = job?.deadline ? job.deadline.slice(0, 10) : "";
  const [deadline, setDeadline] = useState(initialDeadline);
  const [error, setError] = useState("");

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

  const save = useMutation({
    mutationFn: async (intent: Intent) => {
      if (!verified) {
        throw new Error(
          "Your employer account must be verified before you can post jobs.",
        );
      }
      if (!company?._id)
        throw new Error("No employer profile found for this account.");
      if (description.trim().length < 20) {
        throw new Error("Description must be at least 20 characters.");
      }

      const base = {
        title,
        description,
        requirements: splitLines(requirements),
        responsibilities: splitLines(responsibilities),
        location,
        employmentType,
        experienceLevel,
        educationLevel,
        categoryId,
        skills,
        ...(min || max
          ? {
              salary: {
                minimum: min ? Number(min) : undefined,
                maximum: max ? Number(max) : undefined,
                currency: job?.salary?.currency ?? "USD",
              },
            }
          : {}),
      };

      if (!job) {
        return jobsService.create({
          ...base,
          companyId: company._id,
          deadline: deadline || undefined,
          status: intent === "publish" ? "published" : "draft",
        });
      }

      await jobsService.update(job._id, {
        ...base,
        ...(deadline && deadline !== initialDeadline ? { deadline } : {}),
      });
      if (intent === "publish") {
        return jobsService.updateStatus(job._id, "published");
      }
      return undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      if (job)
        await queryClient.invalidateQueries({
          queryKey: queryKeys.job(job._id),
        });
      await navigate("/employer");
    },
    onError: (err: Error) => setError(err.message),
  });

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
        <Field label="Job Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Field>
        <Field label="Description">
          <Textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Field>
        <Field label="Requirements (one per line)">
          <Textarea
            rows={4}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            required
          />
        </Field>
        <Field label="Responsibilities (one per line)">
          <Textarea
            rows={4}
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            required
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Location">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </Field>
          <Field label="Employment type">
            <Select
              value={employmentType}
              onChange={(e) =>
                setEmploymentType(e.target.value as EmploymentType)
              }
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </Select>
          </Field>
          <Field label="Experience level">
            <Select
              value={experienceLevel}
              onChange={(e) =>
                setExperienceLevel(e.target.value as ExperienceLevel)
              }
            >
              <option value="entry">Entry</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </Select>
          </Field>
          <Field label="Education">
            <Select
              value={educationLevel}
              onChange={(e) =>
                setEducationLevel(e.target.value as EducationLevel)
              }
            >
              <option value="high-school">High school</option>
              <option value="certificate">Certificate</option>
              <option value="diploma">Diploma</option>
              <option value="bachelor">Bachelor</option>
              <option value="master">Master</option>
              <option value="phd">PhD</option>
            </Select>
          </Field>
          <Field label="Category">
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
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
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>
          <Field label="Min salary">
            <Input
              type="number"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
          </Field>
          <Field label="Max salary">
            <Input
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Skills">
          <select
            multiple
            className="h-32 w-full rounded-2xl border border-line p-3 text-sm"
            value={skills}
            onChange={(e) =>
              setSkills(
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
              <Button
                type="submit"
                value="save"
                disabled={save.isPending || !verified}
              >
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
              {canPublishFromEdit ? (
                <Button
                  type="submit"
                  value="publish"
                  variant="secondary"
                  disabled={save.isPending || !verified}
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
                disabled={save.isPending || !verified}
              >
                {save.isPending ? "Publishing…" : "Publish Job"}
              </Button>
              <Button
                type="submit"
                value="draft"
                variant="secondary"
                disabled={save.isPending || !verified}
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

function splitLines(value: string) {
  const items = value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : ["See job description"];
}
