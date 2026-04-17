/**
 * OpenAI `omni-moderation-latest` wrapper for The Hero's Forge.
 *
 * This module implements Layers 1 and 3 of the Safety architecture
 * described in PRD §10:
 *
 *   - `moderatePrompt()` runs BEFORE any child input reaches the story
 *     route (pre-prompt gate).
 *   - `moderateOutput()` runs AFTER every AI page before it streams to
 *     the child (post-generation gate).
 *
 * Design notes:
 *
 *   - We intentionally do NOT depend on the `openai` SDK. The moderation
 *     endpoint is a single JSON POST and adding a transitive dependency
 *     here would bloat cold-start time on Vercel. The global `fetch`
 *     available in Node 20 / the Edge runtime is sufficient.
 *
 *   - The module is FAIL-CLOSED on missing configuration. If the API key
 *     environment variable is absent we throw a clear error rather than
 *     silently allowing content through. Safety-critical code should
 *     never "default to open".
 *
 *   - We accept a `lang` argument on both exports even though
 *     `omni-moderation-latest` is language-agnostic. It is reserved for
 *     future per-language threshold tuning (PRD §6 "Content moderation
 *     configured per language") and is currently used only to pick a
 *     localized reason string.
 */

import { getServerEnv } from "@/lib/env";

/**
 * The OpenAI moderation REST endpoint. Hoisted to a const so tests and
 * edge-runtime bundling can see it statically.
 */
const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";

/**
 * Model identifier. Pinned to the "latest" alias per PRD §4.1 — OpenAI
 * ships backwards-compatible upgrades behind this name so we do not need
 * to chase dated snapshots.
 */
const MODERATION_MODEL = "omni-moderation-latest";

/**
 * Severity mapping thresholds. See PRD §10 Layer 3 — we translate the
 * raw category scores OpenAI returns into the three buckets used by the
 * `moderation_event` table's `severity` column.
 *
 *   score > 0.8 → "high"
 *   score > 0.5 → "medium"
 *   score > 0.2 → "low"
 *   otherwise  → not flagged
 */
const SEVERITY_HIGH_THRESHOLD = 0.8;
const SEVERITY_MEDIUM_THRESHOLD = 0.5;
const SEVERITY_LOW_THRESHOLD = 0.2;

/**
 * Shape of a single result entry in the OpenAI moderations response.
 * We only declare the fields we actually read; unknown extras are
 * ignored rather than validated so new OpenAI categories don't break us.
 */
type OpenAIModerationResult = {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
};

type OpenAIModerationResponse = {
  id?: string;
  model?: string;
  results: OpenAIModerationResult[];
};

/**
 * Shape of the pre-prompt gate's return value. See PRD §10 Layer 1.
 *
 *   - "blocked"   → caller must show a kid-friendly redirect; do not
 *                   forward the prompt to the LLM.
 *   - "sanitized" → reserved for future prompt-rewriting; currently
 *                   unused by the wrapper itself but exposed so the
 *                   story route can record the distinction in
 *                   `prompt_log.moderation_action`.
 *   - "allowed"   → forward the prompt unchanged.
 */
export type PromptModerationResult = {
  action: "blocked" | "sanitized" | "allowed";
  reason?: string;
  categories?: Record<string, boolean>;
};

/**
 * Shape of the post-generation gate's return value. See PRD §10 Layer 3.
 */
export type OutputModerationResult = {
  status: "safe" | "flagged";
  reason?: string;
  severity?: "low" | "medium" | "high";
};

/**
 * Resolve the API key from the validated environment. The Zod schema in
 * env.ts enforces `.min(1)` so by the time we reach here the key is
 * guaranteed to be a non-empty string. We still throw fail-closed as a
 * defence-in-depth measure in case the module is somehow imported in an
 * edge case where env validation was bypassed.
 */
function getApiKey(): string {
  const env = getServerEnv();
  const key = env.OPENAI_MODERATION_API_KEY;
  if (!key || key.trim() === "") {
    throw new Error(
      "OPENAI_MODERATION_API_KEY is not configured. Moderation is fail-closed; " +
        "refusing to process content without a valid API key.",
    );
  }
  return key;
}

/**
 * Low-level call into the OpenAI moderation endpoint. Returns the first
 * result object (we always submit a single-string input). Any non-2xx
 * response is surfaced as a thrown Error so callers can fail closed.
 */
async function callOpenAIModeration(
  text: string,
): Promise<OpenAIModerationResult> {
  const apiKey = getApiKey();

  const response = await fetch(OPENAI_MODERATION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODERATION_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "<unreadable>");
    throw new Error(
      `OpenAI moderation request failed: ${response.status} ${response.statusText} — ${bodyText}`,
    );
  }

  const json = (await response.json()) as OpenAIModerationResponse;
  const first = json.results[0];
  if (!first) {
    throw new Error(
      "OpenAI moderation response contained no results; treating as service error.",
    );
  }
  return first;
}

