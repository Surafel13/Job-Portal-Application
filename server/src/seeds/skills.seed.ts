import mongoose from "mongoose";
import env from "../config/env.js";
import { Skill } from "../modules/skill/skill.model.js";
import type { ISkill } from "../modules/skill/skill.interface.js";

/**
 * Seed skills for a job portal.
 *
 * Idempotent: keyed on `slug` via bulkWrite upsert, so re-running is safe
 * and won't clobber manual edits (uses $setOnInsert).
 *
 * The slugs here are intentionally aligned with the `skillSlugs` referenced
 * in `job.seed.ts` so jobs can resolve their `skills: Types.ObjectId[]`.
 */

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/\./g, "")
        .replace(/\+/g, "-plus")
        .replace(/#/g, "-sharp")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

interface SkillSeed {
    name: string;
    slug: string;
    description: string;
}

/**
 * 30 skills covering the tech stack, tools, and soft skills referenced
 * across the job seed blueprints.
 */
const skills: SkillSeed[] = [
    // ── Languages ─────────────────────────────────────────────────────
    {
        name: "JavaScript",
        slug: "javascript",
        description: "Core language of the web; ES2020+ features and patterns.",
    },
    {
        name: "TypeScript",
        slug: "typescript",
        description: "Statically typed superset of JavaScript.",
    },
    {
        name: "Python",
        slug: "python",
        description: "General-purpose language for scripting, data, and ML.",
    },
    {
        name: "Swift",
        slug: "swift",
        description: "Apple's language for iOS, macOS, and beyond.",
    },
    {
        name: "SQL",
        slug: "sql",
        description: "Querying and modeling relational databases.",
    },

    // ── Backend / Frameworks ──────────────────────────────────────────
    {
        name: "Node.js",
        slug: "nodejs",
        description: "Server-side JavaScript runtime for scalable APIs.",
    },
    {
        name: "React",
        slug: "react",
        description: "Component-based UI library for web apps.",
    },
    {
        name: "React Native",
        slug: "react-native",
        description: "Cross-platform mobile framework built on React.",
    },
    {
        name: "Vue.js",
        slug: "vue",
        description: "Progressive JavaScript framework for building UIs.",
    },
    {
        name: "Cypress",
        slug: "cypress",
        description: "End-to-end testing framework for modern web apps.",
    },

    // ── Databases / Data ──────────────────────────────────────────────
    {
        name: "MongoDB",
        slug: "mongodb",
        description: "Document-oriented NoSQL database.",
    },
    {
        name: "PostgreSQL",
        slug: "postgresql",
        description: "Advanced open-source relational database.",
    },
    {
        name: "Redis",
        slug: "redis",
        description: "In-memory data store for caching and queues.",
    },
    {
        name: "Pandas",
        slug: "pandas",
        description: "Python library for data manipulation and analysis.",
    },
    {
        name: "Airflow",
        slug: "airflow",
        description: "Workflow orchestration for data pipelines.",
    },

    // ── DevOps / Cloud ────────────────────────────────────────────────
    {
        name: "Docker",
        slug: "docker",
        description: "Containerization for consistent builds and deploys.",
    },
    {
        name: "Kubernetes",
        slug: "kubernetes",
        description: "Container orchestration for production workloads.",
    },
    {
        name: "Terraform",
        slug: "terraform",
        description: "Infrastructure as code for cloud provisioning.",
    },
    {
        name: "AWS",
        slug: "aws",
        description: "Amazon Web Services cloud platform.",
    },
    {
        name: "Linux",
        slug: "linux",
        description: "Unix-like OS fundamentals and shell tooling.",
    },
    {
        name: "Prometheus",
        slug: "prometheus",
        description: "Metrics collection and alerting for observability.",
    },

    // ── ML / AI ───────────────────────────────────────────────────────
    {
        name: "PyTorch",
        slug: "pytorch",
        description: "Deep learning framework for research and production.",
    },
    {
        name: "Machine Learning",
        slug: "machine-learning",
        description: "Modeling, training, and evaluating ML systems.",
    },

    // ── Design / Creative ─────────────────────────────────────────────
    {
        name: "Figma",
        slug: "figma",
        description: "Collaborative UI/UX design and prototyping tool.",
    },
    {
        name: "UI Design",
        slug: "ui-design",
        description: "Visual design of interfaces and design systems.",
    },
    {
        name: "UX Research",
        slug: "ux-research",
        description: "User interviews, usability testing, and synthesis.",
    },
    {
        name: "Photoshop",
        slug: "photoshop",
        description: "Adobe image editing for design and marketing.",
    },
    {
        name: "Illustrator",
        slug: "illustrator",
        description: "Adobe vector design for brand and print.",
    },

    // ── Business / Soft skills ────────────────────────────────────────
    {
        name: "Communication",
        slug: "communication",
        description: "Clear written and verbal communication.",
    },
    {
        name: "Negotiation",
        slug: "negotiation",
        description: "Structuring and closing mutually beneficial deals.",
    },
];

const buildSkills = (): ISkill[] =>
    skills.map((skill) => ({
        name: skill.name,
        slug: skill.slug,
        description: skill.description,
        isActive: true,
    }));

const seedSkills = async (): Promise<void> => {
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

        const skillDocs = buildSkills();

        const operations = skillDocs.map((skill) => ({
            updateOne: {
                filter: { slug: skill.slug },
                update: { $setOnInsert: skill },
                upsert: true,
            },
        }));

        const result = await Skill.bulkWrite(operations, { ordered: false });

        const inserted = result.upsertedCount ?? 0;
        const matched = result.matchedCount ?? 0;

        console.log(
            `✅ Skill seed complete — inserted: ${inserted}, already existed: ${matched}, total processed: ${skillDocs.length}`
        );
    } catch (error) {
        console.error("❌ Skill seed failed:", error);
        process.exitCode = 1;
    } finally {
        if (connectedHere) {
            await mongoose.disconnect();
            console.log("🔌 Disconnected from MongoDB");
        }
    }
};

void seedSkills();