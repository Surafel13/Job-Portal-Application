import { ApiError } from "../../../utils/ApiError.js";
import logger from "../../../utils/logger.js";
import EmployerRepository from "../../employer/employer.repository.js";
import {
  jobDescriptionPrompt,
  jobDescriptionSystemInstruction,
} from "../prompt/jobDescription.prompt.js";
import type { IGeneratedJobDescription } from "./jobDescription.interface.js";
import { parseGeneratedJobDescription } from "./jobDescription.parser.js";
import type { GenerateJobDescriptionInput } from "./jobDescription.validation.js";

// Same model string the recommendation service uses; change both together.
const JOB_DESCRIPTION_MODEL = "gemini-3.8-flash";

type TextGenerator = (
  input: GenerateJobDescriptionInput,
) => Promise<string | undefined>;

const generateWithGemini: TextGenerator = async (input) => {
  const { gemini } = await import("../../../config/gemini.js");

  const response = await gemini.models.generateContent({
    model: JOB_DESCRIPTION_MODEL,
    contents: jobDescriptionPrompt(input),
    config: {
      systemInstruction: jobDescriptionSystemInstruction,
      responseMimeType: "application/json",
      temperature: 0.6,
    },
  });

  return response.text;
};

export class JobDescriptionService {
  constructor(
    private readonly employerRepository = new EmployerRepository(),
    private readonly generateText: TextGenerator = generateWithGemini,
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

  async generate(
    userId: string,
    input: GenerateJobDescriptionInput,
  ): Promise<IGeneratedJobDescription> {
    await this.assertVerifiedEmployer(userId);

    const seen = new Set<string>();
    const skills = input.skills.filter((skill) => {
      const key = skill.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let text: string | undefined;
    try {
      text = await this.generateText({ ...input, skills });
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
}

export const jobDescriptionService = new JobDescriptionService();

export default jobDescriptionService;
