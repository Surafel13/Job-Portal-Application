import type { Request, RequestHandler, Response } from "express";
import asyncHandler from "../../../utils/asyncHandler.js";
import sendResponse from "../../../utils/sendResponse.js";
import semanticSearchService from "./semanticSearch.service.js";
import type {
    SemanticReindexInput,
    SemanticSearchQuery,
} from "./semanticSearch.validation.js";

class SemanticSearchController {
    reindexPublishedJobs: RequestHandler = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { limit, afterId } = req.body as SemanticReindexInput;
            const result = await semanticSearchService.reindexPublishedJobs(
                limit,
                afterId,
            );
            sendResponse(
                res,
                200,
                "Published job embedding batch processed.",
                result,
            );
        },
    );

    searchJobs: RequestHandler = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const query = req.query as unknown as SemanticSearchQuery;
            const { q, page, limit, ...filters } = query;
            const result = await semanticSearchService.searchJobs(
                q,
                filters,
                { page, limit },
            );
            sendResponse(
                res,
                200,
                "Semantic job search completed.",
                result.results,
                { ...result.meta },
            );
        },
    );
}

export const semanticSearchController = new SemanticSearchController();

export default semanticSearchController;