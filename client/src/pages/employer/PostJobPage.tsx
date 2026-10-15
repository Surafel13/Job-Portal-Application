import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select, Textarea } from "../../components/ui/Input";
import { queryKeys } from "../../lib/queryKeys";
import { catalogService, jobsService } from "../../services/jobs.service";
import { useAuthStore } from "../../store/authStore";
import { findMyEmployer } from "../../lib/job";
import type { EducationLevel, EmploymentType, ExperienceLevel } from "../../types/models";

export function PostJobPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("full-time");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("mid");
  const [educationLevel, setEducationLevel] = useState<EducationLevel>("bachelor");
  const [categoryId, setCategoryId] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [deadline, setDeadline] = useState("");
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

  const create = useMutation({
    mutationFn: () => {
      if (!company?._id) throw new Error("No employer profile found for this account.");
      const reqs = splitLines(requirements);
      const resps = splitLines(responsibilities);
      if (description.trim().length < 20) {
        throw new Error("Description must be at least 20 characters.");
      }
      return jobsService.create({
        companyId: company._id,
        title,
        description,
        requirements: reqs,
        responsibilities: resps,
        location,
        employmentType,
        experienceLevel,
        educationLevel,
        categoryId,
        skills,
        deadline: deadline || undefined,
        status: "pending",
        ...(min || max
          ? {
              salary: {
                minimum: min ? Number(min) : undefined,
                maximum: max ? Number(max) : undefined,
                currency: "USD",
              },
            }
          : {}),
      });
    },
    onSuccess: async () => {
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
          create.mutate();
        }}
      >
        <h1 className="text-2xl font-extrabold">Post a New Job</h1>
        <p className="text-sm text-muted">
          Fields follow the API contract: title, description, requirements, responsibilities,
          location, type, category, and optional salary/skills.
        </p>
        <Field label="Job Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Description">
          <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required />
        </Field>
        <Field label="Requirements (one per line)">
          <Textarea rows={4} value={requirements} onChange={(e) => setRequirements(e.target.value)} required />
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
            <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
          </Field>
          <Field label="Employment type">
            <Select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
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
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
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
              onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
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
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              <option value="">Select category</option>
              {(categories.data ?? []).map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Deadline">
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <Field label="Min salary">
            <Input type="number" value={min} onChange={(e) => setMin(e.target.value)} />
          </Field>
          <Field label="Max salary">
            <Input type="number" value={max} onChange={(e) => setMax(e.target.value)} />
          </Field>
        </div>
        <Field label="Skills">
          <select
            multiple
            className="h-32 w-full rounded-2xl border border-line p-3 text-sm"
            value={skills}
            onChange={(e) =>
              setSkills(Array.from(e.target.selectedOptions).map((option) => option.value))
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
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Posting…" : "Post Job"}
        </Button>
      </form>
      <aside className="rounded-3xl bg-gradient-to-b from-brand-500 to-indigo-700 p-6 text-white">
        <div className="grid h-40 place-items-center rounded-3xl bg-white/10 text-5xl">💼</div>
        <p className="mt-6 font-bold">Tips for a great listing</p>
        <p className="mt-2 text-sm text-white/80">
          Use clear requirements, a future deadline, and select skills from the catalog so matching works.
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
