export type TuneTable = {
  id: string;
  name: string;
  alias: string;
  category: string;
  description: string;
  xLabel: string;
  yLabel: string;
  xAxis: string[];
  yAxis: string[];
  cells: number[][];
  sizeLabel: string;
};

export type EditorPreferenceSet = {
  primaryColor: string;
  accentColor: string;
  shadowDepth: number;
  surfaceStyle: "mesh" | "glass" | "contour";
};

export type AiAssistantState = {
  enabled: boolean;
  modelStatus: "off" | "ready-later";
  systemScope: string[];
};

export type HelpPreview = {
  includedPages: number;
  categories: Array<{
    name: string;
    count: number;
  }>;
  sampleSections: string[];
};
