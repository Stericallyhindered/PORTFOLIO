'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Edit, Eye, Calendar, Users, Trophy, Clock, Star, FileText, Settings, BarChart3, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface ContestData {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  prize: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  submissionDeadline: string;
  status: string;
  category: string;
  requirements: string[];
  judges: string[];
  maxParticipants: number;
  currentParticipants: number;
  rules: string;
  submissionGuidelines: string;
  brandName: string | null;
}

export default function BrandContestDetailsPage() {
  const params = useParams();
  const contestId = params?.id as string;
  const [contest, setContest] = useState<ContestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (contestId) fetchContest();
  }, [contestId]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contests/${contestId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Contest not found');
      const result = await response.json();
      if (result.success && result.data) {
        const c = result.data;
        setContest({
          id: c.id,
          title: c.title,
          description: c.description || '',
          shortDescription: c.shortDescription || '',
          image: c.image || '',
          prize: c.prize || 'TBD',
          startDate: c.startDate || '',
          endDate: c.endDate || '',
          applicationDeadline: c.applicationDeadline || '',
          submissionDeadline: c.submissionDeadline || '',
          status: c.status || 'open',
          category: c.category || 'General',
          requirements: Array.isArray(c.requirements) ? c.requirements : [],
          judges: Array.isArray(c.judges) ? c.judges : [],
          maxParticipants: c.maxParticipants || 0,
          currentParticipants: c.currentParticipants || 0,
          rules: c.rules || '',
          submissionGuidelines: c.submissionGuidelines || '',
          brandName: c.brandName || null,
        });
      }
    } catch (err) {
      console.error('Error fetching contest:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">Contest not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/brand-contests">Back to Contests</Link>
        </Button>
      </div>
    );
  }

  const participationRate = contest.maxParticipants > 0 ? (contest.currentParticipants / contest.maxParticipants) * 100 : 0;
  const daysRemaining = contest.endDate ? Math.ceil((new Date(contest.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/brand-contests">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contests
        </Link>
      </Button>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contest.title}</h1>
            <p className="text-gray-600 mt-2">{contest.shortDescription}</p>
            <div className="flex items-center gap-2 mt-4">
              <Badge variant={contest.status === 'open' ? 'default' : 'secondary'}>{contest.status}</Badge>
              <Badge variant="outline">{contest.category}</Badge>
              {contest.brandName && <Badge variant="outline">{contest.brandName}</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/content-contests`}>
                <Eye className="w-4 h-4 mr-2" />
                View Public
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="text-2xl font-bold">{contest.currentParticipants}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              {contest.maxParticipants > 0 && (
                <>
                  <Progress value={participationRate} className="mt-2" />
                  <p className="text-xs text-gray-500 mt-1">{contest.currentParticipants} of {contest.maxParticipants} max</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Days Remaining</p>
                  <p className="text-2xl font-bold">{daysRemaining > 0 ? daysRemaining : 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              {contest.endDate && <p className="text-xs text-gray-500 mt-1">Until {new Date(contest.endDate).toLocaleDateString()}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Prize Value</p>
                  <p className="text-2xl font-bold">{contest.prize}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-2xl font-bold capitalize">{contest.status}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Requirements</TabsTrigger>
            <TabsTrigger value="judging">Judging</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Contest Details</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Description</h4>
                      <p className="text-gray-600">{contest.description}</p>
                    </div>
                    {contest.rules && (
                      <div>
                        <h4 className="font-semibold text-gray-900">Rules</h4>
                        <p className="text-gray-600">{contest.rules}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contest.startDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Contest Start</span>
                        <span className="font-semibold">{new Date(contest.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {contest.applicationDeadline && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Application Deadline</span>
                        <span className="font-semibold">{new Date(contest.applicationDeadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    {contest.submissionDeadline && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Submission Deadline</span>
                        <span className="font-semibold">{new Date(contest.submissionDeadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    {contest.endDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Contest End</span>
                        <span className="font-semibold">{new Date(contest.endDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Requirements</CardTitle></CardHeader>
              <CardContent>
                {contest.requirements.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {contest.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No specific requirements listed.</p>
                )}
              </CardContent>
            </Card>
            {contest.submissionGuidelines && (
              <Card>
                <CardHeader><CardTitle>Submission Guidelines</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-gray-600">{contest.submissionGuidelines}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="judging">
            <Card>
              <CardHeader>
                <CardTitle>Judging Panel</CardTitle>
                <CardDescription>Judges for this contest</CardDescription>
              </CardHeader>
              <CardContent>
                {contest.judges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {contest.judges.map((judge, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <h5 className="font-semibold">{judge}</h5>
                            <p className="text-sm text-gray-600">Judge</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No judges assigned yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
