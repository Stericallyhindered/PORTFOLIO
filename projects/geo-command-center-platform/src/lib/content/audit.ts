import type { CrawledPage } from "@/lib/crawl/crawler";
import { extractCitationsFromText } from "@/lib/geo/parser";

export type AuditIssue = {
  code: string;
  severity: "low" | "medium" | "high";
  dimension:
    | "answerFirstContent"
    | "citationAuthority"
    | "technicalOptimization"
    | "aiComprehension"
    | "contentFreshness"
    | "competitiveContext";
  message: string;
  whyThisMatters: string;
  location: string;
  current: string;
  improved: string;
  implementationEffort: "low" | "medium" | "high";
  citationLikelihood: number;
};

export type AuditRecommendation = {
  code: string;
  priority: "p1" | "p2" | "p3";
  dimension:
    | "answerFirstContent"
    | "citationAuthority"
    | "technicalOptimization"
    | "aiComprehension"
    | "contentFreshness"
    | "competitiveContext";
  action: string;
};

export type AuditSubDimension = {
  name: string;
  score: number;
  status: "poor" | "good" | "excellent";
};

export type AuditDimension = {
  id:
    | "answerFirstContent"
    | "citationAuthority"
    | "technicalOptimization"
    | "aiComprehension"
    | "contentFreshness"
    | "competitiveContext";
  score: number;
  weight: number;
  status: "poor" | "good" | "excellent";
  summary: string;
  subDimensions: AuditSubDimension[];
};

export type AuditEngineEvidence = {
  engine: "perplexity" | "anthropic" | "technical";
  score: number;
  confidence: number;
  summary: string;
  citations: Array<{ url: string; domain: string }>;
  rawSnippet: string;
};

export type SchemaSuggestion = {
  targetUrl: string;
  recommendedNodes: string[];
  insertionPoint: string;
  why: string;
  jsonLdPatch: Record<string, unknown>;
};

export type GeoAiOptimization = {
  category:
    | "answerBlocks"
    | "citationReadiness"
    | "entityDisambiguation"
    | "retrievalChunking"
    | "chatPromptAlignment";
  priority: "p1" | "p2" | "p3";
  action: string;
  whyItImprovesAiDiscovery: string;
};

type LlmRubricOutput = {
  confidence: number;
  dimensions: Array<{
    id:
      | "answerFirstContent"
      | "citationAuthority"
      | "technicalOptimization"
      | "aiComprehension"
      | "contentFreshness"
      | "competitiveContext";
    score: number;
  }>;
};

export type AuditResult = {
  score: number;
  confidence: number;
  frameworkVersion: string;
  dimensions: AuditDimension[];
  engineEvidence: AuditEngineEvidence[];
  schemaSuggestions: SchemaSuggestion[];
  geoAiOptimizations: GeoAiOptimization[];
  issues: AuditIssue[];
  recommendations: AuditRecommendation[];
};

const FRAMEWORK_VERSION = "enterprise-llm-v1";

function normalizeScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toStatus(score: number): "poor" | "good" | "excellent" {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  return "poor";
}

