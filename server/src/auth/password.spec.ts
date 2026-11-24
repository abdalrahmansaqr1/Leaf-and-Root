import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("verifies the password used to create a hash", async () => {
    const hash = await hashPassword("correct horse battery staple");

    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const hash = await hashPassword("correct horse battery staple");

    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("uses a unique salt for every password", async () => {
    const first = await hashPassword("same password");
    const second = await hashPassword("same password");

    expect(first).not.toBe(second);
  });

  it("rejects malformed stored hashes", async () => {
    await expect(verifyPassword("anything", "not-a-password-hash")).resolves.toBe(false);
  });
});
