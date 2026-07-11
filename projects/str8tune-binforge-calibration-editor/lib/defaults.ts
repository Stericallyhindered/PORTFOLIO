import type { AiAssistantState, EditorPreferenceSet } from "@/lib/types";

export const defaultPreferences: EditorPreferenceSet = {
  primaryColor: "#57d4ff",
  accentColor: "#7cff9f",
  shadowDepth: 36,
  surfaceStyle: "glass",
};

export const defaultAiState: AiAssistantState = {
  enabled: false,
  modelStatus: "ready-later",
  systemScope: [
    "Current BIN metadata",
    "Loaded XDF definition structure",
    "Current table and current cell focus",
    "BINFORGE internal help guide built from the filtered BIN editing source pack",
  ],
};
