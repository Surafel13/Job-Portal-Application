import mongoose from "mongoose";
import env from "./env.js";

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(env.DATABASE_URL);

  console.log("MongoDB connected successfully");
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};