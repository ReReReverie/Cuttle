import { afterEach, describe, expect, it, vi } from "vitest";
import { clearCartCache, getCart } from "./cart-cache-mid";

describe("regional cart cache regression coverage", () => {
  afterEach(() => clearCartCache());

  it("keeps carts for different regions isolated", async () => {
    const load = vi.fn(async (_userId: string, region: "us" | "eu") => ({
      region,
      itemIds: region === "us" ? ["us-item"] : ["eu-item"],
    }));

    await getCart("user-1", "us", load);
    const euCart = await getCart("user-1", "eu", load);

    expect(euCart.region).toBe("eu");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("reuses the cache for the same user and region", async () => {
    const load = vi.fn(async () => ({ region: "us" as const, itemIds: [] }));

    const first = await getCart("user-1", "us", load);
    const second = await getCart("user-1", "us", load);

    expect(second).toBe(first);
    expect(load).toHaveBeenCalledTimes(1);
  });
});

