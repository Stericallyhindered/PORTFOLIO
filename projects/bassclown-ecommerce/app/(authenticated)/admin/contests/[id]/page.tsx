'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Trophy,
  Users,
  Clock,
  DollarSign,
  Check,
  X,
  Loader2,
} from 'lucide-react';

interface Contest {
  id: string;
  title: string;
  description: string;
  shortDescription: string | null;
  image: string | null;
  brandLogo: string | null;
  brandName: string | null;
  prize: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  submissionDeadline: string;
  status: string;
  category: string;
  requirements: unknown;
  judges: unknown;
  maxParticipants: number | null;
  currentParticipants: number | null;
  rules: string | null;
  submissionGuidelines: string | null;
  creatorName: string | null;
  stats?: {
    applicationCount: number;
    submissionCount: number;
    userHasApplied: boolean;
    userApplicationStatus: string | null;
  };
}

interface Application {
  id: string;
  userId: string;
  status: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  rejectionReason: string | null;
}

interface SelectWinnersStats {
  totalSubmissions?: number;
  eligibleSubmissions?: number;
  selectedWinners?: number;
}

export default function AdminContestDetailPage() {
  const params = useParams();
  const contestId = params.id as string;
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [winnerStats, setWinnerStats] = useState<SelectWinnersStats | null>(null);
  const [winnerStatsLoading, setWinnerStatsLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contest>>({});
  const [saving, setSaving] = useState(false);
  const [updatingApp, setUpdatingApp] = useState<string | null>(null);

  useEffect(() => {
    fetchContest();
  }, [contestId]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contests/${contestId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      if (result.success && result.data) {
        setContest(result.data);
        setEditForm(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true);
      const response = await fetch(`/api/contests/${contestId}/applications?limit=100`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      if (result.success && result.data?.applications) {
        setApplications(result.data.applications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchWinnerStats = async () => {
    try {
      setWinnerStatsLoading(true);
      const response = await fetch(`/api/contests/${contestId}/select-winners`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      if (result.success && result.data) {
        setWinnerStats(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWinnerStatsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === 'applications') fetchApplications();
    if (value === 'results') fetchWinnerStats();
  };

  const updateApplication = async (appId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      setUpdatingApp(appId);
      const response = await fetch(`/api/contests/${contestId}/applications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          applicationId: appId,
          status,
          rejectionReason: status === 'rejected' ? rejectionReason || 'Not approved' : undefined,
        }),
      });
      if (!response.ok) throw new Error('Failed to update');
      fetchApplications();
      fetchContest();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingApp(null);
    }
  };

  const saveContest = async () => {
    if (!contest) return;
    try {
      setSaving(true);
      // Only send fields the API schema accepts — strip computed/read-only fields
      const payload: Record<string, unknown> = {};
      const allowedFields = [
        'title', 'description', 'shortDescription', 'image', 'brandLogo', 'brandName',
        'prize', 'startDate', 'endDate', 'applicationDeadline', 'submissionDeadline',
        'status', 'category', 'requirements', 'judges', 'maxParticipants',
        'rules', 'submissionGuidelines'
      ];
      for (const key of allowedFields) {
        const val = (editForm as any)[key];
        if (val !== undefined && val !== null) {
          // Normalize requirements/judges: ensure they're arrays, not objects
          if ((key === 'requirements' || key === 'judges') && !Array.isArray(val)) {
            payload[key] = typeof val === 'string' ? [val] : [];
          } else {
            payload[key] = val;
          }
        }
      }
      if (payload.startDate) payload.startDate = new Date(payload.startDate as string).toISOString();
      if (payload.endDate) payload.endDate = new Date(payload.endDate as string).toISOString();
      if (payload.applicationDeadline)
        payload.applicationDeadline = new Date(payload.applicationDeadline as string).toISOString();
      if (payload.submissionDeadline)
        payload.submissionDeadline = new Date(payload.submissionDeadline as string).toISOString();
      // maxParticipants must be a number or removed
      if (payload.maxParticipants !== undefined) {
        const n = Number(payload.maxParticipants);
        if (isNaN(n) || n <= 0) {
          delete payload.maxParticipants;
        } else {
          payload.maxParticipants = n;
        }
      }
      console.log('Contest PATCH payload:', JSON.stringify(payload, null, 2));
      const response = await fetch(`/api/contests/${contestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const fieldErrors = errData?.errors ? Object.entries(errData.errors).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
        const msg = fieldErrors
          ? `Validation failed - ${fieldErrors}`
          : errData?.message || `Failed to update (${response.status})`;
        alert(msg);
        console.error('Contest update error:', JSON.stringify(errData, null, 2));
        return;
      }
      setEditOpen(false);
      fetchContest();
    } catch (err) {
      console.error(err);
      alert('Failed to update contest. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'judging':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'draft':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const daysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="space-y-6">
        <Link href="/admin/contests">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contests
          </Button>
        </Link>
        <p className="text-gray-500">Contest not found</p>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">{contest.title}</h1>
            <p className="text-gray-600 mt-1">
              {contest.brandName || contest.creatorName || '—'} • {contest.category}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/contests/${contestId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Contest
          </Button>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contest Overview</CardTitle>
            <Badge variant={getStatusColor(contest.status)} className="w-fit">
              {contest.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{contest.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-lg">{contest.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-lg">
                  {new Date(contest.startDate).toLocaleDateString()} -{' '}
                  {new Date(contest.endDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Application Deadline</p>
                <p className="text-lg">{new Date(contest.applicationDeadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Submission Deadline</p>
                <p className="text-lg">{new Date(contest.submissionDeadline).toLocaleDateString()}</p>
              </div>
            </div>
            {contest.rules && (
              <div>
                <p className="text-sm font-medium text-gray-500">Rules</p>
                <p className="text-gray-600 whitespace-pre-wrap">{contest.rules}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prize</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contest.prize}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contest.currentParticipants ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                of {contest.maxParticipants ?? '∞'} max
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contest.stats?.applicationCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contest.stats?.submissionCount ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Remaining</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{daysRemaining(contest.endDate)}</div>
              <p className="text-xs text-muted-foreground">days left</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs onValueChange={handleTabChange} defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="judging">Judging</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contest Applications</CardTitle>
              <CardDescription>Manage user applications for this contest</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={fetchApplications}>
                {applicationsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Refresh
              </Button>
              {applicationsLoading ? (
                <div className="py-8 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No applications yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{app.userName || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{app.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              app.status === 'approved'
                                ? 'default'
                                : app.status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {app.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateApplication(app.id, 'approved')}
                                disabled={!!updatingApp}
                              >
                                {updatingApp === app.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateApplication(app.id, 'rejected')}
                                disabled={!!updatingApp}
                              >
                                {updatingApp === app.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4 mr-1" />
                                )}
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contest Submissions</CardTitle>
              <CardDescription>View and manage all contest submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/admin/contests/${contestId}/submissions`}>
                <Button>View All Submissions</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="judging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Judging Interface</CardTitle>
              <CardDescription>Manage the judging process</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/admin/contests/${contestId}/collaborative-judging`}>
                <Button>Open Collaborative Judging</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contest Results</CardTitle>
              <CardDescription>View and publish contest results</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={fetchWinnerStats}>
                {winnerStatsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Refresh Stats
              </Button>
              {winnerStats && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Total submissions: {winnerStats.totalSubmissions ?? '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Eligible: {winnerStats.eligibleSubmissions ?? '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Selected winners: {winnerStats.selectedWinners ?? '—'}
                  </p>
                </div>
              )}
              <p className="mt-4 text-sm text-gray-500">
                Use the select-winners API to run the draw. Full UI for selecting winners can be
                added here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contest</DialogTitle>
            <DialogDescription>Update contest details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label>Brand Name</Label>
              <Input
                value={editForm.brandName || ''}
                onChange={(e) => setEditForm({ ...editForm, brandName: e.target.value })}
                placeholder="Brand / Sponsor name"
              />
            </div>
            <div>
              <Label>Brand Logo URL</Label>
              <Input
                value={editForm.brandLogo || ''}
                onChange={(e) => setEditForm({ ...editForm, brandLogo: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Prize</Label>
              <Input
                value={editForm.prize || ''}
                onChange={(e) => setEditForm({ ...editForm, prize: e.target.value })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={editForm.category || ''}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
            </div>
            <div>
              <Label>Short Description</Label>
              <Textarea
                value={editForm.shortDescription || ''}
                onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                rows={2}
                placeholder="Brief one-line description for listings"
              />
            </div>
            <div>
              <Label>Contest Image URL</Label>
              <Input
                value={editForm.image || ''}
                onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={
                    editForm.startDate
                      ? new Date(editForm.startDate).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setEditForm({ ...editForm, startDate: new Date(e.target.value).toISOString() })
                  }
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={
                    editForm.endDate
                      ? new Date(editForm.endDate).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setEditForm({ ...editForm, endDate: new Date(e.target.value).toISOString() })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Application Deadline</Label>
                <Input
                  type="datetime-local"
                  value={
                    editForm.applicationDeadline
                      ? new Date(editForm.applicationDeadline).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setEditForm({ ...editForm, applicationDeadline: new Date(e.target.value).toISOString() })
                  }
                />
              </div>
              <div>
                <Label>Submission Deadline</Label>
                <Input
                  type="datetime-local"
                  value={
                    editForm.submissionDeadline
                      ? new Date(editForm.submissionDeadline).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    setEditForm({ ...editForm, submissionDeadline: new Date(e.target.value).toISOString() })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Max Participants (leave empty for no cap)</Label>
              <Input
                type="number"
                value={editForm.maxParticipants ?? ''}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    maxParticipants: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
              />
            </div>
            <div>
              <Label>Rules</Label>
              <Textarea
                value={editForm.rules || ''}
                onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })}
                rows={4}
                placeholder="Contest rules and requirements..."
              />
            </div>
            <div>
              <Label>Submission Guidelines</Label>
              <Textarea
                value={editForm.submissionGuidelines || ''}
                onChange={(e) => setEditForm({ ...editForm, submissionGuidelines: e.target.value })}
                rows={4}
                placeholder="Guidelines for content submissions..."
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={editForm.status || 'draft'}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="judging">Judging</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveContest} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
