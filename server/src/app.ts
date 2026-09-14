import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import env from "./config/env.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true
  })
);

// Middlewares

import errorMiddleware from "./middlewares/error.middleware.js";
import notFoundMiddleware from "./middlewares/notFound.middleware.js";
import loggerMiddleware from "./middlewares/logger.middleware.js";

app.use(loggerMiddleware)

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Job Portal API is running"
  });
});


// routes

import router from "./routes/index.routes.js";

app.use("/api/v1", router)



app.use(notFoundMiddleware)
app.use(errorMiddleware)


export default app;