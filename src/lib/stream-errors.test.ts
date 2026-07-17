import { describe, it, expect } from "vitest";
import { classifyStreamError } from "./stream-errors";

/**
 * The classifier is the seam that keeps a provider's raw error text off the
 * wire to a child (see stream-errors.ts). These cases pin the two classes so
 * a future refactor can't silently reclassify a hard-config outage as a
 * retryable blip — or, worse, leak a message through an unhandled shape.
 */
describe("classifyStreamError", () => {
  it("classifies rate limits and server errors as transient", () => {
    expect(classifyStreamError({ statusCode: 429 })).toBe("transient");
    expect(classifyStreamError({ statusCode: 500 })).toBe("transient");
    expect(classifyStreamError({ statusCode: 503 })).toBe("transient");
    expect(classifyStreamError({ status: 502 })).toBe("transient");
  });

  it("classifies auth, payment, and unknown-model statuses as hard_config", () => {
    expect(classifyStreamError({ statusCode: 401 })).toBe("hard_config");
    expect(classifyStreamError({ statusCode: 402 })).toBe("hard_config");
    expect(classifyStreamError({ statusCode: 403 })).toBe("hard_config");
    expect(classifyStreamError({ statusCode: 404 })).toBe("hard_config");
  });

  it("classifies a bad model ID by message when no status is present", () => {
    // The exact shape seen in the 2026-07-17 forced-error experiment.
    expect(
      classifyStreamError(
        new Error("anthropic/claude-nonexistent-model-99 is not a valid model ID"),
      ),
    ).toBe("hard_config");
    expect(classifyStreamError(new Error("No endpoints found"))).toBe(
      "hard_config",
    );
    expect(
      classifyStreamError(new Error("Invalid API key provided")),
    ).toBe("hard_config");
    expect(
      classifyStreamError(new Error("Insufficient credits on this account")),
    ).toBe("hard_config");
  });

  it("treats timeouts, network drops, and unknown errors as transient", () => {
    expect(classifyStreamError(new Error("network timeout"))).toBe("transient");
    expect(classifyStreamError(new Error("fetch failed"))).toBe("transient");
    expect(classifyStreamError(undefined)).toBe("transient");
    expect(classifyStreamError(null)).toBe("transient");
    expect(classifyStreamError("some opaque string")).toBe("transient");
  });

  it("prefers status code over message shape when both are present", () => {
    // A 429 that happens to mention 'credit' is still a retryable rate limit.
    expect(
      classifyStreamError({ statusCode: 429, message: "credit throttle" }),
    ).toBe("transient");
  });
});