async function runPerplexityEvidence(page: CrawledPage): Promise<AuditEngineEvidence> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return {
      engine: "perplexity",
      score: 58,
      confidence: 0.45,
      summary: "Perplexity key unavailable; using low-confidence fallback baseline.",
      citations: [],
      rawSnippet: "No live Perplexity run executed.",
    };
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "You are a GEO audit engine. Give a concise evaluation with source URLs and focus on citation readiness.",
          },
          {
            role: "user",
            content: [
              `Audit URL: ${page.url}`,
              `Title: ${page.title}`,
              `Meta: ${page.metaDescription ?? "missing"}`,
              `Word count: ${page.wordCount}`,
              "Return a short assessment and include URLs.",
            ].join("\n"),
          },
        ],
      }),
    });
    if (!response.ok) {
      return {
        engine: "perplexity",
        score: 55,
        confidence: 0.4,
        summary: "Perplexity request failed; fallback evidence used.",
        citations: [],
        rawSnippet: `HTTP ${response.status}`,
      };
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    const refs = extractCitationsFromText(content).slice(0, 8);
    const score = normalizeScore(58 + refs.length * 4);
    return {
      engine: "perplexity",
      score,
      confidence: refs.length > 0 ? 0.8 : 0.6,
      summary:
        refs.length > 0
          ? `Captured ${refs.length} external references from live engine output.`
          : "Live output had limited explicit references.",
      citations: refs.map((r) => ({ url: r.citedUrl, domain: r.citedDomain })),
      rawSnippet: content.slice(0, 900),
    };
  } catch (error) {
    return {
      engine: "perplexity",
      score: 52,
      confidence: 0.35,
      summary: "Perplexity network execution failed; fallback evidence used.",
      citations: [],
      rawSnippet: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runAnthropicEvidence(
  page: CrawledPage,
  trackedEntities: string[],
): Promise<AuditEngineEvidence> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      engine: "anthropic",
      score: 60,
      confidence: 0.45,
      summary: "Anthropic key unavailable; using deterministic fallback baseline.",
      citations: [],
      rawSnippet: "No live Anthropic run executed.",
    };
  }
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              "Evaluate this page's GEO quality for AI citation readiness.",
              `URL: ${page.url}`,
              `Title: ${page.title}`,
              `Meta Description: ${page.metaDescription ?? "missing"}`,
              `Headings: ${page.headings.slice(0, 12).join(" | ")}`,
              `Entities: ${trackedEntities.join(", ") || "none provided"}`,
              `Content excerpt: ${page.bodyText.slice(0, 2500)}`,
              "Return 0-100 quality score with brief rationale and include any reference URLs if used.",
            ].join("\n"),
          },
        ],
      }),
    });
    if (!response.ok) {
      return {
        engine: "anthropic",
        score: 57,
        confidence: 0.35,
        summary: "Anthropic request failed; fallback evidence used.",
        citations: [],
        rawSnippet: `HTTP ${response.status}`,
      };
    }
    const payload = (await response.json()) as {
      content?: Array<{ text?: string }>;
    };
    const text = payload.content?.[0]?.text ?? "";
    const refs = extractCitationsFromText(text).slice(0, 6);
    const numericMatch = text.match(/\b([1-9]?\d|100)\/100\b|\bscore[: ]+([1-9]?\d|100)\b/i);
    const parsedScore = Number(numericMatch?.[1] ?? numericMatch?.[2] ?? 66);
    return {
      engine: "anthropic",
      score: normalizeScore(parsedScore),
      confidence: refs.length > 0 ? 0.82 : 0.72,
      summary: "LLM judgment completed using live Anthropic evaluation.",
      citations: refs.map((r) => ({ url: r.citedUrl, domain: r.citedDomain })),
      rawSnippet: text.slice(0, 900),
    };
  } catch (error) {
    return {
      engine: "anthropic",
      score: 56,
      confidence: 0.3,
      summary: "Anthropic network execution failed; fallback evidence used.",
      citations: [],
      rawSnippet: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function buildDimensions(
  page: CrawledPage,
  issues: AuditIssue[],
  ensembleScore: number,
  llmOverride?: LlmRubricOutput | null,
): AuditDimension[] {
  const issueCountFor = (id: AuditDimension["id"]) =>
    issues.filter((i) => i.dimension === id).length;
  const hasFaqSignals = page.hasFaqSchema || page.faqQuestionCount > 0;
  const entityMentionDensity = page.entityMentions.length;
  const base = {
    answerFirstContent:
      72 +
      (hasFaqSignals ? 6 : -8) +
      (page.wordCount > 500 ? 5 : -8) -
      issueCountFor("answerFirstContent") * 8,
    citationAuthority:
      68 + (entityMentionDensity > 2 ? 6 : -6) - issueCountFor("citationAuthority") * 9,
    technicalOptimization:
      74 +
      (page.h1Count === 1 ? 6 : -8) +
      (page.metaDescription && page.metaDescription.length >= 120 ? 6 : -6) -
      issueCountFor("technicalOptimization") * 8,
    aiComprehension:
      71 + (page.headingOutline.length > 3 ? 5 : -5) - issueCountFor("aiComprehension") * 7,
    contentFreshness:
      76 +
      (page.lastModified ? 6 : -7) +
      (page.yearMentions.some((y) => y >= new Date().getFullYear() - 1) ? 6 : -6) -
      issueCountFor("contentFreshness") * 8,
    competitiveContext:
      67 +
      (page.hasComparisonLanguage ? 8 : -8) +
      (page.ctaPhrases.length >= 2 ? 5 : -5) -
      issueCountFor("competitiveContext") * 8,
  };

  const dimensions: AuditDimension[] = [
    {
      id: "answerFirstContent",
      weight: 0.2,
      score: normalizeScore(base.answerFirstContent),
      status: toStatus(base.answerFirstContent),
      summary: "Assesses directness, extractability, and answer-first formatting.",
      subDimensions: [
        { name: "Content Completeness", score: normalizeScore(base.answerFirstContent - 3), status: toStatus(base.answerFirstContent - 3) },
        { name: "Query Intent Matching", score: normalizeScore(base.answerFirstContent + 5), status: toStatus(base.answerFirstContent + 5) },
        { name: "Structured Information", score: normalizeScore(base.answerFirstContent - 2), status: toStatus(base.answerFirstContent - 2) },
      ],
    },
    {
      id: "citationAuthority",
      weight: 0.18,
      score: normalizeScore(base.citationAuthority),
      status: toStatus(base.citationAuthority),
      summary: "Measures trust, source credibility, and citation formatting readiness.",
      subDimensions: [
        { name: "Brand Authority Markers", score: normalizeScore(base.citationAuthority + 7), status: toStatus(base.citationAuthority + 7) },
        { name: "Source Credibility Signals", score: normalizeScore(base.citationAuthority - 8), status: toStatus(base.citationAuthority - 8) },
        { name: "Citation Format Optimization", score: normalizeScore(base.citationAuthority - 10), status: toStatus(base.citationAuthority - 10) },
      ],
    },
    {
      id: "technicalOptimization",
      weight: 0.2,
      score: normalizeScore(base.technicalOptimization),
      status: toStatus(base.technicalOptimization),
      summary: "Evaluates crawlability, markup quality, and performance support for AI retrieval.",
      subDimensions: [
        { name: "Page Performance", score: normalizeScore(base.technicalOptimization - 12), status: toStatus(base.technicalOptimization - 12) },
        { name: "Rich Snippets Markup", score: normalizeScore(base.technicalOptimization + 10), status: toStatus(base.technicalOptimization + 10) },
        { name: "Crawlability Indexation", score: normalizeScore(base.technicalOptimization + 2), status: toStatus(base.technicalOptimization + 2) },
      ],
    },
    {
      id: "aiComprehension",
      weight: 0.16,
      score: normalizeScore(base.aiComprehension),
      status: toStatus(base.aiComprehension),
      summary: "Checks semantic hierarchy, machine readability, and scannability.",
      subDimensions: [
        { name: "Semantic Structure", score: normalizeScore(base.aiComprehension - 2), status: toStatus(base.aiComprehension - 2) },
        { name: "Machine Readability", score: normalizeScore(base.aiComprehension + 1), status: toStatus(base.aiComprehension + 1) },
        { name: "Content Scannability", score: normalizeScore(base.aiComprehension + 4), status: toStatus(base.aiComprehension + 4) },
      ],
    },
    {
      id: "contentFreshness",
      weight: 0.12,
      score: normalizeScore(base.contentFreshness),
      status: toStatus(base.contentFreshness),
      summary: "Captures recency signals, temporal clarity, and update cadence.",
      subDimensions: [
        { name: "Data Currency", score: normalizeScore(base.contentFreshness - 4), status: toStatus(base.contentFreshness - 4) },
        { name: "Industry Currency", score: normalizeScore(base.contentFreshness), status: toStatus(base.contentFreshness) },
        { name: "Information Recency", score: normalizeScore(base.contentFreshness + 5), status: toStatus(base.contentFreshness + 5) },
      ],
    },
    {
      id: "competitiveContext",
      weight: 0.14,
      score: normalizeScore(Math.round((base.competitiveContext + ensembleScore) / 2)),
      status: toStatus(base.competitiveContext),
      summary: "Assesses differentiation, value clarity, and market positioning signals.",
      subDimensions: [
        { name: "Value Clarity", score: normalizeScore(base.competitiveContext + 4), status: toStatus(base.competitiveContext + 4) },
        { name: "Content Completeness", score: normalizeScore(base.competitiveContext + 2), status: toStatus(base.competitiveContext + 2) },
        { name: "Competitive Positioning", score: normalizeScore(base.competitiveContext - 6), status: toStatus(base.competitiveContext - 6) },
      ],
    },
  ];
  if (llmOverride && Array.isArray(llmOverride.dimensions)) {
    const overrideMap = new Map(llmOverride.dimensions.map((d) => [d.id, normalizeScore(d.score)]));
    dimensions.forEach((d) => {
      const override = overrideMap.get(d.id);
      if (typeof override === "number") {
        d.score = normalizeScore(Math.round(d.score * 0.6 + override * 0.4));
        d.status = toStatus(d.score);
      }
    });
  }
  return dimensions;
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function validateRubricPayload(value: unknown): LlmRubricOutput | null {
  if (!value || typeof value !== "object") return null;
  const root = value as Record<string, unknown>;
  if (!Array.isArray(root.dimensions)) return null;
  const validIds = new Set([
    "answerFirstContent",
    "citationAuthority",
    "technicalOptimization",
    "aiComprehension",
    "contentFreshness",
    "competitiveContext",
  ]);
  const dimensions = root.dimensions
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map((x) => ({
      id: String(x.id) as LlmRubricOutput["dimensions"][number]["id"],
      score: Number(x.score ?? 0),
    }))
    .filter((d) => validIds.has(d.id) && Number.isFinite(d.score));
  if (dimensions.length < 4) return null;
  return {
    confidence: Number(root.confidence ?? 0.7),
    dimensions,
  };
}

async function runRubricWithRetries(
  page: CrawledPage,
  trackedEntities: string[],
): Promise<LlmRubricOutput | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 650,
          messages: [
            {
              role: "user",
              content: [
                "Return ONLY valid JSON.",
                "Build GEO rubric scoring for this page with dimensions and confidence.",
                `URL: ${page.url}`,
                `Title: ${page.title}`,
                `Meta: ${page.metaDescription ?? "missing"}`,
                `Word count: ${page.wordCount}`,
                `Entities: ${trackedEntities.join(", ") || "none"}`,
                `Content excerpt: ${page.bodyText.slice(0, 2200)}`,
                'Schema: {"confidence":0-1,"dimensions":[{"id":"answerFirstContent","score":0-100},{"id":"citationAuthority","score":0-100},{"id":"technicalOptimization","score":0-100},{"id":"aiComprehension","score":0-100},{"id":"contentFreshness","score":0-100},{"id":"competitiveContext","score":0-100}]}',
                attempt === 2 ? "Strictly output JSON and no prose." : "",
              ]
                .filter(Boolean)
                .join("\n"),
            },
          ],
        }),
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as { content?: Array<{ text?: string }> };
      const raw = payload.content?.[0]?.text ?? "";
      const json = extractJsonObject(raw);
      if (!json) continue;
      const parsed = JSON.parse(json) as unknown;
      const valid = validateRubricPayload(parsed);
      if (valid) return valid;
    } catch {
      // retry with stricter prompt
    }
  }
  return null;
}

