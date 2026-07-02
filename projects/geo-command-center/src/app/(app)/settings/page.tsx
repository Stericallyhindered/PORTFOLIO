import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getSessionContext } from "@/lib/auth/session";
import { fastapiFetch } from "@/lib/fastapiClient";
import { getActiveClientForOrg } from "@/lib/context/active-client";

export const metadata = {
  title: "Settings | GEO Command Center",
};

export default async function SettingsPage() {
  const session = await getSessionContext();
  if (!session?.currentOrgId) return null;
  const { activeClient } = await getActiveClientForOrg(session.currentOrgId);

  const providers = await fastapiFetch<Record<string, { configured: boolean; provider: string }>>(
    "/settings/providers",
    undefined,
    session.currentOrgId,
  ).catch(() => ({}));
  const platform = await fastapiFetch<{
    apiVersion: string;
    environment: string;
    authHeaderFallbackEnabled: boolean;
    engineDefaults: { required: string[]; retryPolicy: { networkRetries: number; providerRetries: number } };
  }>("/settings/platform", undefined, session.currentOrgId).catch(() => null);
  const diagnostics = await fastapiFetch<{
    runLive: boolean;
    engines: Array<{
      engine: string;
      configured: boolean;
      provider: string;
      liveStatus: string;
      liveVerified: boolean;
      lastErrorCode: string | null;
      lastErrorMessage: string | null;
      lastCheckedAt: string | null;
    }>;
  }>("/settings/providers/diagnostics?run_live=true", undefined, session.currentOrgId).catch(() => ({
    runLive: false,
    engines: [],
  }));
  const conversationLog = await fastapiFetch<{
    items: Array<{
      id: string;
      projectId: string;
      projectName: string;
      website: string;
      engine: string;
      status: string;
      startedAt: string | null;
      completedAt: string | null;
      promptId: string;
      promptText: string;
      responseText: string;
      errorMessage: string | null;
      citationCount: number;
    }>;
    total: number;
  }>(
    `/settings/engine-conversations?limit=300${
      activeClient?.id ? `&project_id=${encodeURIComponent(activeClient.id)}` : ""
    }`,
    undefined,
    session.currentOrgId,
  ).catch(() => ({ items: [], total: 0 }));

  const groupedByWebsite = conversationLog.items.reduce<
    Record<
      string,
      Record<
        string,
        Array<{
          id: string;
          status: string;
          startedAt: string | null;
          completedAt: string | null;
          promptText: string;
          responseText: string;
          errorMessage: string | null;
          citationCount: number;
        }>
      >
    >
  >((acc, item) => {
    const websiteKey = item.website || "unknown-domain";
    if (!acc[websiteKey]) {
      acc[websiteKey] = {};
    }
    if (!acc[websiteKey][item.engine]) {
      acc[websiteKey][item.engine] = [];
    }
    acc[websiteKey][item.engine].push({
      id: item.id,
      status: item.status,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      promptText: item.promptText,
      responseText: item.responseText,
      errorMessage: item.errorMessage,
      citationCount: item.citationCount,
    });
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Settings & Providers</h1>
        <p className="text-sm text-muted-foreground">
          Platform readiness and provider integration status for GEO engine execution.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provider Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(providers).length === 0 ? (
              <p className="text-muted-foreground">No provider status returned.</p>
            ) : (
              Object.entries(providers).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span>{key}</span>
                  <span className={value.configured ? "text-green-600" : "text-destructive"}>
                    {value.configured ? "key present" : "missing key"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Platform Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {platform == null ? (
              <p className="text-muted-foreground">No platform configuration returned.</p>
            ) : (
              <>
                <p>API version: {platform.apiVersion}</p>
                <p>Environment: {platform.environment}</p>
                <p>Header fallback auth: {platform.authHeaderFallbackEnabled ? "enabled" : "disabled"}</p>
                <p>Required engines: {platform.engineDefaults.required.join(", ")}</p>
                <p>
                  Retry policy: network {platform.engineDefaults.retryPolicy.networkRetries} / provider{" "}
                  {platform.engineDefaults.retryPolicy.providerRetries}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Engine Readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {diagnostics.engines.length === 0 ? (
              <p className="text-muted-foreground">No diagnostics available.</p>
            ) : (
              diagnostics.engines.map((item) => (
                <div key={item.engine} className="space-y-1 rounded border p-2">
                  <div className="flex items-center justify-between gap-4">
                    <span>{item.engine}</span>
                    <span className={item.configured ? "text-green-600" : "text-destructive"}>
                      {item.configured ? "key present" : "missing key"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span>Live verification</span>
                    <span className={item.liveVerified ? "text-green-600" : "text-destructive"}>
                      {item.liveVerified ? "verified" : item.liveStatus}
                    </span>
                  </div>
                  {item.lastErrorCode ? (
                    <p className="text-xs text-destructive">
                      {item.lastErrorCode}: {item.lastErrorMessage}
                    </p>
                  ) : null}
                  {item.lastCheckedAt ? (
                    <p className="text-xs text-muted-foreground">
                      Checked: {new Date(item.lastCheckedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              ))
            )}
            <p className="text-xs text-muted-foreground">
              Live diagnostics run on page load and block pipeline preflight when engines fail.
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>AI Conversation Log (by website and engine)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {conversationLog.total === 0 ? (
            <p className="text-muted-foreground">
              No engine conversations recorded yet. Run the full GEO pipeline to populate logs.
            </p>
          ) : (
            Object.entries(groupedByWebsite).map(([website, engineMap]) => (
              <div key={website} className="space-y-3 rounded-md border p-3">
                <p className="font-medium">{website}</p>
                {Object.entries(engineMap).map(([engineName, runs]) => (
                  <div key={`${website}-${engineName}`} className="space-y-2 rounded-md bg-muted/40 p-3">
                    <p className="font-medium">{engineName}</p>
                    {runs.map((run) => (
                      <details key={run.id} className="rounded border bg-background p-2">
                        <summary className="cursor-pointer list-none text-xs text-muted-foreground">
                          {run.status} | citations: {run.citationCount} | started: {run.startedAt ?? "n/a"}
                        </summary>
                        <div className="mt-2 space-y-2 text-xs">
                          <div>
                            <p className="font-medium">Prompt</p>
                            <p className="whitespace-pre-wrap break-words">{run.promptText}</p>
                          </div>
                          <div>
                            <p className="font-medium">Response</p>
                            <p className="whitespace-pre-wrap break-words">
                              {run.responseText || "(empty response)"}
                            </p>
                          </div>
                          {run.errorMessage ? (
                            <p className="text-destructive">Error: {run.errorMessage}</p>
                          ) : null}
                          <p className="text-muted-foreground">Completed: {run.completedAt ?? "n/a"}</p>
                        </div>
                      </details>
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
