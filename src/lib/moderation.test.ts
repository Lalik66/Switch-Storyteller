import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getServerEnv } from "@/lib/env";
import { moderateOutput, moderatePrompt } from "./moderation";

/**
 * Layer 1 (`moderatePrompt`) and Layer 3 (`moderateOutput`) are the two
 * safety gates that stand between a child and the LLM (see moderation.ts /
 * PRD §10). Both delegate to the OpenAI moderation endpoint, so these tests
 * mock `fetch` and pin the score→severity bucketing, the flagged-but-low
 * signal-preservation branch, and the fail-closed behaviour on a bad
 * response or a missing key. A future refactor of the thresholds or the
 * fail-closed guards can't slip through silently.
 */

vi.mock("@/lib/env", () => ({
  getServerEnv: vi.fn(() => ({ OPENAI_MODERATION_API_KEY: "test-key" })),
}));

const fetchMock = vi.fn();

/** Build an OpenAI moderations response body with the given peak signal. */
function moderationBody(opts: {
  flagged?: boolean;
  scores?: Record<string, number>;
  categories?: Record<string, boolean>;
}) {
  return {
    id: "modr_test",
    model: "omni-moderation-latest",
    results: [
      {
        flagged: opts.flagged ?? false,
        categories: opts.categories ?? {},
        category_scores: opts.scores ?? {},
      },
    ],
  };
}

/** Queue one successful fetch response returning `body`. */
function resolveOnce(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValueOnce({
    ok,
    status,
    statusText: ok ? "OK" : "Internal Server Error",
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.mocked(getServerEnv).mockReturnValue({
    OPENAI_MODERATION_API_KEY: "test-key",
  } as unknown as ReturnType<typeof getServerEnv>);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("moderateOutput (Layer 3 — post-generation gate)", () => {
  it("returns safe when every score is below the low threshold and not flagged", async () => {
    resolveOnce(
      moderationBody({ flagged: false, scores: { violence: 0.05, hate: 0.01 } }),
    );
    const result = await moderateOutput("The dragon shared its cake.", "en");
    expect(result.status).toBe("safe");
    expect(result.severity).toBeUndefined();
  });

  it("buckets a peak score above 0.8 as high severity", async () => {
    resolveOnce(
      moderationBody({ flagged: true, scores: { violence: 0.92, hate: 0.1 } }),
    );
    const result = await moderateOutput("something graphic", "en");
    expect(result.status).toBe("flagged");
    expect(result.severity).toBe("high");
    expect(result.reason).toContain("violence");
  });

  it("buckets a peak score in (0.5, 0.8] as medium severity", async () => {
    resolveOnce(moderationBody({ flagged: true, scores: { violence: 0.63 } }));
    const result = await moderateOutput("borderline scene", "en");
    expect(result.severity).toBe("medium");
  });

  it("buckets a peak score in (0.2, 0.5] as low severity", async () => {
    resolveOnce(moderationBody({ flagged: false, scores: { violence: 0.35 } }));
    const result = await moderateOutput("mildly tense scene", "en");
    expect(result.status).toBe("flagged");
    expect(result.severity).toBe("low");
  });

  it("preserves an OpenAI-flagged signal as low severity even when all scores are below threshold", async () => {
    resolveOnce(
      moderationBody({
        flagged: true,
        scores: { "harassment/threatening": 0.05 },
      }),
    );
    const result = await moderateOutput("edge case", "en");
    expect(result.status).toBe("flagged");
    expect(result.severity).toBe("low");
  });

  it("localizes the flagged reason for Azerbaijani", async () => {
    resolveOnce(moderationBody({ flagged: true, scores: { violence: 0.9 } }));
    const result = await moderateOutput("nə isə", "az");
    expect(result.reason).toContain("təhlükəsizlik filtri");
  });

  it("throws fail-closed on a non-2xx moderation response", async () => {
    resolveOnce("upstream boom", false, 500);
    await expect(moderateOutput("anything", "en")).rejects.toThrow(
      /moderation request failed/i,
    );
  });

  it("throws fail-closed when the API key is missing", async () => {
    vi.mocked(getServerEnv).mockReturnValueOnce({
      OPENAI_MODERATION_API_KEY: "",
    } as unknown as ReturnType<typeof getServerEnv>);
    await expect(moderateOutput("anything", "en")).rejects.toThrow(
      /not configured/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("moderatePrompt (Layer 1 — pre-prompt gate)", () => {
  it("allows a clean prompt", async () => {
    resolveOnce(moderationBody({ flagged: false, scores: { violence: 0.02 } }));
    const result = await moderatePrompt("a hero who loves gardens", "en");
    expect(result.action).toBe("allowed");
  });

  it("blocks as soon as a prompt crosses the low threshold (stricter than output gate)", async () => {
    resolveOnce(moderationBody({ flagged: false, scores: { violence: 0.25 } }));
    const result = await moderatePrompt("a scary fight", "en");
    expect(result.action).toBe("blocked");
    expect(result.reason).toBeTruthy();
  });
});
