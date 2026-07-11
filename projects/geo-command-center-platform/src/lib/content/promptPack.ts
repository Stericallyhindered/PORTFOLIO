import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { deliverables } from "@/db/schema";

type PageIntent =
  | "home"
  | "service"
  | "blog"
  | "faq"
  | "product"
  | "legal"
  | "account"
  | "utility"
  | "general";

type GeoPackageContent = {
  website?: string;
  topActions?: Array<{ action?: string }>;
  perPagePriorities?: Array<{
    url?: string;
    canonicalUrl?: string;
    intent?: string;
    optimizeEligible?: boolean;
    score?: number | null;
    topIssues?: string[];
    topActions?: string[];
  }>;
  schemaBundle?: Record<string, unknown>;
};

type BuildOptions = {
  geoPackageId: string;
  orgId: string;
  tone?: string;
  audience?: string;
  optimizeLegalPages?: boolean;
  includeHtmlBlocks?: boolean;
};

type VoiceProfile = {
  brandName: string;
  serviceType: string;
  marketPosition: string;
  stylePillars: string[];
};

function asGeoPackageContent(value: unknown): GeoPackageContent {
  if (!value || typeof value !== "object") return {};
  return value as GeoPackageContent;
}

function normalizeHost(urlString: string) {
  return new URL(urlString).hostname.replace(/^www\./, "").toLowerCase();
}

function canonicalizePageUrl(url: string) {
  const parsed = new URL(url);
  parsed.hash = "";
  // keep meaningful query params only; remove noisy tracking params
  const keepParams = new URLSearchParams();
  parsed.searchParams.forEach((value, key) => {
    const k = key.toLowerCase();
    if (
      !k.startsWith("utm_") &&
      k !== "gclid" &&
      k !== "fbclid" &&
      k !== "ref" &&
      k !== "source"
    ) {
      keepParams.append(key, value);
    }
  });
  parsed.search = keepParams.toString() ? `?${keepParams.toString()}` : "";
  parsed.pathname =
    parsed.pathname !== "/" ? parsed.pathname.replace(/\/+$/, "") : parsed.pathname;
  return parsed.toString();
}

