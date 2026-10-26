import {
  API_BASE_URL,
  ApiClientError,
  getAccessToken,
  refreshSession,
} from "./api";
import { createSseParser } from "./sseParser";

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function postSse(
  path: string,
  body: unknown,
  options: {
    signal?: AbortSignal;
    onEvent: (event: string, data: unknown) => void;
  },
): Promise<void> {
  const send = (token: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      signal: options.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

  let response = await send(getAccessToken());

  if (response.status === 401) {
    const token = await refreshSession();
    if (token) response = await send(token);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      errors?: { field?: string; message: string }[];
    } | null;
    throw new ApiClientError(
      payload?.message ?? `Request failed (${response.status})`,
      response.status,
      payload?.errors ?? [],
    );
  }

  if (!response.body) {
    throw new ApiClientError("Streaming is not supported by this browser.", 500);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser();

  const dispatch = (text: string) => {
    for (const message of parser.push(text)) {
      let data: unknown = message.data;
      try {
        data = JSON.parse(message.data);
      } catch {
        /* keep raw string */
      }
      options.onEvent(message.event, data);
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      dispatch(decoder.decode(value, { stream: true }));
    }
    dispatch(decoder.decode());
  } finally {
    void reader.cancel().catch(() => undefined);
  }
}
