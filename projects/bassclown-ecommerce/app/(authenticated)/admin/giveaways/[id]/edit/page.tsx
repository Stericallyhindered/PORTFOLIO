'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface Giveaway {
  id: string;
  title: string;
  description: string;
  longDescription: string | null;
  prizeValue: string;
  maxEntries: number | null;
  additionalEntryPrice: string | number | null;
  startDate: string;
  endDate: string;
  status: string;
  image: string | null;
  sponsor: string | null;
}

export default function AdminGiveawayEditPage() {
  const params = useParams();
  const router = useRouter();
  const giveawayId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Giveaway>>({});

  useEffect(() => {
    fetchGiveaway();
  }, [giveawayId]);

  const fetchGiveaway = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/giveaways/${giveawayId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      if (result.success && result.data?.giveaway) {
        const g = result.data.giveaway;
        setForm({
          title: g.title,
          description: g.description,
          longDescription: g.longDescription || '',
          prizeValue: g.prizeValue,
          maxEntries: g.maxEntries,
          additionalEntryPrice: g.additionalEntryPrice,
          startDate: g.startDate ? new Date(g.startDate).toISOString().slice(0, 16) : '',
          endDate: g.endDate ? new Date(g.endDate).toISOString().slice(0, 16) : '',
          status: g.status,
          image: g.image || '',
          sponsor: g.sponsor || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.description || !form.prizeValue) {
      setError('Title, description, and prize value are required.');
      return;
    }
    const startDate = form.startDate ? new Date(form.startDate).toISOString() : undefined;
    const endDate = form.endDate ? new Date(form.endDate).toISOString() : undefined;
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date.');
      return;
    }
    try {
      setSaving(true);
      const response = await fetch(`/api/giveaways/${giveawayId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          longDescription: form.longDescription || undefined,
          prizeValue: form.prizeValue,
          maxEntries: form.maxEntries ? parseInt(String(form.maxEntries), 10) : null,
          additionalEntryPrice: form.additionalEntryPrice
            ? parseFloat(String(form.additionalEntryPrice))
            : null,
          startDate,
          endDate,
          status: form.status,
          image: form.image || null,
          sponsor: form.sponsor || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const msg =
          result?.errors
            ? Object.entries(result.errors)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                .join('; ')
            : result?.message || 'Failed to update';
        throw new Error(msg);
      }
      router.push(`/admin/giveaways/${giveawayId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-gray-200 animate-pulse rounded" />
        <div className="h-96 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/admin/giveaways/${giveawayId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Giveaway
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900">Edit Giveaway</h1>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Title, description, and prize</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={form.title || ''}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label>Long Description</Label>
                  <Textarea
                    value={form.longDescription || ''}
                    onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Prize Value *</Label>
                  <Input
                    value={form.prizeValue || ''}
                    onChange={(e) => setForm({ ...form, prizeValue: e.target.value })}
                    placeholder="e.g. $500"
                    required
                  />
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input
                    value={form.image || ''}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Sponsor</Label>
                  <Input
                    value={form.sponsor || ''}
                    onChange={(e) => setForm({ ...form, sponsor: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={form.startDate || ''}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="datetime-local"
                      value={form.endDate || ''}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.status || 'draft'}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Max Entries (optional)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.maxEntries ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxEntries: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Additional Entry Price ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.additionalEntryPrice ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        additionalEntryPrice: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g. 5.00"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-2">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href={`/admin/giveaways/${giveawayId}`}>Cancel</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
