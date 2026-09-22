import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import searchService from "./search.service.js";
import { searchJobsSchema } from "./search.validation.js";

class SearchController {
    searchJobs = asyncHandler(
        async (req: Request, res: Response) => {
            const result = searchJobsSchema.safeParse(
                req.query
            );

            if (!result.success) {
                throw result.error;
            }

            const {
                keyword,
                location,
                employmentType,
                categoryId,
                skillIds,
                page,
                limit,
            } = result.data;

            const skillIdList =
                typeof skillIds === "string"
                    ? skillIds.split(",").filter(Boolean)
                    : undefined;

            const searchResult =
                await searchService.searchJobs(
                    {
                        keyword,
                        location,
                        employmentType,
                        categoryId,
                        skillIds: skillIdList,
                    },
                    {
                        page,
                        limit,
                    }
                );

            sendResponse(
                res,
                200,
                "Jobs retrieved successfully",
                searchResult.jobs,
                searchResult.meta
            );
        }
    );

}

export default new SearchController();
