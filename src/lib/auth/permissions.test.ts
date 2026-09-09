import { describe, expect, it } from "vitest";
import type { SessionUser } from "@/lib/types";
import { assertPermission, PermissionError } from "./permissions";

const user = (over: Partial<SessionUser> = {}): SessionUser => ({
  id: "usr_1",
  username: "kim",
  isAdmin: false,
  isActive: true,
  permissions: [{ resource: "invoices", action: "read" }],
  ...over,
});

describe("assertPermission", () => {
  it("passes a granted permission", () => {
    expect(() => assertPermission(user(), "invoices", "read")).not.toThrow();
  });

  it("refuses one that was not granted", () => {
    expect(() => assertPermission(user(), "invoices", "delete")).toThrow(
      PermissionError,
    );
  });

  it("does not let one resource's grant cover another", () => {
    expect(() => assertPermission(user(), "customers", "read")).toThrow();
  });

  it("lets an admin through without any grants", () => {
    expect(() =>
      assertPermission(
        user({ isAdmin: true, permissions: [] }),
        "users",
        "delete",
      ),
    ).not.toThrow();
  });

  it("refuses a missing session", () => {
    expect(() => assertPermission(null, "invoices", "read")).toThrow();
  });

  it("names the resource in a readable way", () => {
    expect(() => assertPermission(user(), "tax_definitions", "create")).toThrow(
      "You do not have permission to create tax definitions",
    );
  });
});