function buildIssue(
  input: Omit<AuditIssue, "severity" | "citationLikelihood"> & {
    severity: AuditIssue["severity"];
    citationLikelihood: number;
  },
): AuditIssue {
  return {
    ...input,
    citationLikelihood: Math.max(0, Math.min(100, Math.round(input.citationLikelihood))),
  };
}

export async function runPageAudit(page: CrawledPage, trackedEntities: string[]): Promise<AuditResult> {
  const issues: AuditIssue[] = [];
  const recommendations: AuditRecommendation[] = [];

  if (!page.title || page.title.length < 30) {
    issues.push(
      buildIssue({
        code: "TITLE_WEAK",
        dimension: "answerFirstContent",
        severity: "high",
        message: "Title is missing or too short for strong GEO relevance.",
        whyThisMatters:
          "AI systems prioritize concise high-intent title entities for snippet extraction.",
        location: "Title tag",
        current: page.title || "No title found",
        improved:
          "Use a 35-65 character title with intent phrase + service/entity and direct value statement.",
        implementationEffort: "low",
        citationLikelihood: 45,
      }),
    );
    recommendations.push({
      code: "TITLE_ENHANCE",
      dimension: "answerFirstContent",
      priority: "p1",
      action: "Expand title to include intent terms and target brand/entity context.",
    });
  }
  if (page.title.length > 70) {
    issues.push(
      buildIssue({
        code: "TITLE_TOO_LONG",
        dimension: "answerFirstContent",
        severity: "medium",
        message: "Title is too long and may dilute retrieval relevance.",
        whyThisMatters:
          "Overlong titles reduce clarity and weaken direct-answer extraction signals.",
        location: "Title tag",
        current: page.title,
        improved: "Compress title to one intent phrase, one entity, one differentiation clause.",
        implementationEffort: "low",
        citationLikelihood: 40,
      }),
    );
    recommendations.push({
      code: "TITLE_TRIM",
      dimension: "answerFirstContent",
      priority: "p2",
      action: "Keep title between 35-65 chars with clear intent/entity terms.",
    });
  }

  if (page.headings.length === 0) {
    issues.push(
      buildIssue({
        code: "NO_HEADINGS",
        dimension: "aiComprehension",
        severity: "high",
        message: "No headings found; weak topical structure for AI extraction.",
        whyThisMatters:
          "Heading hierarchy helps LLMs segment content and extract citation-safe sections.",
        location: "Document heading structure",
        current: "No heading hierarchy detected.",
        improved: "Add one H1 and intent-specific H2/H3 sections with explicit section purpose.",
        implementationEffort: "medium",
        citationLikelihood: 60,
      }),
    );
    recommendations.push({
      code: "ADD_HEADINGS",
      dimension: "aiComprehension",
      priority: "p1",
      action: "Add clear H1/H2 hierarchy for answer-retrieval snippets.",
    });
  }
  if (page.h1Count === 0) {
    issues.push(
      buildIssue({
        code: "NO_H1",
        dimension: "aiComprehension",
        severity: "high",
        message: "No H1 detected; primary topic is ambiguous for AI parsers.",
        whyThisMatters:
          "Without a canonical H1, AI retrieval systems cannot infer the dominant page intent reliably.",
        location: "Primary heading",
        current: "No H1 found",
        improved: "Add one intent-rich H1 mirroring primary user query and service entity.",
        implementationEffort: "low",
        citationLikelihood: 70,
      }),
    );
    recommendations.push({
      code: "ADD_H1",
      dimension: "aiComprehension",
      priority: "p1",
      action: "Add one clear H1 with the main query intent and entity.",
    });
  }
  if (page.h1Count > 1) {
    issues.push(
      buildIssue({
        code: "MULTIPLE_H1",
        dimension: "aiComprehension",
        severity: "medium",
        message: "Multiple H1 tags can blur page topical focus.",
        whyThisMatters:
          "Competing H1 nodes fragment semantic hierarchy and reduce answer extraction precision.",
        location: "Heading structure",
        current: `Detected ${page.h1Count} H1 tags`,
        improved: "Keep one H1; demote secondary headline blocks to H2/H3.",
        implementationEffort: "low",
        citationLikelihood: 75,
      }),
    );
    recommendations.push({
      code: "H1_CONSOLIDATE",
      dimension: "aiComprehension",
      priority: "p2",
      action: "Use a single canonical H1 and move others to H2/H3.",
    });
  }

  if (!page.metaDescription || page.metaDescription.length < 80) {
    issues.push(
      buildIssue({
        code: "META_DESCRIPTION_WEAK",
        dimension: "technicalOptimization",
        severity: "medium",
        message: "Meta description is missing or too short.",
        whyThisMatters:
          "Short descriptions weaken snippet quality and reduce machine understanding of context.",
        location: "Meta description",
        current: page.metaDescription ?? "Missing",
        improved: "Write a 120-160 character answer-first summary with location/service intent.",
        implementationEffort: "low",
        citationLikelihood: 50,
      }),
    );
    recommendations.push({
      code: "META_DESCRIPTION_ENHANCE",
      dimension: "technicalOptimization",
      priority: "p2",
      action: "Write a 120-160 char summary including entity + intent terms.",
    });
  }

  if (page.wordCount < 300) {
    issues.push(
      buildIssue({
        code: "THIN_CONTENT",
        dimension: "answerFirstContent",
        severity: "high",
        message: "Body content is thin for strong GEO extraction.",
        whyThisMatters:
          "Shallow content lacks enough factual surface area for high-confidence AI citations.",
        location: "Main body content",
        current: `Word count: ${page.wordCount}`,
        improved:
          "Expand with explicit answer blocks, proof statements, and intent-specific FAQs.",
        implementationEffort: "medium",
        citationLikelihood: 65,
      }),
    );
    recommendations.push({
      code: "CONTENT_EXPAND",
      dimension: "answerFirstContent",
      priority: "p1",
      action: "Expand page depth with concrete facts, examples, and FAQs.",
    });
  }

  if (!page.canonicalUrl) {
    issues.push(
      buildIssue({
        code: "NO_CANONICAL",
        dimension: "technicalOptimization",
        severity: "medium",
        message: "No canonical URL detected.",
        whyThisMatters:
          "Canonicalization prevents duplicate ambiguity and keeps authority concentrated.",
        location: "Head canonical tag",
        current: "Canonical tag missing",
        improved: "Add canonical URL matching preferred indexable page version.",
        implementationEffort: "low",
        citationLikelihood: 42,
      }),
    );
    recommendations.push({
      code: "ADD_CANONICAL",
      dimension: "technicalOptimization",
      priority: "p2",
      action: "Add canonical URL tag to prevent duplicate content ambiguity.",
    });
  }

  if (page.internalLinks.length < 4) {
    issues.push(
      buildIssue({
        code: "WEAK_INTERNAL_LINKING",
        dimension: "competitiveContext",
        severity: "medium",
        message: "Low internal link count; page authority flow is limited.",
        whyThisMatters:
          "Weak internal link pathways reduce context propagation and entity reinforcement.",
        location: "Body anchor links",
        current: `Internal links: ${page.internalLinks.length}`,
        improved: "Add contextual links to service, FAQ, comparison, and authority pages.",
        implementationEffort: "medium",
        citationLikelihood: 58,
      }),
    );
    recommendations.push({
      code: "INTERNAL_LINKS",
      dimension: "competitiveContext",
      priority: "p2",
      action: "Add contextual internal links to related pages and entity hubs.",
    });
  }
  if (!page.hasJsonLd) {
    issues.push(
      buildIssue({
        code: "MISSING_SCHEMA",
        dimension: "citationAuthority",
        severity: "high",
        message: "No JSON-LD structured data found.",
        whyThisMatters:
          "Schema nodes help AI engines map entities, services, and FAQs with confidence.",
        location: "JSON-LD scripts",
        current: "No structured data scripts found",
        improved: "Add Organization + Service + FAQPage/Article schema aligned to visible content.",
        implementationEffort: "medium",
        citationLikelihood: 72,
      }),
    );
    recommendations.push({
      code: "ADD_SCHEMA",
      dimension: "citationAuthority",
      priority: "p1",
      action: "Add Organization/Service/FAQPage JSON-LD where relevant.",
    });
  }

  const lowerText = `${page.title} ${page.headings.join(" ")} ${page.bodyText}`.toLowerCase();
  const coveredEntities = trackedEntities.filter((entity) =>
    lowerText.includes(entity.toLowerCase()),
  );

  if (trackedEntities.length > 0 && coveredEntities.length === 0) {
    issues.push(
      buildIssue({
        code: "NO_ENTITY_COVERAGE",
        dimension: "citationAuthority",
        severity: "high",
        message: "No tracked entities detected on page.",
        whyThisMatters:
          "Without explicit entities, LLMs have weak attribution cues and reduced citation reliability.",
        location: "Title/headings/body entity signals",
        current: "Tracked entities absent",
        improved: "Inject high-priority entities in H1/H2 intro and support with evidence blocks.",
        implementationEffort: "medium",
        citationLikelihood: 68,
      }),
    );
    recommendations.push({
      code: "ENTITY_INSERTION",
      dimension: "citationAuthority",
      priority: "p1",
      action: "Add high-priority brand entities to title, headings, and body.",
    });
  }

  if (page.hasFaqSchema === false && page.faqQuestionCount === 0) {
    issues.push(
      buildIssue({
        code: "FAQ_SIGNAL_WEAK",
        dimension: "answerFirstContent",
        severity: "medium",
        message: "No FAQ-style direct Q/A signals detected.",
        whyThisMatters:
          "Explicit Q/A blocks increase direct answer extraction and citation likelihood.",
        location: "FAQ section / schema",
        current: "No FAQ Q/A blocks found",
        improved:
          "Add 4-8 explicit user-intent questions with concise direct answers and FAQ schema.",
        implementationEffort: "medium",
        citationLikelihood: 61,
      }),
    );
    recommendations.push({
      code: "ADD_FAQ_SIGNAL",
      dimension: "answerFirstContent",
      priority: "p2",
      action: "Add visible FAQ blocks and FAQPage schema for primary user intents.",
    });
  }

  if (!page.lastModified && !page.publishDate) {
    issues.push(
      buildIssue({
        code: "FRESHNESS_AMBIGUOUS",
        dimension: "contentFreshness",
        severity: "medium",
        message: "No explicit publish/modified date signals found.",
        whyThisMatters:
          "Recency markers improve trust for time-sensitive queries and citation preference.",
        location: "Metadata / visible timestamp",
        current: "No publish/modified date detected",
        improved: "Expose Last Updated date in page UI and metadata.",
        implementationEffort: "low",
        citationLikelihood: 52,
      }),
    );
    recommendations.push({
      code: "ADD_FRESHNESS_SIGNALS",
      dimension: "contentFreshness",
      priority: "p2",
      action: "Expose current-year update dates in metadata and visible page header/footer.",
    });
  }

  const [perplexityEvidence, anthropicEvidence] = await Promise.all([
    runPerplexityEvidence(page),
    runAnthropicEvidence(page, trackedEntities),
  ]);
  const llmRubric = await runRubricWithRetries(page, trackedEntities);
  const technicalScore = normalizeScore(100 - issues.length * 6);
  const technicalEvidence: AuditEngineEvidence = {
    engine: "technical",
    score: technicalScore,
    confidence: 0.88,
    summary: "Deterministic technical and structural scoring based on crawl evidence.",
    citations: [],
    rawSnippet: `wordCount=${page.wordCount};h1Count=${page.h1Count};jsonLd=${page.hasJsonLd};faq=${page.faqQuestionCount}`,
  };
  const weightedEngineScore = normalizeScore(
    perplexityEvidence.score * 0.3 + anthropicEvidence.score * 0.45 + technicalScore * 0.25,
  );
  const dimensions = buildDimensions(page, issues, weightedEngineScore, llmRubric);
  const score = normalizeScore(
    dimensions.reduce((acc, d) => acc + d.score * d.weight, 0),
  );
  const confidence = Number(
    (
      (perplexityEvidence.confidence + anthropicEvidence.confidence + technicalEvidence.confidence) /
      3
    ).toFixed(3),
  );
  const calibratedConfidence =
    llmRubric == null
      ? confidence
      : Number(Math.min(0.98, (confidence + llmRubric.confidence) / 2).toFixed(3));

  const schemaSuggestions: SchemaSuggestion[] = [
    {
      targetUrl: page.url,
      recommendedNodes: [
        "Organization",
        page.faqQuestionCount > 0 || page.hasFaqSchema ? "FAQPage" : "WebPage",
        /service|guide|book|trip|install|pricing/i.test(page.url) ? "Service" : "Article",
      ],
      insertionPoint: "<head> JSON-LD script block",
      why:
        "Explicit entity and intent schema improves LLM grounding, citation confidence, and chat retrieval relevance.",
      jsonLdPatch: {
        "@context": "https://schema.org",
        "@type": /service|guide|book|trip|install|pricing/i.test(page.url) ? "Service" : "WebPage",
        url: page.canonicalUrl ?? page.url,
        name: page.title || "Page Title",
        description:
          page.metaDescription ??
          "Entity-aligned page description designed for AI answer extraction and citation.",
      },
    },
  ];

  if (!page.hasFaqSchema) {
    schemaSuggestions.push({
      targetUrl: page.url,
      recommendedNodes: ["FAQPage"],
      insertionPoint: "<head> JSON-LD script block",
      why:
        "FAQPage nodes expose direct Q/A pairs that chat engines can cite with higher precision.",
      jsonLdPatch: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What does this page help with?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "This page gives direct, structured answers for high-intent user questions.",
            },
          },
        ],
      },
    });
  }

  const geoAiOptimizations: GeoAiOptimization[] = [
    {
      category: "answerBlocks",
      priority: "p1",
      action: "Add 3-5 answer-first blocks under primary H2s with concise factual lead sentences.",
      whyItImprovesAiDiscovery:
        "Chat systems prefer extractable answer spans over long promotional paragraphs.",
    },
    {
      category: "citationReadiness",
      priority: "p1",
      action: "Attach explicit proof references near claims and include source-linked evidence bullets.",
      whyItImprovesAiDiscovery:
        "Grounded claims increase trust and citation likelihood across AI engines.",
    },
    {
      category: "entityDisambiguation",
      priority: "p1",
      action:
        "Repeat exact brand/service entities in title, H1, intro paragraph, and schema names with consistent canonical spelling.",
      whyItImprovesAiDiscovery:
        "Entity consistency reduces ambiguity and improves AI retrieval precision.",
    },
    {
      category: "retrievalChunking",
      priority: "p2",
      action:
        "Restructure long sections into 60-120 word semantic chunks with descriptive headings and explicit transitions.",
      whyItImprovesAiDiscovery:
        "Smaller coherent chunks map better to vector retrieval and answer synthesis.",
    },
    {
      category: "chatPromptAlignment",
      priority: "p2",
      action:
        "Add a short 'If you ask AI about this topic' section listing canonical Q/A variants users ask in chat.",
      whyItImprovesAiDiscovery:
        "Aligning on real conversational intents improves model match and response inclusion.",
    },
  ];

  return {
    score,
    confidence: calibratedConfidence,
    frameworkVersion: FRAMEWORK_VERSION,
    dimensions,
    engineEvidence: [perplexityEvidence, anthropicEvidence, technicalEvidence],
    schemaSuggestions,
    geoAiOptimizations,
    issues,
    recommendations,
  };
}

