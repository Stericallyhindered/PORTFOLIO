import { AnthropicConnector } from "./connectors/anthropic";
import { MockConnector } from "./connectors/mock";
import { PerplexityConnector } from "./connectors/perplexity";
import type { EngineConnector } from "./types";

const mockConnector = new MockConnector();
const perplexityConnector = new PerplexityConnector();
const anthropicConnector = new AnthropicConnector();

export function resolveEngineConnector(slug: string): EngineConnector {
  if ((slug === "anthropic" || slug === "claude") && process.env.ANTHROPIC_API_KEY) {
    return anthropicConnector;
  }
  if (
    (slug === "perplexity" ||
      slug === "chatgpt" ||
      slug === "google-ai-overviews" ||
      slug === "gemini") &&
    process.env.PERPLEXITY_API_KEY
  ) {
    return perplexityConnector;
  }

  return mockConnector;
}

