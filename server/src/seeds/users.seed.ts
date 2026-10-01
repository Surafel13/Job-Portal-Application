import mongoose from "mongoose";
import env from "../config/env.js";
import User from "../modules/user/user.model.js";
import Worker from "../modules/worker/worker.model.js";
import { Category } from "../modules/category/category.model.js";
import authService from "../modules/auth/auth.service.js";
import type { RegisterDto } from "../modules/auth/auth.interface.js";
import type {
  EmploymentPreference,
  WorkPreference,
} from "../modules/worker/worker.interface.js";

/* ────────────────────────────────────────────────────────────────────────── *
 *  Configuration
 * ────────────────────────────────────────────────────────────────────────── */

const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD ?? "Password123!";

const STRICT_CATEGORY_CHECK = process.env.SEED_STRICT_CATEGORIES !== "false";

/* ────────────────────────────────────────────────────────────────────────── *
 *  Seed types
 * ────────────────────────────────────────────────────────────────────────── */

interface SeedUser {
  fullName: string;
  email: string;
  role: "worker" | "employer";
  phone: string;
  location: string;
  bio: string;
  companyName?: string;
}

interface SeedWorker extends SeedUser {
  role: "worker";
  categoryNames: string[];
  professionalSummary: string;
  skills: {
    name: string;
    level?: "beginner" | "intermediate" | "advanced" | "expert";
  }[];
  preferredJobTypes: EmploymentPreference[];
  preferredLocations: string[];
  preferredWorkTypes: WorkPreference[];
  minimumSalary?: number;
  maximumSalary?: number;
  website?: string;
  linkedin?: string;
  github?: string;
}

/* ────────────────────────────────────────────────────────────────────────── *
 *  Worker seeds — category names now match the real 24 in your DB
 * ────────────────────────────────────────────────────────────────────────── */

