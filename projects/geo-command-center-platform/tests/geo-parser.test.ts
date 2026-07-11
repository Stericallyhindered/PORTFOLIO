import { describe, expect, it } from "vitest";
import { detectMentions, extractCitationsFromText } from "@/lib/geo/parser";

describe("geo parser", () => {
  it("extracts citations from URLs in text", () => {
    const text =
      "Check https://example.com/a and https://docs.example.org/path for references.";
    const citations = extractCitationsFromText(text);
    expect(citations.length).toBe(2);
    expect(citations[0]?.citedDomain).toBe("example.com");
    expect(citations[1]?.citedDomain).toBe("docs.example.org");
  });

  it("detects brand mentions case-insensitively", () => {
    const text = "GEO Command Center improved visibility for Acme Cloud this month.";
    const mentions = detectMentions(text, ["acme cloud", "other brand"]);
    expect(mentions).toEqual(["acme cloud"]);
  });
});

