'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Gift, Loader2, Trophy } from 'lucide-react';

interface DrawData {
  giveaway: { id: string; title: string; status: string; endDate: string };
  stats: { totalEntries: number; winnersDrawn: number; hasEnded: boolean };
  canDraw: boolean;
  winners: Array<{
    id: string;
    userName: string | null;
    userEmail: string | null;
    selectedAt: string;
    prizeClaimStatus: string;
  }> | null;
  eligibilityCheck: {
    isActive: boolean;
    hasEnded: boolean;
    hasEntries: boolean;
    winnersAlreadyDrawn: boolean;
  };
}

export default function AdminGiveawayDrawPage() {
  const params = useParams();
  const giveawayId = params.id as string;
  const [data, setData] = useState<DrawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [numberOfWinners, setNumberOfWinners] = useState(1);
  const [drawing, setDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<{
    winners: Array<{ user?: { name: string; email: string }; entryNumber?: number }>;
  } | null>(null);

  useEffect(() => {
    fetchDrawStatus();
  }, [giveawayId]);

  const fetchDrawStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/giveaways/${giveawayId}/draw`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runDraw = async () => {
    if (!data?.canDraw || numberOfWinners < 1) return;
    try {
      setDrawing(true);
      const response = await fetch(`/api/giveaways/${giveawayId}/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          numberOfWinners: Math.min(numberOfWinners, 10),
          requireConfirmation: false,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result?.message || 'Failed to draw winners');
        return;
      }
      if (result.success && result.data) {
        setDrawResult(result.data);
        fetchDrawStatus();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to draw winners');
    } finally {
      setDrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Link href={`/admin/giveaways/${giveawayId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Giveaway
          </Button>
        </Link>
        <p className="text-gray-500">Failed to load draw status</p>
      </div>
    );
  }

  const { giveaway, stats, canDraw, winners, eligibilityCheck } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/giveaways/${giveawayId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Giveaway
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Draw Winners</h1>
          <p className="text-gray-600 mt-1">{giveaway.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Winners Drawn</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winnersDrawn}</div>
          </CardContent>
        </Card>
      </div>

      {/* Eligibility */}
      <Card>
        <CardHeader>
          <CardTitle>Eligibility</CardTitle>
          <CardDescription>Requirements to run the draw</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            Giveaway active: {eligibilityCheck.isActive ? 'Yes' : 'No'}
          </p>
          <p className="text-sm">Has ended: {eligibilityCheck.hasEnded ? 'Yes' : 'No'}</p>
          <p className="text-sm">Has entries: {eligibilityCheck.hasEntries ? 'Yes' : 'No'}</p>
          <p className="text-sm">
            Winners already drawn: {eligibilityCheck.winnersAlreadyDrawn ? 'Yes' : 'No'}
          </p>
          <p className="text-sm font-medium text-gray-700">
            Can draw: {canDraw ? 'Yes' : 'No'}
          </p>
        </CardContent>
      </Card>

      {drawResult?.winners && drawResult.winners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Winners Selected</CardTitle>
            <CardDescription>Congratulations to the winners!</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {drawResult.winners.map((w, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  {w.user?.name || 'Unknown'} ({w.user?.email})
                  {w.entryNumber != null && (
                    <span className="text-sm text-gray-500">— Entry #{w.entryNumber}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {winners && winners.length > 0 && !drawResult && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Winners</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {winners.map((w) => (
                <li key={w.id}>
                  {w.userName || 'Unknown'} ({w.userEmail}) —{' '}
                  {new Date(w.selectedAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {canDraw && (
        <Card>
          <CardHeader>
            <CardTitle>Run Draw</CardTitle>
            <CardDescription>
              Select how many winners to draw. Winners will be chosen randomly from all eligible
              entries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Number of Winners</Label>
              <Input
                type="number"
                min={1}
                max={Math.min(10, stats.totalEntries)}
                value={numberOfWinners}
                onChange={(e) => setNumberOfWinners(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <Button onClick={runDraw} disabled={drawing}>
              {drawing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Gift className="h-4 w-4 mr-2" />
              )}
              Draw Winners
            </Button>
          </CardContent>
        </Card>
      )}

      {!canDraw && !winners?.length && (
        <Card>
          <CardContent className="py-8">
            <p className="text-gray-500 text-center">
              Cannot draw yet. The giveaway must be active, past its end date, have at least one
              entry, and no winners drawn yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
