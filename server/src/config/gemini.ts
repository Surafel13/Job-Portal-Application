import { GoogleGenAI } from "@google/genai";
import env from "./env.js";

const geminiApiKey = env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

export const gemini = new GoogleGenAI({
  apiKey: geminiApiKey,
});