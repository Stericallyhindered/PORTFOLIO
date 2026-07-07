'use client';

import { useState, useEffect } from 'react';
import { Contest, ContestApplication, ContestSubmission } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ContestStatusCard from '@/components/contests/ContestStatusCard';
import { Search, Trophy, Calendar, Clock, FileText, Plus, Filter, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function MyContestsPage() {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [applications, setApplications] = useState<ContestApplication[]>([]);
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMyContests();
  }, []);

  const fetchMyContests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/contests/my-contests', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch contests: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform applications
        const transformedApplications: ContestApplication[] = result.data.applications.map((app: any) => ({
          id: app.id,
          contestId: app.contestId,
          userId: app.userId,
          userEmail: app.userEmail || '',
          userName: app.userName || '',
          applicationDate: app.applicationDate || new Date().toISOString(),
          status: app.status || 'pending',
          responses: app.responses || {},
          rejectionReason: app.rejectionReason || undefined,
          reviewedBy: app.reviewedBy || undefined,
          reviewedAt: app.reviewedAt || undefined
        }));

        // Transform submissions
        const transformedSubmissions: ContestSubmission[] = result.data.submissions.map((sub: any) => ({
          id: sub.id,
          contestId: sub.contestId,
          applicationId: sub.applicationId || undefined,
          userId: sub.userId,
          title: sub.title || 'Untitled Submission',
          description: sub.description || '',
          fileUrl: sub.fileUrl || '',
          fileType: sub.fileType || 'unknown',
          submissionDate: sub.submissionDate || new Date().toISOString(),
          status: sub.status || 'submitted',
          score: sub.score || undefined,
          feedback: sub.feedback || undefined,
          judgeNotes: sub.judgeNotes || undefined,
          reviewedBy: undefined,
          reviewedAt: undefined
        }));

        // Extract unique contests from applications and submissions
        const contestMap = new Map<string, Contest>();
        
        result.data.applications.forEach((app: any) => {
          if (app.contest && !contestMap.has(app.contest.id)) {
            contestMap.set(app.contest.id, app.contest);
          }
        });

        result.data.submissions.forEach((sub: any) => {
          if (sub.contest && !contestMap.has(sub.contest.id)) {
            contestMap.set(sub.contest.id, sub.contest);
          }
        });

        const uniqueContests = Array.from(contestMap.values());
        
        setApplications(transformedApplications);
        setSubmissions(transformedSubmissions);
        setContests(uniqueContests);
      } else {
        throw new Error(result.message || 'Failed to fetch contest data');
      }
    } catch (err) {
      console.error('Error fetching my contests:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching contest data');
      toast({
        title: "Error",
        description: "Failed to load your contest data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  // Filter contests based on user's applications
  const userContests = contests.filter(contest => 
    applications.some(app => app.contestId === contest.id)
  );

  const filteredContests = userContests.filter(contest => {
    const matchesSearch = contest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contest.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const userApp = applications.find(app => app.contestId === contest.id);
    return matchesSearch && userApp?.status === statusFilter;
  });

  const getApplicationForContest = (contestId: string) => {
    return applications.find(app => app.contestId === contestId);
  };

  const getSubmissionForContest = (contestId: string) => {
    return submissions.find(sub => sub.contestId === contestId);
  };

  const getContestCounts = () => {
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      submitted: submissions.length,
    };
  };

  const counts = getContestCounts();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="bg-[#2D2D2D] border-gray-700">
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && applications.length === 0 && submissions.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Alert variant="destructive" className="bg-[#2D2D2D] border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-white">
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchMyContests}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Contests</h1>
            <p className="text-gray-400">
              Track your contest applications, submissions, and results
            </p>
          </div>
          <Button asChild>
            <Link href="/contests">
              <Plus className="w-4 h-4 mr-2" />
              Browse Contests
            </Link>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-[#2D2D2D] border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{counts.total}</div>
                <div className="text-sm text-gray-400">Total Applications</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#2D2D2D] border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{counts.pending}</div>
                <div className="text-sm text-gray-400">Pending Review</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#2D2D2D] border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{counts.approved}</div>
                <div className="text-sm text-gray-400">Approved</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#2D2D2D] border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{counts.rejected}</div>
                <div className="text-sm text-gray-400">Rejected</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#2D2D2D] border-gray-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{counts.submitted}</div>
                <div className="text-sm text-gray-400">Submissions</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#2D2D2D] border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#2D2D2D] border-gray-700 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-[#2D2D2D] border-gray-700">
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-[#2D2D2D]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications ({counts.total})</TabsTrigger>
            <TabsTrigger value="submissions">Submissions ({counts.submitted})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {filteredContests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContests.map(contest => {
                  const application = getApplicationForContest(contest.id);
                  const submission = getSubmissionForContest(contest.id);
                  
                  return (
                    <Card key={contest.id} className="bg-[#2D2D2D] border-gray-700 hover:bg-[#3D3D3D] transition-colors">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white">{contest.title}</CardTitle>
                            <CardDescription className="text-gray-400">{contest.category}</CardDescription>
                          </div>
                          <Badge variant={contest.status === 'open' ? 'default' : 'secondary'}>
                            {contest.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Application Status</span>
                              <Badge variant={
                                application?.status === 'approved' ? 'default' :
                                application?.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {application?.status || 'Not Applied'}
                              </Badge>
                            </div>
                            
                            {submission && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Submission Status</span>
                                <Badge variant={
                                  submission.status === 'approved' ? 'default' :
                                  submission.status === 'under_review' ? 'secondary' : 'outline'
                                }>
                                  {submission.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Ends {new Date(contest.endDate).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button asChild className="flex-1" variant="outline">
                              <Link href={`/contests/${contest.id}`}>
                                View Details
                              </Link>
                            </Button>
                            {application?.status === 'approved' && !submission && (
                              <Button asChild className="flex-1">
                                <Link href={`/contests/${contest.id}/submit`}>
                                  Submit Entry
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardContent className="p-8 text-center">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Contest Applications</h3>
                  <p className="text-gray-400 mb-4">
                    You haven&apos;t applied to any contests yet. Start by browsing available contests.
                  </p>
                  <Button asChild>
                    <Link href="/contests">Browse Contests</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.filter(app => statusFilter === 'all' || app.status === statusFilter).map(application => {
                  const contest = contests.find(c => c.id === application.contestId);
                  if (!contest) return null;
                  
                  return (
                    <Card key={application.id} className="bg-[#2D2D2D] border-gray-700">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white">{contest.title}</CardTitle>
                            <CardDescription className="text-gray-400">
                              Applied on {new Date(application.applicationDate).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge variant={
                            application.status === 'approved' ? 'default' :
                            application.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {application.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Category:</span>
                              <span className="ml-2 text-white">{contest.category}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Prize:</span>
                              <span className="ml-2 text-white">{contest.prize}</span>
                            </div>
                          </div>
                          
                          {application.status === 'rejected' && application.rejectionReason && (
                            <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
                              <p className="text-sm text-red-400">
                                <strong>Rejection Reason:</strong> {application.rejectionReason}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button asChild variant="outline" className="flex-1">
                              <Link href={`/contests/${contest.id}`}>
                                View Contest
                              </Link>
                            </Button>
                            {application.status === 'approved' && (
                              <Button asChild className="flex-1">
                                <Link href={`/contests/${contest.id}/submit`}>
                                  Submit Entry
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardContent className="p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Applications</h3>
                  <p className="text-gray-400">
                    Your contest applications will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-6">
            {submissions.length > 0 ? (
              <div className="space-y-4">
                {submissions.map(submission => {
                  const contest = contests.find(c => c.id === submission.contestId);
                  if (!contest) return null;
                  
                  return (
                    <Card key={submission.id} className="bg-[#2D2D2D] border-gray-700">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white">{submission.title}</CardTitle>
                            <CardDescription className="text-gray-400">
                              For: {contest.title} • Submitted {new Date(submission.submissionDate).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge variant={
                            submission.status === 'approved' ? 'default' :
                            submission.status === 'under_review' ? 'secondary' : 'outline'
                          }>
                            {submission.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-300">{submission.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">File Type:</span>
                              <span className="ml-2 text-white capitalize">{submission.fileType}</span>
                            </div>
                            {submission.score && (
                              <div>
                                <span className="text-gray-400">Score:</span>
                                <span className="ml-2 text-white">{submission.score}/100</span>
                              </div>
                            )}
                          </div>
                          
                          {submission.feedback && (
                            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3">
                              <p className="text-sm text-blue-400">
                                <strong>Judge Feedback:</strong> {submission.feedback}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button asChild variant="outline" className="flex-1">
                              <Link href={`/contests/${contest.id}`}>
                                View Contest
                              </Link>
                            </Button>
                            <Button variant="outline" className="flex-1">
                              View Submission
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardContent className="p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Submissions</h3>
                  <p className="text-gray-400">
                    Your contest submissions will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 