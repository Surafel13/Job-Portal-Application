import { Types } from "mongoose";
import JobModel from "../../job/job.model.js";
import ResumeModel from "../../resume/resume.model.js";
import UserModel from "../../user/user.model.js";
import WorkerModel from "../../worker/worker.model.js";

export class RecommendationRepository {
  async getUserById(userId: string) {
    return await UserModel.findById(userId);
  }

  async getWorkerProfileById(userId: string) {
    return await WorkerModel.findOne({
      userId: userId,
    });
  }

  async getJobsByCategoryThatArePublished(categoryIds: Types.ObjectId[]) {
    return await JobModel.find({
      categoryId: { $in: categoryIds },
      status: "published",
    });
  }

  async getUserResumeById(userId: string) {
    return await ResumeModel.findById(userId);
  }
}
