import type { Employer } from "../types/models";

export function findMyEmployer(employers: Employer[], userId?: string) {
  if (!userId) return undefined;
  return employers.find((employer) =>
    employer.recruiters.some((id) => {
      if (typeof id === "string") return id === userId;
      return String((id as { _id?: string })._id ?? id) === userId;
    }),
  );
}
