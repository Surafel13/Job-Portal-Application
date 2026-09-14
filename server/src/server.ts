import app from "./app.js";
import env from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { disconnectRedis } from "./config/redis.js";

const startServer = async (): Promise<void> => {
    try {
        await connectDatabase();

        const server = app.listen(env.PORT, () => {
            console.log(`Server running on http://localhost:${env.PORT}`);
        });

        const shutdown = async (): Promise<void> => {
            server.close(async () => {
                await disconnectDatabase();
                await disconnectRedis();

                process.exit(0);
            });
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();