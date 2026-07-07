'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Calendar, Clock, Trophy, FileText, Upload, CheckCircle,
  XCircle, AlertTriangle, Eye, Star, Download
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ContestData {
  id: string;
  title: string;
  shortDescription: string;
  image: string;
  prize: string;
  endDate: string;
  submissionDeadline: string;
  category: string;
  status: string;
}

interface ApplicationData {
  id: string;
  contestId: string;
  status: string;
  responses: Record<string, string>;
  createdAt: string;
  reviewedAt: string | null;
}

interface SubmissionData {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  status: string;
  score: number | null;
  feedback: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export default function MyContestStatusPage() {
  const params = useParams();
  const { user } = useAuth();
  const [contest, setContest] = useState<ContestData | null>(null);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) fetchData();
  }, [params?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch contest details
      const contestRes = await fetch(`/api/contests/${params.id}`, { credentials: 'include' });
      if (!contestRes.ok) throw new Error('Contest not found');
      const contestResult = await contestRes.json();
      if (contestResult.success && contestResult.data) {
        const c = contestResult.data;
        setContest({
          id: c.id,
          title: c.title,
          shortDescription: c.shortDescription || '',
          image: c.image || '/images/assets/bass-clown-co-fish-chase.png',
          prize: c.prize || 'Prize TBD',
          endDate: c.endDate || '',
          submissionDeadline: c.submissionDeadline || '',
          category: c.category || 'General',
          status: c.status || 'open',
        });
      }

      // Fetch user's application for this contest
      const applyRes = await fetch(`/api/contests/${params.id}/apply`, {
        method: 'GET',
        credentials: 'include',
      });
      if (applyRes.ok) {
        const applyResult = await applyRes.json();
        if (applyResult.data?.application) {
          setApplication(applyResult.data.application);
        }
      }

      // Fetch user's submission for this contest
      try {
        const subRes = await fetch(`/api/contests/${params.id}/submissions?mine=true`, {
          credentials: 'include',
        });
        if (subRes.ok) {
          const subResult = await subRes.json();
          if (subResult.data?.submissions?.[0]) {
            setSubmission(subResult.data.submissions[0]);
          }
        }
      } catch {
        // Submissions endpoint may not exist yet - that's ok
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contest data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Contest or application not found.'}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/my-contests">Back to My Contests</Link>
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getProgressValue = () => {
    if (!application) return 0;
    if (application.status === 'rejected') return 100;
    if (application.status === 'pending') return 25;
    if (application.status === 'approved' && !submission) return 50;
    if (submission?.status === 'submitted') return 75;
    if (submission?.status === 'under_review') return 85;
    if (submission?.status === 'approved' || submission?.status === 'rejected') return 100;
    return 25;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/my-contests">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Contests
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Contest Header */}
          <Card>
            <CardContent className="p-0">
              {contest.image && (
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <Image src={contest.image} alt={contest.title} fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{contest.title}</h1>
                    <p className="text-gray-600">{contest.shortDescription}</p>
                  </div>
                  <Badge variant="outline">{contest.category}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    <span>{contest.prize}</span>
                  </div>
                  {contest.endDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Ends {new Date(contest.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Contest Progress</CardTitle>
              <CardDescription>Track your progress through the contest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{getProgressValue()}%</span>
                  </div>
                  <Progress value={getProgressValue()} className="mb-4" />
                </div>

                <div className="space-y-4">
                  {application && (
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Application Submitted</h4>
                        <p className="text-sm text-gray-600">
                          Applied on {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                        <Badge className={`mt-1 ${application.status === 'approved' ? 'bg-green-500' : application.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>
                          {application.status}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {application?.status === 'approved' && (
                    <div className="flex items-start gap-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${submission ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {submission ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Upload className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Content Submission</h4>
                        {submission ? (
                          <div>
                            <p className="text-sm text-gray-600">
                              Submitted on {new Date(submission.createdAt).toLocaleDateString()}
                            </p>
                            <Badge className="mt-1 bg-blue-500 text-white">
                              {submission.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">Ready to submit your content</p>
                        )}
                      </div>
                    </div>
                  )}

                  {submission && (
                    <div className="flex items-start gap-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${submission.status === 'approved' || submission.status === 'rejected' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                        <Clock className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Judging & Review</h4>
                        {submission.score !== null ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">Score: {submission.score}/100</span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">Under review by judges</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          {application?.responses && Object.keys(application.responses).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(application.responses).map(([key, value]) => (
                  <div key={key}>
                    <h4 className="font-medium mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <p className="text-sm text-gray-700">{value}</p>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Submission Details */}
          {submission && (
            <Card>
              <CardHeader>
                <CardTitle>Submission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Title</h4>
                  <p className="text-sm text-gray-700">{submission.title}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-700">{submission.description}</p>
                </div>
                {submission.feedback && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Judge Feedback</h4>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">{submission.feedback}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href={`/contests/${contest.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Contest Details
                </Link>
              </Button>
              {application?.status === 'approved' && !submission && (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/contests/${contest.id}/submit`}>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Content
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link href="/content-contests">Browse More Contests</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Application</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(application.status)}
                    <span className="text-sm font-medium capitalize">{application.status}</span>
                  </div>
                </div>
              )}
              {submission && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Submission</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(submission.status)}
                    <span className="text-sm font-medium">{submission.status.replace('_', ' ')}</span>
                  </div>
                </div>
              )}
              <Separator />
              <div className="space-y-2 text-sm">
                {application && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Applied</span>
                    <span>{new Date(application.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
                {submission && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted</span>
                    <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {contest.submissionDeadline && (
            <Card>
              <CardHeader>
                <CardTitle>Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Submission Deadline</span>
                  <span>{new Date(contest.submissionDeadline).toLocaleDateString()}</span>
                </div>
                {contest.endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contest Ends</span>
                    <span>{new Date(contest.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
