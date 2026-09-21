import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL environment variable is not set");
}

/**
 * Pool sizing. On Vercel every concurrent serverless instance opens its OWN
 * pool, so a large `max` multiplies across instances and can blow past
 * Postgres' `max_connections` (default ~100) under modest traffic. Keep the
 * per-instance pool small; override with POSTGRES_POOL_MAX for a single
 * long-running (self-hosted `next start`) deployment where a bigger pool helps.
 */
const POOL_MAX = Number(process.env.POSTGRES_POOL_MAX ?? 3);

// Reuse a single client across hot-reloads in dev (each reload otherwise
// spawns a fresh pool that never closes) and across module re-evaluations.
const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__pgClient ??
  postgres(connectionString, {
    max: Number.isFinite(POOL_MAX) && POOL_MAX > 0 ? POOL_MAX : 3,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgClient = client;
}

export const db = drizzle(client, { schema });
