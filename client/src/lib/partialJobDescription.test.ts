import test from "node:test";
import assert from "node:assert/strict";
import { extractPartialJobDescription } from "./partialJobDescription.ts";

const final = {
  description: 'Line one\nLine "two" caf\u00e9 \\ end',
  responsibilities: ["Build APIs.", "Review code."],
  requirements: ["Node.js", "MongoDB", "Communication"],
};
const full = JSON.stringify(final);

test("complete JSON is extracted exactly", () => {
  assert.deepEqual(extractPartialJobDescription(full), final);
});

test("every prefix is safe and grows monotonically", () => {
  let prev = { description: "", responsibilities: 0, requirements: 0 };
  for (let i = 0; i <= full.length; i += 1) {
    const p = extractPartialJobDescription(full.slice(0, i));
    assert.ok(final.description.startsWith(p.description), `prefix ${i}`);
    assert.ok(p.description.length >= prev.description.length);
    assert.ok(p.responsibilities.length >= prev.responsibilities);
    assert.ok(p.requirements.length >= prev.requirements);
    prev = {
      description: p.description,
      responsibilities: p.responsibilities.length,
      requirements: p.requirements.length,
    };
  }
});

test("partial unicode escapes are not emitted until complete", () => {
  assert.equal(extractPartialJobDescription('{"description":"a\\u00').description, "a");
  assert.equal(extractPartialJobDescription('{"description":"a\\u00e9').description, "a\u00e9");
});

test("tolerates code fences and garbage", () => {
  assert.equal(extractPartialJobDescription('```json\n{"description":"hi').description, "hi");
  assert.deepEqual(extractPartialJobDescription("nonsense"), {
    description: "",
    responsibilities: [],
    requirements: [],
  });
});
