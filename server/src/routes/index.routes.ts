import { Router } from "express"
import authRouter from "../modules/auth/auth.route.js"
import userRouter from "../modules/user/user.route.js"
import categoryRouter from "../modules/category/category.route.js"
import workerRouter from "../modules/worker/worker.route.js"
import skillRouter from "../modules/skill/skill.route.js"
import companyRouter from "../modules/company/company.route.js"
import resumeRouter from "../modules/resume/resume.route.js"


const router = Router();

router.use("/auth", authRouter)
router.use("/users", userRouter)
router.use("/categories", categoryRouter)
router.use("/workers", workerRouter)
router.use("/skills", skillRouter)
router.use("/companies", companyRouter)
router.use("/resumes", resumeRouter)

export default router
