import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set — see .env.example.");
}

// Next reloads this module on every edit in dev, and a fresh Pool per reload
// exhausts the server's connections, so the pool is cached on globalThis.
const cache = globalThis as typeof globalThis & { orqentaPool?: Pool };
const pool = (cache.orqentaPool ??= new Pool({ connectionString }));

export const db = drizzle(pool, { schema });
export * from "./schema";