/**
 * Find the highest category score in the raw response. Used to decide
 * bucketed severity for post-generation moderation events.
 */
function peakScore(scores: Record<string, number>): {
  category: string | null;
  score: number;
} {
  let topCategory: string | null = null;
  let topScore = 0;
  for (const [category, score] of Object.entries(scores)) {
    if (score > topScore) {
      topScore = score;
      topCategory = category;
    }
  }
  return { category: topCategory, score: topScore };
}

/**
 * Bucket a raw 0–1 score into the three-level severity used in the
 * `moderation_event` table. Returns `null` if the score is below the
 * lowest threshold, meaning we do NOT consider the content flagged at
 * all (even if OpenAI's own `flagged` boolean disagrees — we prefer the
 * calibrated bucket so low-signal categories like `harassment/threatening`
 * with score 0.05 do not drown reviewers).
 */
function bucketSeverity(score: number): "low" | "medium" | "high" | null {
  if (score > SEVERITY_HIGH_THRESHOLD) return "high";
  if (score > SEVERITY_MEDIUM_THRESHOLD) return "medium";
  if (score > SEVERITY_LOW_THRESHOLD) return "low";
  return null;
}

/**
 * Collect the list of categories that OpenAI marked `true`. Used as a
 * human-readable "reason" string in the result.
 */
function flaggedCategoryList(categories: Record<string, boolean>): string[] {
  return Object.entries(categories)
    .filter(([, isFlagged]) => isFlagged)
    .map(([name]) => name);
}

/**
 * Localized reason strings surfaced in the result. These are intentionally
 * short and neutral — user-facing kid-friendly copy lives in the UI layer,
 * not here.
 */
function localizedBlockedReason(
  lang: "en" | "az",
  categories: string[],
): string {
  const joined = categories.length > 0 ? categories.join(", ") : "unspecified";
  if (lang === "az") {
    return `Məzmun uşaqlara uyğun deyil (${joined})`;
  }
  return `Content not appropriate for children (${joined})`;
}

function localizedFlaggedReason(
  lang: "en" | "az",
  topCategory: string | null,
): string {
  const cat = topCategory ?? "unspecified";
  if (lang === "az") {
    return `AI cavabı təhlükəsizlik filtri tərəfindən işarələndi (${cat})`;
  }
  return `AI response flagged by safety filter (${cat})`;
}

/**
 * Layer 1 gate: run a child-supplied prompt through moderation BEFORE it
 * is forwarded to the story LLM. Returns an `action` that the caller is
 * expected to honor:
 *
 *   - "blocked"   → do not call the LLM; show redirect UI.
 *   - "sanitized" → currently unreachable from this function (reserved
 *                   for a future prompt-rewriter); kept in the type so
 *                   downstream code can switch on all three values.
 *   - "allowed"   → safe to forward.
 *
 * Throws on API / configuration failures (fail-closed).
 */
export async function moderatePrompt(
  text: string,
  lang: "en" | "az",
): Promise<PromptModerationResult> {
  const result = await callOpenAIModeration(text);
  const { score } = peakScore(result.category_scores);

  // A child prompt is blocked as soon as it crosses the "low" threshold.
  // The pre-prompt gate is intentionally stricter than the post-generation
  // gate because the child can simply rephrase, whereas a blocked LLM page
  // costs a regeneration.
  if (result.flagged || score > SEVERITY_LOW_THRESHOLD) {
    const categories = flaggedCategoryList(result.categories);
    return {
      action: "blocked",
      reason: localizedBlockedReason(lang, categories),
      categories: result.categories,
    };
  }

  return {
    action: "allowed",
    categories: result.categories,
  };
}

/**
 * Layer 3 gate: run an AI-generated page through moderation BEFORE it
 * streams to the child. Returns `"safe"` or `"flagged"` along with a
 * severity bucket the story route uses to decide whether to regenerate
 * (medium/high) or log-and-allow (low).
 *
 * Throws on API / configuration failures (fail-closed).
 */
export async function moderateOutput(
  text: string,
  lang: "en" | "az",
): Promise<OutputModerationResult> {
  const result = await callOpenAIModeration(text);
  const { category, score } = peakScore(result.category_scores);
  const severity = bucketSeverity(score);

  if (severity === null && !result.flagged) {
    return { status: "safe" };
  }

  // If OpenAI flagged it but all scores are below our low threshold,
  // we still surface it as "low" severity rather than dropping the
  // signal — reviewers can decide whether to raise the threshold later.
  const resolvedSeverity: "low" | "medium" | "high" = severity ?? "low";

  return {
    status: "flagged",
    reason: localizedFlaggedReason(lang, category),
    severity: resolvedSeverity,
  };
}
