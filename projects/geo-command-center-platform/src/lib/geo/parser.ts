import type { CitationResult } from "./types";

const URL_REGEX = /https?:\/\/[^\s)\]]+/gi;

export function extractCitationsFromText(text: string): CitationResult[] {
  const urls = Array.from(new Set(text.match(URL_REGEX) ?? []));

  return urls.map((url, idx) => {
    let domain = "unknown";
    try {
      domain = new URL(url).hostname;
    } catch {
      // ignore invalid URL
    }

    return {
      citedDomain: domain,
      citedUrl: url,
      rank: idx + 1,
      positionWeight: Number((1 / (idx + 1)).toFixed(3)),
      confidence: 0.9,
      mentionType: "neutral",
    };
  });
}

export function detectMentions(text: string, brands: string[]): string[] {
  const lowered = text.toLowerCase();
  return brands.filter((b) => lowered.includes(b.toLowerCase()));
}

export function classifyCitationMentions(input: {
  citations: CitationResult[];
  brandDomains: string[];
  competitorDomains: string[];
}): CitationResult[] {
  const brandHosts = input.brandDomains
    .map((d) => {
      try {
        return new URL(/^https?:\/\//i.test(d) ? d : `https://${d}`).hostname
          .replace(/^www\./, "")
          .toLowerCase();
      } catch {
        return d.replace(/^www\./, "").toLowerCase();
      }
    })
    .filter(Boolean);
  const competitorHosts = input.competitorDomains
    .map((d) => {
      try {
        return new URL(/^https?:\/\//i.test(d) ? d : `https://${d}`).hostname
          .replace(/^www\./, "")
          .toLowerCase();
      } catch {
        return d.replace(/^www\./, "").toLowerCase();
      }
    })
    .filter(Boolean);

  return input.citations.map((c) => {
    const host = c.citedDomain.replace(/^www\./, "").toLowerCase();
    if (brandHosts.some((h) => host.includes(h))) {
      return { ...c, mentionType: "brand", confidence: c.confidence ?? 0.95 };
    }
    if (competitorHosts.some((h) => host.includes(h))) {
      return { ...c, mentionType: "competitor", confidence: c.confidence ?? 0.9 };
    }
    return { ...c, mentionType: "neutral", confidence: c.confidence ?? 0.75 };
  });
}

