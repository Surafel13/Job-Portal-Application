import { ApiError } from "../../../utils/ApiError.js";
import logger from "../../../utils/logger.js";
import EmployerRepository from "../../employer/employer.repository.js";
import {
  jobDescriptionPrompt,
  jobDescriptionSystemInstruction,
} from "../prompt/jobDescription.prompt.js";
import type {
  IGeneratedJobDescription,
  JobDescriptionStreamEvent,
} from "./jobDescription.interface.js";
import { parseGeneratedJobDescription } from "./jobDescription.parser.js";
import type { GenerateJobDescriptionInput } from "./jobDescription.validation.js";

// Same model string the recommendation service uses; change both together.
const JOB_DESCRIPTION_MODEL = "gemini-3.8-flash";

const baseConfig = {
  systemInstruction: jobDescriptionSystemInstruction,
  responseMimeType: "application/json",
  temperature: 0.6,
};

type TextGenerator = (
  input: GenerateJobDescriptionInput,
) => Promise<string | undefined>;

export type TextStreamer = (
  input: GenerateJobDescriptionInput,
  signal?: AbortSignal,
) => AsyncIterable<string>;

const generateWithGemini: TextGenerator = async (input) => {
  const { gemini } = await import("../../../config/gemini.js");

  const response = await gemini.models.generateContent({
    model: JOB_DESCRIPTION_MODEL,
    contents: jobDescriptionPrompt(input),
    config: baseConfig,
  });

  return response.text;
};

const streamWithGemini: TextStreamer = async function* (input, signal) {
  const { gemini } = await import("../../../config/gemini.js");

  const stream = await gemini.models.generateContentStream({
    model: JOB_DESCRIPTION_MODEL,
    contents: jobDescriptionPrompt(input),
    config: { ...baseConfig, ...(signal ? { abortSignal: signal } : {}) },
  });

  for await (const chunk of stream) {
    if (signal?.aborted) return;
    const text = chunk.text;
    if (text) yield text;
  }
};

export class JobDescriptionService {
  constructor(
    private readonly employerRepository = new EmployerRepository(),
    private readonly generateText: TextGenerator = generateWithGemini,
    private readonly streamText: TextStreamer = streamWithGemini,
  ) {}

  private async assertVerifiedEmployer(userId: string): Promise<void> {
    const employer = await this.employerRepository.findByRecruiterId(userId);

    if (!employer) {
      throw new ApiError(404, "No employer profile found for this account.");
    }

    if (employer.verificationStatus !== "verified") {
      throw new ApiError(
        403,
        "Your employer account must be verified before you can generate job descriptions.",
      );
    }
  }

  private dedupeSkills(
    input: GenerateJobDescriptionInput,
  ): GenerateJobDescriptionInput {
    const seen = new Set<string>();
    const skills = input.skills.filter((skill) => {
      const key = skill.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { ...input, skills };
  }

  async generate(
    userId: string,
    input: GenerateJobDescriptionInput,
  ): Promise<IGeneratedJobDescription> {
    await this.assertVerifiedEmployer(userId);
    const prepared = this.dedupeSkills(input);

    let text: string | undefined;
    try {
      text = await this.generateText(prepared);
    } catch (error) {
      logger.error(
        `Job description generation failed: ${
          error instanceof Error
            ? (error.stack ?? error.message)
            : String(error)
        }`,
      );
      throw new ApiError(
        502,
        "The AI service is unavailable right now. Please try again.",
      );
    }

    if (!text) {
      throw new ApiError(
        502,
        "The AI service returned an empty response. Please try again.",
      );
    }

    return parseGeneratedJobDescription(text);
  }

  /**
   * Authorization runs eagerly so callers can still answer with a normal JSON
   * error before opening an SSE response. The returned generator then yields
   * real Gemini chunks and ends with a validated `done` event. It finishes
   * silently when `signal` aborts.
   */
  async openStream(
    userId: string,
    input: GenerateJobDescriptionInput,
    signal?: AbortSignal,
  ): Promise<AsyncGenerator<JobDescriptionStreamEvent, void, undefined>> {
    await this.assertVerifiedEmployer(userId);
    return this.run(this.dedupeSkills(input), signal);
  }

  private async *run(
    input: GenerateJobDescriptionInput,
    signal?: AbortSignal,
  ): AsyncGenerator<JobDescriptionStreamEvent, void, undefined> {
    let text = "";

    try {
      for await (const piece of this.streamText(input, signal)) {
        if (signal?.aborted) return;
        text += piece;
        yield { type: "chunk", text: piece };
      }
    } catch (error) {
      if (signal?.aborted) return;
      logger.error(
        `Job description streaming failed: ${
          error instanceof Error
            ? (error.stack ?? error.message)
            : String(error)
        }`,
      );
      throw new ApiError(
        502,
        "The AI service is unavailable right now. Please try again.",
      );
    }

    if (signal?.aborted) return;

    if (!text) {
      throw new ApiError(
        502,
        "The AI service returned an empty response. Please try again.",
      );
    }

    yield { type: "done", result: parseGeneratedJobDescription(text) };
  }
}

export const jobDescriptionService = new JobDescriptionService();

export default jobDescriptionService;
