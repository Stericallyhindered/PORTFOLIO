import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clients, contentAudits, deliverables, pages } from "@/db/schema";

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

type BuildOptions = {
  clientId: string;
  orgId: string;
  auditRunAt?: string;
  businessName?: string;
  phone?: string;
  logoUrl?: string;
  imageUrl?: string;
  serviceType?: string;
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
  latitude?: number;
  longitude?: number;
  areaServed?: string[];
};

type AuditIssue = {
  message?: string;
};

type AuditRecommendation = {
  action?: string;
};

function asIssues(value: unknown): AuditIssue[] {
  const list = Array.isArray(value)
    ? value
    : Array.isArray((value as { issues?: unknown[] } | null)?.issues)
      ? ((value as { issues: unknown[] }).issues ?? [])
      : [];
  return list.filter((v): v is AuditIssue => typeof v === "object" && v !== null);
}

function asRecommendations(value: unknown): AuditRecommendation[] {
  const list = Array.isArray(value)
    ? value
    : Array.isArray((value as { recommendations?: unknown[] } | null)?.recommendations)
      ? ((value as { recommendations: unknown[] }).recommendations ?? [])
      : [];
  return list.filter(
    (v): v is AuditRecommendation => typeof v === "object" && v !== null,
  );
}

function normalizeUrl(raw: string) {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return new URL(withProtocol).toString().replace(/\/$/, "");
}

function websiteFromUrl(urlString: string) {
  const u = new URL(urlString);
  return `${u.protocol}//${u.host}`;
}

function normalizedHost(urlString: string) {
  return new URL(urlString).hostname.replace(/^www\./, "").toLowerCase();
}

function inferNameFromHost(urlString: string) {
  const host = new URL(urlString).hostname.replace(/^www\./, "");
  return host.split(".")[0] ?? "Business";
}

