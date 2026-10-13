import { Types } from "mongoose";
import { ApiError } from "../../../utils/ApiError.js";
import logger from "../../../utils/logger.js";
import embeddingService from "../embedding/embedding.service.js";
import semanticSearchRepository from "./semanticSearch.repository.js";
import type {
    ISemanticSearchFilters,
    ISemanticSearchOptions,
} from "./semanticSearch.interface.js";

const cosineSimilarity = (first: number[], second: number[]): number => {
    if (first.length !== second.length || first.length === 0) {
        return 0;
    }

    let dotProduct = 0;
    let firstMagnitude = 0;
    let secondMagnitude = 0;
    for (let index = 0; index < first.length; index += 1) {
        dotProduct += first[index] * second[index];
        firstMagnitude += first[index] ** 2;
        secondMagnitude += second[index] ** 2;
    }

    if (firstMagnitude === 0 || secondMagnitude === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude));
};

export class SemanticSearchService {
    async reindexPublishedJobs(
        limit: number,
        afterId?: string,
    ) {
        if (afterId && !Types.ObjectId.isValid(afterId)) {
            throw new ApiError(400, "Invalid reindex cursor.");
        }

        const jobs =
            await semanticSearchRepository.findPublishedJobsForIndexing(
                afterId ? new Types.ObjectId(afterId) : undefined,
                limit,
            );
        const failures: Array<{ jobId: string; message: string }> = [];

        for (let index = 0; index < jobs.length; index += 5) {
            const batch = jobs.slice(index, index + 5);
            const outcomes = await Promise.allSettled(
                batch.map((job) => embeddingService.indexJob(job)),
            );

            outcomes.forEach((outcome, batchIndex) => {
                if (outcome.status === "rejected") {
                    const jobId = batch[batchIndex]._id?.toString() ?? "unknown";
                    const errorMessage =
                        outcome.reason instanceof Error
                            ? outcome.reason.message
                            : String(outcome.reason);
                    logger.error(
                        `Failed to reindex semantic embedding for job ${jobId}: ${errorMessage}`,
                    );
                    failures.push({
                        jobId,
                        message: "Embedding generation failed for this job.",
                    });
                }
            });
        }

        const lastJobId = jobs.at(-1)?._id?.toString();
        return {
            processed: jobs.length,
            failed: failures.length,
            failures,
            nextCursor: lastJobId ?? null,
            hasMore: jobs.length === limit,
        };
    }

    async searchJobs(
        query: string,
        filters: ISemanticSearchFilters,
        options: ISemanticSearchOptions,
    ) {
        const normalizedQuery = query.trim();
        if (normalizedQuery.length < 2 || normalizedQuery.length > 500) {
            throw new ApiError(400, "Search query must be between 2 and 500 characters.");
        }

        const queryEmbedding = await embeddingService.embedText(normalizedQuery);
        const [jobIds, lexicalJobIds] = await Promise.all([
            semanticSearchRepository.findPublishedJobIds(filters),
            semanticSearchRepository.findLexicalMatches(normalizedQuery, filters),
        ]);
        const candidateIds = [
            ...new Map(
                [...jobIds, ...lexicalJobIds].map((id) => [id.toString(), id]),
            ).values(),
        ];
        const embeddings =
            await semanticSearchRepository.findJobEmbeddings(candidateIds);
        const lexicalRank = new Map(
            lexicalJobIds.map((id, index) => [id.toString(), index]),
        );
        const embeddingByJobId = new Map(
            embeddings.map((embedding) => [
                embedding.resourceId.toString(),
                embedding.values,
            ]),
        );

        const ranked = candidateIds
            .map((jobId) => {
                const vector = embeddingByJobId.get(jobId.toString());
                const semanticScore =
                    vector === undefined
                        ? null
                        : Math.max(0, cosineSimilarity(queryEmbedding, vector));
                const textRank = lexicalRank.get(jobId.toString());
                const lexicalScore =
                    textRank === undefined
                        ? null
                        : 1 / (1 + textRank * 0.05);
                const score =
                    semanticScore !== null && lexicalScore !== null
                        ? semanticScore * 0.7 + lexicalScore * 0.3
                        : semanticScore ?? lexicalScore ?? 0;

                return {
                    jobId,
                    score,
                    semanticScore,
                    lexicalRank:
                        textRank === undefined ? null : textRank + 1,
                };
            })
            .filter((result) => result.score > 0)
            .sort((first, second) => second.score - first.score);

        const { page, limit } = options;
        const pageResults = ranked.slice((page - 1) * limit, page * limit);
        const jobs = await semanticSearchRepository.findJobsByIds(
            pageResults.map((result) => result.jobId),
        );
        const jobsById = new Map(
            jobs.map((job) => [job._id?.toString(), job]),
        );
        const results = pageResults.flatMap((result) => {
            const job = jobsById.get(result.jobId.toString());
            return job
                ? [
                      {
                          job,
                          score: Math.round(result.score * 100),
                          semanticScore:
                              result.semanticScore === null
                                  ? null
                                  : Math.round(result.semanticScore * 100),
                          lexicalRank: result.lexicalRank,
                      },
                  ]
                : [];
        });
        const totalPages = Math.ceil(ranked.length / limit);

        return {
            results,
            meta: {
                query: normalizedQuery,
                page,
                limit,
                total: ranked.length,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }
}

export const semanticSearchService = new SemanticSearchService();

export default semanticSearchService;