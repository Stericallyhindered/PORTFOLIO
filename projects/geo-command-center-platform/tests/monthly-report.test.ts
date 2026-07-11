import { describe, expect, it } from "vitest";

import { buildMonthlyReportContent } from "@/lib/reports/monthly";

describe("monthly report generation", () => {
  it("returns all required report sections", () => {
    const data = buildMonthlyReportContent({
      month: "2026-03",
      clientName: "Acme",
      avgShareOfVoice: 41.2,
      citationCount: 32,
      mentionCount: 19,
      completedTasks: 7,
      deliverablesShipped: 3,
      executiveSummary: "Strong month with improved share-of-voice.",
    });

    expect(data.executiveSummary.length).toBeGreaterThan(10);
    expect(data.visibility.avgShareOfVoice).toBe(41.2);
    expect(data.workCompleted.completedTasks).toBe(7);
    expect(data.nextMonthPlan.length).toBeGreaterThan(0);
    expect(data.recommendationsBacklog.length).toBeGreaterThan(0);
  });
});

