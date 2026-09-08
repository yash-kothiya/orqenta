import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Next reloads this module on every edit in dev, and a fresh Pool per reload
// exhausts the server's connections, so the pool is cached on globalThis.
const cache = globalThis as typeof globalThis & { orqentaPool?: Pool };
if (!cache.orqentaPool) {
  cache.orqentaPool = new Pool({ connectionString: env.DATABASE_URL });
}

export const db = drizzle(cache.orqentaPool, { schema });
export * from "./schema";
