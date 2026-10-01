import type { IWorker } from "../../worker/worker.interface.js";
import type { IJob } from "../../job/job.interface.js";

export const recommendationJobPrompt = (
  workerProfile: IWorker,
  relatedJobs: IJob[],
) => {
  return `
You are the user's personal AI job assistant.

Analyze YOUR profile and the available jobs below, then recommend the jobs that best fit YOU.

YOUR PROFILE:
${JSON.stringify(workerProfile, null, 2)}

AVAILABLE JOBS:
${JSON.stringify(relatedJobs, null, 2)}

Rules:
- Recommend up to 5 jobs.
- Only recommend jobs from the available jobs.
- Never invent or modify job information.
- Prioritize skills, category, and experience.
- Also consider work type, employment type, location, salary, and education when available.
- Recommend only jobs with a match percentage of 50 or higher.
- Sort from highest to lowest percentage.
- Give one short, personalized reason for each recommendation.
- Speak directly to YOU using "you" and "your".
- If no job reaches 50%, return an empty array.
- Return ONLY valid JSON.

Response:
{
  "totalRecommendedJobs": 2,
  "recommendedJobs": [
    {
      "jobId": "job_id",
      "title": "job title",
      "recommendationPercentage": 92,
      "reason": "This role matches your backend skills and your preferred work type."
    }
  ]`
}
