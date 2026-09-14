import { Router } from "express"
import authRouter from "../modules/auth/auth.route.js"
import userRouter from "../modules/user/user.route.js"
import categoryRouter from "../modules/category/category.route.js"


const router = Router();

router.use("/auth", authRouter)
router.use("/users", userRouter)
router.use("/categories", categoryRouter)

export default router