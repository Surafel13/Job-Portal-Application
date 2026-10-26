export interface SseMessage {
  event: string;
  data: string;
}

export interface SseParser {
  push(chunk: string): SseMessage[];
}

function parseFrame(frame: string): SseMessage | null {
  let event = "message";
  const data: string[] = [];

  for (const line of frame.split("\n")) {
    if (!line || line.startsWith(":")) continue; // blank or comment (heartbeat)
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }

  return data.length ? { event, data: data.join("\n") } : null;
}

/** Incremental parser: feed decoded text, get back complete messages only. */
export function createSseParser(): SseParser {
  let buffer = "";

  return {
    push(chunk) {
      buffer += chunk;
      // A trailing "\r" may be the first half of "\r\n"; hold it back.
      const held = buffer.endsWith("\r") ? "\r" : "";
      const normalized = (held ? buffer.slice(0, -1) : buffer).replace(
        /\r\n?/g,
        "\n",
      );
      const frames = normalized.split("\n\n");
      buffer = (frames.pop() ?? "") + held; // incomplete tail stays buffered
      return frames.map(parseFrame).filter((m): m is SseMessage => m !== null);
    },
  };
}
