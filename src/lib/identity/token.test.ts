import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { identityTokenHash, parseVirtualNin } from "./token.ts";

describe("virtual NIN", () => {
  it("rejects the raw 11-digit NIN", () => {
    const parsed = parseVirtualNin("12345678901");
    assert.equal(parsed.token, undefined);
    assert.match(parsed.error ?? "", /11-digit/);
  });

  it("accepts a 16-character Virtual NIN", () => {
    const parsed = parseVirtualNin("ab12-cd34-ef56-gh78");
    assert.equal(parsed.token, "AB12CD34EF56GH78");
  });

  it("accepts a 6-character Share Code", () => {
    const parsed = parseVirtualNin("ab12cd");
    assert.equal(parsed.token, "AB12CD");
  });

  it("hashes the same token to the same value", () => {
    assert.equal(identityTokenHash("AB12CD34EF56GH78", "pepper"), identityTokenHash("AB12CD34EF56GH78", "pepper"));
    assert.notEqual(identityTokenHash("AB12CD34EF56GH78", "pepper"), identityTokenHash("AB12CD34EF56GH79", "pepper"));
  });
});
