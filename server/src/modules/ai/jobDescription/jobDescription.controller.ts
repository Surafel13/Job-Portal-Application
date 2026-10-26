import type { Request, Response } from "express";
import asyncHandler from "../../../utils/asyncHandler.js";
import sendResponse from "../../../utils/sendResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import logger from "../../../utils/logger.js";
import { openSse } from "../../../utils/sse.js";
import jobDescriptionService, {
  type JobDescriptionService,
} from "./jobDescription.service.js";
import type { GenerateJobDescriptionInput } from "./jobDescription.validation.js";

type DescriptionService = Pick<
  JobDescriptionService,
  "generate" | "openStream"
>;

export class JobDescriptionController {
  constructor(
    private readonly service: DescriptionService = jobDescriptionService,
  ) {}

  generate = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.user) {
        throw new ApiError(401, "Authentication required.");
      }

      console.log("Request body:", req.body);

      const result = await this.service.generate(
        req.user.userId,
        req.body as GenerateJobDescriptionInput,
      );

      sendResponse(res, 200, "Job description generated successfully.", result);
    },
  );

  stream = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }

    // Abort upstream work when the client goes away before we finish.
    const controller = new AbortController();
    res.on("close", () => {
      if (!res.writableFinished) controller.abort();
    });

    // May throw ApiError -> regular JSON error response (headers not sent yet).
    const events = await this.service.openStream(
      req.user.userId,
      req.body as GenerateJobDescriptionInput,
      controller.signal,
    );

    if (controller.signal.aborted) {
      await events.return(undefined);
      return;
    }

    const sse = openSse(res);

    try {
      for await (const event of events) {
        if (controller.signal.aborted) break;
        if (event.type === "chunk") {
          sse.send("chunk", { text: event.text });
        } else {
          sse.send("done", event.result);
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        if (!(error instanceof ApiError)) {
          logger.error(
            `Unexpected job description stream error: ${
              error instanceof Error
                ? (error.stack ?? error.message)
                : String(error)
            }`,
          );
        }
        sse.send("error", {
          message:
            error instanceof ApiError
              ? error.message
              : "Something went wrong while generating the description.",
          statusCode: error instanceof ApiError ? error.statusCode : 500,
        });
      }
    } finally {
      sse.close();
    }
  });
}

export const jobDescriptionController = new JobDescriptionController();

export default jobDescriptionController;
