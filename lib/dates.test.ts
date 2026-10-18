import { describe, expect, it } from "vitest";
import { cairoDateToIso, isRealDate } from "./dates";

describe("isRealDate", () => {
  it.each(["2026-01-15", "2028-02-29", "2026-12-31"])("accepts %s", (value) => {
    expect(isRealDate(value)).toBe(true);
  });

  it.each([
    ["an impossible day", "2026-02-31"],
    ["a non-leap Feb 29", "2027-02-29"],
    ["month 13", "2026-13-01"],
    ["the wrong format", "15/01/2026"],
    ["an empty string", ""],
    ["a datetime", "2026-01-15T10:00:00Z"],
  ])("rejects %s", (_name, value) => {
    expect(isRealDate(value)).toBe(false);
  });
});

describe("cairoDateToIso", () => {
  it("uses UTC+2 in winter", () => {
    expect(cairoDateToIso("2026-01-15", false)).toBe("2026-01-14T22:00:00.000Z");
    expect(cairoDateToIso("2026-01-15", true)).toBe("2026-01-15T21:59:59.000Z");
  });

  it("uses UTC+3 during daylight saving time", () => {
    expect(cairoDateToIso("2026-07-15", false)).toBe("2026-07-14T21:00:00.000Z");
    expect(cairoDateToIso("2026-07-15", true)).toBe("2026-07-15T20:59:59.000Z");
  });

  it("makes the end of a day later than its start", () => {
    expect(new Date(cairoDateToIso("2026-03-10", true)).getTime()).toBeGreaterThan(
      new Date(cairoDateToIso("2026-03-10", false)).getTime(),
    );
  });
});