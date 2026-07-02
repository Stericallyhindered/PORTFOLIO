import { detectMentions, extractCitationsFromText } from "../parser";
import type { EngineConnector, EngineRunInput, EngineRunResult } from "../types";

type AnthropicResponse = {
  content?: Array<{ text?: string }>;
};

export class AnthropicConnector implements EngineConnector {
  slug = "anthropic";

  async runQuery(input: EngineRunInput): Promise<EngineRunResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: [
              `Query: ${input.query}`,
              input.region ? `Region: ${input.region}` : "",
              input.language ? `Language: ${input.language}` : "",
              "Answer clearly and include explicit source URLs.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic request failed: ${response.status} ${body}`);
    }

    const payload = (await response.json()) as AnthropicResponse;
    const answerText = payload.content?.[0]?.text ?? "";
    const citations = extractCitationsFromText(answerText);
    const mentionedBrands = detectMentions(answerText, input.entities ?? []);

    return {
      answerText,
      citations,
      mentionedBrands,
      confidence: citations.length > 0 ? 0.8 : 0.6,
      raw: payload,
    };
  }
}
