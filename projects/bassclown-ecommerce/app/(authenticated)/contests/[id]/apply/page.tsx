'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Contest, ContestApplicationValues } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ContestApplicationForm from '@/components/contests/ContestApplicationForm';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Trophy, Calendar, Crown } from 'lucide-react';
import Link from 'next/link';

export default function ContestApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [membershipRequired, setMembershipRequired] = useState(false);
  const [membershipMessage, setMembershipMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetchContestAndStatus();
    }
  }, [params?.id]);

  const fetchContestAndStatus = async () => {
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
          description: c.description || '',
          shortDescription: c.shortDescription || '',
          image: c.image || '/images/assets/bass-clown-co-fish-chase.png',
          prize: c.prize || 'Prize TBD',
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
          createdBy: c.createdBy || '',
          createdAt: c.createdAt || '',
          updatedAt: c.updatedAt || '',
        });
      }

      // Check application status + membership
      const applyRes = await fetch(`/api/contests/${params.id}/apply`, {
        method: 'GET',
        credentials: 'include',
      });

      if (applyRes.ok) {
        const applyResult = await applyRes.json();
        if (applyResult.data) {
          setHasExistingApplication(!!applyResult.data.hasExistingApplication);
          setMembershipRequired(!!applyResult.data.membershipRequired);
          setMembershipMessage(applyResult.data.membershipMessage || '');
        }
      } else if (applyRes.status === 403) {
        const r = await applyRes.json();
        setMembershipRequired(true);
        setMembershipMessage(r.message || 'Active membership required to apply.');
      }
    } catch (err) {
      console.error('Error fetching contest:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contest');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSubmit = async (values: ContestApplicationValues) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/contests/${params.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to submit application');
      }

      // Success is handled by the form component
    } catch (err) {
      console.error('Application submission failed:', err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-64" />
          </div>
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
            {error || 'Contest not found. Please check the URL and try again.'}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/content-contests">Browse Contests</Link>
        </Button>
      </div>
    );
  }

  const applicationDeadline = contest.applicationDeadline ? new Date(contest.applicationDeadline) : null;
  const isDeadlinePassed = applicationDeadline ? new Date() > applicationDeadline : false;
  const isContestFull = contest.maxParticipants > 0 && contest.currentParticipants >= contest.maxParticipants;

  if (membershipRequired) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="outline" className="mb-6">
          <Link href={`/contests/${contest.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contest
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Crown className="w-5 h-5" />
              Membership Required
            </CardTitle>
            <CardDescription>
              You need an active membership to apply to contests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {membershipMessage || 'An active Bass Clown Co membership ($9.99/month) is required to apply to content creation contests. Become a member to unlock contest applications, giveaway entries, and more!'}
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/settings">Get Membership</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/contests/${contest.id}`}>View Contest Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasExistingApplication) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="outline" className="mb-6">
          <Link href={`/contests/${contest.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contest
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Application Already Submitted
            </CardTitle>
            <CardDescription>
              You have already submitted an application for this contest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Your application for &quot;{contest.title}&quot; is currently under review.
              You&apos;ll receive a notification once your application has been reviewed.
            </p>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link href={`/contests/${contest.id}`}>View Contest Details</Link>
              </Button>
              <Button asChild>
                <Link href="/my-contests">View My Applications</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDeadlinePassed) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="outline" className="mb-6">
          <Link href={`/contests/${contest.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contest
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Application Deadline Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              The application deadline for &quot;{contest.title}&quot; was {applicationDeadline?.toLocaleDateString()}.
              New applications are no longer being accepted.
            </p>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link href={`/contests/${contest.id}`}>View Contest Details</Link>
              </Button>
              <Button asChild>
                <Link href="/content-contests">Browse Other Contests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isContestFull) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="outline" className="mb-6">
          <Link href={`/contests/${contest.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contest
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5" />
              Contest Full
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              &quot;{contest.title}&quot; has reached its maximum capacity of {contest.maxParticipants} participants.
            </p>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link href={`/contests/${contest.id}`}>View Contest Details</Link>
              </Button>
              <Button asChild>
                <Link href="/content-contests">Browse Other Contests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="outline" className="mb-6">
        <Link href={`/contests/${contest.id}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contest
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ContestApplicationForm
            contest={contest}
            onSubmit={handleApplicationSubmit}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{contest.title}</CardTitle>
              <CardDescription>{contest.shortDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Prize</p>
                  <p className="font-semibold">{contest.prize}</p>
                </div>
              </div>
              {applicationDeadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Application Deadline</p>
                    <p className="font-semibold">{applicationDeadline.toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              {contest.submissionDeadline && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Submission Deadline</p>
                    <p className="font-semibold">{new Date(contest.submissionDeadline).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline">{contest.category}</Badge>
                <Badge className="bg-green-500 text-white">
                  {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Be specific about your experience and skills</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Include links to your best portfolio work</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Explain your creative vision clearly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>List all relevant equipment you have</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Double-check all information before submitting</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {[
                  { step: '1', title: 'Submit Application', desc: 'Complete and submit your application form' },
                  { step: '2', title: 'Review (2-3 days)', desc: 'Our team reviews your application' },
                  { step: '3', title: 'Notification', desc: 'Email notification of approval/rejection' },
                  { step: '4', title: 'Start Creating', desc: 'If approved, begin working on your submission' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-blue-600">{item.step}</span>
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
