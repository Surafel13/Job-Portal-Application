import {
  Briefcase,
  Flag,
  LayoutDashboard,
  ScrollText,
  Settings,
  Tags,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export interface SuperAdminNavItem {
  key: string;
  to: string;
  label: string;
  icon: LucideIcon;
  /** false → rendered as an "In Progress" placeholder page */
  ready: boolean;
  description: string;
  planned: string[];
  /** Honest note about what the current backend does / doesn't offer */
  backend: string;
}

export const superAdminNav: SuperAdminNavItem[] = [
  {
    key: "overview",
    to: "/super-admin",
    label: "Overview",
    icon: LayoutDashboard,
    ready: true,
    description: "Platform analytics at a glance.",
    planned: [],
    backend: "",
  },
  {
    key: "users",
    to: "/super-admin/users",
    label: "Users & Roles",
    icon: UserCog,
    ready: true,
    description: "Manage workers, employers, admins and permissions.",
    planned: [],
    backend: "",
  },
  {
    key: "jobs",
    to: "/super-admin/jobs",
    label: "Job Moderation",
    icon: Briefcase,
    ready: false,
    description: "Review, publish, reject and close job listings.",
    planned: [
      "Queue of jobs waiting for review",
      "Publish, reject and close actions with a reason",
      "Filter by status, employer and category",
    ],
    backend:
      "Publish / reject / close exist at PATCH /admin/jobs/:id/*, but only for the admin role. GET /jobs/status is shadowed by GET /jobs/:id, so jobs can't be listed by status yet.",
  },
  {
    key: "categories",
    to: "/super-admin/categories",
    label: "Categories",
    icon: Tags,
    ready: false,
    description: "Organize the job categories used across the platform.",
    planned: [
      "Create, rename and deactivate categories",
      "Job counts per category",
      "Slug validation and duplicate detection",
    ],
    backend:
      "Full CRUD is available at /categories. Those routes currently have no authentication middleware.",
  },
  {
    key: "reports",
    to: "/super-admin/reports",
    label: "Reports",
    icon: Flag,
    ready: false,
    description: "Handle reports raised against users, employers and jobs.",
    planned: [
      "Report queue by status",
      "Start review, resolve or reject with a decision note",
      "Report counts per resource",
    ],
    backend: "Endpoints exist at /report, restricted to the admin role.",
  },
  {
    key: "audit-logs",
    to: "/super-admin/audit-logs",
    label: "Audit Logs",
    icon: ScrollText,
    ready: false,
    description: "Track every administrative action on the platform.",
    planned: [
      "Searchable timeline of admin actions",
      "Filter by admin, action and resource",
      "Export for compliance",
    ],
    backend:
      "No audit-log model or routes yet. IAdminAction exists only as a TypeScript interface.",
  },
  {
    key: "settings",
    to: "/super-admin/settings",
    label: "System Settings",
    icon: Settings,
    ready: false,
    description: "Configure platform-wide behavior and feature flags.",
    planned: [
      "Platform information and support contacts",
      "Registration, verification and approval toggles",
      "Maintenance mode",
    ],
    backend: "No settings model or endpoints yet.",
  },
];
