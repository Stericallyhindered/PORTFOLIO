type JsonRecord = Record<string, unknown>;

export type EnterpriseDimensionSummary = {
  id: string;
  score: number;
  status: string;
};

export type EnterpriseIssueSummary = {
  message: string;
  whyThisMatters: string;
  location: string;
  current: string;
  improved: string;
  implementationEffort: string;
  citationLikelihood: number;
  dimension: string;
};

export type EnterpriseAuditSummary = {
  frameworkVersion: string;
  score: number;
  confidence: number;
  dimensions: EnterpriseDimensionSummary[];
  issues: EnterpriseIssueSummary[];
  engineEvidence: Array<{
    engine: string;
    score: number;
    confidence: number;
    summary: string;
  }>;
  schemaSuggestions: Array<{
    targetUrl: string;
    recommendedNodes: string[];
    insertionPoint: string;
    why: string;
  }>;
  geoAiOptimizations: Array<{
    category: string;
    priority: string;
    action: string;
    whyItImprovesAiDiscovery: string;
  }>;
  auditedPages: number;
};

function asObjectArray(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is JsonRecord => typeof v === "object" && v !== null);
}

export function buildEnterpriseAuditSummary(
  rows: Array<{
    score: number | null;
    issuesJson: unknown;
    recommendationsJson: unknown;
  }>,
): EnterpriseAuditSummary {
  const dimensionsMap = new Map<string, { total: number; count: number; status: string }>();
  const issueList: EnterpriseIssueSummary[] = [];
  const engineEvidence: EnterpriseAuditSummary["engineEvidence"] = [];
  const schemaSuggestions: EnterpriseAuditSummary["schemaSuggestions"] = [];
  const geoAiOptimizations: EnterpriseAuditSummary["geoAiOptimizations"] = [];
  let totalScore = 0;
  let totalConfidence = 0;
  let frameworkVersion = "enterprise-llm-v1";

  rows.forEach((row) => {
    const issuesRoot =
      row.issuesJson && typeof row.issuesJson === "object"
        ? (row.issuesJson as JsonRecord)
        : {};
    const recRoot =
      row.recommendationsJson && typeof row.recommendationsJson === "object"
        ? (row.recommendationsJson as JsonRecord)
        : {};

    if (typeof issuesRoot.frameworkVersion === "string") {
      frameworkVersion = issuesRoot.frameworkVersion;
    }
    if (typeof row.score === "number") totalScore += row.score;
    if (typeof issuesRoot.confidence === "number") totalConfidence += issuesRoot.confidence;

    asObjectArray(issuesRoot.dimensions).forEach((d) => {
      const id = String(d.id ?? "unknown");
      const score = Number(d.score ?? 0);
      const status = String(d.status ?? "good");
      const current = dimensionsMap.get(id) ?? { total: 0, count: 0, status };
      current.total += score;
      current.count += 1;
      current.status = status;
      dimensionsMap.set(id, current);
    });

    asObjectArray(issuesRoot.currentVsImproved).forEach((item) => {
      issueList.push({
        message: String(item.message ?? "Improvement opportunity identified."),
        whyThisMatters: String(item.whyThisMatters ?? ""),
        location: String(item.location ?? "Unknown"),
        current: String(item.current ?? ""),
        improved: String(item.improved ?? ""),
        implementationEffort: String(item.implementationEffort ?? "medium"),
        citationLikelihood: Number(item.citationLikelihood ?? 0),
        dimension: String(item.dimension ?? "general"),
      });
    });

    asObjectArray(recRoot.engineEvidence).forEach((ev) => {
      engineEvidence.push({
        engine: String(ev.engine ?? "unknown"),
        score: Number(ev.score ?? 0),
        confidence: Number(ev.confidence ?? 0),
        summary: String(ev.summary ?? ""),
      });
    });
    asObjectArray(recRoot.schemaSuggestions).forEach((s) => {
      schemaSuggestions.push({
        targetUrl: String(s.targetUrl ?? ""),
        recommendedNodes: Array.isArray(s.recommendedNodes)
          ? (s.recommendedNodes as unknown[]).map((n) => String(n))
          : [],
        insertionPoint: String(s.insertionPoint ?? ""),
        why: String(s.why ?? ""),
      });
    });
    asObjectArray(recRoot.geoAiOptimizations).forEach((g) => {
      geoAiOptimizations.push({
        category: String(g.category ?? "general"),
        priority: String(g.priority ?? "p2"),
        action: String(g.action ?? ""),
        whyItImprovesAiDiscovery: String(g.whyItImprovesAiDiscovery ?? ""),
      });
    });
  });

  const dimensions = Array.from(dimensionsMap.entries()).map(([id, value]) => ({
    id,
    score: value.count === 0 ? 0 : Math.round(value.total / value.count),
    status: value.status,
  }));

  return {
    frameworkVersion,
    score: rows.length === 0 ? 0 : Math.round(totalScore / rows.length),
    confidence: rows.length === 0 ? 0 : Number((totalConfidence / rows.length).toFixed(3)),
    dimensions,
    issues: issueList.slice(0, 24),
    engineEvidence: engineEvidence.slice(0, 24),
    schemaSuggestions: schemaSuggestions.slice(0, 24),
    geoAiOptimizations: geoAiOptimizations.slice(0, 24),
    auditedPages: rows.length,
  };
}
