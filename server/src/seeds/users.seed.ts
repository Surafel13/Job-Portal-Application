import mongoose from "mongoose";
import User from "../modules/user/user.model.js";
import env from "../config/env.js";
import { hashPassword } from "../utils/password.js";

const users = [
    {
        fullName: "Abebe Kebede",
        email: "abebe.worker@example.com",
        password: "12345678",
        role: "worker",
        status: "active",
    },
    {
        fullName: "Hana Tesfaye",
        email: "hana.worker@example.com",
        password: "12345678",
        role: "worker",
        status: "active",
    },
    {
        fullName: "Dawit Alemu",
        email: "dawit.worker@example.com",
        password: "12345678",
        role: "worker",
        status: "active",
    },
    {
        fullName: "Meron Getachew",
        email: "meron.worker@example.com",
        password: "12345678",
        role: "worker",
        status: "active",
    },
    {
        fullName: "Samuel Bekele",
        email: "samuel.worker@example.com",
        password: "12345678",
        role: "worker",
        status: "active",
    },
    {
        fullName: "Rahel Worku",
        email: "rahel.worker@example.com",
        password: "12345678",
        role: "worker",
        status: "suspended",
    },
    {
        fullName: "Yonatan Girma",
        email: "yonatan.worker@example.com",
        password: "12345678",
        role: "worker",
        status: "active",
    },
    {
        fullName: "Sara Mohammed",
        email: "sara.worker@example.com",
        password: "12345678",
        role: "worker",
        status: "active",
    },
    {
        fullName: "Nile Technologies",
        email: "nile.tech@example.com",
        password: "12345678",
        role: "employer",
        status: "active",
    },
    {
        fullName: "Ethio Solutions",
        email: "ethio.solutions@example.com",
        password: "12345678",
        role: "employer",
        status: "active",
    },
    {
        fullName: "Blue Nile Software",
        email: "blue.nile@example.com",
        password: "12345678",
        role: "employer",
        status: "active",
    },
    {
        fullName: "Addis Digital",
        email: "addis.digital@example.com",
        password: "12345678",
        role: "employer",
        status: "active",
    },
    {
        fullName: "Admin User",
        email: "admin@example.com",
        password: "12345678",
        role: "admin",
        status: "active",
    },
    {
        fullName: "System Administrator",
        email: "system.admin@example.com",
        password: "12345678",
        role: "admin",
        status: "active",
    },
    {
        fullName: "Super Administrator",
        email: "superadmin@example.com",
        password: "12345678",
        role: "superAdmin",
        status: "active",
    },
];

const seedUsers = async () => {
    try {
        await mongoose.connect(env.DATABASE_URL);

        console.log("Connected to MongoDB");

        await User.deleteMany({});

        const usersWithHashedPasswords = await Promise.all(
            users.map(async (user) => ({
                ...user,
                password: await hashPassword(user.password),
            }))
        );

        await User.insertMany(usersWithHashedPasswords);

        console.log(`${users.length} users seeded successfully`);

        await mongoose.disconnect();
    } catch (error) {
        console.error("User seeding failed:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seedUsers();