const workers: SeedWorker[] = [
  {
    fullName: "Alice Johnson",
    email: "alice.johnson@example.com",
    role: "worker",
    phone: "+4915112345601",
    location: "Berlin, Germany",
    bio: "Senior backend engineer with 6 years building Node.js services.",
    categoryNames: ["Software Engineering", "DevOps & Cloud", "Cybersecurity"],
    professionalSummary:
      "Backend engineer specialising in Node.js, PostgreSQL and event-driven microservices.",
    skills: [
      { name: "Node.js", level: "expert" },
      { name: "TypeScript", level: "advanced" },
      { name: "PostgreSQL", level: "advanced" },
      { name: "AWS", level: "intermediate" },
    ],
    preferredJobTypes: ["full-time", "contract"],
    preferredLocations: ["Berlin, Germany", "Remote"],
    preferredWorkTypes: ["hybrid", "remote"],
    minimumSalary: 75000,
    maximumSalary: 95000,
    github: "https://github.com/alicejohnson",
    linkedin: "https://linkedin.com/in/alicejohnson",
  },
  {
    fullName: "Bob Smith",
    email: "bob.smith@example.com",
    role: "worker",
    phone: "+4915112345602",
    location: "Munich, Germany",
    bio: "Frontend engineer focused on React and design systems.",
    categoryNames: ["Web Development", "UI/UX Design"],
    professionalSummary:
      "Frontend engineer building accessible component libraries and design systems.",
    skills: [
      { name: "React", level: "expert" },
      { name: "TypeScript", level: "advanced" },
      { name: "Figma", level: "intermediate" },
    ],
    preferredJobTypes: ["full-time"],
    preferredLocations: ["Munich, Germany", "Remote"],
    preferredWorkTypes: ["hybrid", "remote"],
    minimumSalary: 68000,
    maximumSalary: 85000,
    github: "https://github.com/bobsmith",
  },
  {
    fullName: "Carla Mendes",
    email: "carla.mendes@example.com",
    role: "worker",
    phone: "+3519112345603",
    location: "Lisbon, Portugal",
    bio: "Full stack developer with a love for clean architecture.",
    categoryNames: ["Web Development", "Software Engineering"],
    professionalSummary:
      "Full stack developer comfortable across React, Node.js and relational databases.",
    skills: [
      { name: "React", level: "advanced" },
      { name: "Node.js", level: "advanced" },
      { name: "MySQL", level: "intermediate" },
    ],
    preferredJobTypes: ["full-time", "freelance"],
    preferredLocations: ["Lisbon, Portugal", "Remote"],
    preferredWorkTypes: ["remote", "hybrid"],
    minimumSalary: 45000,
    maximumSalary: 65000,
    linkedin: "https://linkedin.com/in/carlamendes",
  },
  {
    fullName: "Daniel Okafor",
    email: "daniel.okafor@example.com",
    role: "worker",
    phone: "+4412345604",
    location: "London, UK",
    bio: "DevOps engineer specialising in Kubernetes and AWS.",
    categoryNames: ["DevOps & Cloud", "Cybersecurity"],
    professionalSummary:
      "DevOps engineer automating infrastructure with Terraform, Kubernetes and AWS.",
    skills: [
      { name: "Kubernetes", level: "expert" },
      { name: "Terraform", level: "advanced" },
      { name: "AWS", level: "advanced" },
      { name: "Linux", level: "advanced" },
    ],
    preferredJobTypes: ["full-time", "contract"],
    preferredLocations: ["London, UK", "Remote"],
    preferredWorkTypes: ["remote"],
    minimumSalary: 80000,
    maximumSalary: 110000,
    github: "https://github.com/danielokafor",
  },
  {
    fullName: "Eva Novak",
    email: "eva.novak@example.com",
    role: "worker",
    phone: "+42012345605",
    location: "Prague, Czechia",
    bio: "Data scientist with 4 years in applied ML and analytics.",
    categoryNames: [
      "Data Science & Analytics",
      "Artificial Intelligence & Machine Learning",
    ],
    professionalSummary:
      "Data scientist turning messy data into production ML models.",
    skills: [
      { name: "Python", level: "expert" },
      { name: "scikit-learn", level: "advanced" },
      { name: "SQL", level: "advanced" },
    ],
    preferredJobTypes: ["full-time"],
    preferredLocations: ["Prague, Czechia", "Remote"],
    preferredWorkTypes: ["hybrid", "remote"],
    minimumSalary: 60000,
    maximumSalary: 85000,
    github: "https://github.com/evanovak",
  },
  {
    fullName: "Farid Hassan",
    email: "farid.hassan@example.com",
    role: "worker",
    phone: "+2012345606",
    location: "Cairo, Egypt",
    bio: "Mobile engineer (React Native + iOS) shipping cross-platform apps.",
    categoryNames: ["Mobile Development", "Web Development"],
    professionalSummary:
      "Mobile engineer shipping cross-platform apps with React Native and native iOS.",
    skills: [
      { name: "React Native", level: "expert" },
      { name: "Swift", level: "intermediate" },
      { name: "TypeScript", level: "advanced" },
    ],
    preferredJobTypes: ["full-time", "contract"],
    preferredLocations: ["Cairo, Egypt", "Remote", "Dubai, UAE"],
    preferredWorkTypes: ["remote", "hybrid"],
    minimumSalary: 40000,
    maximumSalary: 70000,
  },
  {
    fullName: "Grace Lee",
    email: "grace.lee@example.com",
    role: "worker",
    phone: "+821012345607",
    location: "Seoul, South Korea",
    bio: "QA automation engineer with strong Playwright/Cypress background.",
    categoryNames: ["Quality Assurance & Testing", "Software Engineering"],
    professionalSummary:
      "QA automation engineer building reliable end-to-end test suites.",
    skills: [
      { name: "Playwright", level: "expert" },
      { name: "Cypress", level: "advanced" },
      { name: "TypeScript", level: "intermediate" },
    ],
    preferredJobTypes: ["full-time"],
    preferredLocations: ["Seoul, South Korea", "Remote"],
    preferredWorkTypes: ["hybrid"],
    minimumSalary: 55000,
    maximumSalary: 75000,
  },
  {
    fullName: "Hassan Ali",
    email: "hassan.ali@example.com",
    role: "worker",
    phone: "+9715012345608",
    location: "Dubai, UAE",
    bio: "Cybersecurity engineer focused on application security.",
    categoryNames: ["Cybersecurity", "DevOps & Cloud"],
    professionalSummary:
      "Application security engineer performing threat modelling and pentesting.",
    skills: [
      { name: "Penetration Testing", level: "advanced" },
      { name: "OWASP", level: "expert" },
      { name: "Python", level: "intermediate" },
    ],
    preferredJobTypes: ["full-time", "contract"],
    preferredLocations: ["Dubai, UAE", "Remote"],
    preferredWorkTypes: ["onsite", "hybrid"],
    minimumSalary: 90000,
    maximumSalary: 130000,
  },
  {
    fullName: "Ines Costa",
    email: "ines.costa@example.com",
    role: "worker",
    phone: "+3519112345609",
    location: "Porto, Portugal",
    bio: "Product designer with a strong B2B SaaS portfolio.",
    categoryNames: ["UI/UX Design", "Graphic Design"],
    professionalSummary:
      "Product designer crafting B2B SaaS experiences from research to handoff.",
    skills: [
      { name: "Figma", level: "expert" },
      { name: "User Research", level: "advanced" },
      { name: "Prototyping", level: "advanced" },
    ],
    preferredJobTypes: ["full-time", "freelance"],
    preferredLocations: ["Porto, Portugal", "Remote"],
    preferredWorkTypes: ["remote", "hybrid"],
    minimumSalary: 45000,
    maximumSalary: 70000,
    website: "https://inescosta.design",
  },
  {
    fullName: "Jonas Weber",
    email: "jonas.weber@example.com",
    role: "worker",
    phone: "+4915112345610",
    location: "Hamburg, Germany",
    bio: "Data engineer building reliable pipelines with Airflow and dbt.",
    categoryNames: ["Data Science & Analytics", "DevOps & Cloud"],
    professionalSummary:
      "Data engineer building reliable batch and streaming pipelines on AWS.",
    skills: [
      { name: "Airflow", level: "advanced" },
      { name: "dbt", level: "advanced" },
      { name: "SQL", level: "expert" },
      { name: "Python", level: "advanced" },
    ],
    preferredJobTypes: ["full-time"],
    preferredLocations: ["Hamburg, Germany", "Berlin, Germany", "Remote"],
    preferredWorkTypes: ["hybrid", "remote"],
    minimumSalary: 70000,
    maximumSalary: 95000,
  },
  {
    fullName: "Kavya Nair",
    email: "kavya.nair@example.com",
    role: "worker",
    phone: "+919812345611",
    location: "Bangalore, India",
    bio: "Machine learning engineer shipping models to production.",
    categoryNames: [
      "Artificial Intelligence & Machine Learning",
      "Data Science & Analytics",
      "Software Engineering",
    ],
    professionalSummary:
      "ML engineer deploying models to production with MLOps best practices.",
    skills: [
      { name: "PyTorch", level: "advanced" },
      { name: "MLflow", level: "intermediate" },
      { name: "Docker", level: "advanced" },
    ],
    preferredJobTypes: ["full-time"],
    preferredLocations: ["Bangalore, India", "Remote"],
    preferredWorkTypes: ["hybrid", "remote"],
    minimumSalary: 2500000,
    maximumSalary: 4000000,
  },
  {
    fullName: "Liam O'Brien",
    email: "liam.obrien@example.com",
    role: "worker",
    phone: "+3538712345612",
    location: "Dublin, Ireland",
    bio: "Site reliability engineer with strong Linux fundamentals.",
    categoryNames: ["DevOps & Cloud", "Customer Support"],
    professionalSummary:
      "SRE keeping large Linux fleets healthy with observability and automation.",
    skills: [
      { name: "Linux", level: "expert" },
      { name: "Prometheus", level: "advanced" },
      { name: "Go", level: "intermediate" },
    ],
    preferredJobTypes: ["full-time"],
    preferredLocations: ["Dublin, Ireland", "Remote"],
    preferredWorkTypes: ["hybrid", "remote"],
    minimumSalary: 75000,
    maximumSalary: 100000,
  },
  {
    fullName: "Maya Patel",
    email: "maya.patel@example.com",
    role: "worker",
    phone: "+44123456013",
    location: "Manchester, UK",
    bio: "Product manager with marketplace experience.",
    categoryNames: ["Product Management", "Sales & Business Development"],
    professionalSummary:
      "Product manager shipping marketplace features with cross-functional teams.",
    skills: [
      { name: "Roadmapping", level: "advanced" },
      { name: "Analytics", level: "intermediate" },
      { name: "Agile", level: "advanced" },
    ],
    preferredJobTypes: ["full-time"],
    preferredLocations: ["Manchester, UK", "London, UK", "Remote"],
    preferredWorkTypes: ["hybrid", "remote"],
    minimumSalary: 70000,
    maximumSalary: 95000,
  },
  {
    fullName: "Noah Müller",
    email: "noah.mueller@example.com",
    role: "worker",
    phone: "+4915112345614",
    location: "Frankfurt, Germany",
    bio: "Junior software engineer eager to learn and ship.",
    categoryNames: ["Software Engineering", "Internships & Entry Level"],
    professionalSummary:
      "Junior software engineer with internship experience in Java and Spring Boot.",
    skills: [
      { name: "Java", level: "beginner" },
      { name: "Spring Boot", level: "beginner" },
      { name: "Git", level: "intermediate" },
    ],
    preferredJobTypes: ["full-time", "internship"],
    preferredLocations: ["Frankfurt, Germany", "Remote"],
    preferredWorkTypes: ["hybrid", "onsite"],
    minimumSalary: 45000,
    maximumSalary: 55000,
    github: "https://github.com/noahmueller",
  },
  {
    fullName: "Olivia Silva",
    email: "olivia.silva@example.com",
    role: "worker",
    phone: "+5511987654321",
    location: "São Paulo, Brazil",
    bio: "Technical writer and content specialist for developer tools.",
    categoryNames: ["Content Writing & Copywriting", "Marketing & Growth"],
    professionalSummary:
      "Technical writer producing API docs and developer tutorials.",
    skills: [
      { name: "Markdown", level: "expert" },
      { name: "API Documentation", level: "advanced" },
      { name: "SEO", level: "intermediate" },
    ],
    preferredJobTypes: ["full-time", "freelance"],
    preferredLocations: ["São Paulo, Brazil", "Remote"],
    preferredWorkTypes: ["remote"],
    minimumSalary: 80000,
    maximumSalary: 120000,
    website: "https://oliviasilva.dev",
  },
];

