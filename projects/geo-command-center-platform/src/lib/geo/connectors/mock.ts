import type { EngineConnector, EngineRunInput, EngineRunResult } from "../types";

function seededScore(query: string): number {
  let hash = 0;
  for (let i = 0; i < query.length; i += 1) {
    hash = (hash << 5) - hash + query.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

export class MockConnector implements EngineConnector {
  slug = "mock";

  async runQuery(input: EngineRunInput): Promise<EngineRunResult> {
    const score = seededScore(input.query);
    const answerText = `Mock answer for: ${input.query}. Useful GEO references: https://developers.google.com/search/docs/appearance/ai-overviews and https://schema.org/Organization`;
    const citations = [
      {
        citedDomain: "developers.google.com",
        citedUrl:
          "https://developers.google.com/search/docs/appearance/ai-overviews",
        snippet: "Google AI Overviews guidance",
        rank: 1,
        positionWeight: 1,
      },
      {
        citedDomain: "schema.org",
        citedUrl: "https://schema.org/Organization",
        snippet: "Organization schema",
        rank: 2,
        positionWeight: 0.5,
      },
    ];

    return {
      answerText,
      citations,
      confidence: Number((0.65 + score * 0.3).toFixed(3)),
      mentionedBrands: input.entities?.slice(0, 2) ?? [],
      raw: { mock: true, input },
    };
  }
}

