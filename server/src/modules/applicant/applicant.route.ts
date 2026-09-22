import Router from "express";
import applicantController from "./applicant.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";
import {
    validateBody,
    validateParams,
} from "../../middlewares/validation.middleware.js";
import {
    createApplicantSchema,
    updateApplicantSchema,
    applicantIdSchema,
} from "./applicant.validation.js";

const router = Router();

router.post(
    "/",
    authMiddleware,
    authorizeRoles("worker"),
    validateBody(createApplicantSchema),
    applicantController.createApplicant
);

router.get(
    "/",
    authMiddleware,
    authorizeRoles("admin", "superAdmin"),
    applicantController.getMyApplicantProfile
);

router.get(
    "/me",
    authMiddleware,
    authorizeRoles("worker"),
    applicantController.getMyApplicantProfile
);

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("admin", "superAdmin"),
    validateParams(applicantIdSchema),
    applicantController.getApplicantById
);

router.patch(
    "/",
    authMiddleware,
    authorizeRoles("worker"),
    validateBody(updateApplicantSchema),
    applicantController.updateApplicant
);

router.delete(
    "/",
    authMiddleware,
    authorizeRoles("worker"),
    applicantController.deleteApplicant
);

export default router;
