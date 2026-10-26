import type { Response } from "express";

export interface SseStream {
    send(event: string, data: unknown): boolean;
    close(): void;
}

const HEARTBEAT_MS = 15_000;

export const formatSseEvent = (event: string, data: unknown): string =>
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

export const openSse = (res: Response): SseStream => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.write(": connected\n\n");

    const heartbeat = setInterval(() => {
        if (!res.writableEnded && !res.destroyed) {
            res.write(": ping\n\n");
        }
    }, HEARTBEAT_MS);
    heartbeat.unref();
    res.on("close", () => clearInterval(heartbeat));

    return {
        send(event, data) {
            if (res.writableEnded || res.destroyed) return false;
            return res.write(formatSseEvent(event, data));
        },
        close() {
            clearInterval(heartbeat);
            if (!res.writableEnded) res.end();
        },
    };
};
