import { describe, expect, it } from "vitest";

import { buildMonthlyReportContent } from "@/lib/reports/monthly";
import { renderMonthlyReportPdf } from "@/lib/reports/pdf";

describe("report pdf integration", () => {
  it("renders a non-empty PDF from monthly report content", async () => {
    const content = buildMonthlyReportContent({
      month: "2026-03",
      clientName: "Acme",
      avgShareOfVoice: 38.4,
      citationCount: 28,
      mentionCount: 16,
      completedTasks: 9,
      deliverablesShipped: 4,
      executiveSummary: "Visibility climbed and deliverables shipped on time.",
    });

    const pdf = await renderMonthlyReportPdf({
      clientName: "Acme",
      month: "2026-03",
      data: content,
    });

    expect(pdf.byteLength).toBeGreaterThan(500);
  });
});

