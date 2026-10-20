import test from "node:test";
import assert from "node:assert/strict";
import { Types } from "mongoose";
import {
    calculateWorkerProfileCompletion,
    MIN_PROFILE_COMPLETION_TO_APPLY,
} from "./worker.completion.js";
import type { IWorker } from "./worker.interface.js";

const completeWorker = (): IWorker => ({
    userId: new Types.ObjectId(),
    professionalSummary: "Experienced engineer",
    skills: [
        {
            skillId: new Types.ObjectId(),
            name: "TypeScript",
        },
    ],
    categoryIds: [new Types.ObjectId()],
    education: [
        {
            institution: "Addis Ababa University",
            degree: "BSc",
        },
    ],
    experience: [
        {
            company: "Acme",
            jobTitle: "Engineer",
            startDate: new Date("2020-01-01"),
            isCurrent: true,
        },
    ],
    location: "Addis Ababa",
    preferredJobTypes: ["full-time"],
    preferredLocations: ["Addis Ababa"],
    preferredWorkTypes: ["remote"],
    resumeIds: [new Types.ObjectId()],
    profileCompletion: 0,
});

test("calculateWorkerProfileCompletion is 0 for an empty profile", () => {
    const completion = calculateWorkerProfileCompletion({
        skills: [],
        categoryIds: [],
        education: [],
        experience: [],
        preferredJobTypes: [],
        preferredLocations: [],
        preferredWorkTypes: [],
        resumeIds: [],
    });

    assert.equal(completion, 0);
});

test("calculateWorkerProfileCompletion is 100 for a complete profile", () => {
    assert.equal(calculateWorkerProfileCompletion(completeWorker()), 100);
});

test("calculateWorkerProfileCompletion reaches the 80% apply threshold with 8 of 10 fields", () => {
    const worker = completeWorker();
    worker.preferredLocations = [];
    worker.preferredWorkTypes = [];

    const completion = calculateWorkerProfileCompletion(worker);
    assert.equal(completion, MIN_PROFILE_COMPLETION_TO_APPLY);
});
