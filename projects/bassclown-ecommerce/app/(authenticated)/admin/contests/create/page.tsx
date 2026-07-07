'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';

const CATEGORIES = [
  'Video Production',
  'Photography',
  'Writing',
  'Bass Fishing',
  'Fly Fishing',
  'Ice Fishing',
  'Saltwater Fishing',
  'Gear Review',
  'Educational',
];

export default function CreateContestPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    image: '',
    brandLogo: '',
    brandName: '',
    prize: '',
    category: '',
    startDate: '',
    endDate: '',
    applicationDeadline: '',
    submissionDeadline: '',
    maxParticipants: '',
    rules: '',
    submissionGuidelines: '',
  });

  const toISO = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.description || !form.prize || !form.category) {
      setError('Title, description, prize, and category are required.');
      return;
    }
    const startDate = toISO(form.startDate);
    const endDate = toISO(form.endDate);
    const applicationDeadline = toISO(form.applicationDeadline || form.startDate);
    const submissionDeadline = toISO(form.submissionDeadline || form.endDate);
    if (!startDate || !endDate || !applicationDeadline || !submissionDeadline) {
      setError('Start date and end date are required.');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date.');
      return;
    }
    try {
      setSaving(true);
      const response = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          shortDescription: form.shortDescription || undefined,
          image: form.image || undefined,
          brandLogo: form.brandLogo || undefined,
          brandName: form.brandName || undefined,
          prize: form.prize,
          category: form.category,
          startDate,
          endDate,
          applicationDeadline,
          submissionDeadline,
          maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants, 10) : undefined,
          rules: form.rules || undefined,
          submissionGuidelines: form.submissionGuidelines || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const msg = result?.errors
          ? Object.entries(result.errors)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join('; ')
          : result?.message || 'Failed to create contest';
        throw new Error(msg);
      }
      if (result.success && result.data?.id) {
        router.push(`/admin/contests/${result.data.id}`);
      } else {
        router.push('/admin/contests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contest');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/contests">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contests
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Contest</h1>
            <p className="text-gray-600 mt-1">Set up a new contest with all the details</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <a href="/content-contests" target="_blank" rel="noopener noreferrer">
            <Eye className="h-4 w-4 mr-2" />
            Preview Frontend
          </a>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contest Information</CardTitle>
                <CardDescription>Basic details about the contest</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Contest Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter contest title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the contest, rules, and requirements"
                    className="min-h-[100px]"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    placeholder="Brief summary (optional)"
                    value={form.shortDescription}
                    onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brandName">Brand / Sponsor Name</Label>
                    <Input
                      id="brandName"
                      placeholder="Brand name"
                      value={form.brandName}
                      onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="image">Contest Image URL</Label>
                  <Input
                    id="image"
                    placeholder="https://..."
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="brandLogo">Brand Logo URL</Label>
                  <Input
                    id="brandLogo"
                    placeholder="https://..."
                    value={form.brandLogo}
                    onChange={(e) => setForm({ ...form, brandLogo: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contest Timeline</CardTitle>
                <CardDescription>Set the important dates for your contest</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date *</Label>
                    <Input
                      id="start-date"
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date *</Label>
                    <Input
                      id="end-date"
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="application-deadline">Application Deadline</Label>
                    <Input
                      id="application-deadline"
                      type="datetime-local"
                      value={form.applicationDeadline}
                      onChange={(e) =>
                        setForm({ ...form, applicationDeadline: e.target.value })
                      }
                      placeholder="Defaults to start date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="submission-deadline">Submission Deadline</Label>
                    <Input
                      id="submission-deadline"
                      type="datetime-local"
                      value={form.submissionDeadline}
                      onChange={(e) =>
                        setForm({ ...form, submissionDeadline: e.target.value })
                      }
                      placeholder="Defaults to end date"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prize Information</CardTitle>
                <CardDescription>Configure the contest rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prize">Prize Description *</Label>
                  <Input
                    id="prize"
                    placeholder="e.g. $2,500 prize pool, 1st place $1,500"
                    value={form.prize}
                    onChange={(e) => setForm({ ...form, prize: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rules">Rules</Label>
                  <Textarea
                    id="rules"
                    placeholder="Contest rules and eligibility"
                    value={form.rules}
                    onChange={(e) => setForm({ ...form, rules: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="submissionGuidelines">Submission Guidelines</Label>
                  <Textarea
                    id="submissionGuidelines"
                    placeholder="How to submit, file formats, etc."
                    value={form.submissionGuidelines}
                    onChange={(e) => setForm({ ...form, submissionGuidelines: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Participation Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="max-participants">Max Participants (optional)</Label>
                  <Input
                    id="max-participants"
                    type="number"
                    placeholder="100"
                    min={1}
                    value={form.maxParticipants}
                    onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Create Contest
                </Button>
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/admin/contests">Cancel</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