function normalizeList(values: string[] | undefined) {
  if (!values || values.length === 0) return [];
  return values
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function canonicalizeUrl(urlString: string) {
  const u = new URL(urlString);
  u.hash = "";
  u.pathname = u.pathname !== "/" ? u.pathname.replace(/\/+$/, "") : u.pathname;
  return u.toString();
}

function classifyPageIntent(urlString: string): PageIntent {
  try {
    const p = new URL(urlString).pathname.toLowerCase();
    if (p === "/" || p === "/home") return "home";
    if (
      /\/(product|products|pricing|plans|book|booking|reserve|quote|checkout|trips?)\b/.test(
        p,
      )
    )
      return "product";
    if (/(trip|booking|reserve|book-now|book)/.test(p)) return "product";
    if (
      /\/(services?|solutions?|guides?|guided|contact|about)\b/.test(p)
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
    if (/\/(terms|privacy|policy|legal|compliance)\b/.test(p)) return "legal";
    if (/\/(account|login|register|cart|checkout|my-account)\b/.test(p))
      return "account";
    if (/\/(wp-admin|xmlrpc|sitemap|feed|search)\b/.test(p)) return "utility";
    return "general";
  } catch {
    return "general";
  }
}

export async function buildGeoImplementationPack(options: BuildOptions) {
  const client = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, options.clientId), eq(clients.orgId, options.orgId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!client) {
    throw new Error("Client not found");
  }

  const normalizedClientUrl = normalizeUrl(client.websiteUrl);
  const websiteRoot = websiteFromUrl(normalizedClientUrl);
  const businessName =
    options.businessName?.trim() || client.name || inferNameFromHost(websiteRoot);

  const auditRows = await db
    .select({
      url: pages.url,
      score: contentAudits.score,
      issuesJson: contentAudits.issuesJson,
      recommendationsJson: contentAudits.recommendationsJson,
      auditDate: contentAudits.auditDate,
    })
    .from(contentAudits)
    .leftJoin(pages, eq(pages.id, contentAudits.pageId))
    .where(eq(pages.clientId, client.id))
    .orderBy(desc(contentAudits.auditDate))
    .limit(250);

  if (auditRows.length === 0) {
    throw new Error("No audit data found for this client");
  }

  const targetHost = normalizedHost(websiteRoot);
  const sameHostRows = auditRows.filter((row) => {
    if (!row.url) return false;
    try {
      return normalizedHost(row.url) === targetHost;
    } catch {
      return false;
    }
  });

  const requestedRunIso =
    options.auditRunAt == null ? null : new Date(options.auditRunAt).toISOString();
  const latestRunIso =
    sameHostRows.length === 0
      ? null
      : new Date(sameHostRows[0].auditDate).toISOString();

  const scopedRows = requestedRunIso
    ? sameHostRows.filter(
        (row) => new Date(row.auditDate).toISOString() === requestedRunIso,
      )
    : sameHostRows.filter(
        (row) =>
          latestRunIso != null &&
          new Date(row.auditDate).toISOString() === latestRunIso,
      );

  if (scopedRows.length === 0) {
    throw new Error("No audit data found for the selected website run");
  }

  const dedupedScopedRows = Array.from(
    new Map(
      scopedRows
        .map((row) => {
          const url = row.url ?? "";
          try {
            return [canonicalizeUrl(url), row] as const;
          } catch {
            return [url, row] as const;
          }
        })
        .filter(([key]) => key.length > 0),
    ).values(),
  );

  const issueCounts = new Map<string, number>();
  const actionCounts = new Map<string, number>();
  const scores = dedupedScopedRows
    .map((row) => row.score)
    .filter((v): v is number => v != null);

  dedupedScopedRows.forEach((row) => {
    asIssues(row.issuesJson).forEach((issue) => {
      const msg = issue.message?.trim();
      if (!msg) return;
      issueCounts.set(msg, (issueCounts.get(msg) ?? 0) + 1);
    });
    asRecommendations(row.recommendationsJson).forEach((rec) => {
      const action = rec.action?.trim();
      if (!action) return;
      actionCounts.set(action, (actionCounts.get(action) ?? 0) + 1);
    });
  });

  const topIssues = [...issueCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([message, occurrences]) => ({ message, occurrences }));
  const topActions = [...actionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([action, occurrences]) => ({ action, occurrences }));

  const avgScore =
    scores.length === 0
      ? null
      : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

  const serviceType =
    options.serviceType?.trim() ||
    client.industry?.trim() ||
    "Professional Services";
  const areaServed = normalizeList(options.areaServed);

  const homepageUrl = websiteRoot;
  const faqPage =
    dedupedScopedRows.find((row) => row.url?.toLowerCase().includes("/faq"))?.url ?? null;
  const servicePages = dedupedScopedRows
    .map((row) => row.url)
    .filter((url): url is string => Boolean(url))
    .filter((url) => /\/services?\b/i.test(url))
    .slice(0, 4);

  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "Organization",
      "@id": `${websiteRoot}/#organization`,
      name: businessName,
      url: websiteRoot,
      ...(options.logoUrl ? { logo: options.logoUrl } : {}),
      ...(options.phone
        ? {
            contactPoint: {
              "@type": "ContactPoint",
              telephone: options.phone,
              contactType: "Customer Service",
              areaServed: "US",
              availableLanguage: ["English"],
            },
          }
        : {}),
    },
    {
      "@type": "LocalBusiness",
      "@id": `${websiteRoot}/#localbusiness`,
      name: businessName,
      url: websiteRoot,
      ...(options.imageUrl ? { image: options.imageUrl } : {}),
      ...(options.phone ? { telephone: options.phone } : {}),
      ...(options.streetAddress ||
      options.addressLocality ||
      options.addressRegion ||
      options.postalCode ||
      options.addressCountry
        ? {
            address: {
              "@type": "PostalAddress",
              ...(options.streetAddress
                ? { streetAddress: options.streetAddress }
                : {}),
              ...(options.addressLocality
                ? { addressLocality: options.addressLocality }
                : {}),
              ...(options.addressRegion
                ? { addressRegion: options.addressRegion }
                : {}),
              ...(options.postalCode ? { postalCode: options.postalCode } : {}),
              ...(options.addressCountry
                ? { addressCountry: options.addressCountry }
                : {}),
            },
          }
        : {}),
      ...(options.latitude != null && options.longitude != null
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: options.latitude,
              longitude: options.longitude,
            },
          }
        : {}),
      ...(areaServed.length > 0
        ? {
            areaServed: areaServed.map((name) => ({
              "@type": "Place",
              name,
            })),
          }
        : {}),
    },
    {
      "@type": "Service",
      "@id": `${websiteRoot}/#service`,
      name: `${businessName} ${serviceType}`.trim(),
      provider: {
        "@type": "LocalBusiness",
        "@id": `${websiteRoot}/#localbusiness`,
      },
      serviceType,
      ...(options.imageUrl ? { image: options.imageUrl } : {}),
      areaServed:
        areaServed.length > 0
          ? areaServed.map((name) => ({ "@type": "Place", name }))
          : [{ "@type": "Country", name: "United States" }],
      description: `${businessName} provides ${serviceType.toLowerCase()} with a focus on authority, structured data, and AI answer visibility.`,
    },
    {
      "@type": "FAQPage",
      "@id": `${websiteRoot}/#faq`,
      mainEntity: topActions.slice(0, 5).map((item, idx) => ({
        "@type": "Question",
        name: `How should we implement GEO priority #${idx + 1}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.action,
        },
      })),
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  const plan = {
    version: 1,
    generatedAt: new Date().toISOString(),
    website: websiteRoot,
    summary: {
      pagesAudited: dedupedScopedRows.length,
      averageScore: avgScore,
      issueCount: topIssues.length,
      recommendationCount: topActions.length,
    },
    topIssues,
    topActions,
    whereToPaste: {
      homepageHead: homepageUrl,
      servicePageHeads:
        servicePages.length > 0 ? servicePages : [`${websiteRoot}/services`],
      faqPageHead: faqPage ?? `${websiteRoot}/faq`,
      notes:
        "You can reuse the same JSON-LD graph across key pages for consistency, then tune per-page schema as needed.",
    },
    perPagePriorities: dedupedScopedRows.slice(0, 20).map((row) => {
      const rawUrl = row.url ?? "unknown-page";
      let canonicalUrl = rawUrl;
      try {
        canonicalUrl = canonicalizeUrl(rawUrl);
      } catch {
        canonicalUrl = rawUrl;
      }
      const intent = classifyPageIntent(canonicalUrl);
      return {
      url: rawUrl,
      canonicalUrl,
      intent,
      optimizeEligible: !(intent === "account" || intent === "utility"),
      score: row.score,
      topIssues: asIssues(row.issuesJson)
        .map((i) => i.message?.trim())
        .filter((v): v is string => Boolean(v))
        .slice(0, 3),
      topActions: asRecommendations(row.recommendationsJson)
        .map((r) => r.action?.trim())
        .filter((v): v is string => Boolean(v))
        .slice(0, 3),
    };}),
    implementationChecklist: [
      "Paste JSON-LD into the <head> of homepage and service pages.",
      "Add FAQ JSON-LD to FAQ page and link from nav/footer.",
      "Implement the top actions in descending occurrence order.",
      "Re-run crawl + GEO audit to validate score improvements.",
    ],
    schemaBundle: jsonLd,
  };

  const [deliverable] = await db
    .insert(deliverables)
    .values({
      clientId: client.id,
      orgId: options.orgId,
      type: "schema_update",
      title: `GEO Implementation Pack ${new Date().toISOString().slice(0, 10)}`,
      description: `Auto-generated schema + optimization plan for ${businessName}.`,
      status: "in_review",
      contentJson: plan as Record<string, unknown>,
    })
    .returning();

  return {
    deliverableId: deliverable.id,
    title: deliverable.title,
    plan,
  };
}

