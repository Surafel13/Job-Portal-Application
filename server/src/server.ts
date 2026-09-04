import app from "./app.js";
import env from "./config/env.js";
import { connectDatabase } from "./config/database.js";

const startServer = async (): Promise<void> => {
    try {
        await connectDatabase();

        const server = app.listen(env.PORT, () => {
            console.log(`Server running on http://localhost:${env.PORT}`);
        });

        const shutdown = async (): Promise<void> => {
            server.close(async () => {
                await import("./config/database.js").then(({ disconnectDatabase }) =>
                    disconnectDatabase()
                );

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