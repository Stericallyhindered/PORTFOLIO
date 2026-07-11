import { detectMentions, extractCitationsFromText } from "../parser";
import type { EngineConnector, EngineRunInput, EngineRunResult } from "../types";

type PerplexityChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const PERPLEXITY_MODEL = "sonar-pro";
const PERPLEXITY_SYSTEM_PROMPT =
  "You are a GEO research assistant. Provide factual, concise answers with verifiable source URLs.";
const PERPLEXITY_REQUEST_PARAMS = {
  temperature: 0.2,
  top_p: 0.9,
  max_tokens: 900,
};

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class PerplexityConnector implements EngineConnector {
  slug = "perplexity";

  async runQuery(input: EngineRunInput): Promise<EngineRunResult> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY is not set");
    }

    const userPrompt = [
      `Query: ${input.query}`,
      input.entities?.[0] ? `Brand: ${input.entities[0]}` : "",
      input.brandDomains?.[0] ? `Primary domain: ${input.brandDomains[0]}` : "",
      input.region ? `Region: ${input.region}` : "",
      input.language ? `Language: ${input.language}` : "",
      "Return references as explicit URLs.",
      "If listing providers or brands, keep ordering evidence-based and avoid prioritizing any single brand without support.",
    ]
      .filter(Boolean)
      .join("\n");
    const promptHash = await sha256Hex(`${PERPLEXITY_SYSTEM_PROMPT}\n${userPrompt}`);
    const requestPayload = {
      model: PERPLEXITY_MODEL,
      messages: [
        { role: "system", content: PERPLEXITY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      ...PERPLEXITY_REQUEST_PARAMS,
    };
    console.info("[perplexity][runQuery]", {
      model: PERPLEXITY_MODEL,
      promptHash,
      params: PERPLEXITY_REQUEST_PARAMS,
    });

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Perplexity request failed: ${response.status} ${body}`);
    }

    const payload = (await response.json()) as PerplexityChatResponse;
    const answerText = payload.choices?.[0]?.message?.content ?? "";
    const citations = extractCitationsFromText(answerText);
    const mentionedBrands = detectMentions(answerText, input.entities ?? []);

    return {
      answerText,
      citations,
      mentionedBrands,
      confidence: citations.length > 0 ? 0.82 : 0.55,
      raw: {
        request: {
          model: PERPLEXITY_MODEL,
          systemPrompt: PERPLEXITY_SYSTEM_PROMPT,
          userPrompt,
          promptHash,
          params: PERPLEXITY_REQUEST_PARAMS,
        },
        response: payload,
      },
    };
  }
}

