import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Field, Input, Textarea } from "../../components/ui/Input";
import { ErrorState, Spinner } from "../../components/ui/States";
import { WorkerProfileOverview } from "../../components/worker/WorkerProfileOverview";
import { ApiClientError } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";
import { catalogService, resumeService } from "../../services/jobs.service";
import { userService, workerService } from "../../services/platform.service";
import { useAuthStore } from "../../store/authStore";
import type { EmploymentType, WorkerProfile, WorkerSkill } from "../../types/models";

type WorkerFormState = {
  professionalSummary: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  preferredJobTypes: EmploymentType[];
  preferredLocations: string[];
  preferredWorkTypes: Array<"onsite" | "remote" | "hybrid">;
  minimumSalary: string;
  maximumSalary: string;
  availableFrom: string;
  categoryIds: string[];
  skills: Array<{ skillId: string; name: string; level: WorkerSkill["level"] }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  experience: Array<{
    company: string;
    jobTitle: string;
    location: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
  }>;
};

const emptyEducation = () => ({
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  description: "",
});

const emptyExperience = () => ({
  company: "",
  jobTitle: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
});

const normalizeString = (value: string | undefined) => value?.trim() ?? "";

const toDateInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getSkillDisplayName = (skillId: string, skillList: Array<{ _id: string; name: string }>) =>
  skillList.find((skill) => skill._id === skillId)?.name ?? "Unknown skill";

function profileToForm(profile: WorkerProfile | null, fallbackLocation?: string): WorkerFormState {
  return {
    professionalSummary: normalizeString(profile?.professionalSummary),
    location: normalizeString(profile?.location ?? fallbackLocation),
    website: normalizeString(profile?.website),
    linkedin: normalizeString(profile?.linkedin),
    github: normalizeString(profile?.github),
    preferredJobTypes: profile?.preferredJobTypes ?? [],
    preferredLocations: profile?.preferredLocations ?? [],
    preferredWorkTypes: profile?.preferredWorkTypes ?? [],
    minimumSalary: profile?.minimumSalary?.toString() ?? "",
    maximumSalary: profile?.maximumSalary?.toString() ?? "",
    availableFrom: toDateInputValue(profile?.availableFrom),
    categoryIds: profile?.categoryIds ?? [],
    skills: (profile?.skills ?? []).map((skill) => ({
      skillId: skill.skillId,
      name: normalizeString(skill.name),
      level: skill.level ?? "intermediate",
    })),
    education: profile?.education.length
      ? profile.education.map((item) => ({
          institution: normalizeString(item.institution),
          degree: normalizeString(item.degree),
          fieldOfStudy: normalizeString(item.fieldOfStudy),
          startDate: toDateInputValue(item.startDate),
          endDate: toDateInputValue(item.endDate),
          description: normalizeString(item.description),
        }))
      : [emptyEducation()],
    experience: profile?.experience.length
      ? profile.experience.map((item) => ({
          company: normalizeString(item.company),
          jobTitle: normalizeString(item.jobTitle),
          location: normalizeString(item.location),
          startDate: toDateInputValue(item.startDate),
          endDate: toDateInputValue(item.endDate),
          isCurrent: Boolean(item.isCurrent),
          description: normalizeString(item.description),
        }))
      : [emptyExperience()],
  };
}

