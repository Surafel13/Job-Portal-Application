import http from "node:http";
import app from "./app.js";
import env from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";
import { redisClient, disconnectRedis } from "./config/redis.js";
import { initSocketServer } from "./socket/socket.server.js";

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await redisClient.connect();

    const server = http.createServer(app);
    initSocketServer(server);

    server.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });

    const shutdown = async (): Promise<void> => {
      server.close(async () => {
        try {
          await disconnectRedis();
          await disconnectDatabase();
          console.log("Server shutdown completed.");
          process.exit(0);
        } catch (error) {
          console.error("Error during server shutdown:", error);
          process.exit(1);
        }
      });
    };

    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
