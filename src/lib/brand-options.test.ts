import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseGoals, serializeGoals } from "./brand-options.ts";

describe("brand goals", () => {
  it("reads a single older value", () => {
    assert.deepEqual(parseGoals("ugc"), ["ugc"]);
  });
  it("reads several, drops unknown tokens, and keeps the form order", () => {
    assert.deepEqual(parseGoals(" sponsored , nope, ugc "), ["ugc", "sponsored"]);
  });
  it("stores a list and treats an empty selection as unset", () => {
    assert.equal(serializeGoals(["affiliate", "ugc", "ugc"]), "ugc,affiliate");
    assert.equal(serializeGoals([]), null);
    assert.equal(serializeGoals(["nope"]), null);
  });
  it("round-trips", () => {
    assert.deepEqual(parseGoals(serializeGoals(["local_events", "other"])), ["local_events", "other"]);
  });
});
