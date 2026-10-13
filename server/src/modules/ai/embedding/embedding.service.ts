import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { gemini } from "../../../config/gemini.js";
import { ApiError } from "../../../utils/ApiError.js";
import type { IJob } from "../../job/job.interface.js";
import SkillModel from "../../skill/skill.model.js";
import embeddingRepository from "./embedding.repository.js";

export const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
type EmbeddingTask = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

export class EmbeddingService {
    async embedText(
        text: string,
        taskType: EmbeddingTask = "RETRIEVAL_QUERY",
    ): Promise<number[]> {
        const normalizedText = text.trim();
        if (!normalizedText) {
            throw new ApiError(400, "Text is required to generate an embedding.");
        }

        const response = await gemini.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: normalizedText.slice(0, 12_000),
            config: {
                outputDimensionality: EMBEDDING_DIMENSIONS,
                taskType,
            },
        });

        const values = response.embeddings?.[0]?.values;
        if (
            !values ||
            values.length !== EMBEDDING_DIMENSIONS ||
            !values.every(Number.isFinite)
        ) {
            throw new ApiError(
                502,
                "The embedding service returned an invalid vector.",
            );
        }

        return values;
    }

    async indexJob(job: IJob): Promise<void> {
        if (!job._id) {
            throw new ApiError(400, "A saved job is required for indexing.");
        }

        const resourceId =
            job._id instanceof Types.ObjectId
                ? job._id
                : new Types.ObjectId(job._id);
        const skills = await SkillModel.find({ _id: { $in: job.skills } })
            .select("name")
            .lean()
            .exec();
        const text = this.jobToText(
            job,
            skills.map((skill) => skill.name),
        );
        const contentHash = createHash("sha256").update(text).digest("hex");
        const existing = await embeddingRepository.findByResource(
            "job",
            resourceId,
        );

        if (existing?.contentHash === contentHash) {
            return;
        }

        const values = await this.embedText(text, "RETRIEVAL_DOCUMENT");
        await embeddingRepository.upsert({
            resourceType: "job",
            resourceId,
            contentHash,
            modelVersion: EMBEDDING_MODEL,
            values,
        });
    }

    async removeJobIndex(jobId: string): Promise<void> {
        if (!Types.ObjectId.isValid(jobId)) {
            throw new ApiError(400, "Invalid job ID.");
        }

        await embeddingRepository.deleteByResource(
            "job",
            new Types.ObjectId(jobId),
        );
    }

    jobToText(job: IJob, skillNames: string[] = []): string {
        return [
            job.title,
            job.description,
            `Location: ${job.location}`,
            `Employment type: ${job.employmentType}`,
            skillNames.length > 0
                ? `Skills: ${skillNames.join(", ")}`
                : "",
            job.experienceLevel
                ? `Experience level: ${job.experienceLevel}`
                : "",
            job.educationLevel
                ? `Education level: ${job.educationLevel}`
                : "",
            job.salary
                ? `Salary: ${job.salary.minimum ?? ""}-${
                      job.salary.maximum ?? ""
                  } ${job.salary.currency ?? ""}`
                : "",
            job.requirements.join(". "),
            job.responsibilities.join(". "),
        ]
            .filter(Boolean)
            .join("\n")
            .slice(0, 12_000);
    }
}

export const embeddingService = new EmbeddingService();

export default embeddingService;