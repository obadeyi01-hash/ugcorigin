import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { combineGuides, FALLBACK_GUIDES, rateStance } from "./guides.ts";

describe("rate guides", () => {
  it("uses the Origin band for a new Oyo creator", () => {
    const band = combineGuides(FALLBACK_GUIDES, "origin", ["Fashion", "Lifestyle", "Dance & Choreography"], "Oyo");
    assert.equal(band.low, 10000);
    assert.equal(band.typical, 13000);
    assert.equal(band.high, 19000);
    assert.equal(rateStance(80000, band), "high");
    assert.equal(rateStance(45000, band), "high");
    assert.equal(rateStance(13000, band), "ok");
  });

  it("uses the Lagos Origin row for Fashion", () => {
    const band = combineGuides(FALLBACK_GUIDES, "origin", ["Fashion"], "Lagos");
    assert.deepEqual(band, { low: 13000, typical: 19000, high: 25000 });
  });

  it("keeps an unlisted niche on the Origin default", () => {
    const band = combineGuides(FALLBACK_GUIDES, "origin", ["Skits"], "Oyo");
    assert.deepEqual(band, { low: 10000, typical: 12000, high: 18000 });
  });

  it("suggests Rising only when that tier is asked for", () => {
    const origin = combineGuides(FALLBACK_GUIDES, "origin", ["Fashion"], "Oyo");
    const rising = combineGuides(FALLBACK_GUIDES, "rising", ["Fashion"], "Oyo");
    assert.equal(origin.typical, 15000);
    assert.equal(rising.typical, 28000);
  });
});
