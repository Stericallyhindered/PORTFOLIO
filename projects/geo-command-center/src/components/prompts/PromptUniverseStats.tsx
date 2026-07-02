"use client";

import { useEffect, useState } from "react";
import { fastapiFetch } from "@/lib/fastapiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Props = {
  projectId: string;
  orgId?: string;
};

type TierTargets = {
  core: { min: number; target: number; max: number };
  expanded: { min: number; target: number; max: number };
  deep: { min: number; target: number; max: number };
};

type UniverseStats = {
  projectId: string;
  totalPrompts: number;
  coreCount: number;
  expandedCount: number;
  deepCount: number;
  tierTargets: TierTargets;
  byIntent: Record<string, number>;
  byFunnelStage: Record<string, number>;
  byAudience: Record<string, number>;
  byUseCase: Record<string, number>;
  byTier: Record<string, number>;
  bySourceLayer: Record<string, number>;
  byCompetitor: Record<string, number>;
  avgQualityScore: number | null;
};

export function PromptUniverseStats({ projectId, orgId }: Props) {
  const [stats, setStats] = useState<UniverseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await fastapiFetch<UniverseStats>(
          `/prompts/universe/stats/${projectId}`,
          undefined,
          orgId
        );
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [projectId, orgId]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading prompt universe stats...</div>;
  }

  if (error || !stats) {
    return <div className="text-sm text-red-500">{error || "No stats available"}</div>;
  }

  const tierProgress = (count: number, target: number) => {
    return Math.min(100, (count / target) * 100);
  };

  const topIntents = Object.entries(stats.byIntent)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topCompetitors = Object.entries(stats.byCompetitor)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrompts.toLocaleString()}</div>
            {stats.avgQualityScore && (
              <p className="text-xs text-muted-foreground">
                Avg quality: {(stats.avgQualityScore * 100).toFixed(1)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Core Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coreCount.toLocaleString()}</div>
            <Progress
              value={tierProgress(stats.coreCount, stats.tierTargets.core.target)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Target: {stats.tierTargets.core.target.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expanded Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expandedCount.toLocaleString()}</div>
            <Progress
              value={tierProgress(stats.expandedCount, stats.tierTargets.expanded.target)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Target: {stats.tierTargets.expanded.target.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deep Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deepCount.toLocaleString()}</div>
            <Progress
              value={tierProgress(stats.deepCount, stats.tierTargets.deep.target)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Target: {stats.tierTargets.deep.target.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Intent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topIntents.map(([intent, count]) => (
                <div key={intent} className="flex justify-between text-sm">
                  <span className="capitalize">{intent.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Funnel Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byFunnelStage)
                .sort(([, a], [, b]) => b - a)
                .map(([stage, count]) => (
                  <div key={stage} className="flex justify-between text-sm">
                    <span className="capitalize">{stage.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">{count.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Source Layer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.bySourceLayer)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([layer, count]) => (
                  <div key={layer} className="flex justify-between text-sm">
                    <span className="capitalize">{layer.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">{count.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Competitor Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            {topCompetitors.length > 0 ? (
              <div className="space-y-2">
                {topCompetitors.map(([competitor, count]) => (
                  <div key={competitor} className="flex justify-between text-sm">
                    <span>{competitor}</span>
                    <span className="text-muted-foreground">{count.toLocaleString()} prompts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No competitor prompts yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
