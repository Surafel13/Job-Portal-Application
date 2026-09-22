import { Router } from "express"
import authRouter from "../modules/auth/auth.route.js"
import userRouter from "../modules/user/user.route.js"
import categoryRouter from "../modules/category/category.route.js"
import workerRouter from "../modules/worker/worker.route.js"
import skillRouter from "../modules/skill/skill.route.js"
import employerRouter from "../modules/employer/employer.route.js"
import resumeRouter from "../modules/resume/resume.route.js"
import jobRouter from "../modules/job/job.route.js"
import savedJobRouter from "../modules/savedJob/savedJob.route.js"
import applicantRouter from "../modules/applicant/applicant.route.js"
import applicationRouter from "../modules/application/application.route.js"
import searchJobs from "../modules/search/search.route.js"


const router = Router();

router.use("/auth", authRouter)
router.use("/users", userRouter)
router.use("/categories", categoryRouter)
router.use("/workers", workerRouter)
router.use("/skills", skillRouter)
router.use("/employers", employerRouter)
router.use("/resumes", resumeRouter)
router.use("/jobs", jobRouter)
router.use("/saved-job", savedJobRouter)
router.use("/applicants", applicantRouter)
router.use("/application", applicationRouter)
router.use("/search", searchJobs)

export default router
