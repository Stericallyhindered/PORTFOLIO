import PDFDocument from "pdfkit";
import type { EnterpriseAuditSummary } from "@/lib/content/enterpriseSummary";

import type { generateMonthlyReportData } from "./monthly";

type ReportData = Awaited<ReturnType<typeof generateMonthlyReportData>>;

export async function renderMonthlyReportPdf(args: {
  clientName: string;
  month: string;
  data: ReportData;
}): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const completed = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(20).text(`GEO Command Center`, { align: "left" });
  doc.fontSize(16).text(`Monthly Report - ${args.clientName}`, { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#666").text(`Month: ${args.month}`);
  doc.moveDown();

  doc.fillColor("#000").fontSize(12).text("Executive Summary", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(10).text(args.data.executiveSummary);
  doc.moveDown();

  doc.fontSize(12).text("Visibility", { underline: true });
  doc.fontSize(10).text(
    `Avg Share of Voice: ${args.data.visibility.avgShareOfVoice}%\nCitations: ${args.data.visibility.citationCount}\nMentions: ${args.data.visibility.mentionCount}`,
  );
  doc.moveDown();

  doc.fontSize(12).text("Work Completed", { underline: true });
  doc.fontSize(10).text(
    `Completed Tasks: ${args.data.workCompleted.completedTasks}\nDeliverables Shipped: ${args.data.workCompleted.deliverablesShipped}`,
  );
  doc.moveDown();

  doc.fontSize(12).text("Next Month Plan", { underline: true });
  args.data.nextMonthPlan.forEach((item) => {
    doc.fontSize(10).text(`- ${item}`);
  });
  doc.moveDown();

  doc.fontSize(12).text("Recommendations Backlog", { underline: true });
  args.data.recommendationsBacklog.forEach((item) => {
    doc.fontSize(10).text(`- ${item}`);
  });

  if (args.data.enterpriseAudit) {
    doc.addPage();
    doc.fontSize(14).text("Enterprise GEO Audit Snapshot", { underline: true });
    doc.moveDown(0.4);
    doc
      .fontSize(10)
      .text(
        `Score: ${args.data.enterpriseAudit.score}/100 | Confidence: ${(args.data.enterpriseAudit.confidence * 100).toFixed(1)}% | Audited pages: ${args.data.enterpriseAudit.auditedPages}`,
      );
    doc.moveDown(0.4);
    doc.fontSize(12).text("Dimensions");
    args.data.enterpriseAudit.dimensions.forEach((d) => {
      doc.fontSize(10).text(`- ${d.id}: ${d.score} (${d.status})`);
    });
    doc.moveDown(0.5);
    doc.fontSize(12).text("Top Issues");
    args.data.enterpriseAudit.topIssues.forEach((issue, idx) => {
      doc.fontSize(10).text(`${idx + 1}. ${issue.location}`);
      doc.fontSize(9).text(`Why this matters: ${issue.whyThisMatters}`);
      doc.fontSize(9).text(`Improved: ${issue.improved}`);
      doc
        .fontSize(9)
        .text(
          `Effort: ${issue.implementationEffort} | Citation likelihood: ${issue.citationLikelihood}%`,
        );
      doc.moveDown(0.25);
    });
  }

  doc.end();
  return completed;
}

export async function renderEnterpriseAuditPdf(args: {
  websiteUrl: string;
  generatedAt: string;
  summary: EnterpriseAuditSummary;
}): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 44 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const completed = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(20).text("GEO Command Center", { align: "left" });
  doc.fontSize(15).text("Enterprise GEO Audit", { align: "left" });
  doc.moveDown(0.4);
  doc
    .fontSize(10)
    .fillColor("#555")
    .text(`Website: ${args.websiteUrl}`)
    .text(`Generated: ${new Date(args.generatedAt).toLocaleString()}`)
    .text(`Framework: ${args.summary.frameworkVersion}`);
  doc.moveDown();

  doc.fillColor("#000").fontSize(14).text(`Overall Score: ${args.summary.score}/100`);
  doc.fontSize(10).text(`Confidence: ${(args.summary.confidence * 100).toFixed(1)}%`);
  doc.fontSize(10).text(`Audited pages: ${args.summary.auditedPages}`);
  doc.moveDown();

  doc.fontSize(12).text("Dimension Analysis", { underline: true });
  doc.moveDown(0.4);
  args.summary.dimensions.forEach((d) => {
    doc.fontSize(10).text(`${d.id}: ${d.score} (${d.status})`);
  });
  doc.moveDown();

  doc.fontSize(12).text("Key Issues", { underline: true });
  doc.moveDown(0.3);
  args.summary.issues.slice(0, 10).forEach((issue, idx) => {
    doc.fontSize(10).text(`${idx + 1}. ${issue.location} (${issue.dimension})`);
    doc.fontSize(9).fillColor("#222").text(`Why This Matters: ${issue.whyThisMatters}`);
    doc.fontSize(9).text(`Current: ${issue.current}`);
    doc.fontSize(9).text(`Improved: ${issue.improved}`);
    doc
      .fontSize(9)
      .fillColor("#555")
      .text(
        `Implementation Effort: ${issue.implementationEffort} | Citation Likelihood: ${issue.citationLikelihood}%`,
      );
    doc.fillColor("#000").moveDown(0.5);
  });

  doc.addPage();
  doc.fontSize(12).text("Engine Attribution", { underline: true });
  doc.moveDown(0.4);
  args.summary.engineEvidence.slice(0, 15).forEach((ev, idx) => {
    doc
      .fontSize(10)
      .text(
        `${idx + 1}. ${ev.engine} | score ${ev.score} | confidence ${(ev.confidence * 100).toFixed(0)}%`,
      );
    doc.fontSize(9).fillColor("#333").text(ev.summary);
    doc.fillColor("#000").moveDown(0.2);
  });

  if (args.summary.schemaSuggestions.length > 0) {
    doc.addPage();
    doc.fontSize(12).text("Per-Page Schema Suggestions", { underline: true });
    doc.moveDown(0.4);
    args.summary.schemaSuggestions.slice(0, 12).forEach((s, idx) => {
      doc.fontSize(10).text(`${idx + 1}. ${s.targetUrl || args.websiteUrl}`);
      doc
        .fontSize(9)
        .text(`Nodes: ${s.recommendedNodes.length > 0 ? s.recommendedNodes.join(", ") : "WebPage"}`);
      doc.fontSize(9).text(`Insertion: ${s.insertionPoint}`);
      doc.fontSize(9).fillColor("#333").text(s.why);
      doc.fillColor("#000").moveDown(0.25);
    });
  }

  if (args.summary.geoAiOptimizations.length > 0) {
    doc.addPage();
    doc.fontSize(12).text("GEO for AI/Chat Optimizations", { underline: true });
    doc.moveDown(0.4);
    args.summary.geoAiOptimizations.slice(0, 14).forEach((g, idx) => {
      doc.fontSize(10).text(`${idx + 1}. ${g.category} (${g.priority})`);
      doc.fontSize(9).text(g.action);
      doc.fontSize(9).fillColor("#333").text(g.whyItImprovesAiDiscovery);
      doc.fillColor("#000").moveDown(0.25);
    });
  }

  doc.end();
  return completed;
}

