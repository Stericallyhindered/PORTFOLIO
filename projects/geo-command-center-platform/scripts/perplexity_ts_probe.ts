import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { PerplexityConnector } from "../src/lib/geo/connectors/perplexity";

function loadEnvFromFile(path: string) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFromFile(join(process.cwd(), ".env.local"));
  loadEnvFromFile(join(process.cwd(), "backend", ".env"));

  const query =
    process.argv[2] ??
    "Best Christmas light installation companies in Phoenix with ratings and review volume";
  const brand = process.argv[3] ?? "We Hang Christmas Lights LLC";
  const domain = process.argv[4] ?? "wehangchristmaslights.com";

  const connector = new PerplexityConnector();
  const result = await connector.runQuery({
    query,
    entities: [brand],
    brandDomains: [domain],
  });

  const raw = (result.raw ?? {}) as {
    request?: {
      model?: string;
      promptHash?: string;
      userPrompt?: string;
    };
  };

  console.log(
    JSON.stringify(
      {
        probe: "typescript",
        model: raw.request?.model ?? null,
        promptHash: raw.request?.promptHash ?? null,
        userPrompt: raw.request?.userPrompt ?? null,
        mentionedBrands: result.mentionedBrands,
        citationsTop5: result.citations.slice(0, 5).map((c) => c.citedDomain),
        answerPreview: result.answerText.slice(0, 900),
      },
      null,
      2,
    ),
  );
}

void main();
