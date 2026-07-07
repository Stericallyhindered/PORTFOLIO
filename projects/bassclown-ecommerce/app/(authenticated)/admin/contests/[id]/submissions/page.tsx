'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ExternalLink, FileVideo, FileImage } from 'lucide-react';

interface Submission {
  id: string;
  contestId: string;
  applicationId: string;
  userId: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  status: string;
  score: string | null;
  feedback: string | null;
  judgeNotes: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubmissionsData {
  contest: { id: string; title: string; status: string };
  submissions: Submission[];
  stats: {
    total: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function AdminContestSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;
  const [data, setData] = useState<SubmissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editScore, setEditScore] = useState<string>('');
  const [editFeedback, setEditFeedback] = useState<string>('');
  const [editJudgeNotes, setEditJudgeNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [contestId, statusFilter, page]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const response = await fetch(`/api/contests/${contestId}/submissions?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch submissions');
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

  const openEditDialog = (sub: Submission) => {
    setEditingSubmission(sub);
    setEditStatus(sub.status);
    setEditScore(sub.score || '');
    setEditFeedback(sub.feedback || '');
    setEditJudgeNotes(sub.judgeNotes || '');
  };

  const saveSubmission = async () => {
    if (!editingSubmission) return;
    try {
      setSaving(true);
      const response = await fetch(`/api/contests/${contestId}/submissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          submissionId: editingSubmission.id,
          status: editStatus,
          score: editScore ? parseFloat(editScore) : undefined,
          feedback: editFeedback || undefined,
          judgeNotes: editJudgeNotes || undefined,
        }),
      });
      if (!response.ok) throw new Error('Failed to update');
      setEditingSubmission(null);
      fetchSubmissions();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'under_review': return 'secondary';
      default: return 'outline';
    }
  };

  const isVideo = (fileType: string) =>
    fileType?.toLowerCase().includes('video') || fileType?.toLowerCase() === 'mp4' || fileType?.toLowerCase() === 'webm';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/contests/${contestId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contest
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contest Submissions</h1>
            <p className="text-gray-600 mt-1">
              {data?.contest?.title || 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Submitted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.submitted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Under Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.underReview}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
              <CardDescription>View and manage all contest submissions</CardDescription>
              <div className="flex items-center gap-2 mt-4">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {data.submissions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No submissions found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.submissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sub.userName || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{sub.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>{sub.title}</TableCell>
                        <TableCell>
                          {isVideo(sub.fileType) ? (
                            <FileVideo className="h-4 w-4 text-gray-500" />
                          ) : (
                            <FileImage className="h-4 w-4 text-gray-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(sub.status)}>{sub.status}</Badge>
                        </TableCell>
                        <TableCell>{sub.score ?? '-'}</TableCell>
                        <TableCell>{new Date(sub.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(sub)}>
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!data.pagination.hasPrev}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!data.pagination.hasNext}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">Failed to load submissions</div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSubmission} onOpenChange={(open) => !open && setEditingSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Submission</DialogTitle>
            <DialogDescription>Update status, score, and notes</DialogDescription>
          </DialogHeader>
          {editingSubmission && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Score (0-100)</Label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={editScore}
                  onChange={(e) => setEditScore(e.target.value)}
                />
              </div>
              <div>
                <Label>Feedback</Label>
                <Textarea
                  value={editFeedback}
                  onChange={(e) => setEditFeedback(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Judge Notes</Label>
                <Textarea
                  value={editJudgeNotes}
                  onChange={(e) => setEditJudgeNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubmission(null)}>Cancel</Button>
            <Button onClick={saveSubmission} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
