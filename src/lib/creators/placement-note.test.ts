import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { alignedRate, placementNote } from "./placement-note.ts";

describe("placement", () => {
  it("brings a high starting rate down to the usual number for the level", () => {
    const aligned = alignedRate(80000, { low: 10000, typical: 13000, high: 19000 }, 10000);
    assert.deepEqual(aligned, { rate: 13000, adjusted: true });
  });

  it("leaves a rate that already sits in the band", () => {
    assert.equal(alignedRate(15000, { low: 10000, typical: 13000, high: 19000 }, 10000).adjusted, false);
  });

  it("names the level and the new rate without scolding", () => {
    const note = placementNote({
      firstName: "Oluwabukolami",
      tierLabel: "Origin",
      previousRate: 80000,
      nextRate: 13000,
      band: { low: 10000, typical: 13000, high: 19000 },
      niches: ["Lifestyle", "Fashion"],
      location: "Oyo",
    });
    assert.match(note.subject, /Origin/);
    assert.match(note.body, /13,000/);
    assert.match(note.body, /showcase/);
    assert.match(note.body, /comment on your worth/);
    assert.match(note.body, /significantly above/);
    assert.match(note.body, /negotiate/);
    assert.doesNotMatch(note.body, /wrong|too expensive|terrible/i);
  });
});
