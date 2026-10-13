import { Router } from "express";
import authMiddleware from "../../../middlewares/auth.middleware.js";
import {
    validateBody,
    validateQuery,
} from "../../../middlewares/validation.middleware.js";
import rateLimitMiddleware from "../../../middlewares/rateLimit.middleware.js";
import { authorizeRoles } from "../../../middlewares/role.middleware.js";
import semanticSearchController from "./semanticSearch.controller.js";
import {
    semanticReindexSchema,
    semanticSearchQuerySchema,
} from "./semanticSearch.validation.js";

const router: ReturnType<typeof Router> = Router();

router.get(
    "/jobs",
    rateLimitMiddleware,
    validateQuery(semanticSearchQuerySchema),
    semanticSearchController.searchJobs,
);

router.post(
    "/reindex",
    authMiddleware,
    authorizeRoles("admin", "superAdmin"),
    rateLimitMiddleware,
    validateBody(semanticReindexSchema),
    semanticSearchController.reindexPublishedJobs,
);

export default router;