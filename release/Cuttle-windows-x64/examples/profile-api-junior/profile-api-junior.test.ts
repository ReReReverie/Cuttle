import { describe, expect, it } from "vitest";
import { loadProfile } from "./profile-api-junior";

describe("profile loader regression coverage", () => {
  it("returns a profile for a successful response", async () => {
    const response = Response.json({ id: "user-1", displayName: "Ari" });
    await expect(loadProfile("user-1", async () => response)).resolves.toEqual({
      id: "user-1",
      displayName: "Ari",
    });
  });

  it("returns null when the profile no longer exists", async () => {
    const response = Response.json({ message: "Not found" }, { status: 404 });
    await expect(loadProfile("deleted-user", async () => response)).resolves.toBeNull();
  });
});
