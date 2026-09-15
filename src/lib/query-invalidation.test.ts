import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { INVALIDATES, invalidate } from "./query-invalidation";

/** The roots `invalidate` actually asked the client to drop, in order. */
function spyOn(client: QueryClient) {
  const roots: string[] = [];
  vi.spyOn(client, "invalidateQueries").mockImplementation(
    async ({ queryKey } = {}) => {
      roots.push(String((queryKey as string[])[0]));
    },
  );
  return roots;
}

describe("invalidate", () => {
  it("drops only the resource root for a self-contained mutation", async () => {
    const client = new QueryClient();
    const roots = spyOn(client);

    await invalidate(client, "customers");
    expect(roots).toEqual(["customers"]);
  });

  it("drops products too when a category, unit or tax rate changes", async () => {
    for (const resource of [
      "product_categories",
      "product_units",
      "tax_definitions",
    ] as const) {
      const client = new QueryClient();
      const roots = spyOn(client);

      await invalidate(client, resource);
      expect(roots).toContain("products");
      expect(roots).toContain(resource);
    }
  });

  it("pairs templates with settings, since the default lives in both", async () => {
    const client = new QueryClient();
    const roots = spyOn(client);

    await invalidate(client, "templates");
    expect(roots.sort()).toEqual(["settings", "templates"]);
  });

  it("does not drop a root twice when two resources overlap", async () => {
    const client = new QueryClient();
    const roots = spyOn(client);

    await invalidate(client, "product_categories", "product_units");
    expect(roots.filter((r) => r === "products")).toHaveLength(1);
  });

  it("invalidates at the root so lists and details both refetch", () => {
    for (const [resource, roots] of Object.entries(INVALIDATES)) {
      expect(roots).toContain(resource);
      expect(roots.every((r) => !r.includes(","))).toBe(true);
    }
  });
});
