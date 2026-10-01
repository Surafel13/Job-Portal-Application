import mongoose from "mongoose";
import env from "../config/env.js";
import Job  from "../modules/job/job.model.js";
import type { IJob } from "../modules/job/job.interface.js";
import Employer from "../modules/employer/employer.model.js";
import { Category } from "../modules/category/category.model.js";
import { Skill } from "../modules/skill/skill.model.js";

/**
 * Seed 32 jobs for a job portal.
 *
 * Requires: employers, categories, and skills to already exist.
 *  - companyId  → resolved round-robin from available employers
 *                 (field name kept as `companyId` to match IJob interface)
 *  - categoryId → resolved by category slug
 *  - skills     → resolved by skill slug (missing ones are skipped w/ warning)
 *
 * Idempotency: keyed on a deterministic fingerprint (companyId + title)
 * via bulkWrite upsert, so re-running won't duplicate rows.
 *
 * ⚠️  Run order:
 *   1. seed:category
 *   2. seed:skill
 *   3. seed:users   (creates Employer profiles)
 *   4. seed:job     ← this file
 */

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

type EmployerLean = {
    _id: mongoose.Types.ObjectId;
    name: string;
};

type CategoryLean = {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
};

type SkillLean = {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
};

interface JobBlueprint {
    title: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    location: string;
    employmentType: IJob["employmentType"];
    salary?: IJob["salary"];
    experienceLevel: IJob["experienceLevel"];
    educationLevel: IJob["educationLevel"];
    skillSlugs: string[];
    categorySlug: string;
    status: IJob["status"];
    daysToDeadline: number;
    viewCount: number;
    /** Optional hint: pin this job to a specific employer name (partial match). */
    employerNameHint?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Blueprints — 32 jobs across categories, types, levels, statuses
// ─────────────────────────────────────────────────────────────────────

const jobBlueprints: JobBlueprint[] = [
    // ── Software Engineering ─────────────────────────────────────────
    {
        title: "Senior Backend Engineer (Node.js)",
        description:
            "Design and scale distributed backend services powering a job marketplace used by millions. You'll own services end-to-end, from schema design to production on-call.",
        requirements: [
            "5+ years building production Node.js services",
            "Strong TypeScript and REST/GraphQL API design",
            "Experience with MongoDB, Redis, and message queues",
            "Comfortable with Docker, CI/CD, and observability tooling",
        ],
        responsibilities: [
            "Design and ship new microservices",
            "Improve API performance and reliability",
            "Mentor mid-level engineers through code review",
            "Participate in on-call rotation",
        ],
        location: "Remote (EU)",
        employmentType: "full-time",
        salary: { minimum: 70000, maximum: 110000, currency: "EUR" },
        experienceLevel: "senior",
        educationLevel: "bachelor",
        skillSlugs: ["nodejs", "typescript", "mongodb", "redis", "docker"],
        categorySlug: "software-engineering",
        status: "published",
        daysToDeadline: 45,
        viewCount: 1284,
    },
    {
        title: "Frontend Engineer (React)",
        description:
            "Build polished, accessible interfaces for our candidate experience. You'll partner closely with design to ship pixel-perfect components at scale.",
        requirements: [
            "3+ years with React and modern TypeScript",
            "Deep understanding of state management and rendering perf",
            "Experience with testing libraries (Vitest, Testing Library)",
        ],
        responsibilities: [
            "Ship reusable component library",
            "Own frontend performance budget",
            "Collaborate with designers on design system",
        ],
        location: "Berlin, Germany",
        employmentType: "full-time",
        salary: { minimum: 55000, maximum: 85000, currency: "EUR" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["react", "typescript", "javascript"],
        categorySlug: "web-development",
        status: "published",
        daysToDeadline: 30,
        viewCount: 842,
    },
    {
        title: "Full Stack Developer (MERN)",
        description:
            "Own features across the stack in a small, high-velocity team building internal recruiter tooling.",
        requirements: [
            "3+ years full stack JavaScript/TypeScript",
            "Experience with React and Node.js in production",
            "Familiarity with MongoDB data modeling",
        ],
        responsibilities: [
            "Build end-to-end features",
            "Write tests and participate in code review",
            "Ship weekly to production",
        ],
        location: "Amsterdam, Netherlands",
        employmentType: "full-time",
        salary: { minimum: 50000, maximum: 80000, currency: "EUR" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["react", "nodejs", "mongodb", "typescript"],
        categorySlug: "web-development",
        status: "published",
        daysToDeadline: 21,
        viewCount: 611,
    },
    {
        title: "Junior Software Engineer",
        description:
            "Join our graduate program and grow into a well-rounded engineer with structured mentorship and real ownership from week one.",
        requirements: [
            "CS degree or equivalent bootcamp",
            "Familiarity with at least one programming language",
            "Strong problem-solving and communication skills",
        ],
        responsibilities: [
            "Implement well-scoped tickets",
            "Write tests alongside features",
            "Learn from code review feedback",
        ],
        location: "Lisbon, Portugal",
        employmentType: "full-time",
        salary: { minimum: 28000, maximum: 38000, currency: "EUR" },
        experienceLevel: "entry",
        educationLevel: "bachelor",
        skillSlugs: ["javascript", "nodejs", "communication"],
        categorySlug: "software-engineering",
        status: "published",
        daysToDeadline: 60,
        viewCount: 1523,
    },
    {
        title: "Staff Software Engineer, Platform",
        description:
            "Set technical direction for our platform team. You'll drive architecture decisions across services, data, and infrastructure.",
        requirements: [
            "8+ years engineering, 3+ at staff/principal level",
            "Track record of leading cross-team initiatives",
            "Deep distributed systems knowledge",
        ],
        responsibilities: [
            "Define platform architecture",
            "Lead design reviews and RFCs",
            "Mentor senior engineers",
        ],
        location: "London, UK",
        employmentType: "full-time",
        salary: { minimum: 120000, maximum: 170000, currency: "GBP" },
        experienceLevel: "lead",
        educationLevel: "bachelor",
        skillSlugs: ["nodejs", "typescript", "kubernetes", "postgresql"],
        categorySlug: "software-engineering",
        status: "published",
        daysToDeadline: 40,
        viewCount: 402,
    },

    // ── Mobile ────────────────────────────────────────────────────────
    {
        title: "React Native Engineer",
        description:
            "Ship our candidate app to iOS and Android. You'll own the mobile codebase and release process.",
        requirements: [
            "3+ years React Native in production",
            "Experience with native modules and app store releases",
            "Strong debugging across iOS/Android",
        ],
        responsibilities: [
            "Build and maintain cross-platform app",
            "Own release pipeline",
            "Collaborate with backend on API contracts",
        ],
        location: "Remote (Global)",
        employmentType: "full-time",
        salary: { minimum: 60000, maximum: 95000, currency: "USD" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["react-native", "typescript", "javascript"],
        categorySlug: "mobile-development",
        status: "published",
        daysToDeadline: 35,
        viewCount: 388,
    },
    {
        title: "iOS Engineer (Swift)",
        description:
            "Craft a world-class native iOS experience for job seekers on the go.",
        requirements: [
            "4+ years Swift and UIKit/SwiftUI",
            "Shipped apps on the App Store",
            "Experience with Combine or async/await",
        ],
        responsibilities: [
            "Own iOS feature development",
            "Improve app performance and accessibility",
            "Coordinate releases with QA",
        ],
        location: "Berlin, Germany",
        employmentType: "full-time",
        salary: { minimum: 65000, maximum: 95000, currency: "EUR" },
        experienceLevel: "senior",
        educationLevel: "bachelor",
        skillSlugs: ["swift"],
        categorySlug: "mobile-development",
        status: "published",
        daysToDeadline: 28,
        viewCount: 244,
    },

    // ── DevOps / Cloud ────────────────────────────────────────────────
    {
        title: "DevOps Engineer",
        description:
            "Own our cloud infrastructure and developer experience. You'll make deploys boring and monitoring excellent.",
        requirements: [
            "3+ years DevOps/SRE experience",
            "Strong Kubernetes and Terraform",
            "Experience with AWS or GCP at scale",
        ],
        responsibilities: [
            "Maintain and improve CI/CD pipelines",
            "Manage Kubernetes clusters",
            "Improve observability and alerting",
        ],
        location: "Remote (EU)",
        employmentType: "full-time",
        salary: { minimum: 65000, maximum: 95000, currency: "EUR" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["kubernetes", "docker", "terraform", "aws", "linux"],
        categorySlug: "devops-and-cloud",
        status: "published",
        daysToDeadline: 33,
        viewCount: 720,
    },
    {
        title: "Site Reliability Engineer",
        description:
            "Keep our platform fast and reliable. You'll define SLOs and drive down error budgets.",
        requirements: [
            "4+ years SRE or infrastructure experience",
            "Deep Linux and networking knowledge",
            "Experience with Prometheus/Grafana",
        ],
        responsibilities: [
            "Own production reliability",
            "Lead incident response",
            "Automate toil away",
        ],
        location: "Dublin, Ireland",
        employmentType: "full-time",
        salary: { minimum: 75000, maximum: 105000, currency: "EUR" },
        experienceLevel: "senior",
        educationLevel: "bachelor",
        skillSlugs: ["kubernetes", "linux", "prometheus", "docker"],
        categorySlug: "devops-and-cloud",
        status: "published",
        daysToDeadline: 50,
        viewCount: 311,
    },
    {
        title: "Cloud Architect",
        description:
            "Design multi-region cloud architecture for a growing global platform.",
        requirements: [
            "7+ years infrastructure, 3+ architecting cloud at scale",
            "Deep AWS expertise and cost optimization",
            "Strong stakeholder communication",
        ],
        responsibilities: [
            "Define cloud reference architecture",
            "Lead migration initiatives",
            "Mentor infrastructure engineers",
        ],
        location: "London, UK",
        employmentType: "full-time",
        salary: { minimum: 110000, maximum: 150000, currency: "GBP" },
        experienceLevel: "lead",
        educationLevel: "bachelor",
        skillSlugs: ["aws", "terraform", "kubernetes"],
        categorySlug: "devops-and-cloud",
        status: "published",
        daysToDeadline: 55,
        viewCount: 198,
    },

    // ── Data / AI ─────────────────────────────────────────────────────
    {
        title: "Data Scientist",
        description:
            "Turn marketplace data into product decisions — matching, ranking, and pricing models that drive real outcomes.",
        requirements: [
            "3+ years applied data science",
            "Strong Python, pandas, and SQL",
            "Experience deploying models to production",
        ],
        responsibilities: [
            "Build and evaluate models",
            "Partner with product on experiment design",
            "Communicate findings to stakeholders",
        ],
        location: "Remote (EU)",
        employmentType: "full-time",
        salary: { minimum: 65000, maximum: 95000, currency: "EUR" },
        experienceLevel: "mid",
        educationLevel: "master",
        skillSlugs: ["python", "sql", "pandas", "machine-learning"],
        categorySlug: "data-science-and-analytics",
        status: "published",
        daysToDeadline: 42,
        viewCount: 977,
    },
    {
        title: "Machine Learning Engineer",
        description:
            "Own the ML platform and ship models that power recommendations and search ranking.",
        requirements: [
            "4+ years ML engineering",
            "Strong Python and PyTorch/TensorFlow",
            "Experience with feature stores and MLOps",
        ],
        responsibilities: [
            "Build training and serving pipelines",
            "Deploy and monitor models",
            "Collaborate with data scientists",
        ],
        location: "Berlin, Germany",
        employmentType: "full-time",
        salary: { minimum: 80000, maximum: 120000, currency: "EUR" },
        experienceLevel: "senior",
        educationLevel: "master",
        skillSlugs: ["python", "pytorch", "machine-learning", "docker"],
        categorySlug: "artificial-intelligence-and-machine-learning",
        status: "published",
        daysToDeadline: 38,
        viewCount: 856,
    },
    {
        title: "Data Engineer",
        description:
            "Build the pipelines that feed our analytics and ML systems with clean, timely data.",
        requirements: [
            "3+ years data engineering",
            "Strong SQL and Python",
            "Experience with Airflow/dbt and a warehouse",
        ],
        responsibilities: [
            "Design and maintain ETL pipelines",
            "Own data quality and freshness",
            "Support analytics and ML teams",
        ],
        location: "Remote (Global)",
        employmentType: "full-time",
        salary: { minimum: 60000, maximum: 90000, currency: "USD" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["python", "sql", "airflow", "postgresql"],
        categorySlug: "data-science-and-analytics",
        status: "published",
        daysToDeadline: 47,
        viewCount: 534,
    },
    {
        title: "AI Research Intern",
        description:
            "Work alongside our ML team on applied research problems in matching and ranking.",
        requirements: [
            "Currently pursuing a Master's or PhD in a related field",
            "Strong Python and ML fundamentals",
            "Publication record is a plus",
        ],
        responsibilities: [
            "Run experiments and literature reviews",
            "Prototype research ideas",
            "Present findings to the team",
        ],
        location: "Zurich, Switzerland",
        employmentType: "internship",
        salary: { minimum: 2500, maximum: 3500, currency: "CHF" },
        experienceLevel: "entry",
        educationLevel: "master",
        skillSlugs: ["python", "pytorch", "machine-learning"],
        categorySlug: "artificial-intelligence-and-machine-learning",
        status: "published",
        daysToDeadline: 25,
        viewCount: 1450,
    },

    // ── Security / QA ─────────────────────────────────────────────────
    {
        title: "Security Engineer",
        description:
            "Harden our platform and lead application security reviews across engineering.",
        requirements: [
            "4+ years application security",
            "Experience with threat modeling and SAST/DAST",
            "Strong knowledge of OWASP Top 10",
        ],
        responsibilities: [
            "Run security reviews",
            "Build secure-by-default tooling",
            "Lead incident response for security events",
        ],
        location: "Remote (EU)",
        employmentType: "full-time",
        salary: { minimum: 75000, maximum: 110000, currency: "EUR" },
        experienceLevel: "senior",
        educationLevel: "bachelor",
        skillSlugs: ["linux", "python"],
        categorySlug: "cybersecurity",
        status: "published",
        daysToDeadline: 44,
        viewCount: 289,
    },
    {
        title: "QA Automation Engineer",
        description:
            "Build the automated test suites that let us ship confidently every day.",
        requirements: [
            "3+ years test automation",
            "Strong Playwright/Cypress and TypeScript",
            "Experience with CI-integrated test suites",
        ],
        responsibilities: [
            "Own end-to-end test coverage",
            "Improve test reliability",
            "Partner with engineers on quality",
        ],
        location: "Amsterdam, Netherlands",
        employmentType: "full-time",
        salary: { minimum: 50000, maximum: 75000, currency: "EUR" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["typescript", "cypress", "javascript"],
        categorySlug: "quality-assurance-and-testing",
        status: "published",
        daysToDeadline: 29,
        viewCount: 367,
    },

    // ── Design ────────────────────────────────────────────────────────
    {
        title: "Senior Product Designer",
        description:
            "Own end-to-end design for our recruiter product, from research to polished UI.",
        requirements: [
            "5+ years product design experience",
            "Strong portfolio of shipped B2B products",
            "Proficient in Figma and design systems",
        ],
        responsibilities: [
            "Lead discovery and research",
            "Deliver high-fidelity designs",
            "Maintain and evolve the design system",
        ],
        location: "Remote (EU)",
        employmentType: "full-time",
        salary: { minimum: 65000, maximum: 95000, currency: "EUR" },
        experienceLevel: "senior",
        educationLevel: "bachelor",
        skillSlugs: ["figma", "ui-design", "ux-research"],
        categorySlug: "ui-ux-design",
        status: "published",
        daysToDeadline: 41,
        viewCount: 745,
    },
    {
        title: "UI/UX Designer",
        description:
            "Design intuitive experiences for job seekers and recruiters alike.",
        requirements: [
            "3+ years UI/UX design",
            "Strong Figma skills",
            "Experience running usability tests",
        ],
        responsibilities: [
            "Design user flows and screens",
            "Run usability tests",
            "Collaborate with engineers on handoff",
        ],
        location: "Lisbon, Portugal",
        employmentType: "full-time",
        salary: { minimum: 40000, maximum: 60000, currency: "EUR" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["figma", "ui-design", "ux-research"],
        categorySlug: "ui-ux-design",
        status: "published",
        daysToDeadline: 26,
        viewCount: 512,
    },
    {
        title: "Graphic Designer",
        description:
            "Create marketing assets, brand collateral, and campaign visuals.",
        requirements: [
            "2+ years graphic design",
            "Strong Adobe Creative Suite skills",
            "Portfolio of brand and campaign work",
        ],
        responsibilities: [
            "Design marketing and brand assets",
            "Maintain brand guidelines",
            "Support campaign launches",
        ],
        location: "Remote (Global)",
        employmentType: "contract",
        salary: { minimum: 30000, maximum: 50000, currency: "USD" },
        experienceLevel: "junior",
        educationLevel: "diploma",
        skillSlugs: ["photoshop", "illustrator"],
        categorySlug: "graphic-design",
        status: "published",
        daysToDeadline: 20,
        viewCount: 233,
    },

    // ── Product ───────────────────────────────────────────────────────
    {
        title: "Product Manager",
        description:
            "Own the roadmap for our core matching product and drive measurable outcomes.",
        requirements: [
            "4+ years product management",
            "Experience with B2C or marketplace products",
            "Strong analytical and communication skills",
        ],
        responsibilities: [
            "Define and prioritize the roadmap",
            "Run discovery with users",
            "Partner with eng and design to ship",
        ],
        location: "London, UK",
        employmentType: "full-time",
        salary: { minimum: 75000, maximum: 105000, currency: "GBP" },
        experienceLevel: "senior",
        educationLevel: "bachelor",
        skillSlugs: ["sql", "communication"],
        categorySlug: "product-management",
        status: "published",
        daysToDeadline: 39,
        viewCount: 689,
    },
    {
        title: "Associate Product Manager",
        description:
            "Kickstart your product career with mentorship and real ownership of a small surface area.",
        requirements: [
            "0-2 years experience",
            "Strong analytical and writing skills",
            "Genuine curiosity about users",
        ],
        responsibilities: [
            "Own a small product area",
            "Write specs and user stories",
            "Analyze product metrics",
        ],
        location: "Berlin, Germany",
        employmentType: "full-time",
        salary: { minimum: 45000, maximum: 60000, currency: "EUR" },
        experienceLevel: "entry",
        educationLevel: "bachelor",
        skillSlugs: ["communication"],
        categorySlug: "product-management",
        status: "published",
        daysToDeadline: 34,
        viewCount: 1201,
    },

    // ── Marketing / Sales / Support ───────────────────────────────────
    {
        title: "Digital Marketing Manager",
        description:
            "Own paid and organic growth channels across search, social, and lifecycle.",
        requirements: [
            "4+ years digital marketing",
            "Hands-on with Google Ads and Meta Ads",
            "Strong analytics and A/B testing background",
        ],
        responsibilities: [
            "Own growth KPIs",
            "Run paid campaigns end-to-end",
            "Report on performance weekly",
        ],
        location: "Remote (EU)",
        employmentType: "full-time",
        salary: { minimum: 55000, maximum: 80000, currency: "EUR" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["communication"],
        categorySlug: "marketing-and-growth",
        status: "published",
        daysToDeadline: 37,
        viewCount: 456,
    },
    {
        title: "Content Writer (Tech)",
        description:
            "Write blog posts, guides, and product copy that make complex topics clear.",
        requirements: [
            "2+ years writing for a technical audience",
            "Portfolio of published work",
            "Basic understanding of SEO",
        ],
        responsibilities: [
            "Produce 4-6 pieces per month",
            "Interview subject-matter experts",
            "Optimize content for search",
        ],
        location: "Remote (Global)",
        employmentType: "freelance",
        salary: { minimum: 30, maximum: 60, currency: "USD" },
        experienceLevel: "junior",
        educationLevel: "bachelor",
        skillSlugs: ["communication"],
        categorySlug: "content-writing-and-copywriting",
        status: "published",
        daysToDeadline: 22,
        viewCount: 388,
    },
    {
        title: "Account Executive (SaaS)",
        description:
            "Own the full sales cycle for our recruiter-facing SaaS product.",
        requirements: [
            "3+ years B2B SaaS closing experience",
            "Track record of hitting quota",
            "Strong discovery and demo skills",
        ],
        responsibilities: [
            "Manage pipeline end-to-end",
            "Run demos and negotiate contracts",
            "Hit quarterly quota",
        ],
        location: "London, UK",
        employmentType: "full-time",
        salary: { minimum: 50000, maximum: 80000, currency: "GBP" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["negotiation", "communication"],
        categorySlug: "sales-and-business-development",
        status: "published",
        daysToDeadline: 31,
        viewCount: 277,
    },
    {
        title: "Customer Support Specialist",
        description:
            "Be the first line of help for recruiters and candidates using our platform.",
        requirements: [
            "1+ years in customer support",
            "Excellent written English",
            "Comfortable with ticketing tools",
        ],
        responsibilities: [
            "Respond to tickets within SLA",
            "Escalate bugs with clear repro",
            "Maintain help center docs",
        ],
        location: "Remote (EU)",
        employmentType: "full-time",
        salary: { minimum: 28000, maximum: 38000, currency: "EUR" },
        experienceLevel: "entry",
        educationLevel: "high-school",
        skillSlugs: ["communication"],
        categorySlug: "customer-support",
        status: "published",
        daysToDeadline: 27,
        viewCount: 902,
    },

    // ── HR / Finance / Legal / Ops ────────────────────────────────────
    {
        title: "Technical Recruiter",
        description:
            "Source and hire engineers for our growing product and platform teams.",
        requirements: [
            "3+ years technical recruiting",
            "Experience hiring engineers in competitive markets",
            "Strong stakeholder management",
        ],
        responsibilities: [
            "Own full-cycle recruiting",
            "Build talent pipelines",
            "Partner with hiring managers",
        ],
        location: "Berlin, Germany",
        employmentType: "full-time",
        salary: { minimum: 45000, maximum: 65000, currency: "EUR" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["communication"],
        categorySlug: "human-resources",
        status: "published",
        daysToDeadline: 36,
        viewCount: 419,
    },
    {
        title: "Financial Analyst",
        description:
            "Support FP&A with modeling, forecasting, and reporting for a fast-growing business.",
        requirements: [
            "2+ years in FP&A or investment banking",
            "Strong Excel and financial modeling",
            "Experience with a planning tool is a plus",
        ],
        responsibilities: [
            "Build and maintain models",
            "Prepare monthly reporting",
            "Support budgeting cycle",
        ],
        location: "London, UK",
        employmentType: "full-time",
        salary: { minimum: 50000, maximum: 70000, currency: "GBP" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["sql"],
        categorySlug: "finance-and-accounting",
        status: "published",
        daysToDeadline: 43,
        viewCount: 265,
    },
    {
        title: "Legal Counsel (Commercial)",
        description:
            "Draft and negotiate commercial contracts and advise on product legal matters.",
        requirements: [
            "4+ years commercial legal experience",
            "Qualified solicitor/lawyer in EU or UK",
            "In-house experience preferred",
        ],
        responsibilities: [
            "Negotiate customer and vendor contracts",
            "Advise product on compliance",
            "Manage outside counsel",
        ],
        location: "London, UK",
        employmentType: "full-time",
        salary: { minimum: 80000, maximum: 120000, currency: "GBP" },
        experienceLevel: "senior",
        educationLevel: "master",
        skillSlugs: ["negotiation"],
        categorySlug: "legal-and-compliance",
        status: "published",
        daysToDeadline: 52,
        viewCount: 143,
    },
    {
        title: "Operations Coordinator",
        description:
            "Keep our day-to-day operations running smoothly across teams and time zones.",
        requirements: [
            "1+ years in operations or admin",
            "Excellent organization and communication",
            "Comfortable with spreadsheets and tooling",
        ],
        responsibilities: [
            "Coordinate cross-team logistics",
            "Maintain internal docs and trackers",
            "Support leadership with scheduling",
        ],
        location: "Lisbon, Portugal",
        employmentType: "part-time",
        salary: { minimum: 20000, maximum: 28000, currency: "EUR" },
        experienceLevel: "entry",
        educationLevel: "diploma",
        skillSlugs: ["communication"],
        categorySlug: "operations-and-logistics",
        status: "published",
        daysToDeadline: 24,
        viewCount: 344,
    },

    // ── Healthcare / Education / Non-software engineering ─────────────
    {
        title: "Registered Nurse",
        description:
            "Provide compassionate patient care in a modern, well-equipped facility.",
        requirements: [
            "Valid nursing license",
            "2+ years clinical experience",
            "Strong communication and empathy",
        ],
        responsibilities: [
            "Deliver patient care per protocol",
            "Maintain accurate records",
            "Collaborate with the care team",
        ],
        location: "Munich, Germany",
        employmentType: "full-time",
        salary: { minimum: 42000, maximum: 55000, currency: "EUR" },
        experienceLevel: "mid",
        educationLevel: "diploma",
        skillSlugs: ["communication"],
        categorySlug: "healthcare-and-medical",
        status: "published",
        daysToDeadline: 48,
        viewCount: 176,
    },
    {
        title: "Online English Teacher",
        description:
            "Teach conversational English to adult learners in 1:1 online sessions.",
        requirements: [
            "TEFL/CELTA or equivalent",
            "Native or near-native English",
            "Reliable internet and quiet space",
        ],
        responsibilities: [
            "Deliver engaging 1:1 lessons",
            "Track student progress",
            "Provide feedback after sessions",
        ],
        location: "Remote (Global)",
        employmentType: "part-time",
        salary: { minimum: 15, maximum: 30, currency: "USD" },
        experienceLevel: "junior",
        educationLevel: "bachelor",
        skillSlugs: ["communication"],
        categorySlug: "education-and-training",
        status: "published",
        daysToDeadline: 18,
        viewCount: 623,
    },
    {
        title: "Mechanical Engineer",
        description:
            "Design and validate mechanical components for our hardware product line.",
        requirements: [
            "3+ years mechanical design",
            "Proficient in SolidWorks or Fusion 360",
            "Experience with DFM and tolerance analysis",
        ],
        responsibilities: [
            "Design parts and assemblies",
            "Run simulations and tolerance stacks",
            "Work with suppliers on production",
        ],
        location: "Stuttgart, Germany",
        employmentType: "full-time",
        salary: { minimum: 55000, maximum: 80000, currency: "EUR" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["communication"],
        categorySlug: "engineering-non-software",
        status: "published",
        daysToDeadline: 46,
        viewCount: 218,
    },

    // ── Closed / expired / pending / draft examples ───────────────────
    {
        title: "Senior Frontend Engineer (Vue)",
        description:
            "Lead our Vue migration and modernize the recruiter dashboard.",
        requirements: [
            "5+ years frontend, 3+ with Vue",
            "Strong TypeScript",
            "Experience leading migrations",
        ],
        responsibilities: [
            "Lead Vue migration",
            "Set frontend standards",
            "Mentor the team",
        ],
        location: "Remote (EU)",
        employmentType: "full-time",
        salary: { minimum: 70000, maximum: 100000, currency: "EUR" },
        experienceLevel: "senior",
        educationLevel: "bachelor",
        skillSlugs: ["vue", "typescript", "javascript"],
        categorySlug: "web-development",
        status: "closed",
        daysToDeadline: -10,
        viewCount: 934,
    },
    {
        title: "Data Analyst (Contract)",
        description:
            "6-month contract to build reporting dashboards for the growth team.",
        requirements: [
            "2+ years analytics",
            "Strong SQL and a BI tool",
            "Experience with product analytics",
        ],
        responsibilities: [
            "Build dashboards",
            "Run ad-hoc analyses",
            "Partner with growth team",
        ],
        location: "Remote (EU)",
        employmentType: "contract",
        salary: { minimum: 400, maximum: 600, currency: "EUR" },
        experienceLevel: "mid",
        educationLevel: "bachelor",
        skillSlugs: ["sql", "python"],
        categorySlug: "data-science-and-analytics",
        status: "expired",
        daysToDeadline: -3,
        viewCount: 412,
    },
    {
        title: "Principal Backend Engineer",
        description:
            "Shape the technical direction of our core marketplace services.",
        requirements: [
            "10+ years backend engineering",
            "Deep distributed systems expertise",
            "Track record of technical leadership",
        ],
        responsibilities: [
            "Set backend architecture",
            "Lead critical initiatives",
            "Grow senior engineers",
        ],
        location: "London, UK",
        employmentType: "full-time",
        salary: { minimum: 140000, maximum: 190000, currency: "GBP" },
        experienceLevel: "lead",
        educationLevel: "bachelor",
        skillSlugs: ["nodejs", "typescript", "kubernetes", "postgresql"],
        categorySlug: "software-engineering",
        status: "pending",
        daysToDeadline: 65,
        viewCount: 0,
    },
    {
        title: "Growth Marketing Lead",
        description:
            "Own the growth strategy across acquisition, activation, and retention.",
        requirements: [
            "6+ years growth marketing",
            "Experience scaling a marketplace",
            "Strong analytics background",
        ],
        responsibilities: [
            "Define growth strategy",
            "Lead a small team",
            "Own growth KPIs",
        ],
        location: "Remote (EU)",
        employmentType: "full-time",
        salary: { minimum: 85000, maximum: 120000, currency: "EUR" },
        experienceLevel: "lead",
        educationLevel: "bachelor",
        skillSlugs: ["communication"],
        categorySlug: "marketing-and-growth",
        status: "draft",
        daysToDeadline: 70,
        viewCount: 0,
    },
];

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

const addDays = (days: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
};

const resolveSkills = (
    skillSlugs: string[],
    skillIndex: Map<string, SkillLean>
): mongoose.Types.ObjectId[] => {
    const resolved: mongoose.Types.ObjectId[] = [];
    const missing: string[] = [];

    for (const slug of skillSlugs) {
        const skill = skillIndex.get(slug);
        if (skill) resolved.push(skill._id);
        else missing.push(slug);
    }

    if (missing.length > 0) {
        console.warn(`⚠️  Missing skill slugs (skipped): ${missing.join(", ")}`);
    }

    return resolved;
};

const pickEmployer = (
    index: number,
    employers: EmployerLean[],
    hint?: string
): EmployerLean => {
    if (hint) {
        const match = employers.find((e) =>
            e.name.toLowerCase().includes(hint.toLowerCase())
        );
        if (match) return match;
    }
    return employers[index % employers.length];
};

// ─────────────────────────────────────────────────────────────────────
// Main seed
// ─────────────────────────────────────────────────────────────────────

const seedJobs = async (): Promise<void> => {
    const mongoUri = env.DATABASE_URL;

    if (!mongoUri) {
        throw new Error("MONGO_URI is not defined in environment/config");
    }

    let connectedHere = false;

    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoUri);
            connectedHere = true;
            console.log("🔌 Connected to MongoDB");
        }

        // ── Load reference data ──────────────────────────────────────
        const [employers, categories, skills] = await Promise.all([
            Employer.find({}, { _id: 1, name: 1 })
                .lean<EmployerLean[]>()
                .exec(),
            Category.find({}, { _id: 1, name: 1, slug: 1 })
                .lean<CategoryLean[]>()
                .exec(),
            Skill.find({}, { _id: 1, name: 1, slug: 1 })
                .lean<SkillLean[]>()
                .exec(),
        ]);

        if (employers.length === 0) {
            throw new Error(
                "No employers found. Run `npm run seed:users` first."
            );
        }
        if (categories.length === 0) {
            throw new Error(
                "No categories found. Run `npm run seed:category` first."
            );
        }
        if (skills.length === 0) {
            throw new Error("No skills found. Run `npm run seed:skill` first.");
        }

        console.log(
            `📦 Loaded ${employers.length} employers, ${categories.length} categories, ${skills.length} skills`
        );

        const categoryIndex = new Map<string, CategoryLean>(
            categories.map((c) => [c.slug, c])
        );
        const skillIndex = new Map<string, SkillLean>(
            skills.map((s) => [s.slug, s])
        );

        // ── Build job documents ──────────────────────────────────────
        const missingCategorySlugs: string[] = [];

        const jobs: IJob[] = jobBlueprints.map((bp, i) => {
            const category = categoryIndex.get(bp.categorySlug);

            if (!category) {
                missingCategorySlugs.push(bp.categorySlug);
            }

            const employer = pickEmployer(i, employers, bp.employerNameHint);

            const deadline = addDays(bp.daysToDeadline);

            // publishedAt only for published/closed/expired jobs
            const publishedAt =
                bp.status === "published" ||
                bp.status === "closed" ||
                bp.status === "expired"
                    ? addDays(-Math.max(1, Math.abs(bp.daysToDeadline) / 2))
                    : undefined;

            return {
                companyId: employer._id, // field name kept per IJob interface
                title: bp.title,
                description: bp.description,
                requirements: bp.requirements,
                responsibilities: bp.responsibilities,
                location: bp.location,
                employmentType: bp.employmentType,
                salary: bp.salary,
                experienceLevel: bp.experienceLevel,
                educationLevel: bp.educationLevel,
                skills: resolveSkills(bp.skillSlugs, skillIndex),
                categoryId:
                    category?._id ?? categories[0]._id, // fallback so we never crash
                status: bp.status,
                publishedAt,
                deadline,
                viewCount: bp.viewCount,
            };
        });

        if (missingCategorySlugs.length > 0) {
            console.warn(
                `⚠️  Missing category slugs (fell back to first category): ${[
                    ...new Set(missingCategorySlugs),
                ].join(", ")}`
            );
        }

        // ── Upsert by (companyId + title) ────────────────────────────
        const operations = jobs.map((job) => ({
            updateOne: {
                filter: { companyId: job.companyId, title: job.title },
                update: { $setOnInsert: job },
                upsert: true,
            },
        }));

        const result = await Job.bulkWrite(operations, { ordered: false });

        const inserted = result.upsertedCount ?? 0;
        const matched = result.matchedCount ?? 0;

        console.log(
            `✅ Job seed complete — inserted: ${inserted}, already existed: ${matched}, total processed: ${jobs.length}`
        );

        // ── Breakdown by status (nice for sanity checks) ─────────────
        const byStatus = jobs.reduce<Record<string, number>>((acc, j) => {
            acc[j.status] = (acc[j.status] ?? 0) + 1;
            return acc;
        }, {});
        console.log("📊 By status:", byStatus);
    } catch (error) {
        console.error("❌ Job seed failed:", error);
        process.exitCode = 1;
    } finally {
        if (connectedHere) {
            await mongoose.disconnect();
            console.log("🔌 Disconnected from MongoDB");
        }
    }
};

void seedJobs();