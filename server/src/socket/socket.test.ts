import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { io as Client, type Socket as ClientSocket } from "socket.io-client";
import { initSocketServer } from "./socket.server.js";
import { generateAccessToken } from "../utils/token.js";

test("Socket.IO: Authentication & Real-time Event Flow", async (t) => {
    const server = http.createServer();
    const io = initSocketServer(server);

    await new Promise<void>((resolve) => {
        server.listen(0, () => resolve());
    });

    const port = (server.address() as AddressInfo).port;
    const url = `http://localhost:${port}`;

    t.after(() => {
        io.close();
        server.close();
    });

    await t.test("Rejects connection when token is missing", async () => {
        const client: ClientSocket = Client(url, {
            auth: {},
            transports: ["websocket"],
            reconnection: false,
        });

        const error = await new Promise<string>((resolve) => {
            client.on("connect_error", (err) => {
                resolve(err.message);
                client.disconnect();
            });
        });

        assert.match(error, /Authentication/i);
    });

    await t.test("Accepts connection with valid JWT access token", async () => {
        const token = generateAccessToken({
            userId: "64b8f0f0f0f0f0f0f0f0f001",
            role: "worker",
        });

        const client: ClientSocket = Client(url, {
            auth: { token },
            transports: ["websocket"],
            reconnection: false,
        });

        await new Promise<void>((resolve, reject) => {
            client.on("connect", () => {
                client.disconnect();
                resolve();
            });
            client.on("connect_error", (err) => {
                client.disconnect();
                reject(err);
            });
        });
    });

    await t.test("Typing indicators broadcast to conversation room", async () => {
        const token1 = generateAccessToken({
            userId: "64b8f0f0f0f0f0f0f0f0f001",
            role: "worker",
        });
        const token2 = generateAccessToken({
            userId: "64b8f0f0f0f0f0f0f0f0f002",
            role: "employer",
        });

        const client1: ClientSocket = Client(url, {
            auth: { token: token1 },
            transports: ["websocket"],
            reconnection: false,
        });
        const client2: ClientSocket = Client(url, {
            auth: { token: token2 },
            transports: ["websocket"],
            reconnection: false,
        });

        await Promise.all([
            new Promise<void>((resolve) => client1.on("connect", () => resolve())),
            new Promise<void>((resolve) => client2.on("connect", () => resolve())),
        ]);

        // Manually have both sockets join test room on the server side
        const sockets = Array.from(io.sockets.sockets.values());
        for (const s of sockets) {
            s.join("conversation:test-conv-123");
        }

        const typingPromise = new Promise<{ conversationId: string; userId: string }>((resolve) => {
            client2.on("user_typing", (data) => {
                resolve(data);
            });
        });

        // Client 1 starts typing
        client1.emit("typing_start", "test-conv-123");

        const received = await typingPromise;
        assert.equal(received.conversationId, "test-conv-123");
        assert.equal(received.userId, "64b8f0f0f0f0f0f0f0f0f001");

        client1.disconnect();
        client2.disconnect();
    });
});