export function WorkerProfilePage() {
  const [editorVersion, setEditorVersion] = useState(0);
  const worker = useQuery({
    queryKey: queryKeys.worker,
    queryFn: async () => {
      try {
        const res = await workerService.me();
        return res.data;
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  if (worker.isLoading) return <Spinner />;
  if (worker.isError) {
    return (
      <ErrorState
        message={worker.error.message}
        onRetry={() => void worker.refetch()}
      />
    );
  }

  const key = `${worker.data?._id ?? "new"}:${worker.data?.updatedAt ?? ""}:${editorVersion}`;
  return (
    <WorkerProfileEditor
      key={key}
      profile={worker.data ?? null}
      onProfileSaved={() => setEditorVersion((version) => version + 1)}
    />
  );
}

function WorkerProfileEditor({
  profile,
  onProfileSaved,
}: {
  profile: WorkerProfile | null;
  onProfileSaved: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [form, setForm] = useState<WorkerFormState>(() =>
    profileToForm(profile, user?.location),
  );

  const skillList = useQuery({
    queryKey: queryKeys.skills,
    queryFn: () => catalogService.skills().then((r) => r.data ?? []),
  });

  const categoryList = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => catalogService.categories().then((r) => r.data ?? []),
  });

  const resumes = useQuery({
    queryKey: queryKeys.resumes,
    queryFn: () => resumeService.list().then((r) => r.data ?? []),
  });

  const addEducation = () => setForm((prev) => ({ ...prev, education: [...prev.education, emptyEducation()] }));
  const removeEducation = (index: number) =>
    setForm((prev) => ({
      ...prev,
      education: prev.education.length > 1 ? prev.education.filter((_, i) => i !== index) : [emptyEducation()],
    }));

  const addExperience = () => setForm((prev) => ({ ...prev, experience: [...prev.experience, emptyExperience()] }));
  const removeExperience = (index: number) =>
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.length > 1 ? prev.experience.filter((_, i) => i !== index) : [emptyExperience()],
    }));

  const toggleValue = <T extends string>(value: T, values: T[], field: "preferredJobTypes" | "preferredWorkTypes") => {
    const next = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
    setForm((prev) => ({ ...prev, [field]: next }));
  };

  const buildPayload = () => {
    const education = form.education
      .filter((item) => item.institution.trim() || item.degree.trim() || item.fieldOfStudy.trim())
      .map((item) => ({
        institution: item.institution.trim(),
        degree: item.degree.trim(),
        fieldOfStudy: item.fieldOfStudy.trim() || undefined,
        startDate: item.startDate ? new Date(item.startDate).toISOString() : undefined,
        endDate: item.endDate ? new Date(item.endDate).toISOString() : undefined,
        description: item.description.trim() || undefined,
      }));

    const experience = form.experience
      .filter((item) => item.company.trim() || item.jobTitle.trim())
      .map((item) => ({
        company: item.company.trim(),
        jobTitle: item.jobTitle.trim(),
        location: item.location.trim() || undefined,
        startDate: item.startDate ? new Date(item.startDate).toISOString() : undefined,
        endDate: item.endDate ? new Date(item.endDate).toISOString() : undefined,
        isCurrent: Boolean(item.isCurrent),
        description: item.description.trim() || undefined,
      }));

    const payload: Record<string, unknown> = {
      professionalSummary: form.professionalSummary.trim() || undefined,
      location: form.location.trim() || undefined,
      website: form.website.trim() || undefined,
      linkedin: form.linkedin.trim() || undefined,
      github: form.github.trim() || undefined,
      preferredJobTypes: form.preferredJobTypes,
      preferredLocations: form.preferredLocations.filter(Boolean),
      preferredWorkTypes: form.preferredWorkTypes,
      minimumSalary: form.minimumSalary ? Number(form.minimumSalary) : undefined,
      maximumSalary: form.maximumSalary ? Number(form.maximumSalary) : undefined,
      availableFrom: form.availableFrom ? new Date(form.availableFrom).toISOString() : undefined,
      categoryIds: form.categoryIds,
      skills: form.skills
        .filter((skill) => skill.skillId && skill.name.trim())
        .map((skill) => ({
          skillId: skill.skillId,
          name: skill.name.trim(),
          level: skill.level ?? "intermediate",
        })),
      education,
      experience,
    };

    return payload;
  };

  const saveProfile = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (user) {
        const updatedUser = await userService.update(user._id, {
          fullName: fullName.trim() || undefined,
          location: form.location.trim() || undefined,
        });
        setUser({ ...user, ...updatedUser.data });
      }

      if (profile) {
        return workerService.update(payload);
      }

      return workerService.create(payload);
    },
    onSuccess: (res) => {
      setMessage("Profile saved successfully.");
      queryClient.setQueryData(queryKeys.worker, res.data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.worker });
      void queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
      onProfileSaved();
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const upload = useMutation({
    mutationFn: (file: File) => resumeService.upload(file),
    onSuccess: () => {
      setMessage("Resume uploaded.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.worker });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const replaceResume = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => resumeService.replace(id, file),
    onSuccess: () => {
      setMessage("Resume replaced.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.worker });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const removeResume = useMutation({
    mutationFn: (id: string) => resumeService.remove(id),
    onSuccess: () => {
      setMessage("Resume deleted.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.worker });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  if (skillList.isLoading || categoryList.isLoading) return <Spinner />;
  if (skillList.isError || categoryList.isError) {
    return (
      <ErrorState
        message={
          (skillList.error as Error)?.message ??
          (categoryList.error as Error)?.message ??
          "Unable to load your profile."}
        onRetry={() => {
          void skillList.refetch();
          void categoryList.refetch();
        }}
      />
    );
  }

  const profileCompletion = profile?.profileCompletion ?? 0;

  if (viewMode === "preview" && profile && user) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">Employer profile preview</h1>
            <p className="text-sm text-muted">This is how your profile appears to employers.</p>
          </div>
          <Button variant="outline" onClick={() => setViewMode("edit")}>
            Edit profile
          </Button>
        </div>
        <WorkerProfileOverview
          user={{ ...user, fullName }}
          profile={profile}
          categories={categoryList.data ?? []}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form
        className="rounded-3xl bg-white p-6 ring-1 ring-line"
        onSubmit={(event) => {
          event.preventDefault();
          saveProfile.mutate();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">My worker profile</h1>
            <p className="text-sm text-muted">
              Match the backend schema and keep your public profile ready for applications.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {profile ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setViewMode("preview")}>
                Preview as employer
              </Button>
            ) : null}
            <div className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
              {profileCompletion}% complete
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Professional summary">
            <Textarea
              rows={5}
              value={form.professionalSummary}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, professionalSummary: e.target.value }))
              }
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Website">
              <Input
                type="url"
                value={form.website}
                onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
              />
            </Field>
            <Field label="LinkedIn">
              <Input
                type="url"
                value={form.linkedin}
                onChange={(e) => setForm((prev) => ({ ...prev, linkedin: e.target.value }))}
              />
            </Field>
            <Field label="GitHub">
              <Input
                type="url"
                value={form.github}
                onChange={(e) => setForm((prev) => ({ ...prev, github: e.target.value }))}
              />
            </Field>
            <Field label="Available from">
              <Input
                type="date"
                value={form.availableFrom}
                onChange={(e) => setForm((prev) => ({ ...prev, availableFrom: e.target.value }))}
              />
            </Field>
            <Field label="Minimum salary">
              <Input
                type="number"
                min="0"
                value={form.minimumSalary}
                onChange={(e) => setForm((prev) => ({ ...prev, minimumSalary: e.target.value }))}
              />
            </Field>
            <Field label="Maximum salary">
              <Input
                type="number"
                min="0"
                value={form.maximumSalary}
                onChange={(e) => setForm((prev) => ({ ...prev, maximumSalary: e.target.value }))}
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Skills">
              <select
                multiple
                className="h-36 w-full rounded-2xl border border-line bg-white p-3 text-sm"
                value={form.skills.map((skill) => skill.skillId)}
                onChange={(event) => {
                  const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                  setForm((prev) => {
                    const selectedSkills = selected.map((skillId) => ({
                      skillId,
                      name: getSkillDisplayName(skillId, skillList.data ?? []),
                      level: prev.skills.find((skill) => skill.skillId === skillId)?.level ?? "intermediate",
                    }));
                    return { ...prev, skills: selectedSkills };
                  });
                }}
              >
                {(skillList.data ?? []).map((skill) => (
                  <option key={skill._id} value={skill._id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Categories">
              <select
                multiple
                className="h-36 w-full rounded-2xl border border-line bg-white p-3 text-sm"
                value={form.categoryIds}
                onChange={(event) => {
                  const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                  setForm((prev) => ({ ...prev, categoryIds: selected }));
                }}
              >
                {(categoryList.data ?? []).map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-ink">Preferred job types</label>
            <div className="flex flex-wrap gap-2">
              {(["full-time", "part-time", "contract", "internship", "freelance"] as EmploymentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    form.preferredJobTypes.includes(type)
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-line bg-white text-ink"
                  }`}
                  onClick={() => toggleValue(type, form.preferredJobTypes, "preferredJobTypes")}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-ink">Preferred work types</label>
            <div className="flex flex-wrap gap-2">
              {(["onsite", "remote", "hybrid"] as Array<"onsite" | "remote" | "hybrid">).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    form.preferredWorkTypes.includes(type)
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-line bg-white text-ink"
                  }`}
                  onClick={() => toggleValue(type, form.preferredWorkTypes, "preferredWorkTypes")}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <Field label="Preferred locations (one per line)">
            <Textarea
              rows={3}
              value={form.preferredLocations.join("\n")}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  preferredLocations: e.target.value
                    .split(/\n|,/)
                    .map((value) => value.trim())
                    .filter(Boolean),
                }))
              }
            />
          </Field>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Education</h2>
              <Button type="button" variant="secondary" onClick={addEducation}>
                Add education
              </Button>
            </div>
            {form.education.map((education, index) => (
              <div key={`education-${index}`} className="rounded-2xl border border-line bg-surface p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-muted">Entry {index + 1}</span>
                  {form.education.length > 1 ? (
                    <button type="button" className="text-sm text-rose-600" onClick={() => removeEducation(index)}>
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Institution">
                    <Input
                      value={education.institution}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          education: prev.education.map((item, i) =>
                            i === index ? { ...item, institution: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Degree">
                    <Input
                      value={education.degree}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          education: prev.education.map((item, i) =>
                            i === index ? { ...item, degree: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Field of study">
                    <Input
                      value={education.fieldOfStudy}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          education: prev.education.map((item, i) =>
                            i === index ? { ...item, fieldOfStudy: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Description">
                    <Input
                      value={education.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          education: prev.education.map((item, i) =>
                            i === index ? { ...item, description: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Start date">
                    <Input
                      type="date"
                      value={education.startDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          education: prev.education.map((item, i) =>
                            i === index ? { ...item, startDate: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="End date">
                    <Input
                      type="date"
                      value={education.endDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          education: prev.education.map((item, i) =>
                            i === index ? { ...item, endDate: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Experience</h2>
              <Button type="button" variant="secondary" onClick={addExperience}>
                Add experience
              </Button>
            </div>
            {form.experience.map((experience, index) => (
              <div key={`experience-${index}`} className="rounded-2xl border border-line bg-surface p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-muted">Entry {index + 1}</span>
                  {form.experience.length > 1 ? (
                    <button type="button" className="text-sm text-rose-600" onClick={() => removeExperience(index)}>
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Company">
                    <Input
                      value={experience.company}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          experience: prev.experience.map((item, i) =>
                            i === index ? { ...item, company: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Job title">
                    <Input
                      value={experience.jobTitle}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          experience: prev.experience.map((item, i) =>
                            i === index ? { ...item, jobTitle: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Location">
                    <Input
                      value={experience.location}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          experience: prev.experience.map((item, i) =>
                            i === index ? { ...item, location: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <div className="flex items-center gap-2 pt-9">
                    <input
                      type="checkbox"
                      checked={experience.isCurrent}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          experience: prev.experience.map((item, i) =>
                            i === index ? { ...item, isCurrent: e.target.checked } : item,
                          ),
                        }))
                      }
                    />
                    <label className="text-sm text-ink">Current role</label>
                  </div>
                  <Field label="Start date">
                    <Input
                      type="date"
                      value={experience.startDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          experience: prev.experience.map((item, i) =>
                            i === index ? { ...item, startDate: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="End date">
                    <Input
                      type="date"
                      value={experience.endDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          experience: prev.experience.map((item, i) =>
                            i === index ? { ...item, endDate: e.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Description">
                      <Textarea
                        rows={3}
                        value={experience.description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            experience: prev.experience.map((item, i) =>
                              i === index ? { ...item, description: e.target.value } : item,
                            ),
                          }))
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? "Saving…" : profile ? "Save profile" : "Create profile"}
          </Button>
          {message ? <p className="text-sm text-brand-700">{message}</p> : null}
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
          <h2 className="font-bold">Resumes</h2>
          <p className="mt-1 text-xs text-muted">
            Replacing a document keeps existing applications intact because the original resume reference is preserved.
          </p>
          <input
            type="file"
            accept=".pdf,.docx"
            className="mt-3 w-full text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload.mutate(file);
              event.target.value = "";
            }}
          />
          <ul className="mt-4 space-y-2 text-sm">
            {(resumes.data ?? []).map((resume) => (
              <li key={resume._id} className="rounded-2xl bg-surface px-3 py-2">
                <p className="font-medium">{resume.originalName}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {resume.cloudinaryUrl || resume.filePath ? (
                    <a
                      href={resume.cloudinaryUrl || resume.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700"
                    >
                      View
                    </a>
                  ) : null}
                  <label className="cursor-pointer text-brand-700">
                    Replace
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) replaceResume.mutate({ id: resume._id, file });
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={() => removeResume.mutate(resume._id)}
                    disabled={removeResume.isPending}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
          <p className="text-sm text-muted">Status</p>
          <p className="mt-2 text-3xl font-extrabold">{profileCompletion}%</p>
          <p className="mt-2 text-xs text-muted">
            At least 80% completion is required before applying for jobs.
          </p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${Math.min(profileCompletion, 100)}%` }}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
