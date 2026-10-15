import type { Category, Employer, Job, Skill } from "../types/models";

export function companyOf(job: Job): Employer | null {
  return typeof job.companyId === "object" ? job.companyId : null;
}

export function categoryOf(job: Job): Category | null {
  return typeof job.categoryId === "object" ? job.categoryId : null;
}

export function skillsOf(job: Job): Skill[] {
  return job.skills.filter((skill): skill is Skill => typeof skill === "object");
}

export function isRemote(job: Job) {
  return /remote/i.test(job.location);
}

export function isUrgent(job: Job) {
  if (!job.deadline) return false;
  const diff = new Date(job.deadline).getTime() - Date.now();
  return diff > 0 && diff < 1000 * 60 * 60 * 24 * 7;
}

export function findMyEmployer(employers: Employer[], userId?: string) {
  if (!userId) return undefined;
  return employers.find((employer) =>
    employer.recruiters.some((id) => {
      if (typeof id === "string") return id === userId;
      return String((id as { _id?: string })._id ?? id) === userId;
    }),
  );
}

