import mongoose from "mongoose";
import env from "../config/env.js"; 
import { Category } from "../modules/category/category.model.js";
import type { ICategory } from "../modules/category/category.interface.js";

/**
 * Seed categories for a job portal.
 * Uses upsert-by-slug so re-running is idempotent (no duplicates).
 */

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const categoryNames: string[] = [
    // Tech & Engineering
    "Software Engineering",
    "Web Development",
    "Mobile Development",
    "DevOps & Cloud",
    "Data Science & Analytics",
    "Artificial Intelligence & Machine Learning",
    "Cybersecurity",
    "Quality Assurance & Testing",

    // Product & Design
    "Product Management",
    "UI/UX Design",
    "Graphic Design",

    // Business & Operations
    "Marketing & Growth",
    "Sales & Business Development",
    "Customer Support",
    "Human Resources",
    "Finance & Accounting",
    "Operations & Logistics",

    // Domain-specific
    "Healthcare & Medical",
    "Education & Training",
    "Legal & Compliance",
    "Engineering (Non-Software)",

    // Content & Creative
    "Content Writing & Copywriting",
    "Media & Communications",

    // Internships / Early career
    "Internships & Entry Level",
];

const buildCategories = (): ICategory[] =>
    categoryNames.map((name) => ({
        name,
        slug: slugify(name),
        description: `Jobs related to ${name}.`,
        isActive: true,
    }));

const seedCategories = async (): Promise<void> => {
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

        const categories = buildCategories();

        const operations = categories.map((category) => ({
            updateOne: {
                filter: { slug: category.slug },
                update: { $setOnInsert: category },
                upsert: true,
            },
        }));

        const result = await Category.bulkWrite(operations, { ordered: false });

        const inserted = result.upsertedCount ?? 0;
        const matched = result.matchedCount ?? 0;

        console.log(
            `✅ Category seed complete — inserted: ${inserted}, already existed: ${matched}, total processed: ${categories.length}`
        );
    } catch (error) {
        console.error("❌ Category seed failed:", error);
        process.exitCode = 1;
    } finally {
        if (connectedHere) {
            await mongoose.disconnect();
            console.log("🔌 Disconnected from MongoDB");
        }
    }
};

void seedCategories();