import { describe, expect, it } from "vitest";

import { buildEnterpriseAuditSummary } from "@/lib/content/enterpriseSummary";

describe("buildEnterpriseAuditSummary", () => {
  it("aggregates dimensions and issues from enterprise payloads", () => {
    const summary = buildEnterpriseAuditSummary([
      {
        score: 72,
        issuesJson: {
          frameworkVersion: "enterprise-llm-v1",
          confidence: 0.82,
          dimensions: [
            { id: "answerFirstContent", score: 70, status: "good" },
            { id: "technicalOptimization", score: 80, status: "excellent" },
          ],
          currentVsImproved: [
            {
              location: "Title tag",
              whyThisMatters: "Direct answers improve extraction",
              current: "Title is vague",
              improved: "Add service + location + value",
              implementationEffort: "low",
              citationLikelihood: 75,
              dimension: "answerFirstContent",
            },
          ],
        },
        recommendationsJson: {
          engineEvidence: [
            {
              engine: "anthropic",
              score: 74,
              confidence: 0.8,
              summary: "Strong semantic structure",
            },
          ],
        },
      },
    ]);

    expect(summary.frameworkVersion).toBe("enterprise-llm-v1");
    expect(summary.score).toBe(72);
    expect(summary.dimensions.length).toBeGreaterThan(0);
    expect(summary.issues[0]?.location).toBe("Title tag");
    expect(summary.engineEvidence[0]?.engine).toBe("anthropic");
  });
});
