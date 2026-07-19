import { describe, expect, it } from "vitest";
import {
  applyCoupon,
  shouldShowRetryBanner,
  submitCheckout,
} from "./buggy-checkout";

describe("checkout regression coverage", () => {
  it("accepts a successful empty response", async () => {
    const response = new Response(null, { status: 204 });
    await expect(submitCheckout({ cartId: "cart-1" }, async () => response)).resolves.toBeNull();
  });

  it("keeps the total numeric when there is no discount", () => {
    expect(applyCoupon(42, undefined)).toBe(42);
  });

  it("hides the retry banner after payment succeeds", () => {
    expect(shouldShowRetryBanner("success")).toBe(false);
  });
});