/* ────────────────────────────────────────────────────────────────────────── *
 *  Employer seeds — unchanged
 * ────────────────────────────────────────────────────────────────────────── */

const employers: SeedUser[] = [
  {
    fullName: "Peter Anderson",
    email: "peter.anderson@techcorp.example.com",
    role: "employer",
    phone: "+4915112345701",
    location: "Berlin, Germany",
    bio: "Head of Talent at TechCorp.",
    companyName: "TechCorp GmbH",
  },
  {
    fullName: "Quinn Roberts",
    email: "quinn.roberts@cloudwave.example.com",
    role: "employer",
    phone: "+44123456072",
    location: "London, UK",
    bio: "Engineering Manager at CloudWave.",
    companyName: "CloudWave Ltd",
  },
  {
    fullName: "Rita Fernandes",
    email: "rita.fernandes@databridge.example.com",
    role: "employer",
    phone: "+3519112345703",
    location: "Lisbon, Portugal",
    bio: "People Ops lead at DataBridge.",
    companyName: "DataBridge SA",
  },
  {
    fullName: "Samir Khalil",
    email: "samir.khalil@finedge.example.com",
    role: "employer",
    phone: "+9715012345704",
    location: "Dubai, UAE",
    bio: "COO at FinEdge.",
    companyName: "FinEdge Capital",
  },
  {
    fullName: "Tina Zhao",
    email: "tina.zhao@luminaai.example.com",
    role: "employer",
    phone: "+8613800138005",
    location: "Shanghai, China",
    bio: "Head of People at LuminaAI.",
    companyName: "Lumina AI",
  },
  {
    fullName: "Umar Sheikh",
    email: "umar.sheikh@medicore.example.com",
    role: "employer",
    phone: "+9230012345706",
    location: "Karachi, Pakistan",
    bio: "Recruitment lead at MediCore.",
    companyName: "MediCore Health",
  },
  {
    fullName: "Vera Ivanova",
    email: "vera.ivanova@greenleaf.example.com",
    role: "employer",
    phone: "+791612345707",
    location: "Moscow, Russia",
    bio: "HR Director at GreenLeaf.",
    companyName: "GreenLeaf Renewables",
  },
  {
    fullName: "Wale Adeyemi",
    email: "wale.adeyemi@urbanbuild.example.com",
    role: "employer",
    phone: "+2348123456708",
    location: "Lagos, Nigeria",
    bio: "Talent Partner at UrbanBuild.",
    companyName: "UrbanBuild Ltd",
  },
  {
    fullName: "Xenia Papadopoulou",
    email: "xenia.p@northstar.example.com",
    role: "employer",
    phone: "+302112345709",
    location: "Athens, Greece",
    bio: "COO at NorthStar Logistics.",
    companyName: "NorthStar Logistics",
  },
  {
    fullName: "Yusuf Demir",
    email: "yusuf.demir@bluetech.example.com",
    role: "employer",
    phone: "+9055512345710",
    location: "Istanbul, Türkiye",
    bio: "Founder at BlueTech.",
    companyName: "BlueTech Yazılım",
  },
  {
    fullName: "Zara Ahmed",
    email: "zara.ahmed@carehub.example.com",
    role: "employer",
    phone: "+44123456071",
    location: "Birmingham, UK",
    bio: "Recruitment Manager at CareHub.",
    companyName: "CareHub Health",
  },
  {
    fullName: "Andreas Berg",
    email: "andreas.berg@nordicsaas.example.com",
    role: "employer",
    phone: "+461234567012",
    location: "Stockholm, Sweden",
    bio: "CTO at NordicSaaS.",
    companyName: "NordicSaaS AB",
  },
  {
    fullName: "Beatriz Lopes",
    email: "beatriz.lopes@eduforward.example.com",
    role: "employer",
    phone: "+5511987657213",
    location: "Rio de Janeiro, Brazil",
    bio: "Head of People at EduForward.",
    companyName: "EduForward",
  },
  {
    fullName: "Carlos Rivera",
    email: "carlos.rivera@fintechhub.example.com",
    role: "employer",
    phone: "+525512345714",
    location: "Mexico City, Mexico",
    bio: "Talent Acquisition Lead at FinTechHub.",
    companyName: "FinTechHub MX",
  },
  {
    fullName: "Diana Novak",
    email: "diana.novak@quantumleap.example.com",
    role: "employer",
    phone: "+3859112345715",
    location: "Zagreb, Croatia",
    bio: "VP People at QuantumLeap.",
    companyName: "QuantumLeap d.o.o.",
  },
];

