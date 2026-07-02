import * as cheerio from "cheerio";

export type CrawledPage = {
  url: string;
  title: string;
  headings: string[];
  headingOutline: Array<{ level: number; text: string }>;
  h1Count: number;
  metaDescription?: string;
  canonicalUrl?: string;
  robotsDirectives: string[];
  openGraphTitle?: string;
  openGraphDescription?: string;
  publishDate?: string;
  lastModified?: string;
  yearMentions: number[];
  faqQuestionCount: number;
  hasFaqSchema: boolean;
  schemaNodeTypes: string[];
  entityMentions: string[];
  ctaPhrases: string[];
  hasComparisonLanguage: boolean;
  bodyText: string;
  wordCount: number;
  hasJsonLd: boolean;
  internalLinks: string[];
};

export async function crawlSite(options: {
  baseUrl: string;
  maxPages?: number;
  depth?: number;
}): Promise<CrawledPage[]> {
  const maxPages = options.maxPages ?? 25;
  const maxDepth = options.depth ?? 1;
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [
    { url: normalizeUrl(options.baseUrl), depth: 0 },
  ];
  const results: CrawledPage[] = [];

  while (queue.length > 0 && results.length < maxPages) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (visited.has(current.url) || current.depth > maxDepth) {
      continue;
    }
    visited.add(current.url);

    try {
      const response = await fetch(current.url, {
        headers: {
          "User-Agent": "GEO-Command-Center-Crawler/1.0",
        },
      });
      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const title = $("title").first().text().trim();
      const headings = $("h1, h2")
        .toArray()
        .map((el) => $(el).text().trim())
        .filter(Boolean);
      const headingOutline = $("h1, h2, h3, h4")
        .toArray()
        .map((el) => {
          const tagName = (el.tagName || "").toLowerCase();
          const levelMatch = tagName.match(/^h([1-6])$/);
          return {
            level: Number(levelMatch?.[1] ?? 0),
            text: $(el).text().trim(),
          };
        })
        .filter((h) => h.level > 0 && h.text.length > 0);
      const h1Count = $("h1").length;
      const metaDescription = $('meta[name="description"]').attr("content")?.trim();
      const canonicalUrl = $('link[rel="canonical"]').attr("href");
      const robotsDirectives = [
        $('meta[name="robots"]').attr("content"),
        $('meta[name="googlebot"]').attr("content"),
      ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      const openGraphTitle = $('meta[property="og:title"]').attr("content")?.trim();
      const openGraphDescription = $('meta[property="og:description"]').attr("content")?.trim();
      const publishDate =
        $('meta[property="article:published_time"]').attr("content")?.trim() ||
        $('meta[name="publish_date"]').attr("content")?.trim() ||
        undefined;
      const lastModified =
        $('meta[property="article:modified_time"]').attr("content")?.trim() ||
        $('meta[name="last-modified"]').attr("content")?.trim() ||
        undefined;
      const bodyText = $("body").text().replace(/\s+/g, " ").trim();
      const wordCount = bodyText.length === 0 ? 0 : bodyText.split(/\s+/).length;
      const hasJsonLd = $('script[type="application/ld+json"]').length > 0;
      const yearMentions = Array.from(
        new Set(
          (bodyText.match(/\b(19|20)\d{2}\b/g) ?? [])
            .map((y) => Number(y))
            .filter((y) => y >= 1990 && y <= 2099),
        ),
      );
      const faqQuestionCount = $("section, div, article")
        .toArray()
        .filter((el) => /faq|frequently asked/i.test($(el).text()))
        .length;
      const ctaPhrases = $("a, button")
        .toArray()
        .map((el) => $(el).text().trim())
        .filter((text) => /(book|quote|contact|call|start|request|schedule|demo)/i.test(text))
        .slice(0, 20);
      const hasComparisonLanguage = /(compare|vs\.?|alternative|better than|why choose)/i.test(
        bodyText,
      );

      const schemaNodeTypes: string[] = [];
      $('script[type="application/ld+json"]').each((_idx, el) => {
        const text = $(el).text().trim();
        try {
          const parsed = JSON.parse(text) as
            | Record<string, unknown>
            | Array<Record<string, unknown>>;
          const nodes = Array.isArray(parsed)
            ? parsed
            : Array.isArray((parsed as Record<string, unknown>)["@graph"])
              ? ((parsed as Record<string, unknown>)["@graph"] as Array<Record<string, unknown>>)
              : [parsed];
          nodes.forEach((node) => {
            const type = node?.["@type"];
            if (typeof type === "string") schemaNodeTypes.push(type);
            if (Array.isArray(type)) {
              type
                .filter((t): t is string => typeof t === "string")
                .forEach((t) => schemaNodeTypes.push(t));
            }
          });
        } catch {
          // ignore malformed schema scripts
        }
      });
      const hasFaqSchema = schemaNodeTypes.some((t) => /FAQPage/i.test(t));
      const entityMentions = Array.from(
        new Set(
          [
            ...headings,
            ...bodyText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) ?? [],
          ]
            .map((v) => v.trim())
            .filter((v) => v.length >= 3)
            .slice(0, 100),
        ),
      );

      const internalLinks = $("a[href]")
        .toArray()
        .map((el) => $(el).attr("href") ?? "")
        .map((href) => toAbsoluteUrl(current.url, href))
        .filter((href): href is string => !!href)
        .filter((href) => sameOrigin(options.baseUrl, href));

      results.push({
        url: current.url,
        title,
        headings,
        headingOutline,
        h1Count,
        metaDescription,
        canonicalUrl: canonicalUrl ? toAbsoluteUrl(current.url, canonicalUrl) ?? undefined : undefined,
        robotsDirectives,
        openGraphTitle,
        openGraphDescription,
        publishDate,
        lastModified,
        yearMentions,
        faqQuestionCount,
        hasFaqSchema,
        schemaNodeTypes: Array.from(new Set(schemaNodeTypes)),
        entityMentions,
        ctaPhrases,
        hasComparisonLanguage,
        bodyText,
        wordCount,
        hasJsonLd,
        internalLinks,
      });

      if (current.depth < maxDepth) {
        internalLinks.forEach((href) => {
          if (!visited.has(href)) {
            queue.push({ url: href, depth: current.depth + 1 });
          }
        });
      }
    } catch {
      // swallow crawl failures per page
    }
  }

  return results;
}

function normalizeUrl(url: string) {
  const u = new URL(url);
  u.hash = "";
  return u.toString();
}

function toAbsoluteUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function sameOrigin(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}

