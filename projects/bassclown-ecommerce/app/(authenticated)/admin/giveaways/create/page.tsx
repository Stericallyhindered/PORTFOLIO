'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function CreateGiveawayPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    longDescription: '',
    prizeValue: '',
    maxEntries: '',
    additionalEntryPrice: '',
    startDate: '',
    endDate: '',
    image: '',
    sponsor: '',
  });

  const toISO = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.description || !form.prizeValue) {
      setError('Title, description, and prize value are required.');
      return;
    }
    const startDate = toISO(form.startDate);
    const endDate = toISO(form.endDate);
    if (!startDate || !endDate) {
      setError('Start date and end date are required.');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date.');
      return;
    }
    try {
      setSaving(true);
      const response = await fetch('/api/giveaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          longDescription: form.longDescription || undefined,
          prizeValue: form.prizeValue,
          maxEntries: form.maxEntries ? parseInt(form.maxEntries, 10) : undefined,
          additionalEntryPrice: form.additionalEntryPrice
            ? parseFloat(form.additionalEntryPrice)
            : undefined,
          startDate,
          endDate,
          image: form.image || undefined,
          sponsor: form.sponsor || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const msg =
          result?.errors
            ? Object.entries(result.errors)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                .join('; ')
            : result?.message || 'Failed to create giveaway';
        throw new Error(msg);
      }
      if (result.success && result.data?.id) {
        router.push(`/admin/giveaways/${result.data.id}`);
      } else {
        router.push('/admin/giveaways');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create giveaway');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/giveaways">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Giveaways
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900">Create Giveaway</h1>
      <p className="text-gray-600">Set up a new giveaway with prizes and entry rules</p>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Set up the fundamental details of your giveaway</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Giveaway Title *</Label>
                  <Input
                    placeholder="Enter giveaway title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    placeholder="Describe the giveaway and its prizes"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Long Description</Label>
                  <Textarea
                    placeholder="Extended description (optional)"
                    rows={3}
                    value={form.longDescription}
                    onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Sponsor / Brand</Label>
                  <Input
                    placeholder="e.g. Bass Masters"
                    value={form.sponsor}
                    onChange={(e) => setForm({ ...form, sponsor: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prize Information</CardTitle>
                <CardDescription>Define the prize value</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Prize Value *</Label>
                  <Input
                    placeholder="e.g. $500"
                    value={form.prizeValue}
                    onChange={(e) => setForm({ ...form, prizeValue: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input
                    placeholder="https://..."
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entry Rules</CardTitle>
                <CardDescription>Members get one free entry; configure additional entries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Maximum Entries (optional)</Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    min={1}
                    value={form.maxEntries}
                    onChange={(e) => setForm({ ...form, maxEntries: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Additional Entry Price ($)</Label>
                  <Input
                    type="number"
                    placeholder="5.00"
                    min={0}
                    step={0.01}
                    value={form.additionalEntryPrice}
                    onChange={(e) => setForm({ ...form, additionalEntryPrice: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Set the giveaway timeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
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
                  Create Giveaway
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/admin/giveaways">Cancel</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
} 
} 