/* ────────────────────────────────────────────────────────────────────────── *
 *  Derived required categories
 * ────────────────────────────────────────────────────────────────────────── */

const REQUIRED_CATEGORY_NAMES: string[] = Array.from(
  new Set(workers.flatMap((w) => w.categoryNames)),
).sort();

/* ────────────────────────────────────────────────────────────────────────── *
 *  Helpers
 * ────────────────────────────────────────────────────────────────────────── */

const buildRegisterDto = (u: SeedUser): RegisterDto =>
  ({
    fullName: u.fullName,
    email: u.email,
    password: DEFAULT_PASSWORD,
    role: u.role,
    phone: u.phone,
    location: u.location,
    bio: u.bio,
    ...(u.role === "employer" ? { companyName: u.companyName } : {}),
  }) as RegisterDto;

const emailExists = async (email: string): Promise<boolean> => {
  const found = await User.exists({ email: email.toLowerCase().trim() });
  return found !== null;
};

const loadCategoryMap = async (): Promise<
  Map<string, mongoose.Types.ObjectId>
> => {
  const categories = await Category.find({
    name: { $in: REQUIRED_CATEGORY_NAMES },
  })
    .select("_id name")
    .lean();

  const map = new Map<string, mongoose.Types.ObjectId>();
  for (const c of categories) {
    map.set(c.name, c._id as mongoose.Types.ObjectId);
  }

  const missing = REQUIRED_CATEGORY_NAMES.filter((n) => !map.has(n));

  if (missing.length > 0) {
    const allInDb = await Category.find({}).select("name").lean();
    const dbNames = allInDb
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b));

    const message =
      `Worker seed references ${missing.length} category name(s) not in DB:\n` +
      missing.map((n) => `  ✗ "${n}"`).join("\n") +
      `\n\nCategories actually in DB (${dbNames.length}):\n` +
      (dbNames.length === 0
        ? "  (none — run your category seed first)"
        : dbNames.map((n) => `  • "${n}"`).join("\n")) +
      `\n\nFix: either rename the DB categories to match, or update ` +
      `\`categoryNames\` on the affected worker seeds.`;

    if (STRICT_CATEGORY_CHECK) {
      throw new Error(message);
    }

    console.warn(`⚠️  ${message}`);
    console.warn(
      `⚠️  STRICT_CATEGORY_CHECK=false → seeding workers without ` +
        `categoryIds for the missing categories.\n`,
    );
  } else {
    console.log(
      `📚 Resolved all ${REQUIRED_CATEGORY_NAMES.length} required categories`,
    );
  }

  return map;
};

