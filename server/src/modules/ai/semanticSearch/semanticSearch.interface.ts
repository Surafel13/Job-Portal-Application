import type { Types } from "mongoose";
import type { EmploymentType } from "../../job/job.interface.js";

export interface ISemanticSearchFilters {
    location?: string;
    employmentType?: EmploymentType;
    categoryId?: string;
}

export interface ISemanticSearchOptions {
    page: number;
    limit: number;
}

export interface ISemanticSearchResult {
    jobId: Types.ObjectId;
    score: number;
    semanticScore: number | null;
    lexicalRank: number | null;
}