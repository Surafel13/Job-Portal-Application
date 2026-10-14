export type UserRole = "worker" | "employer" | "admin" | "superAdmin";
export type UserStatus = "active" | "suspended" | "deactivated";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type EmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship"
  | "freelance";

export type ExperienceLevel = "entry" | "junior" | "mid" | "senior" | "lead";

export type EducationLevel =
  | "high-school"
  | "certificate"
  | "diploma"
  | "bachelor"
  | "master"
  | "phd";

export type JobStatus =
  | "draft"
  | "pending"
  | "published"
  | "closed"
  | "expired"
  | "rejected";

export interface SalaryRange {
  minimum?: number;
  maximum?: number;
  currency?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface Skill {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface Employer {
  _id: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  headquarters?: string;
  description?: string;
  logo?: string;
  verificationStatus: "pending" | "verified" | "rejected" | "suspended";
  recruiters: string[];
  createdAt?: string;
}

export interface Job {
  _id: string;
  companyId: string | Employer;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location: string;
  employmentType: EmploymentType;
  salary?: SalaryRange;
  experienceLevel?: ExperienceLevel;
  educationLevel?: EducationLevel;
  skills: Array<string | Skill>;
  categoryId: string | Category;
  status: JobStatus;
  publishedAt?: string;
  deadline?: string;
  viewCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn";

export interface Resume {
  _id: string;
  userId: string;
  originalName: string;
  fileName: string;
  filePath: string;
  cloudinaryUrl?: string;
  mimeType: string;
  size: number;
  createdAt?: string;
}

export interface Application {
  _id: string;
  applicantId: string | Record<string, unknown>;
  jobId: string | Job;
  coverLetter?: string;
  resumeId?: string | Resume;
  status: ApplicationStatus;
  appliedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkerSkill {
  skillId: string;
  name: string;
  level?: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface WorkerProfile {
  _id: string;
  userId: string;
  professionalSummary?: string;
  skills: WorkerSkill[];
  categoryIds: string[];
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
  }>;
  experience: Array<{
    company: string;
    jobTitle: string;
    isCurrent: boolean;
  }>;
  location?: string;
  preferredJobTypes: EmploymentType[];
  preferredLocations: string[];
  preferredWorkTypes: Array<"onsite" | "remote" | "hybrid">;
  minimumSalary?: number;
  maximumSalary?: number;
  resumeIds: string[];
  profileCompletion: number;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  isRead: boolean;
  resourceType?: string;
  resourceId?: string;
  createdAt?: string;
}

export interface RecommendationResult {
  totalRecommendedJobs: number;
  recommendedJobs: Array<{
    jobId: string;
    title: string;
    recommendationPercentage: number;
    reason: string;
  }>;
}

export interface AdminDashboard {
  statistics: {
    totalUsers: number;
    totalWorkers: number;
    totalEmployers: number;
    totalAdmins: number;
    totalEmployersCount: number;
    verifiedEmployers: number;
    pendingEmployers: number;
    suspendedEmployers: number;
    totalJobs: number;
    publishedJobs: number;
    pendingJobs: number;
    closedJobs: number;
    totalApplications: number;
    totalReports: number;
  };
  generatedAt: string;
}

export interface SavedJob {
  _id: string;
  jobId: string | Job;
  createdAt?: string;
}