const enrichWorkerProfile = async (
  userId: mongoose.Types.ObjectId,
  seed: SeedWorker,
  categoryMap: Map<string, mongoose.Types.ObjectId>,
): Promise<void> => {
  const categoryIds = seed.categoryNames
    .map((name) => categoryMap.get(name))
    .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

  await Worker.findOneAndUpdate(
    { userId },
    {
      $set: {
        professionalSummary: seed.professionalSummary,
        skills: seed.skills.map((s) => ({
          skillId: new mongoose.Types.ObjectId(),
          name: s.name,
          level: s.level,
        })),
        categoryIds,
        location: seed.location,
        preferredJobTypes: seed.preferredJobTypes,
        preferredLocations: seed.preferredLocations,
        preferredWorkTypes: seed.preferredWorkTypes,
        minimumSalary: seed.minimumSalary,
        maximumSalary: seed.maximumSalary,
        website: seed.website,
        linkedin: seed.linkedin,
        github: seed.github,
        profileCompletion: 80,
      },
    },
    { new: true, upsert: false },
  );
};

/* ────────────────────────────────────────────────────────────────────────── *
 *  Main
 * ────────────────────────────────────────────────────────────────────────── */

const seedUsers = async (): Promise<void> => {
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

    console.log(
      `📋 Worker seeds reference ${REQUIRED_CATEGORY_NAMES.length} distinct categories`,
    );

    const categoryMap = await loadCategoryMap();

    const allUsers: SeedUser[] = [...workers, ...employers];

    let created = 0;
    let skipped = 0;
    let enriched = 0;
    const failures: { email: string; reason: string }[] = [];

    for (const seed of allUsers) {
      const email = seed.email.toLowerCase().trim();

      if (await emailExists(email)) {
        skipped++;
        console.log(`⏭️  Skipped (exists): ${email}`);
        continue;
      }

      try {
        const result = await authService.register(buildRegisterDto(seed));
        created++;
        console.log(`✅ Created ${seed.role}: ${email}`);

        if (seed.role === "worker") {
          const workerSeed = seed as SeedWorker;
          const userId = (result as any).user?._id ?? (result as any)._id;

          if (!userId) {
            throw new Error("authService.register() did not return a user id");
          }

          await enrichWorkerProfile(
            userId as mongoose.Types.ObjectId,
            workerSeed,
            categoryMap,
          );
          enriched++;
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        failures.push({ email, reason });
        console.error(`❌ Failed: ${email} — ${reason}`);
      }
    }

    console.log("\n──────── Seed summary ────────");
    console.log(`Workers seeded:   ${workers.length}`);
    console.log(`Employers seeded: ${employers.length}`);
    console.log(`Created:          ${created}`);
    console.log(`Enriched workers: ${enriched}`);
    console.log(`Skipped:          ${skipped}`);
    console.log(`Failed:           ${failures.length}`);
    console.log(`Strict category:  ${STRICT_CATEGORY_CHECK}`);
    console.log(
      `Default password: ${DEFAULT_PASSWORD} (override with SEED_USER_PASSWORD)`,
    );
    console.log("──────────────────────────────\n");

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("❌ User seed failed:", error);
    process.exitCode = 1;
  } finally {
    if (connectedHere) {
      await mongoose.disconnect();
      console.log("🔌 Disconnected from MongoDB");
    }
  }
};

void seedUsers();
