'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Users, 
  MessageCircle, 
  CheckCircle, 
  Clock,
  Eye,
  Plus,
  AlertCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';

interface JudgingSession {
  id: string;
  contestId: string;
  submissionId: string;
  sessionType: 'independent' | 'collaborative' | 'consensus';
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  requiredJudges: number;
  completedJudges: number;
  consensusReached: boolean;
  finalScore?: number;
  finalDecision?: string;
  aggregationMethod: string;
  metadata?: any;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

interface Submission {
  id: string;
  title: string;
  userName: string;
  status: string;
}

interface JudgeScore {
  judgeId: string;
  judgeName: string;
  totalScore: number;
  confidence?: number;
  submittedAt: Date;
  criteriaScores?: Record<string, number>;
  comments?: string;
}

export default function CollaborativeJudgingPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.id as string;
  
  const [sessions, setSessions] = useState<JudgingSession[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<JudgingSession | null>(null);
  const [sessionScores, setSessionScores] = useState<JudgeScore[]>([]);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const [newSession, setNewSession] = useState({
    submissionId: '',
    sessionType: 'collaborative' as 'independent' | 'collaborative' | 'consensus',
    requiredJudges: 3,
    aggregationMethod: 'average' as 'average' | 'median' | 'weighted',
    consensusThreshold: 0.8,
    allowDiscussion: true,
    anonymousScoring: false
  });

  useEffect(() => {
    fetchSessions();
    fetchSubmissions();
  }, [contestId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contests/${contestId}/judge/collaborative`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const result = await response.json();
      if (result.success && result.data?.sessions) {
        setSessions(result.data.sessions.map((s: any) => ({
          ...s,
          startedAt: new Date(s.startedAt),
          completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
          createdAt: new Date(s.createdAt)
        })));
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/contests/${contestId}/submissions`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.submissions) {
          setSubmissions(result.data.submissions);
        }
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.submissionId) {
      toast({
        title: "Validation Error",
        description: "Please select a submission",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      
      const response = await fetch(`/api/contests/${contestId}/judge/collaborative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newSession),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Collaborative judging session created successfully",
        });
        setCreateDialogOpen(false);
        setNewSession({
          submissionId: '',
          sessionType: 'collaborative',
          requiredJudges: 3,
          aggregationMethod: 'average',
          consensusThreshold: 0.8,
          allowDiscussion: true,
          anonymousScoring: false
        });
        fetchSessions();
      }
    } catch (err) {
      console.error('Error creating session:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create session',
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const viewSessionDetails = async (session: JudgingSession) => {
    setSelectedSession(session);
    // Fetch session scores/details
    try {
      const response = await fetch(`/api/contests/${contestId}/judge/collaborative/${session.id}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.scores) {
          setSessionScores(result.data.scores);
        }
      }
    } catch (err) {
      console.error('Error fetching session details:', err);
    }
  };

  if (loading) {
    return (
      <>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/contests/${contestId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contest
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Collaborative Judging</h1>
              <p className="text-gray-600 mt-1">Manage collaborative judging sessions for this contest</p>
            </div>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Collaborative Judging Session</DialogTitle>
                <DialogDescription>
                  Set up a collaborative judging session for a submission
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="submission">Submission *</Label>
                  <Select
                    value={newSession.submissionId}
                    onValueChange={(value) => setNewSession({ ...newSession, submissionId: value })}
                  >
                    <SelectTrigger id="submission">
                      <SelectValue placeholder="Select a submission" />
                    </SelectTrigger>
                    <SelectContent>
                      {submissions.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.title} - {sub.userName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sessionType">Session Type *</Label>
                  <Select
                    value={newSession.sessionType}
                    onValueChange={(value: any) => setNewSession({ ...newSession, sessionType: value })}
                  >
                    <SelectTrigger id="sessionType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="independent">Independent</SelectItem>
                      <SelectItem value="collaborative">Collaborative</SelectItem>
                      <SelectItem value="consensus">Consensus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="requiredJudges">Required Judges *</Label>
                  <Input
                    id="requiredJudges"
                    type="number"
                    min="1"
                    max="10"
                    value={newSession.requiredJudges}
                    onChange={(e) => setNewSession({ ...newSession, requiredJudges: parseInt(e.target.value) || 3 })}
                  />
                </div>
                <div>
                  <Label htmlFor="aggregationMethod">Aggregation Method *</Label>
                  <Select
                    value={newSession.aggregationMethod}
                    onValueChange={(value: any) => setNewSession({ ...newSession, aggregationMethod: value })}
                  >
                    <SelectTrigger id="aggregationMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="median">Median</SelectItem>
                      <SelectItem value="weighted">Weighted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowDiscussion"
                    checked={newSession.allowDiscussion}
                    onChange={(e) => setNewSession({ ...newSession, allowDiscussion: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="allowDiscussion" className="cursor-pointer">
                    Allow discussion between judges
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymousScoring"
                    checked={newSession.anonymousScoring}
                    onChange={(e) => setNewSession({ ...newSession, anonymousScoring: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="anonymousScoring" className="cursor-pointer">
                    Anonymous scoring
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSession}
                  disabled={creating || !newSession.submissionId}
                >
                  {creating ? 'Creating...' : 'Create Session'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Collaborative Sessions</h3>
              <p className="text-gray-500 mb-4">
                Create a collaborative judging session to enable multiple judges to review submissions together
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => {
              const submission = submissions.find(s => s.id === session.submissionId);
              const progress = (session.completedJudges / session.requiredJudges) * 100;
              
              return (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {submission?.title || 'Unknown Submission'}
                      </CardTitle>
                      <Badge variant={
                        session.status === 'completed' ? 'default' :
                        session.status === 'active' ? 'secondary' :
                        'outline'
                      }>
                        {session.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {session.sessionType} • {submission?.userName || 'Unknown User'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">
                            {session.completedJudges}/{session.requiredJudges} judges
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      
                      {session.finalScore !== null && session.finalScore !== undefined && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="text-sm font-medium text-green-900">Final Score</span>
                          <span className="text-lg font-bold text-green-600">
                            {session.finalScore.toFixed(1)}
                          </span>
                        </div>
                      )}
                      
                      {session.consensusReached && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Consensus reached</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Started {formatDistanceToNow(session.startedAt, { addSuffix: true })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => viewSessionDetails(session)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Session Details Dialog */}
        {selectedSession && (
          <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Session Details</DialogTitle>
                <DialogDescription>
                  View collaborative judging session results and judge scores
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Session Type</Label>
                    <p className="font-medium capitalize">{selectedSession.sessionType}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Status</Label>
                    <Badge>{selectedSession.status}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Progress</Label>
                    <p className="font-medium">
                      {selectedSession.completedJudges}/{selectedSession.requiredJudges} judges
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Aggregation Method</Label>
                    <p className="font-medium capitalize">{selectedSession.aggregationMethod}</p>
                  </div>
                </div>
                
                {selectedSession.finalScore !== null && selectedSession.finalScore !== undefined && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Final Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Final Score</span>
                        <span className="text-3xl font-bold text-blue-600">
                          {selectedSession.finalScore.toFixed(1)}
                        </span>
                      </div>
                      {selectedSession.finalDecision && (
                        <div className="mt-4">
                          <Label className="text-sm text-gray-500">Final Decision</Label>
                          <Badge className="ml-2 capitalize">{selectedSession.finalDecision}</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {sessionScores.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Judge Scores</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sessionScores.map((score, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{score.judgeName}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">
                                  {score.totalScore.toFixed(1)}
                                </div>
                                {score.confidence && (
                                  <div className="text-xs text-gray-500">
                                    Confidence: {(score.confidence * 100).toFixed(0)}%
                                  </div>
                                )}
                              </div>
                            </div>
                            {score.comments && (
                              <p className="text-sm text-gray-600 mt-2">{score.comments}</p>
                            )}
                            <div className="text-xs text-gray-400 mt-2">
                              Submitted {formatDistanceToNow(score.submittedAt, { addSuffix: true })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedSession(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}

