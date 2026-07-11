export type CitationResult = {
  citedDomain: string;
  citedUrl: string;
  snippet?: string;
  positionWeight?: number;
  rank?: number;
  confidence?: number;
  mentionType?: "brand" | "competitor" | "neutral";
};

export type EngineRunResult = {
  answerText: string;
  citations: CitationResult[];
  mentionedBrands: string[];
  confidence: number;
  raw: unknown;
};

export type EngineRunInput = {
  query: string;
  region?: string | null;
  language?: string | null;
  entities?: string[];
  brandDomains?: string[];
};

export type EngineConnector = {
  slug: string;
  runQuery(input: EngineRunInput): Promise<EngineRunResult>;
};

