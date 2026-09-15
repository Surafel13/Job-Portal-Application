import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
    validateBody,
    validateParams,
    validateQuery,
} from "../../middlewares/validation.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
    createCompany,
    deleteCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
} from "./company.controller.js";
import {
    companyIdParamSchema,
    companyQuerySchema,
    createCompanySchema,
    updateCompanySchema,
} from "./company.validation.js";

const router = Router();

router.get(
    "/",
    validateQuery(companyQuerySchema),
    asyncHandler(getCompanies)
);

router.get(
    "/:id",
    validateParams(companyIdParamSchema),
    asyncHandler(getCompanyById)
);

router.use(authMiddleware);

router.post(
    "/",
    validateBody(createCompanySchema),
    asyncHandler(createCompany)
);

router.patch(
    "/:id",
    validateParams(companyIdParamSchema),
    validateBody(updateCompanySchema),
    asyncHandler(updateCompany)
);

router.delete(
    "/:id",
    validateParams(companyIdParamSchema),
    asyncHandler(deleteCompany)
);

export default router;
