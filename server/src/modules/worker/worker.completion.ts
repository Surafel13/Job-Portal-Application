import type { IWorker } from "./worker.interface.js";

export const MIN_PROFILE_COMPLETION_TO_APPLY = 80;

const hasText = (value?: string): boolean => Boolean(value?.trim());

export const calculateWorkerProfileCompletion = (
    worker: Pick<
        IWorker,
        | "professionalSummary"
        | "skills"
        | "categoryIds"
        | "education"
        | "experience"
        | "location"
        | "preferredJobTypes"
        | "preferredLocations"
        | "preferredWorkTypes"
        | "resumeIds"
    >
): number => {
    const checks = [
        hasText(worker.professionalSummary),
        (worker.skills?.length ?? 0) > 0,
        (worker.categoryIds?.length ?? 0) > 0,
        (worker.education?.length ?? 0) > 0,
        (worker.experience?.length ?? 0) > 0,
        hasText(worker.location),
        (worker.preferredJobTypes?.length ?? 0) > 0,
        (worker.preferredLocations?.length ?? 0) > 0,
        (worker.preferredWorkTypes?.length ?? 0) > 0,
        (worker.resumeIds?.length ?? 0) > 0,
    ];

    const completed = checks.filter(Boolean).length;

    return Math.round((completed / checks.length) * 100);
};
