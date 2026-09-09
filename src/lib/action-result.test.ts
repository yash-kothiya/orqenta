import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ActionError, runAction, unwrap } from "./action-result";
import { PermissionError } from "./auth/permissions";

describe("runAction", () => {
  it("wraps a value in an ok result", async () => {
    await expect(runAction(async () => 42)).resolves.toEqual({
      ok: true,
      data: 42,
    });
  });

  it("returns an ActionError as a message the page can show", async () => {
    await expect(
      runAction(async () => {
        throw new ActionError("This customer is on 2 invoices");
      }),
    ).resolves.toEqual({ ok: false, error: "This customer is on 2 invoices" });
  });

  it("returns a permission failure rather than throwing it", async () => {
    const result = await runAction(async () => {
      throw new PermissionError("invoices", "delete");
    });
    expect(result).toMatchObject({
      ok: false,
      error: "You do not have permission to delete invoices",
    });
  });

  it("maps a zod failure onto the individual fields", async () => {
    const result = await runAction(async () => {
      z.object({ name: z.string().min(1, "Name is required") }).parse({
        name: "",
      });
    });

    expect(result).toEqual({
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: { name: ["Name is required"] },
    });
  });

  it("rethrows anything else, so redirect() still navigates", async () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/login;307;",
    });

    await expect(
      runAction(async () => {
        throw redirect;
      }),
    ).rejects.toBe(redirect);
  });
});

describe("unwrap", () => {
  it("hands back the data", () => {
    expect(unwrap({ ok: true, data: ["a"] })).toEqual(["a"]);
  });

  it("throws the message, so TanStack Query sees a rejected promise", () => {
    expect(() => unwrap({ ok: false, error: "Nope" })).toThrow("Nope");
  });
});
