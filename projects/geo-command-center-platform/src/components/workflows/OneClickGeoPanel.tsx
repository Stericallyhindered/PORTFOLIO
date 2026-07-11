"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { fastapiFetch } from "@/lib/fastapiClient";
import { GeneratedPromptsPanel } from "./GeneratedPromptsPanel";

type Props = {
  defaultWebsiteUrl?: string;
  defaultProjectId?: string;
  orgId?: string;
};

const AI_ENGINES = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "perplexity", name: "Perplexity" },
  { id: "gemini", name: "Gemini" },
  { id: "google-ai-overviews", name: "Google AI Overviews" },
  { id: "claude", name: "Claude" },
];

function parseFastapiErrorDetail(raw: string): { message?: string; blockingEngines?: Array<{ engine: string; errorCode?: string }> } | null {
  const jsonStart = raw.indexOf("{");
  if (jsonStart < 0) return null;
  try {
    const parsed = JSON.parse(raw.slice(jsonStart));
    const detail = parsed?.detail;
    if (detail && typeof detail === "object") {
      return detail as { message?: string; blockingEngines?: Array<{ engine: string; errorCode?: string }> };
    }
    return null;
  } catch {
    return null;
  }
}

export function OneClickGeoPanel({ defaultWebsiteUrl, defaultProjectId, orgId }: Props) {
  const [websiteUrl, setWebsiteUrl] = useState(defaultWebsiteUrl ?? "");
  const [promptCount, setPromptCount] = useState<number>(100);
  const [selectedEngines, setSelectedEngines] = useState<string[]>(["perplexity"]);
  const [skipPreflight, setSkipPreflight] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggleEngine = (engineId: string) => {
    setSelectedEngines(prev => 
      prev.includes(engineId) 
        ? prev.filter(e => e !== engineId)
        : [...prev, engineId]
    );
  };

  async function runPipeline() {
    if (selectedEngines.length === 0) {
      setMessage("Please select at least one AI engine.");
      return;
    }

    if (promptCount < 1) {
      setMessage("Please enter at least 1 prompt.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const backendProjectId =
        defaultProjectId ?? process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID;
      if (!backendProjectId) {
        setMessage("No active website selected.");
        return;
      }
      
      await fastapiFetch(
        `/projects/${encodeURIComponent(backendProjectId)}`,
        undefined,
        orgId,
      );

      const body = await fastapiFetch<{
        status: string;
        run_id: string | null;
      }>(
        "/crawl/full-pipeline",
        {
          method: "POST",
          body: JSON.stringify({
            project_id: backendProjectId,
            domain: websiteUrl.replace(/^https?:\/\//, "").split("/")[0],
            target_tier: "core",
            max_prompts: promptCount,
            selected_engines: selectedEngines,
            skip_preflight: skipPreflight,
          }),
        },
        orgId,
      );

      setMessage(`Pipeline queued! Run ID: ${body.run_id ?? "n/a"} | ${promptCount} prompts | Engines: ${selectedEngines.join(", ")}. Check the Generated Prompts panel below for results.`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to queue GEO pipeline.";
      const detail = parseFastapiErrorDetail(text);
      if (detail?.blockingEngines && detail.blockingEngines.length > 0) {
        const failing = detail.blockingEngines
          .map((item) => `${item.engine}${item.errorCode ? `(${item.errorCode})` : ""}`)
          .join(", ");
        setMessage(`Provider preflight failed: ${failing}`);
        return;
      }
      if (text.includes("Project not found")) {
        setMessage("The selected website no longer exists. Refresh and select/configure a website first.");
      } else {
        setMessage(text);
      }
    } finally {
      setLoading(false);
    }
  }

  const estimatedApiCalls = promptCount * selectedEngines.length;

  return (
    <div className="rounded-md border bg-background p-4 space-y-4">
      <div>
        <p className="text-sm font-medium">GEO Pipeline Runner</p>
        <p className="text-xs text-muted-foreground">
          Configure how many prompts to generate and which AI engines to test against.
        </p>
      </div>

      {/* Website URL */}
      <div className="space-y-1">
        <Label className="text-xs">Website URL</Label>
        <Input
          placeholder="https://yourwebsite.com"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
        />
      </div>

      {/* Prompt Count */}
      <div className="space-y-1">
        <Label className="text-xs">Number of Prompts to Generate</Label>
        <Input
          type="number"
          min={1}
          max={15000}
          value={promptCount}
          onChange={(e) => setPromptCount(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-40"
        />
        <p className="text-xs text-muted-foreground">Enter any number from 1 to 15,000</p>
      </div>

      {/* Engine Selection */}
      <div className="space-y-2">
        <Label className="text-xs">Select AI Engines to Test ({selectedEngines.length} selected)</Label>
        <div className="flex flex-wrap gap-3">
          {AI_ENGINES.map((engine) => {
            const isSelected = selectedEngines.includes(engine.id);
            return (
              <label
                key={engine.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-muted hover:border-muted-foreground/50"
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleEngine(engine.id)}
                />
                <span className="text-sm">{engine.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Skip Preflight Option */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="skip-preflight"
          checked={skipPreflight}
          onCheckedChange={(checked) => setSkipPreflight(checked === true)}
        />
        <Label htmlFor="skip-preflight" className="text-xs text-muted-foreground cursor-pointer">
          Skip API health check (use if preflight keeps failing but API keys are valid)
        </Label>
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-md p-3 text-sm">
        <p><strong>Summary:</strong></p>
        <p>Prompts: {promptCount.toLocaleString()}</p>
        <p>Engines: {selectedEngines.length === 0 ? "None selected" : selectedEngines.join(", ")}</p>
        <p>Estimated API calls: {estimatedApiCalls.toLocaleString()}</p>
        {skipPreflight && <p className="text-amber-600">⚠️ Preflight check disabled</p>}
      </div>

      {/* Run Button */}
      <Button 
        onClick={runPipeline} 
        disabled={loading || selectedEngines.length === 0 || !websiteUrl}
        className="w-full"
      >
        {loading ? "Running Pipeline..." : "Run GEO Pipeline"}
      </Button>

      {message && (
        <p className={`text-xs ${message.includes("failed") || message.includes("error") || message.includes("Failed") ? "text-red-500" : "text-green-600"}`}>
          {message}
        </p>
      )}

      {/* Generated Prompts Panel */}
      {defaultProjectId && (
        <GeneratedPromptsPanel projectId={defaultProjectId} orgId={orgId} />
      )}
    </div>
  );
}
