import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cleanReferralCode } from "./code.ts";

describe("cleanReferralCode", () => {
  it("keeps a normal handle", () => {
    assert.equal(cleanReferralCode("@NymahVlogs"), "nymahvlogs");
  });

  it("rejects a short or empty value", () => {
    assert.equal(cleanReferralCode("ab"), null);
    assert.equal(cleanReferralCode("  "), null);
    assert.equal(cleanReferralCode(null), null);
  });
});
