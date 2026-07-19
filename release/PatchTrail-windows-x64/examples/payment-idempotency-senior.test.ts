import { afterEach, describe, expect, it, vi } from "vitest";
import { chargeOnce, clearCompletedPayments } from "./payment-idempotency-senior";

describe("payment idempotency regression coverage", () => {
  afterEach(() => clearCompletedPayments());

  it("does not share a result across accounts", async () => {
    const charge = vi
      .fn()
      .mockResolvedValueOnce({ paymentId: "pay-us", accountId: "account-us", amount: 10 })
      .mockResolvedValueOnce({ paymentId: "pay-eu", accountId: "account-eu", amount: 10 });

    const first = await chargeOnce("account-us", "checkout-1", charge);
    const second = await chargeOnce("account-eu", "checkout-1", charge);

    expect(first.accountId).toBe("account-us");
    expect(second.accountId).toBe("account-eu");
    expect(charge).toHaveBeenCalledTimes(2);
  });

  it("reuses a result for retries from the same account", async () => {
    const charge = vi.fn(async () => ({ paymentId: "pay-1", accountId: "account-1", amount: 10 }));

    const first = await chargeOnce("account-1", "checkout-1", charge);
    const retry = await chargeOnce("account-1", "checkout-1", charge);

    expect(retry).toBe(first);
    expect(charge).toHaveBeenCalledTimes(1);
  });
});
