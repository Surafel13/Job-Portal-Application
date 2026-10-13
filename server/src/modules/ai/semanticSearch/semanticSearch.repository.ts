import { Types } from "mongoose";
import type { IJob } from "../../job/job.interface.js";
import JobModel from "../../job/job.model.js";
import embeddingRepository from "../embedding/embedding.repository.js";
import { EMBEDDING_MODEL } from "../embedding/embedding.service.js";
import type { ISemanticSearchFilters } from "./semanticSearch.interface.js";

const MAX_VECTOR_CANDIDATES = 5000;
const MAX_LEXICAL_CANDIDATES = 500;

interface PublishedJobFilter {
    status: "published";
    categoryId?: Types.ObjectId;
    employmentType?: IJob["employmentType"];
    location?: RegExp;
}

export class SemanticSearchRepository {
    private buildJobFilter(
        filters: ISemanticSearchFilters,
    ): PublishedJobFilter {
        const query: PublishedJobFilter = { status: "published" };

        if (filters.categoryId) {
            query.categoryId = new Types.ObjectId(filters.categoryId);
        }
        if (filters.employmentType) {
            query.employmentType = filters.employmentType;
        }
        if (filters.location) {
            const escapedLocation = filters.location.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&",
            );
            query.location = new RegExp(escapedLocation, "i");
        }

        return query;
    }

    async findPublishedJobIds(
        filters: ISemanticSearchFilters,
    ): Promise<Types.ObjectId[]> {
        const jobs = await JobModel.find(this.buildJobFilter(filters))
            .select("_id")
            .sort({ publishedAt: -1, createdAt: -1 })
            .limit(MAX_VECTOR_CANDIDATES)
            .lean<Array<{ _id: Types.ObjectId }>>()
            .exec();

        return jobs.map((job) => job._id);
    }

    async findPublishedJobsForIndexing(
        afterId: Types.ObjectId | undefined,
        limit: number,
    ): Promise<IJob[]> {
        return JobModel.find({
            status: "published",
            ...(afterId && { _id: { $gt: afterId } }),
        })
            .sort({ _id: 1 })
            .limit(limit)
            .lean<IJob[]>()
            .exec();
    }

    async findLexicalMatches(
        query: string,
        filters: ISemanticSearchFilters,
    ): Promise<Types.ObjectId[]> {
        const jobs = await JobModel.find(
            {
                ...this.buildJobFilter(filters),
                $text: { $search: query },
            },
            { score: { $meta: "textScore" } },
        )
            .select("_id")
            .sort({ score: { $meta: "textScore" } })
            .limit(MAX_LEXICAL_CANDIDATES)
            .lean<Array<{ _id: Types.ObjectId; score: number }>>()
            .exec();

        return jobs.map((job) => job._id);
    }

    async findJobEmbeddings(resourceIds: Types.ObjectId[]) {
        return embeddingRepository.findByResourceIds(
            "job",
            resourceIds,
            EMBEDDING_MODEL,
        );
    }

    async findJobsByIds(jobIds: Types.ObjectId[]) {
        if (jobIds.length === 0) {
            return [];
        }

        return JobModel.find({
            _id: { $in: jobIds },
            status: "published",
        })
            .populate("companyId")
            .populate("categoryId")
            .populate("skills")
            .lean<IJob[]>()
            .exec();
    }
}

export const semanticSearchRepository = new SemanticSearchRepository();

export default semanticSearchRepository;
