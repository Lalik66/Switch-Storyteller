import { describe, expect, it } from "vitest";
import {
  HEARTBEAT_MAX_CREDIT_SECONDS,
  clampCredit,
  overDailyLimit,
  usageDateFor,
} from "@/lib/usage";

describe("usageDateFor", () => {
  it("returns the Asia/Baku calendar day as YYYY-MM-DD", () => {
    // 12:00 UTC on 2026-09-17 is 16:00 in Baku — same date.
    expect(usageDateFor(new Date("2026-09-17T12:00:00Z"))).toBe("2026-09-17");
  });

  it("rolls to the next day at Baku midnight, before UTC midnight", () => {
    // Baku is UTC+4, so 21:00 UTC is 01:00 the NEXT day locally.
    expect(usageDateFor(new Date("2026-09-17T21:00:00Z"))).toBe("2026-09-18");
  });

  it("has not yet rolled just before Baku midnight", () => {
    // 19:59 UTC is 23:59 in Baku — still the same local day.
    expect(usageDateFor(new Date("2026-09-17T19:59:00Z"))).toBe("2026-09-17");
  });
});

describe("clampCredit", () => {
  it("floors non-positive and non-finite deltas at 0", () => {
    expect(clampCredit(0)).toBe(0);
    expect(clampCredit(-30)).toBe(0);
    expect(clampCredit(Number.NaN)).toBe(0);
    // A non-finite delta is bogus input, not a real elapsed time → 0, never the cap.
    expect(clampCredit(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("passes through a normal interval unchanged", () => {
    expect(clampCredit(30)).toBe(30);
  });

  it("caps a long gap at the max credit", () => {
    expect(clampCredit(6000)).toBe(HEARTBEAT_MAX_CREDIT_SECONDS);
  });
});

describe("overDailyLimit", () => {
  it("is never over when no limit is set", () => {
    const r = overDailyLimit({ dailyMinuteLimit: null }, 999_999);
    expect(r.over).toBe(false);
    expect(r.limitSeconds).toBeNull();
  });

  it("is not over below the limit", () => {
    // 30 min = 1800s; 1500s used is under.
    expect(overDailyLimit({ dailyMinuteLimit: 30 }, 1500).over).toBe(false);
  });

  it("is over at exactly the limit", () => {
    expect(overDailyLimit({ dailyMinuteLimit: 30 }, 1800).over).toBe(true);
  });

  it("is over past the limit", () => {
    const r = overDailyLimit({ dailyMinuteLimit: 30 }, 2400);
    expect(r.over).toBe(true);
    expect(r.limitSeconds).toBe(1800);
  });
});
