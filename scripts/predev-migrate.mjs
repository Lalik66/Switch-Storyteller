#!/usr/bin/env node
/**
 * predev guard — apply pending Drizzle migrations before `next dev` starts.
 *
 * Why: `next dev` (unlike `pnpm build`) does not run migrations, so pulling a
 * schema change and starting the dev server left the DB behind — the app then
 * threw "relation ... does not exist" at runtime (e.g. child_usage_daily).
 * This runs the same `drizzle-kit migrate` the build uses, first.
 *
 * Failure policy:
 *   - database unreachable (Docker/PG down)  -> warn, exit 0, dev still starts
 *     (the app already surfaces DB-down clearly; don't block the whole server).
 *     Reachability is decided by a short TCP probe, not by parsing tool output.
 *   - migrations applied / already current   -> exit 0, dev starts.
 *   - a real migration error (bad SQL, etc.) -> print it, exit 1, block dev.
 */

import { execSync } from "node:child_process";
import { connect } from "node:net";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Resolve POSTGRES_URL from the environment, falling back to a parse of .env. */
function resolvePostgresUrl() {
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  try {
    const env = readFileSync(join(ROOT, ".env"), "utf8");
    const match = env.match(/^\s*POSTGRES_URL\s*=\s*(.+)\s*$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    /* no .env — fall through */
  }
  return undefined;
}

/** TCP-connect to host:port within `timeoutMs`. Resolves true if reachable. */
function isReachable(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = connect({ host, port });
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

const url = resolvePostgresUrl();

// Can't find a URL to probe — let drizzle-kit be the source of truth.
if (url) {
  let host = "localhost";
  let port = 5432;
  try {
    const parsed = new URL(url);
    host = parsed.hostname || host;
    port = Number(parsed.port) || 5432;
  } catch {
    /* unparseable URL — skip the probe, let drizzle-kit report */
  }

  const reachable = await isReachable(host, port);
  if (!reachable) {
    console.warn(
      `${c.yellow}⚠ Database not reachable at ${host}:${port} — skipping migrations.${c.reset}\n` +
        `${c.dim}  Is Postgres running? Start it with:  docker compose up -d${c.reset}\n` +
        `${c.dim}  The dev server will start, but data queries will error until the DB is up.${c.reset}`,
    );
    process.exit(0);
  }
}

try {
  execSync("pnpm exec drizzle-kit migrate", { stdio: "pipe" });
  console.log(`${c.green}✓${c.reset} Database migrations up to date`);
  process.exit(0);
} catch (err) {
  const output = `${err?.stdout ?? ""}${err?.stderr ?? ""}${err?.message ?? ""}`;
  console.error(
    `${c.red}✗ Migration failed.${c.reset} Fix the migration, then retry.\n${output.trim()}`,
  );
  process.exit(1);
}
