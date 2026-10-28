import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatFollowers, parseSocialAccount } from "./accounts.ts";

describe("social accounts", () => {
  it("reads a TikTok profile address", () => {
    assert.deepEqual(parseSocialAccount("tiktok", "https://www.tiktok.com/@amicia08"), {
      handle: "amicia08",
      url: "https://www.tiktok.com/@amicia08",
    });
  });

  it("refuses a Facebook share link", () => {
    assert.equal(parseSocialAccount("facebook", "https://facebook.com/share/19hCNWe9Gf"), null);
  });

  it("formats a ten-thousand audience like 10.0K", () => {
    assert.equal(formatFollowers(10000), "10.0K");
    assert.equal(formatFollowers(300), "300");
  });
});
