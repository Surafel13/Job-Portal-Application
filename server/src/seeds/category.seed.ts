import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Category } from "../modules/category/category.model.js";

const categories = [
    {
        name: "Software Development",
        slug: "software-development",
        description: "Jobs related to software development and programming",
        isActive: true,
    },
    {
        name: "Web Development",
        slug: "web-development",
        description: "Jobs related to frontend, backend, and full-stack web development",
        isActive: true,
    },
    {
        name: "Mobile Development",
        slug: "mobile-development",
        description: "Jobs related to Android, iOS, React Native, and mobile applications",
        isActive: true,
    },
    {
        name: "Data Science",
        slug: "data-science",
        description: "Jobs related to data analysis, machine learning, and data science",
        isActive: true,
    },
    {
        name: "Cybersecurity",
        slug: "cybersecurity",
        description: "Jobs related to information security, network security, and cybersecurity",
        isActive: true,
    },
    {
        name: "UI/UX Design",
        slug: "ui-ux-design",
        description: "Jobs related to user interface and user experience design",
        isActive: true,
    },
    {
        name: "Graphic Design",
        slug: "graphic-design",
        description: "Jobs related to visual design, branding, and digital graphics",
        isActive: true,
    },
    {
        name: "Digital Marketing",
        slug: "digital-marketing",
        description: "Jobs related to online marketing, social media, and digital campaigns",
        isActive: true,
    },
    {
        name: "Accounting and Finance",
        slug: "accounting-and-finance",
        description: "Jobs related to accounting, finance, auditing, and financial management",
        isActive: true,
    },
    {
        name: "Sales",
        slug: "sales",
        description: "Jobs related to sales, business development, and customer acquisition",
        isActive: true,
    },
    {
        name: "Human Resources",
        slug: "human-resources",
        description: "Jobs related to recruitment, employee management, and human resources",
        isActive: true,
    },
    {
        name: "Healthcare",
        slug: "healthcare",
        description: "Jobs related to healthcare, medicine, nursing, and medical services",
        isActive: true,
    },
    {
        name: "Education",
        slug: "education",
        description: "Jobs related to teaching, training, academic services, and education",
        isActive: true,
    },
    {
        name: "Engineering",
        slug: "engineering",
        description: "Jobs related to civil, mechanical, electrical, and other engineering fields",
        isActive: true,
    },
    {
        name: "Customer Service",
        slug: "customer-service",
        description: "Jobs related to customer support, communication, and client services",
        isActive: true,
    },
];

const seedCategories = async (): Promise<void> => {
    try {
        await connectDatabase();

        for (const category of categories) {
            await Category.updateOne(
                { slug: category.slug },
                { $set: category },
                { upsert: true }
            );
        }

        console.log("15 categories seeded successfully.");
    } catch (error) {
        console.error("Category seed failed:", error);
        process.exitCode = 1;
    } finally {
        await disconnectDatabase();
    }
};

seedCategories();