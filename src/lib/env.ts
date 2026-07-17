import { z } from "zod";

/**
 * Server-side environment variables schema.
 * These variables are only available on the server.
 */
const serverEnvSchema = z.object({
  // Database
  POSTGRES_URL: z.string().url("Invalid database URL"),

  // Authentication
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // AI
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("openai/gpt-5-mini"),
  // Per PRD §4.1: cheap = Claude Haiku for per-page generation, premium =
  // Claude Sonnet for chapter openers/finales. Model slugs rot: the 3.5-era
  // Anthropic slugs died in mid-2026 just like `google/gemini-flash-1.5`
  // before them ("No endpoints found"). Verified live 2026-07-17 against
  // GET /api/v1/models. Override per-deployment via .env.
  OPENROUTER_STORY_MODEL_CHEAP: z
    .string()
    .default("anthropic/claude-haiku-4.5"),
  OPENROUTER_STORY_MODEL_PREMIUM: z
    .string()
    .default("anthropic/claude-sonnet-4.6"),
  // Phase 2: image generation model via OpenRouter images API.
  // Re-verified 2026-07-17: `openai/dall-e-3` and `openai/gpt-image-1` no
  // longer resolve; gemini-2.5-flash-image (PRD §4.2's first choice) does.
  OPENROUTER_IMAGE_MODEL: z
    .string()
    .default("google/gemini-2.5-flash-image"),

  // Moderation (child-safety critical — required, not optional)
  OPENAI_MODERATION_API_KEY: z
    .string()
    .min(1, "OPENAI_MODERATION_API_KEY is required for child safety moderation"),

  // ElevenLabs (Phase 2: audio narrator)
  ELEVENLABS_API_KEY: z.string().optional(),
  // Default voice "Rachel" — warm, calm, kid-friendly. Override per-deployment.
  ELEVENLABS_VOICE_ID: z.string().default("21m00Tcm4TlvDq8ikWAM"),
  ELEVENLABS_MODEL_ID: z.string().default("eleven_turbo_v2_5"),

  // Email (Phase 2: parent digest)
  RESEND_API_KEY: z.string().optional(),

  // Cron auth (Phase 2: Vercel Cron invocations)
  CRON_SECRET: z.string().optional(),

  // Storage
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Feature flags
  // Community surface (feed, public reader, publish, remix) master switch.
  // Default OFF. Turned dark 2026-07-17 pending owner decisions from the
  // community-feed safety audit — see `isCommunityEnabled()` below.
  COMMUNITY_ENABLED: z.string().optional(),

  // App
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Client-side environment variables schema.
 * These variables are exposed to the browser via NEXT_PUBLIC_ prefix.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3001"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validates and returns server-side environment variables.
 * Throws an error if validation fails.
 */
export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "Invalid server environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid server environment variables");
  }

  return parsed.data;
}

/**
 * Validates and returns client-side environment variables.
 * Throws an error if validation fails.
 */
export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    console.error(
      "Invalid client environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid client environment variables");
  }

  return parsed.data;
}

/**
 * Community surface master switch (feed, public reader, publish, remix).
 * Read directly from `process.env` so pages and route handlers can gate
 * cheaply without running full server-env validation. Default OFF —
 * anything other than the exact string "true" is treated as disabled, so
 * an unset or malformed value fails safe (dark). See COMMUNITY_ENABLED in
 * `env.example` and the 2026-07-17 community-feed safety audit.
 */
export function isCommunityEnabled(): boolean {
  return process.env.COMMUNITY_ENABLED === "true";
}

/**
 * Checks if required environment variables are set.
 * Logs warnings for missing optional variables.
 */
export function checkEnv(): void {
  const warnings: string[] = [];

  // Check required variables
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is required");
  }

  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is required");
  }

  // Check optional variables and warn
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    warnings.push("Google OAuth is not configured. Social login will be disabled.");
  }

  if (!process.env.OPENROUTER_API_KEY) {
    warnings.push("OPENROUTER_API_KEY is not set. AI chat will not work.");
  }

  if (!process.env.OPENAI_MODERATION_API_KEY) {
    throw new Error(
      "OPENAI_MODERATION_API_KEY is required. Moderation is fail-closed; " +
        "refusing to start without a valid API key.",
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    warnings.push("BLOB_READ_WRITE_TOKEN is not set. Using local storage for file uploads.");
  }

  // Log warnings in development
  if (process.env.NODE_ENV === "development" && warnings.length > 0) {
    console.warn("\n⚠️  Environment warnings:");
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn("");
  }
}
