import Router from "express";
import searchController from "./search.controller.js";

const router = Router();

router.get(
    "/jobs",
    searchController.searchJobs
);

export default router;
