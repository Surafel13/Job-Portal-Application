export interface PartialJobDescription {
  description: string;
  responsibilities: string[];
  requirements: string[];
}

const ESCAPES: Record<string, string> = {
  n: "\n",
  t: "\t",
  r: "\r",
  b: "\b",
  f: "\f",
  "/": "/",
  "\\": "\\",
  '"': '"',
};

interface ReadString {
  value: string;
  complete: boolean;
  next: number;
}

function readString(text: string, start: number): ReadString {
  let value = "";
  let i = start + 1;

  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') return { value, complete: true, next: i + 1 };

    if (ch === "\\") {
      if (i + 1 >= text.length) break; // dangling backslash
      const esc = text[i + 1];
      if (esc === "u") {
        const hex = text.slice(i + 2, i + 6);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) break; // partial \u escape
        value += String.fromCharCode(parseInt(hex, 16));
        i += 6;
        continue;
      }
      value += ESCAPES[esc] ?? esc;
      i += 2;
      continue;
    }

    value += ch;
    i += 1;
  }

  return { value, complete: false, next: text.length };
}

/**
 * Best-effort extraction of the job description JSON while it is still being
 * generated. Never throws; the server's final `done` event is authoritative.
 */
export function extractPartialJobDescription(
  raw: string,
): PartialJobDescription {
  const result: PartialJobDescription = {
    description: "",
    responsibilities: [],
    requirements: [],
  };

  const text = raw.replace(/^\s*```(?:json)?/i, "");
  let depth = 0;
  let expectKey = false;
  let key: string | null = null;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (depth === 0) {
      if (ch === "{") {
        depth = 1;
        expectKey = true;
      }
      i += 1;
      continue;
    }

    if (depth === 1) {
      if (ch === '"') {
        const str = readString(text, i);
        i = str.next;
        if (expectKey) {
          if (!str.complete) break;
          key = str.value;
          expectKey = false;
        } else {
          if (key === "description") result.description = str.value;
          if (!str.complete) break;
        }
      } else if (ch === "[") {
        depth = 2;
        i += 1;
      } else if (ch === ",") {
        expectKey = true;
        key = null;
        i += 1;
      } else if (ch === "}") {
        break;
      } else {
        i += 1;
      }
      continue;
    }

    // depth === 2 (inside an array of strings)
    if (ch === '"') {
      const str = readString(text, i);
      i = str.next;
      if (key === "responsibilities") result.responsibilities.push(str.value);
      else if (key === "requirements") result.requirements.push(str.value);
      if (!str.complete) break;
    } else if (ch === "]") {
      depth = 1;
      i += 1;
    } else {
      i += 1;
    }
  }

  return result;
}
