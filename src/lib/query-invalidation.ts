/**
 * §6.2 / §6.3 — cache invalidation after a mutation.
 *
 * There is deliberately no key factory here: §6.2 fixes the key convention
 * instead, and every call site writes it inline.
 *
 *   ["customers"]                        the resource root — invalidation
 *   ["customers", "list"]                list pages
 *   ["invoices", "inv_…"]                detail pages
 *   ["invoices", "next-number", id]      everything else
 *
 * What does need a shared home is the fan-out: a mutation usually invalidates
 * more than the resource it wrote, and those pairings are easy to forget one
 * call site at a time.
 */
import type { QueryClient } from "@tanstack/react-query";

/** Roots to drop when the keyed resource is mutated (§6.3 rule 1). */
export const INVALIDATES = {
  invoices: ["invoices"],
  customers: ["customers"],
  products: ["products"],
  // A renamed or deleted category or unit changes how products read.
  product_categories: ["product_categories", "products"],
  product_units: ["product_units", "products"],
  // Products carry a tax definition, so dropping one restates their tax.
  tax_definitions: ["tax_definitions", "products"],
  // Installing or removing a template can move the default the settings show.
  templates: ["templates", "settings"],
  settings: ["settings"],
  users: ["users"],
} as const satisfies Record<string, readonly string[]>;

export type MutatedResource = keyof typeof INVALIDATES;

/**
 * Invalidate at the resource root, never at an individual key, so lists and
 * details both refetch. Pass every resource the mutation touched — a settings
 * write that changes `templateId` is `invalidate(qc, "settings", "templates")`.
 */
export function invalidate(
  queryClient: QueryClient,
  ...resources: MutatedResource[]
) {
  const roots = new Set(resources.flatMap((r) => INVALIDATES[r]));
  return Promise.all(
    [...roots].map((root) =>
      queryClient.invalidateQueries({ queryKey: [root] }),
    ),
  );
}
