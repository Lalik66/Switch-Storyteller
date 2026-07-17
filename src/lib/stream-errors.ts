/**
 * Classification of AI-generation stream failures into a stable, safe class
 * code. Pure — no I/O, no imports — so it is unit-testable in isolation
 * (see stream-errors.test.ts).
 *
 * WHY THIS EXISTS: the class code is the ONLY thing allowed to cross the wire
 * to the browser (see the `onError` handler in
 * `src/app/api/story/page/route.ts`). A provider's raw error message must
 * never reach a child reader — it can leak model IDs, API-key hints, or
 * account/credit details, and it is untranslated technical English. The
 * client maps this code to its own localized copy and never renders a
 * server-supplied string.
 *
 * Two classes, per the plan's Layer-3 / stream-failure ruling:
 *   - "transient"   — retryable: rate limit (429), server errors (5xx),
 *                     timeouts, network drops. The child is invited to retry.
 *   - "hard_config" — not retryable by the child: bad model ID, auth
 *                     (401/403), exhausted credits (402). This is an ops
 *                     signal — the app is misconfigured for *every* child,
 *                     not one page. (Alerting on it is deferred until
 *                     PostHog lands — see plan §12.)
 *
 * The child sees the same gentle copy for both; only the code (and therefore
 * the server-side log severity / future ops routing) differs.
 */

export type StreamErrorClass = "transient" | "hard_config";

/** Pull an HTTP-ish status code off an AI SDK / provider error, if present. */
function statusOf(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const e = error as { statusCode?: unknown; status?: unknown };
    if (typeof e.statusCode === "number") return e.statusCode;
    if (typeof e.status === "number") return e.status;
  }
  return undefined;
}

/** Best-effort message extraction for shape-matching (never sent to client). */
function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function classifyStreamError(error: unknown): StreamErrorClass {
  const status = statusOf(error);
  if (status !== undefined) {
    // Retryable: rate limit + any server-side (5xx) failure.
    if (status === 429 || status >= 500) return "transient";
    // Not retryable by the child: auth (401/403), payment/credits (402),
    // unknown model/route (404) are configuration/account problems.
    if (status === 401 || status === 402 || status === 403 || status === 404) {
      return "hard_config";
    }
  }

  // Some providers surface a bad model ID / disabled endpoint / missing key
  // without a clean status code — match the message shapes we have actually
  // observed (e.g. the forced-error experiment's "is not a valid model ID").
  const msg = messageOf(error).toLowerCase();
  if (
    msg.includes("not a valid model") ||
    msg.includes("no endpoints") ||
    msg.includes("api key") ||
    msg.includes("insufficient") ||
    msg.includes("credit")
  ) {
    return "hard_config";
  }

  // Network drops, timeouts, aborts, and everything unrecognized: treat as
  // transient so the child is invited to retry. The raw provider message is
  // still logged server-side regardless of class, so nothing is lost for ops.
  return "transient";
}
