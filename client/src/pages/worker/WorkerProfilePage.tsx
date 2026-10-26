import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  FileText,
  GraduationCap,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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
import type {
  EmploymentType,
  WorkerProfile,
  WorkerSkill,
} from "../../types/models";

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

const getSkillDisplayName = (
  skillId: string,
  skillList: Array<{ _id: string; name: string }>,
) => skillList.find((skill) => skill._id === skillId)?.name ?? "Unknown skill";

function profileToForm(
  profile: WorkerProfile | null,
  fallbackLocation?: string,
): WorkerFormState {
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

  if (worker.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <Spinner label="Loading profile..." />
      </div>
    );
  }

  if (worker.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          message={worker.error.message}
          onRetry={() => void worker.refetch()}
        />
      </div>
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
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
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

  const addEducation = () =>
    setForm((prev) => ({
      ...prev,
      education: [...prev.education, emptyEducation()],
    }));
  const removeEducation = (index: number) =>
    setForm((prev) => ({
      ...prev,
      education:
        prev.education.length > 1
          ? prev.education.filter((_, i) => i !== index)
          : [emptyEducation()],
    }));

  const addExperience = () =>
    setForm((prev) => ({
      ...prev,
      experience: [...prev.experience, emptyExperience()],
    }));
  const removeExperience = (index: number) =>
    setForm((prev) => ({
      ...prev,
      experience:
        prev.experience.length > 1
          ? prev.experience.filter((_, i) => i !== index)
          : [emptyExperience()],
    }));

  const toggleValue = <T extends string>(
    value: T,
    values: T[],
    field: "preferredJobTypes" | "preferredWorkTypes",
  ) => {
    const next = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
    setForm((prev) => ({ ...prev, [field]: next }));
  };

  /* --------------------------- Skill/Category helpers --------------------------- */

  const toggleSkill = (skillId: string) => {
    setForm((prev) => {
      const exists = prev.skills.some((skill) => skill.skillId === skillId);
      if (exists) {
        return {
          ...prev,
          skills: prev.skills.filter((skill) => skill.skillId !== skillId),
        };
      }
      return {
        ...prev,
        skills: [
          ...prev.skills,
          {
            skillId,
            name: getSkillDisplayName(skillId, skillList.data ?? []),
            level: "intermediate",
          },
        ],
      };
    });
  };

  const selectCategory = (categoryId: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds[0] === categoryId ? [] : [categoryId],
    }));
  };

  const buildPayload = () => {
    const education = form.education
      .filter(
        (item) =>
          item.institution.trim() ||
          item.degree.trim() ||
          item.fieldOfStudy.trim(),
      )
      .map((item) => ({
        institution: item.institution.trim(),
        degree: item.degree.trim(),
        fieldOfStudy: item.fieldOfStudy.trim() || undefined,
        startDate: item.startDate
          ? new Date(item.startDate).toISOString()
          : undefined,
        endDate: item.endDate
          ? new Date(item.endDate).toISOString()
          : undefined,
        description: item.description.trim() || undefined,
      }));

    const experience = form.experience
      .filter((item) => item.company.trim() || item.jobTitle.trim())
      .map((item) => ({
        company: item.company.trim(),
        jobTitle: item.jobTitle.trim(),
        location: item.location.trim() || undefined,
        startDate: item.startDate
          ? new Date(item.startDate).toISOString()
          : undefined,
        endDate: item.endDate
          ? new Date(item.endDate).toISOString()
          : undefined,
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
      availableFrom: form.availableFrom
        ? new Date(form.availableFrom).toISOString()
        : undefined,
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
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      resumeService.replace(id, file),
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

  if (skillList.isLoading || categoryList.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <Spinner label="Loading catalog and profile data..." />
      </div>
    );
  }

  if (skillList.isError || categoryList.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          message={
            (skillList.error as Error)?.message ??
            (categoryList.error as Error)?.message ??
            "Unable to load your profile."
          }
          onRetry={() => {
            void skillList.refetch();
            void categoryList.refetch();
          }}
        />
      </div>
    );
  }

  const profileCompletion = profile?.profileCompletion ?? 0;
  const selectedCategoryId = form.categoryIds[0] ?? "";

  if (viewMode === "preview" && profile && user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
              Preview Mode
            </span>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              Employer Profile Preview
            </h1>
            <p className="mt-1 text-sm text-muted">
              This is how your profile appears to prospective employers.
            </p>
          </div>
          <Button variant="outline" onClick={() => setViewMode("edit")}>
            Back to Editor
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
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main Editor Form */}
        <form
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8 space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            saveProfile.mutate();
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                Candidate Dashboard
              </span>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Worker Profile
              </h1>
              <p className="mt-1 text-sm text-muted">
                Keep your details updated to match job opportunities and
                application requirements.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {profile ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("preview")}
                >
                  Preview Profile
                </Button>
              ) : null}
              <div className="rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                {profileCompletion}% Complete
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full name">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>
              <Field label="Location">
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="e.g. San Francisco, CA"
                />
              </Field>
            </div>

            <Field label="Professional summary">
              <Textarea
                rows={5}
                value={form.professionalSummary}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    professionalSummary: e.target.value,
                  }))
                }
                placeholder="Write a short summary about your background, career goals, and core strengths..."
                className="resize-y"
              />
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Website URL">
                <Input
                  type="url"
                  value={form.website}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, website: e.target.value }))
                  }
                  placeholder="https://yourwebsite.com"
                />
              </Field>
              <Field label="LinkedIn profile">
                <Input
                  type="url"
                  value={form.linkedin}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, linkedin: e.target.value }))
                  }
                  placeholder="https://linkedin.com/in/username"
                />
              </Field>
              <Field label="GitHub profile">
                <Input
                  type="url"
                  value={form.github}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, github: e.target.value }))
                  }
                  placeholder="https://github.com/username"
                />
              </Field>
              <Field label="Available from">
                <Input
                  type="date"
                  value={form.availableFrom}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      availableFrom: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Minimum salary expectation (USD)">
                <Input
                  type="number"
                  min="0"
                  value={form.minimumSalary}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      minimumSalary: e.target.value,
                    }))
                  }
                  placeholder="e.g. 60000"
                />
              </Field>
              <Field label="Maximum salary expectation (USD)">
                <Input
                  type="number"
                  min="0"
                  value={form.maximumSalary}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      maximumSalary: e.target.value,
                    }))
                  }
                  placeholder="e.g. 100000"
                />
              </Field>
            </div>

            {/* ------------------- Skills (multi-select chips) ------------------- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-ink">Skills</label>
                {form.skills.length > 0 ? (
                  <span className="text-xs text-muted">
                    {form.skills.length} selected
                  </span>
                ) : null}
              </div>

              <div className="rounded-2xl border border-line bg-surface/40 p-3 ring-1 ring-line/50">
                <div className="flex flex-wrap gap-2">
                  {(skillList.data ?? []).map((skill) => {
                    const isSelected = form.skills.some(
                      (s) => s.skillId === skill._id,
                    );
                    return (
                      <button
                        key={skill._id}
                        type="button"
                        onClick={() => toggleSkill(skill._id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                            : "border-line bg-white text-muted hover:text-ink"
                        }`}
                      >
                        {skill.name}
                        {isSelected ? <X className="h-3 w-3" /> : null}
                      </button>
                    );
                  })}
                  {(skillList.data ?? []).length === 0 ? (
                    <p className="text-xs text-muted">No skills available.</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ------------------- Category (single-select w/ search) ------------------- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-ink">
                  Category
                </label>
                {selectedCategoryId ? (
                  <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full ring-1 ring-brand-100">
                    1 selected
                  </span>
                ) : null}
              </div>

              <div className="rounded-2xl border border-line bg-surface/30 p-4 ring-1 ring-line/50 space-y-3">
                {/* Selected Category Pill Display */}
                {selectedCategoryId ? (
                  <div className="flex min-h-[2.5rem] flex-wrap items-center gap-2">
                    {(() => {
                      const selectedCat = (categoryList.data ?? []).find(
                        (c) => c._id === selectedCategoryId,
                      );
                      if (!selectedCat) return null;
                      return (
                        <span
                          key={selectedCat._id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100"
                        >
                          {selectedCat.name}
                          <button
                            type="button"
                            aria-label={`Remove ${selectedCat.name}`}
                            className="grid h-4 w-4 place-items-center rounded-full text-brand-700/70 hover:bg-brand-100 hover:text-brand-700"
                            onClick={() => selectCategory("")}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <span className="block text-sm text-muted">
                    No category selected yet
                  </span>
                )}

                {/* Single Input Search */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <Input
                      value={categorySearchQuery ?? ""}
                      onChange={(e) => setCategorySearchQuery?.(e.target.value)}
                      placeholder="Search categories..."
                      className="w-full bg-white"
                    />
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-muted">
                    {selectedCategoryId ? "1/1" : "0/1"}
                  </span>
                </div>

                {/* Scrollable List Panel */}
                <div className="max-h-48 overflow-y-auto rounded-xl border border-line bg-white shadow-sm">
                  {(() => {
                    const filteredCategories = (categoryList.data ?? []).filter(
                      (cat) =>
                        !categorySearchQuery ||
                        cat.name
                          .toLowerCase()
                          .includes(categorySearchQuery.toLowerCase()),
                    );

                    if (filteredCategories.length === 0) {
                      return (
                        <p className="px-4 py-3 text-xs text-muted">
                          {categorySearchQuery
                            ? "No matching categories."
                            : "No categories available."}
                        </p>
                      );
                    }

                    return (
                      <ul className="divide-y divide-line">
                        {filteredCategories.map((category) => {
                          const isSelected =
                            selectedCategoryId === category._id;
                          return (
                            <li key={category._id}>
                              <button
                                type="button"
                                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-brand-50/60 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => selectCategory(category._id)}
                              >
                                <span
                                  className={`font-medium ${isSelected ? "text-brand-700 font-bold" : "text-ink"}`}
                                >
                                  {category.name}
                                </span>
                                <span className="text-xs font-semibold text-brand-700">
                                  {isSelected ? "Selected" : "+ Select"}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-ink">
                Preferred job types
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "full-time",
                    "part-time",
                    "contract",
                    "internship",
                    "freelance",
                  ] as EmploymentType[]
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                      form.preferredJobTypes.includes(type)
                        ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                        : "border-line bg-surface/50 text-muted hover:text-ink"
                    }`}
                    onClick={() =>
                      toggleValue(
                        type,
                        form.preferredJobTypes,
                        "preferredJobTypes",
                      )
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-ink">
                Preferred work types
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  ["onsite", "remote", "hybrid"] as Array<
                    "onsite" | "remote" | "hybrid"
                  >
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                      form.preferredWorkTypes.includes(type)
                        ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                        : "border-line bg-surface/50 text-muted hover:text-ink"
                    }`}
                    onClick={() =>
                      toggleValue(
                        type,
                        form.preferredWorkTypes,
                        "preferredWorkTypes",
                      )
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Preferred locations (one per line or comma-separated)">
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
                placeholder="e.g. New York, Remote, London"
                className="resize-y"
              />
            </Field>

            {/* Education Section */}
            <div className="space-y-6 pt-4 border-t border-line">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                  <GraduationCap className="h-5 w-5 text-brand-600" /> Education
                  History
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addEducation}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Education
                </Button>
              </div>

              <div className="space-y-4">
                {form.education.map((education, index) => (
                  <div
                    key={`education-${index}`}
                    className="rounded-2xl border border-line bg-surface/40 p-5 ring-1 ring-line/50"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">
                        Education #{index + 1}
                      </span>
                      {form.education.length > 1 ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                          onClick={() => removeEducation(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
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
                                i === index
                                  ? { ...item, institution: e.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder="e.g. Stanford University"
                        />
                      </Field>
                      <Field label="Degree">
                        <Input
                          value={education.degree}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              education: prev.education.map((item, i) =>
                                i === index
                                  ? { ...item, degree: e.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder="e.g. Bachelor of Science"
                        />
                      </Field>
                      <Field label="Field of study">
                        <Input
                          value={education.fieldOfStudy}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              education: prev.education.map((item, i) =>
                                i === index
                                  ? { ...item, fieldOfStudy: e.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder="e.g. Computer Science"
                        />
                      </Field>
                      <Field label="Description">
                        <Input
                          value={education.description}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              education: prev.education.map((item, i) =>
                                i === index
                                  ? { ...item, description: e.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder="Honors, activities..."
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
                                i === index
                                  ? { ...item, startDate: e.target.value }
                                  : item,
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
                                i === index
                                  ? { ...item, endDate: e.target.value }
                                  : item,
                              ),
                            }))
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience Section */}
            <div className="space-y-6 pt-4 border-t border-line">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                  <Briefcase className="h-5 w-5 text-brand-600" /> Work
                  Experience
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addExperience}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Experience
                </Button>
              </div>

              <div className="space-y-4">
                {form.experience.map((experience, index) => (
                  <div
                    key={`experience-${index}`}
                    className="rounded-2xl border border-line bg-surface/40 p-5 ring-1 ring-line/50"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">
                        Experience #{index + 1}
                      </span>
                      {form.experience.length > 1 ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                          onClick={() => removeExperience(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
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
                                i === index
                                  ? { ...item, company: e.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder="e.g. Acme Inc."
                        />
                      </Field>
                      <Field label="Job title">
                        <Input
                          value={experience.jobTitle}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              experience: prev.experience.map((item, i) =>
                                i === index
                                  ? { ...item, jobTitle: e.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder="e.g. Senior Frontend Developer"
                        />
                      </Field>
                      <Field label="Location">
                        <Input
                          value={experience.location}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              experience: prev.experience.map((item, i) =>
                                i === index
                                  ? { ...item, location: e.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder="e.g. Remote"
                        />
                      </Field>
                      <div className="flex items-center gap-3 pt-8">
                        <input
                          type="checkbox"
                          id={`current-role-${index}`}
                          checked={experience.isCurrent}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              experience: prev.experience.map((item, i) =>
                                i === index
                                  ? { ...item, isCurrent: e.target.checked }
                                  : item,
                              ),
                            }))
                          }
                          className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
                        />
                        <label
                          htmlFor={`current-role-${index}`}
                          className="text-sm font-medium text-ink"
                        >
                          I currently work here
                        </label>
                      </div>
                      <Field label="Start date">
                        <Input
                          type="date"
                          value={experience.startDate}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              experience: prev.experience.map((item, i) =>
                                i === index
                                  ? { ...item, startDate: e.target.value }
                                  : item,
                              ),
                            }))
                          }
                        />
                      </Field>
                      <Field label="End date">
                        <Input
                          type="date"
                          value={experience.endDate}
                          disabled={experience.isCurrent}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              experience: prev.experience.map((item, i) =>
                                i === index
                                  ? { ...item, endDate: e.target.value }
                                  : item,
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
                                  i === index
                                    ? { ...item, description: e.target.value }
                                    : item,
                                ),
                              }))
                            }
                            placeholder="Describe your key responsibilities and achievements..."
                            className="resize-y"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-6 border-t border-line sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="submit"
              disabled={saveProfile.isPending}
              className="px-8"
            >
              {saveProfile.isPending
                ? "Saving changes..."
                : profile
                  ? "Save profile"
                  : "Create profile"}
            </Button>
            {message ? (
              <p className="text-sm font-medium text-brand-700">{message}</p>
            ) : null}
          </div>
        </form>

        {/* Sidebar Resume Manager Column */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line space-y-4">
            <div>
              <h2 className="text-base font-bold text-ink">Resumes</h2>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Upload or manage your resume files. Replacing a document
                preserves your existing job applications.
              </p>
            </div>

            {/* Upload Area */}
            <div>
              <label
                htmlFor="worker-upload-resume"
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50/40 p-4 transition-colors hover:bg-brand-50/80"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm">
                  <Upload className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-ink">
                    Upload PDF or DOCX
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    Max file size: 5MB
                  </span>
                </span>
              </label>
              <input
                id="worker-upload-resume"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload.mutate(file);
                  event.target.value = "";
                }}
              />
            </div>

            {/* Resumes List */}
            <div className="space-y-3 pt-2">
              {(resumes.data ?? []).map((resume) => (
                <div
                  key={resume._id}
                  className="rounded-2xl bg-surface/60 p-4 ring-1 ring-line/60 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                      <p className="truncate text-xs font-bold text-ink">
                        {resume.originalName}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60 text-xs">
                    {resume.cloudinaryUrl || resume.filePath ? (
                      <a
                        href={resume.cloudinaryUrl || resume.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        View file
                      </a>
                    ) : (
                      <span className="text-muted">Unavailable</span>
                    )}

                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer font-semibold text-brand-700 hover:underline">
                        Replace
                        <input
                          type="file"
                          accept=".pdf,.docx"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file)
                              replaceResume.mutate({ id: resume._id, file });
                            event.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeResume.mutate(resume._id)}
                        className="font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {(!resumes.data || resumes.data.length === 0) &&
              !resumes.isLoading ? (
                <p className="text-xs text-muted text-center py-4">
                  No resumes uploaded yet.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
