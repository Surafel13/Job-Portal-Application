import type { Types } from "mongoose";
import UserModel from "../user/user.model.js";
import EmployerModel from "../employer/employer.model.js";
import JobModel from "../job/job.model.js";
import type { IPlatformStatistics } from "./admin.interface.js";

export class AdminRepository {
  async findUserById(userId: Types.ObjectId) {
    return UserModel.findById(userId)
      .select("-password -refreshToken")
      .lean()
      .exec();
  }

  async updateUserStatus(
    userId: Types.ObjectId,
    status: "active" | "suspended" | "deactivated",
  ) {
    return UserModel.findByIdAndUpdate(
      userId,
      { $set: { status } },
      { new: true, runValidators: true },
    )
      .select("-password -refreshToken")
      .lean()
      .exec();
  }

  async findEmployerById(employerId: Types.ObjectId) {
    return EmployerModel.findById(employerId).lean().exec();
  }

  async updateEmployerVerification(
    employerId: Types.ObjectId,
    verificationStatus: "pending" | "verified" | "rejected" | "suspended",
  ) {
    return EmployerModel.findByIdAndUpdate(
      employerId,
      { $set: { verificationStatus } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();
  }

  async updateEmployerStatus(
    employerId: Types.ObjectId,
    verificationStatus: "pending" | "verified" | "rejected" | "suspended",
  ) {
    return EmployerModel.findByIdAndUpdate(
      employerId,
      { $set: { verificationStatus } },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();
  }

  async findJobById(jobId: Types.ObjectId) {
    return JobModel.findById(jobId).lean().exec();
  }

  async updateJobStatus(
    jobId: Types.ObjectId,
    status:
      | "draft"
      | "pending"
      | "published"
      | "closed"
      | "expired"
      | "rejected",
  ) {
    return JobModel.findByIdAndUpdate(
      jobId,
      {
        $set: {
          status,
          ...(status === "published" ? { publishedAt: new Date() } : {}),
        },
      },
      { new: true, runValidators: true },
    )
      .lean()
      .exec();
  }

  async getStatistics(): Promise<IPlatformStatistics> {
    const [
      totalUsers,
      totalWorkers,
      totalEmployers,
      totalAdmins,
      totalEmployersCount,
      verifiedEmployers,
      pendingEmployers,
      suspendedEmployers,
      totalJobs,
      publishedJobs,
      pendingJobs,
      closedJobs,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: "worker" }),
      UserModel.countDocuments({ role: "employer" }),
      UserModel.countDocuments({ role: "admin" }),
      EmployerModel.countDocuments(),
      EmployerModel.countDocuments({
        verificationStatus: "verified",
      }),
      EmployerModel.countDocuments({
        verificationStatus: "pending",
      }),
      EmployerModel.countDocuments({
        verificationStatus: "suspended",
      }),
      JobModel.countDocuments(),
      JobModel.countDocuments({ status: "published" }),
      JobModel.countDocuments({ status: "pending" }),
      JobModel.countDocuments({ status: "closed" }),
    ]);
    
    return {
      totalUsers,
      totalWorkers,
      totalEmployers,
      totalAdmins,
      totalEmployersCount,
      verifiedEmployers,
      pendingEmployers,
      suspendedEmployers,
      totalJobs,
      publishedJobs,
      pendingJobs,
      closedJobs,
      totalApplications: 0,
      totalReports: 0,
    };
  }
}

export const adminRepository = new AdminRepository();

export default adminRepository;