function classifyPageIntent(url: string): PageIntent {
  try {
    const u = new URL(url);
    const p = u.pathname.toLowerCase();
    if (p === "/" || p === "/home") return "home";
    if (
      /\/(product|products|pricing|plans|demo|book|booking|reserve|quote|checkout|trips?)\b/.test(
        p,
      )
    ) {
      return "product";
    }
    if (/(trip|booking|reserve|book-now|book)/.test(p)) {
      return "product";
    }
    if (
      /\/(services?|solutions?|what-we-do|guides?|guided|contact|about)\b/.test(
        p,
      )
    ) {
      return "service";
    }
    if (
      /\/(summer-series|cactus-cup|team-trail|tournament|event|lake-|guided-fishing|trip-report)\b/.test(
        p,
      )
    ) {
      return "service";
    }
    if (/\/(blog|news|insights|articles|tips|techniques|videos)\b/.test(p)) return "blog";
    if (/\/\d{4}\/\d{2}\//.test(p)) return "blog";
    if (/\/(faq|faqs|help|support)\b/.test(p)) return "faq";
    if (/\/(terms|privacy|policy|legal|compliance|refund)\b/.test(p)) return "legal";
    if (/\/(account|login|logout|register|cart|checkout|my-account)\b/.test(p))
      return "account";
    if (/\/(wp-admin|xmlrpc|sitemap|feed|search)\b/.test(p)) return "utility";
    return "general";
  } catch {
    return "general";
  }
}

function topicFromUrl(url: string) {
  try {
    const u = new URL(url);
    const p = u.pathname === "/" ? "homepage" : u.pathname;
    return p
      .replace(/\//g, " ")
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  } catch {
    return "service page";
  }
}

function isDoNotOptimizeIntent(intent: PageIntent, optimizeLegalPages: boolean) {
  if (intent === "account" || intent === "utility") return true;
  if (intent === "legal" && !optimizeLegalPages) return true;
  return false;
}

function inferBrandName(website: string) {
  try {
    const host = normalizeHost(website);
    return host.split(".")[0]?.replace(/-/g, " ") ?? "brand";
  } catch {
    return "brand";
  }
}

function buildPageSeed(url: string) {
  let hash = 2166136261;
  for (let i = 0; i < url.length; i += 1) {
    hash ^= url.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function pickBySeed<T>(seed: number, options: T[]): T {
  return options[seed % options.length]!;
}

function asSchemaGraph(value: unknown): Array<Record<string, unknown>> {
  if (!value || typeof value !== "object") return [];
  const graph = (value as Record<string, unknown>)["@graph"];
  return Array.isArray(graph)
    ? graph.filter(
        (x): x is Record<string, unknown> =>
          typeof x === "object" && x !== null,
      )
    : [];
}

function extractVoiceProfile(
  website: string,
  schemaBundle: Record<string, unknown> | undefined,
): VoiceProfile {
  const fallbackBrand = inferBrandName(website);
  const graph = asSchemaGraph(schemaBundle);
  const orgNode = graph.find((n) => n["@type"] === "Organization");
  const serviceNode = graph.find((n) => n["@type"] === "Service");
  const brandName =
    (typeof orgNode?.name === "string" && orgNode.name.trim()) || fallbackBrand;
  const serviceType =
    (typeof serviceNode?.serviceType === "string" && serviceNode.serviceType.trim()) ||
    "Professional Services";

  return {
    brandName,
    serviceType,
    marketPosition: "high-trust, authority-led, conversion-focused",
    stylePillars: [
      "evidence-forward clarity",
      "entity-rich specificity",
      "commercial precision",
      "low-fluff expert tone",
    ],
  };
}

function intentSpecificTemplate(intent: PageIntent) {
  switch (intent) {
    case "home":
      return {
        ctaPrimary: "Book a Strategy Call",
        ctaSecondary: "Explore Results",
        ctaPrimaryHref: "#contact",
        ctaSecondaryHref: "#results",
        proofTitle: "Why Buyers and AI Engines Trust This Brand",
        faqPattern: [
          "What makes this brand credible in AI answers?",
          "Which proof assets should appear above the fold?",
          "What should we measure in the first 30 days?",
        ],
      };
    case "service":
      return {
        ctaPrimary: "Request Service Plan",
        ctaSecondary: "View Service Scope",
        ctaPrimaryHref: "#request-plan",
        ctaSecondaryHref: "#service-scope",
        proofTitle: "What Makes This Service Category-Leading",
        faqPattern: [
          "Who is this service best for?",
          "What implementation timeline should buyers expect?",
          "How is success measured for this service page?",
        ],
      };
    case "blog":
      return {
        ctaPrimary: "Subscribe for GEO Insights",
        ctaSecondary: "Read Related Playbooks",
        ctaPrimaryHref: "#subscribe",
        ctaSecondaryHref: "#related-insights",
        proofTitle: "Why This Insight Is Citation-Ready",
        faqPattern: [
          "Why does this article earn citations?",
          "How should this article link to service pages?",
          "What update cadence keeps this article competitive?",
        ],
      };
    case "faq":
      return {
        ctaPrimary: "Ask a Specific Question",
        ctaSecondary: "Review Implementation Guide",
        ctaPrimaryHref: "#ask-question",
        ctaSecondaryHref: "#implementation-guide",
        proofTitle: "Clear Answers Built for Retrieval",
        faqPattern: [
          "How concise should FAQ answers be for AI retrieval?",
          "Which answers need supporting proof links?",
          "How often should FAQ items be refreshed?",
        ],
      };
    case "product":
      return {
        ctaPrimary: "Start Product Evaluation",
        ctaSecondary: "Compare Product Options",
        ctaPrimaryHref: "#start-evaluation",
        ctaSecondaryHref: "#compare-options",
        proofTitle: "Product Signals AI and Buyers Can Verify",
        faqPattern: [
          "Which product claims require visible proof?",
          "How should offer and availability be represented?",
          "What objections should this page pre-handle?",
        ],
      };
    case "legal":
      return {
        ctaPrimary: "Review Policy Details",
        ctaSecondary: "Contact Compliance Team",
        ctaPrimaryHref: "#policy-details",
        ctaSecondaryHref: "#contact-compliance",
        proofTitle: "Policy Clarity and Trust Signals",
        faqPattern: [
          "Which legal details are most queried by users?",
          "How should policy updates be signaled on-page?",
          "What compliance statements need explicit sourcing?",
        ],
      };
    default:
      return {
        ctaPrimary: "Talk to an Expert",
        ctaSecondary: "See Execution Plan",
        ctaPrimaryHref: "#contact",
        ctaSecondaryHref: "#execution-plan",
        proofTitle: "Credibility Signals that Improve Retrieval",
        faqPattern: [
          "Which entities should this page emphasize most?",
          "What internal links should be prioritized here?",
          "How do we validate GEO impact after deployment?",
        ],
      };
  }
}

function buildSchemaPatchForIntent(input: {
  intent: PageIntent;
  website: string;
  canonicalUrl: string;
  brandName: string;
}) {
  const common = {
    insertionPoint: "<head> JSON-LD script block",
    validateWith: ["schema.org validator", "Google rich results test"],
    canonicalUrl: input.canonicalUrl,
  };

  if (input.intent === "home") {
    return {
      ...common,
      recommendedNodes: ["Organization", "WebSite", "LocalBusiness"],
      notes: [
        "Set Organization @id anchored to homepage.",
        "Include sameAs/social profiles and contact points where possible.",
      ],
    };
  }
  if (input.intent === "service") {
    return {
      ...common,
      recommendedNodes: ["Service", "Organization", "FAQPage"],
      notes: [
        "Align Service.name with page H1 and title.",
        "Ensure serviceArea/areaServed reflects real delivery footprint.",
      ],
    };
  }
  if (input.intent === "blog") {
    return {
      ...common,
      recommendedNodes: ["Article", "BreadcrumbList"],
      notes: [
        "Set datePublished/dateModified accurately.",
        "Map author entity consistently to brand expert profile.",
      ],
    };
  }
  if (input.intent === "faq") {
    return {
      ...common,
      recommendedNodes: ["FAQPage", "Organization"],
      notes: [
        "Only mark questions visible on-page.",
        "Keep answers concise and factual for LLM retrieval.",
      ],
    };
  }
  if (input.intent === "product") {
    return {
      ...common,
      recommendedNodes: ["Product", "Offer", "FAQPage"],
      notes: [
        "Ensure Offer fields match visible pricing/availability.",
        "Keep claims verifiable and consistent with page copy.",
      ],
    };
  }

  return {
    ...common,
    recommendedNodes: ["Organization", "WebPage"],
    notes: [
      "Use WebPage schema as baseline for non-core pages.",
      "Avoid over-marking unsupported node types.",
    ],
  };
}

function buildSinglePagePrompt(input: {
  website: string;
  brandName: string;
  pageUrl: string;
  canonicalUrl: string;
  intent: PageIntent;
  score: number | null | undefined;
  topIssues: string[];
  pageActions: string[];
  globalActions: string[];
  tone: string;
  audience: string;
}) {
  const issues = input.topIssues.length > 0 ? input.topIssues : ["No explicit issues captured."];
  const actions =
    input.pageActions.length > 0 ? input.pageActions : input.globalActions.slice(0, 5);

  return [
    "You are a senior GEO strategist and conversion copy lead.",
    `Target website: ${input.website}`,
    `Brand: ${input.brandName}`,
    `Target page: ${input.pageUrl}`,
    `Canonical page: ${input.canonicalUrl}`,
    `Page intent: ${input.intent}`,
    `Current GEO score: ${input.score ?? "unknown"}`,
    `Audience: ${input.audience}`,
    `Tone: ${input.tone}`,
    "",
    "Primary page issues to solve:",
    ...issues.map((issue, idx) => `${idx + 1}. ${issue}`),
    "",
    "Required GEO actions:",
    ...actions.map((action, idx) => `${idx + 1}. ${action}`),
    "",
    "Output requirements:",
    "1) Rewrite page headline and subheadline for entity clarity and retrieval intent.",
    "2) Provide full page copy sections (intro, proof, FAQs, CTA blocks).",
    "3) Provide structured data recommendations and exact JSON-LD updates.",
    "4) Provide internal link anchors and target URL suggestions.",
    "5) Provide final QA checklist for AI visibility and human conversion.",
    "6) Include objection-handling and proof statements tailored to this page intent.",
    "7) Keep this page lexically unique; do not reuse boilerplate wording from sibling pages.",
    "",
    "Constraints:",
    "- Preserve factual accuracy and avoid unverifiable claims.",
    "- Keep language direct, premium, and authority-building.",
    "- Optimize for both AI answers and high-conversion landing behavior.",
  ].join("\n");
}

function buildGeoContentDraft(input: {
  pageUrl: string;
  canonicalUrl: string;
  brandName: string;
  intent: PageIntent;
  audience: string;
  tone: string;
  topIssues: string[];
  actions: string[];
  schemaPatch: Record<string, unknown>;
  globalActions: string[];
  website: string;
  includeHtmlBlocks: boolean;
  voiceProfile: VoiceProfile;
}) {
  const topic = topicFromUrl(input.pageUrl);
  const intentTemplate = intentSpecificTemplate(input.intent);
  const seed = buildPageSeed(input.canonicalUrl);
  const openingAngles = [
    "authority-first positioning",
    "buyer-intent precision",
    "proof-led differentiation",
    "citation-friendly clarity",
  ];
  const evidenceStyles = [
    "benchmark deltas",
    "implementation milestones",
    "trust assets and credentials",
    "comparative positioning signals",
  ];
  const angle = pickBySeed(seed, openingAngles);
  const evidenceStyle = pickBySeed(seed + 7, evidenceStyles);
  const h1 =
    input.intent === "home"
      ? `${input.brandName} Authority Hub for High-Intent Search`
      : `${input.voiceProfile.serviceType}: ${topic} Optimized for AI Visibility`;

  const headlineVariants = [
    h1,
    `${input.brandName}: ${topic} Built on ${angle}`,
    `${topic} Strategy Built for Citations, Conversions, and ${evidenceStyle}`,
  ];

  const sectionBlueprint = [
    { section: "Hero", targetWords: 60 },
    { section: "Problem + Stakes", targetWords: 140 },
    { section: "Solution + Method", targetWords: 220 },
    { section: "Proof + Trust", targetWords: 160 },
    { section: "FAQ", targetWords: 200 },
    { section: "CTA", targetWords: 50 },
  ];

  const prioritizedActions =
    input.actions.length > 0 ? input.actions : input.globalActions.slice(0, 6);

  const faqItems = [
    {
      question: intentTemplate.faqPattern[0]!,
      answer:
        "It makes entity signals explicit, improves factual structure, and adds schema metadata so LLM-based engines can extract and cite key points more reliably.",
    },
    {
      question: intentTemplate.faqPattern[1]!,
      answer:
        prioritizedActions[0] ??
        "Start with heading/meta clarity and schema alignment, then refine internal linking and supporting proof blocks.",
    },
    {
      question: intentTemplate.faqPattern[2]!,
      answer:
        "Re-run the GEO pipeline and compare visibility score, citations, and mention trends against the previous baseline.",
    },
  ];

  const bodySections = [
    {
      title: "Why This Page Wins in AI Search",
      paragraphs: [
        `This ${input.intent} page is designed for ${input.audience}. It emphasizes ${angle}, clear entity context, and retrieval-safe structure so AI models can trust and reuse the content in answers.`,
        "The structure aligns search intent, topical depth, and conversion copy so the page performs for both retrieval and revenue.",
      ],
    },
    {
      title: "What Was Upgraded",
      bullets: prioritizedActions.length
        ? prioritizedActions.slice(0, 6)
        : [
            "Strengthened heading hierarchy",
            "Expanded intent-aligned copy",
            "Added schema and internal linking upgrades",
          ],
    },
    {
      title: "Conversion Block: Objection Handling",
      paragraphs: [
        `Common objection: “Will ${input.brandName} fit my exact use case?”`,
        `Response: We map recommendations to intent stage, page context, and measurable KPIs with ${evidenceStyle} so implementation is grounded and testable.`,
      ],
    },
    {
      title: "Conversion Block: Proof Framework",
      bullets: [
        "State baseline metric before optimization.",
        "Show implementation deltas by page component (heading/meta/schema/internal links).",
        "Track post-deploy citation and share-of-voice movement.",
      ],
    },
  ];

  const markdownDraft = [
    `# ${h1}`,
    "",
    "We combine entity clarity, structured data, and conversion-focused messaging so this page is easier for AI systems to extract and cite.",
    "",
    "## Why This Page Wins in AI Search",
    `This page is designed for ${input.audience}. It emphasizes ${angle}, strong proof framing, and clear entity context so AI models can trust and reuse the content in answers.`,
    "The structure aligns search intent, topical depth, and conversion copy so the page performs for both retrieval and revenue.",
    "",
    "## What Was Upgraded",
    ...(prioritizedActions.length > 0
      ? prioritizedActions.slice(0, 6).map((a) => `- ${a}`)
      : [
          "- Strengthened heading hierarchy",
          "- Expanded intent-aligned copy",
          "- Added schema and internal linking upgrades",
        ]),
    "",
    "## FAQ",
    ...faqItems.flatMap((item) => [`### ${item.question}`, item.answer, ""]),
    "## Call To Action",
    `${intentTemplate.ctaPrimary} and get a prioritized implementation roadmap for this page.`,
  ].join("\n");

  const faqHtml = [
    "<section aria-label=\"FAQ\">",
    "  <h2>Frequently Asked Questions</h2>",
    ...faqItems.map(
      (item) =>
        `  <article><h3>${item.question}</h3><p>${item.answer}</p></article>`,
    ),
    "</section>",
  ].join("\n");

  const heroHtml = [
    "<section class=\"geo-hero\">",
    `  <h1>${h1}</h1>`,
    "  <p>We combine entity clarity, structured data, and conversion-focused messaging so this page is easier for AI systems to extract and cite.</p>",
    "  <div class=\"geo-cta-group\">",
    `    <a href="${intentTemplate.ctaPrimaryHref}" class="btn btn-primary">${intentTemplate.ctaPrimary}</a>`,
    `    <a href="${intentTemplate.ctaSecondaryHref}" class="btn btn-secondary">${intentTemplate.ctaSecondary}</a>`,
    "  </div>",
    "</section>",
  ].join("\n");

  const proofHtml = [
    "<section aria-label=\"Proof\">",
    `  <h2>${intentTemplate.proofTitle}</h2>`,
    "  <ul>",
    "    <li>Clear entity and service framing in H1/H2 structure.</li>",
    "    <li>Specific proof statements and outcome-oriented messaging.</li>",
    "    <li>Structured data aligned with on-page content and intent.</li>",
    "  </ul>",
    "</section>",
  ].join("\n");

  return {
    pageUrl: input.pageUrl,
    canonicalUrl: input.canonicalUrl,
    intent: input.intent,
    brandName: input.brandName,
    headlineVariants,
    sectionBlueprint,
    hero: {
      h1,
      subheadline:
        "We combine entity clarity, structured data, and conversion-focused messaging so this page is easier for AI systems to extract and cite.",
      ctaPrimary: intentTemplate.ctaPrimary,
      ctaSecondary: intentTemplate.ctaSecondary,
    },
    bodySections,
    faqItems,
    schemaPatchNotes: [
      "Keep Organization + Service nodes aligned with the page promise and entity naming.",
      "Add FAQPage items only when FAQ content is visibly present on-page.",
      "Validate JSON-LD after deployment before next crawl run.",
    ],
    qaChecklist: [
      "Single H1 aligned to primary intent and entity.",
      "Meta description and intro paragraph match target query intent.",
      "FAQ answers concise, factual, and citation-safe.",
      "Internal links point to high-authority supporting pages.",
    ],
    issueContext: input.topIssues,
    prioritizedActions,
    style: {
      tone: input.tone,
      guidance: "Confident, specific, low-fluff, evidence-forward.",
    },
    schemaPatch: input.schemaPatch,
    contentDeliverables: {
      markdownDraft,
      ...(input.includeHtmlBlocks
        ? {
            cmsHtmlBlocks: {
              heroHtml,
              proofHtml,
              faqHtml,
            },
          }
        : {}),
    },
  };
}

export async function buildGeoPromptPack(options: BuildOptions) {
  const source = await db
    .select()
    .from(deliverables)
    .where(
      and(
        eq(deliverables.id, options.geoPackageId),
        eq(deliverables.orgId, options.orgId),
        eq(deliverables.type, "schema_update"),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!source) {
    throw new Error("GEO package not found");
  }

  const pkg = asGeoPackageContent(source.contentJson);
  const website = pkg.website ?? "unknown-website";
  const voiceProfile = extractVoiceProfile(website, pkg.schemaBundle);
  const brandName = voiceProfile.brandName;
  const globalActions = (pkg.topActions ?? [])
    .map((a) => (a?.action ?? "").trim())
    .filter(Boolean);
  const rawPages = (pkg.perPagePriorities ?? []).filter((p) => !!p.url);

  if (rawPages.length === 0) {
    throw new Error("No per-page priorities found in GEO package");
  }

  const tone = options.tone?.trim() || "expert, confident, commercially sharp";
  const audience = options.audience?.trim() || "buyers evaluating premium providers";
  const optimizeLegalPages = options.optimizeLegalPages ?? false;
  const includeHtmlBlocks = options.includeHtmlBlocks ?? true;

  const websiteHost = normalizeHost(website);
  const normalized = rawPages
    .map((page) => {
      const originalUrl = String(page.url);
      try {
        const parsedOriginal = new URL(originalUrl);
        const canonicalUrl =
          typeof page.canonicalUrl === "string" && page.canonicalUrl.length > 0
            ? canonicalizePageUrl(page.canonicalUrl)
            : canonicalizePageUrl(originalUrl);
        const host = normalizeHost(canonicalUrl);
        const sourceIntent =
          typeof page.intent === "string" ? (page.intent as PageIntent) : null;
        const classifiedIntent = classifyPageIntent(canonicalUrl);
        const intent =
          sourceIntent && sourceIntent !== "general"
            ? sourceIntent
            : classifiedIntent;
        const optimizeEligible =
          typeof page.optimizeEligible === "boolean" ? page.optimizeEligible : true;
        const excluded =
          host !== websiteHost
            ? `Host mismatch (${host} vs ${websiteHost})`
            : parsedOriginal.hash.length > 0
              ? "Source URL contains hash fragment; excluded to avoid duplicate/source-noise pages"
            : /\/(privacy|terms|cookies|cookie-policy|wp-json|tag\/|author\/|category\/|search)/i.test(
                  parsedOriginal.pathname,
                )
              ? "Low-value utility/legal path excluded from optimization pack"
            : !optimizeEligible
              ? `Marked non-optimizable in source package (${intent})`
            : isDoNotOptimizeIntent(intent, optimizeLegalPages)
              ? `Intent excluded (${intent})`
              : null;
        return {
          originalUrl,
          canonicalUrl,
          intent,
          score: page.score ?? null,
          topIssues: (page.topIssues ?? []).filter(Boolean),
          topActions: (page.topActions ?? []).filter(Boolean),
          excludedReason: excluded,
        };
      } catch {
        return {
          originalUrl,
          canonicalUrl: originalUrl,
          intent: "general" as PageIntent,
          score: page.score ?? null,
          topIssues: (page.topIssues ?? []).filter(Boolean),
          topActions: (page.topActions ?? []).filter(Boolean),
          excludedReason: "Invalid URL",
        };
      }
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const byCanonical = new Map<string, (typeof normalized)[number]>();
  normalized.forEach((row) => {
    if (!byCanonical.has(row.canonicalUrl)) {
      byCanonical.set(row.canonicalUrl, row);
    }
  });
  const deduped = [...byCanonical.values()];
  const excludedPages = deduped.filter((p) => p.excludedReason != null);
  const eligiblePages = deduped.filter((p) => p.excludedReason == null);

  if (eligiblePages.length === 0) {
    throw new Error("All pages were excluded; no optimize-eligible pages remain");
  }

  const prompts = eligiblePages.map((page) => {
    const topIssues = page.topIssues;
    const pageActions = page.topActions;
    const schemaPatch = buildSchemaPatchForIntent({
      intent: page.intent,
      website,
      canonicalUrl: page.canonicalUrl,
      brandName,
    });
    const prompt = buildSinglePagePrompt({
      website,
      brandName,
      pageUrl: page.originalUrl,
      canonicalUrl: page.canonicalUrl,
      intent: page.intent,
      score: page.score,
      topIssues,
      pageActions,
      globalActions,
      tone,
      audience,
    });
    const geoContentDraft = buildGeoContentDraft({
      pageUrl: page.originalUrl,
      canonicalUrl: page.canonicalUrl,
      brandName,
      intent: page.intent,
      website,
      audience,
      tone,
      topIssues,
      actions: pageActions,
      globalActions,
      schemaPatch,
      includeHtmlBlocks,
      voiceProfile,
    });
    return {
      pageUrl: page.originalUrl,
      canonicalUrl: page.canonicalUrl,
      intent: page.intent,
      score: page.score ?? null,
      issues: topIssues,
      actions: pageActions,
      schemaPatch,
      prompt,
      geoContentDraft,
      cursorExecutionPrompt: [
        "You are editing a production website project in Cursor.",
        `Target website: ${website}`,
        `Target URL: ${page.originalUrl}`,
        `Canonical URL: ${page.canonicalUrl}`,
        `Page intent: ${page.intent}`,
        "",
        "File-finding strategy:",
        "1) Locate route/page template serving the target URL path.",
        "2) Identify GEO metadata block and primary H1 section.",
        "3) Locate FAQ/structured-data injection points.",
        "",
        "Transformation checklist:",
        "- Apply headline/subheadline/CTA from geoContentDraft.hero.",
        "- Replace/add body sections from geoContentDraft.bodySections.",
        "- Add FAQ block from geoContentDraft.faqItems.",
        "- Apply schema patch guidance from schemaPatch.",
        "- Ensure internal links and conversion blocks are present.",
        "",
        "Acceptance criteria:",
        "- Exactly one H1 on page.",
        "- Title/meta align with page intent and entity clarity.",
        "- FAQ content is visible and consistent with FAQ schema.",
        "- No unverifiable claims introduced.",
        "",
        "Verification steps:",
        "- Run local build/lint for edited project.",
        "- Validate rendered page has one H1.",
        "- Validate JSON-LD in schema test tool.",
        "- Re-run GEO pipeline and compare score/citation deltas.",
        "",
        "Definition of done:",
        "Page copy, schema, and conversion elements are updated and validated with no regressions.",
        "",
        "Execution prompt:",
        prompt,
      ].join("\n"),
    };
  });

  const pack = {
    kind: "geo_page_prompt_pack",
    version: 2,
    generatedAt: new Date().toISOString(),
    sourcePackageId: source.id,
    website,
    brandName,
    voiceProfile,
    tone,
    audience,
    optimizeLegalPages,
    includeHtmlBlocks,
    eligiblePageCount: eligiblePages.length,
    excludedPageCount: excludedPages.length,
    excludedPages: excludedPages.map((p) => ({
      pageUrl: p.originalUrl,
      canonicalUrl: p.canonicalUrl,
      intent: p.intent,
      reason: p.excludedReason,
    })),
    pagePromptCount: prompts.length,
    prompts,
    schemaBundle: pkg.schemaBundle ?? {},
    qualityGuards: {
      excludesHashSourceUrls: true,
      excludesLowValueUtilityPaths: true,
      requiresCanonicalUniqueness: true,
      requiresIntentSpecificCta: true,
    },
  };

  const [created] = await db
    .insert(deliverables)
    .values({
      clientId: source.clientId,
      orgId: source.orgId,
      type: "content_piece",
      title: `GEO Page Prompt Pack ${new Date().toISOString().slice(0, 10)}`,
      description: `AI prompt pack generated from GEO package ${source.id}.`,
      status: "in_review",
      contentJson: pack as Record<string, unknown>,
    })
    .returning();

  return created;
}

