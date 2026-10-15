import { request } from "../lib/api";
import type { PaginationMeta } from "../types/api";
import type {
  Application,
  Category,
  Employer,
  Job,
  RecommendationResult,
  Resume,
  SavedJob,
  Skill,
} from "../types/models";

export const catalogService = {
  categories: () =>
    request<Category[]>("get", "/categories", { params: { limit: 100 } }),
  skills: () => request<Skill[]>("get", "/skills", { params: { limit: 100 } }),
  employers: () =>
    request<Employer[]>("get", "/employers", {
      params: { page: 1, limit: 100 },
    }),
};

export const jobsService = {
  search: (params: Record<string, unknown>) =>
    request<Job[]>("get", "/search/jobs", { params }).then((res) => ({
      jobs: res.data ?? [],
      meta: {
        page: typeof res.meta?.page === "number" ? res.meta.page : 1,
        limit: typeof res.meta?.limit === "number" ? res.meta.limit : 10,
      } satisfies PaginationMeta,
    })),

  semanticSearch: (params: Record<string, unknown>) =>
    request<Job[]>("get", "/semantic-search/jobs", { params }),

  getById: (id: string) => request<Job>("get", `/jobs/${id}`),

  incrementView: (id: string) => request<Job>("patch", `/jobs/${id}/view`),

  byCompany: (companyId: string) =>
    request<Job[]>("get", `/jobs/company/${companyId}`),

  create: (payload: Record<string, unknown>) =>
    request<Job>("post", "/jobs", { data: payload }),

  update: (id: string, payload: Record<string, unknown>) =>
    request<Job>("patch", `/jobs/${id}`, { data: payload }),

  updateStatus: (id: string, status: string) =>
    request<Job>("patch", `/jobs/status/${id}`, { data: { status } }),

  remove: (id: string) => request<undefined>("delete", `/jobs/${id}`),

  recommendations: () =>
    request<RecommendationResult>("get", "/recommendation"),
};

export const savedJobsService = {
  list: () => request<SavedJob[]>("get", "/saved-job"),
  save: (jobId: string) => request<SavedJob>("post", `/saved-job/${jobId}`),
  remove: (jobId: string) =>
    request<undefined>("delete", `/saved-job/${jobId}`),
};

export const applicationService = {
  my: () => request<Application[]>("get", "/application/my"),
  create: (
    jobId: string,
    payload: { resumeId: string; coverLetter?: string },
  ) =>
    request<Application>("post", `/application/job/${jobId}`, {
      data: payload,
    }),
  byJob: (jobId: string) =>
    request<Application[]>("get", `/application/job/${jobId}`),
  updateStatus: (id: string, status: string) =>
    request<Application>("patch", `/application/${id}/status`, {
      data: { status },
    }),
  withdraw: (id: string) =>
    request<Application>("patch", `/application/${id}/withdraw`),
};

export const resumeService = {
  list: () => request<Resume[]>("get", "/resumes"),
  upload: (file: File) => {
    const form = new FormData();
    form.append("resume", file);
    return request<Resume>("post", "/resumes", {
      data: form,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  remove: (id: string) => request<undefined>("delete", `/resumes/${id}`),
};
