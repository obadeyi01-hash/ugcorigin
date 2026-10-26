import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { feeFor } from "../fees.ts";
import { campaignPayoutNaira, disputeShares, mayTransfer } from "./money-math.ts";

describe("feeFor", () => {
  it("is 12% rounded to naira", () => {
    assert.equal(feeFor(10_000), 1_200);
    assert.equal(feeFor(100), 12);
  });
});

describe("disputeShares", () => {
  it("releases the whole rate to the creator", () => {
    assert.deepEqual(disputeShares(50_000, "release"), { price: 50_000, toCreator: 50_000, toBrand: 0 });
  });
  it("refunds the whole rate to the brand", () => {
    assert.deepEqual(disputeShares(50_000, "refund"), { price: 50_000, toCreator: 0, toBrand: 50_000 });
  });
  it("caps a partial at the rate and floors negatives", () => {
    assert.deepEqual(disputeShares(50_000, "partial", 80_000), { price: 50_000, toCreator: 50_000, toBrand: 0 });
    assert.deepEqual(disputeShares(50_000, "partial", -5), { price: 50_000, toCreator: 0, toBrand: 50_000 });
    assert.deepEqual(disputeShares(50_000, "partial", 20_000), { price: 50_000, toCreator: 20_000, toBrand: 30_000 });
  });
});

describe("campaignPayoutNaira", () => {
  it("pays the view rate when the pool can cover it", () => {
    assert.equal(campaignPayoutNaira(100_000, 0, 2500, 4_000), 10_000);
  });
  it("caps at the remainder so a second approval cannot overspend", () => {
    assert.equal(campaignPayoutNaira(100_000, 95_000, 10_000, 4_000), 5_000);
  });
  it("pays nothing when the pool is empty or there are no views", () => {
    assert.equal(campaignPayoutNaira(100_000, 100_000, 5000, 4_000), 0);
    assert.equal(campaignPayoutNaira(100_000, 0, 0, 4_000), 0);
    assert.equal(campaignPayoutNaira(100_000, 0, -10, 4_000), 0);
  });
  it("prorates a partial thousand views", () => {
    assert.equal(campaignPayoutNaira(100_000, 0, 100, 4_000), 400);
  });
});

describe("mayTransfer", () => {
  it("refuses a payout when escrow was not flipped from held", () => {
    assert.equal(mayTransfer(false), false);
    assert.equal(mayTransfer(true), true);
  });
});
