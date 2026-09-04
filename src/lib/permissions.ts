export const RESOURCES = [
  "invoices",
  "customers",
  "products",
  "templates",
  "settings",
  "tax_definitions",
  "users",
] as const;

export const ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
  "publish",
  "void",
  "export",
  "install",
] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];

/** Which actions are meaningful per resource — drives the permissions grid columns. */
export const RESOURCE_ACTIONS: Record<Resource, readonly Action[]> = {
  invoices: ["read", "create", "update", "delete", "publish", "void", "export"],
  customers: ["read", "create", "update", "delete"],
  products: ["read", "create", "update", "delete"],
  templates: ["read", "create", "update", "delete", "install"],
  settings: ["read", "update"],
  tax_definitions: ["read", "create", "update", "delete"],
  users: ["read", "create", "update", "delete"],
};

/** Grid columns: every action some resource actually uses, in ACTIONS order. */
export const GRID_ACTIONS = ACTIONS.filter((a) =>
  RESOURCES.some((r) => RESOURCE_ACTIONS[r].includes(a)),
);

/** A permission key as it travels through the form: `perm.{resource}.{action}`. */
export const permKey = (resource: Resource, action: Action) =>
  `perm.${resource}.${action}`;

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const resourceLabel = (r: Resource) => r.split("_").map(title).join(" ");

export const actionLabel = title;
