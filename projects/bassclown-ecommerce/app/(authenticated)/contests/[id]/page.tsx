'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Contest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Users, 
  Trophy, 
  Clock, 
  MapPin, 
  FileText, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Share2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ContestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContest = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/contests/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch contest');
        }
        const result = await response.json();
        if (result.success && result.data) {
          const contestData = result.data;
          setContest({
            id: contestData.id,
            title: contestData.title,
            description: contestData.description || '',
            shortDescription: contestData.shortDescription || contestData.description?.substring(0, 100) || '',
            image: contestData.image || '/images/assets/bass-clown-co-fish-chase.png',
            prize: contestData.prize || 'Prize TBD',
            startDate: contestData.startDate ? new Date(contestData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: contestData.endDate ? new Date(contestData.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            applicationDeadline: contestData.applicationDeadline ? new Date(contestData.applicationDeadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            submissionDeadline: contestData.submissionDeadline ? new Date(contestData.submissionDeadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            status: contestData.status || 'open',
            category: contestData.category || 'General',
            requirements: Array.isArray(contestData.requirements) ? contestData.requirements : 
                          typeof contestData.requirements === 'object' && contestData.requirements !== null 
                            ? Object.values(contestData.requirements) as string[]
                            : [],
            judges: Array.isArray(contestData.judges) ? contestData.judges : 
                    typeof contestData.judges === 'object' && contestData.judges !== null
                      ? Object.values(contestData.judges) as string[]
                      : [],
            maxParticipants: contestData.maxParticipants || 100,
            currentParticipants: contestData.currentParticipants || 0,
            rules: contestData.rules || '',
            submissionGuidelines: contestData.submissionGuidelines || '',
            createdBy: contestData.createdBy || contestData.creatorName || 'Bass Clown Co',
            createdAt: contestData.createdAt ? new Date(contestData.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: contestData.updatedAt ? new Date(contestData.updatedAt).toISOString() : new Date().toISOString()
          });
        } else {
          throw new Error('Contest not found');
        }
      } catch (err) {
        console.error('Error fetching contest:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contest');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchContest();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-8"></div>
        </div>
      </div>
    );
  }

  if (error || (!loading && !contest)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Contest not found. Please check the URL and try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!contest) {
    return null;
  }

  const applicationDeadline = new Date(contest.applicationDeadline);
  const submissionDeadline = new Date(contest.submissionDeadline);
  const endDate = new Date(contest.endDate);
  const now = new Date();
  
  const isApplicationOpen = now <= applicationDeadline && contest.status === 'open';
  const isSubmissionOpen = now <= submissionDeadline && contest.status === 'open';
  const participationRate = (contest.currentParticipants / contest.maxParticipants) * 100;

  const getStatusIcon = () => {
    switch (contest.status) {
      case 'open':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'judging':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <Trophy className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (contest.status) {
      case 'open':
        return 'bg-green-500';
      case 'closed':
        return 'bg-red-500';
      case 'judging':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const shareContest = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: contest.title,
          text: contest.shortDescription,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contests
        </Button>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{contest.title}</h1>
              {getStatusIcon()}
            </div>
            <p className="text-gray-600 mb-4">{contest.shortDescription}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{contest.category}</Badge>
              <Badge className={`${getStatusColor()} text-white`}>
                {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={shareContest}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            {isApplicationOpen && (
              <Button asChild>
                <Link href={`/contests/${contest.id}/apply`}>
                  Apply Now
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contest Image */}
          <Card>
            <CardContent className="p-0">
              <Image
                src={contest.image}
                alt={contest.title}
                width={800}
                height={400}
                className="w-full h-64 object-cover rounded-t-lg"
              />
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Contest</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {contest.description}
              </p>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {contest.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Rules & Regulations</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap text-gray-700 font-sans">
                {contest.rules}
              </pre>
            </CardContent>
          </Card>

          {/* Submission Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap text-gray-700 font-sans">
                {contest.submissionGuidelines}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contest Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Contest Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Prize</p>
                  <p className="font-semibold">{contest.prize}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="font-semibold">
                    {contest.currentParticipants} / {contest.maxParticipants}
                  </p>
                  <Progress value={participationRate} className="mt-2" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Application Deadline</p>
                    <p className="font-semibold">
                      {applicationDeadline.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Submission Deadline</p>
                    <p className="font-semibold">
                      {submissionDeadline.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Contest Ends</p>
                    <p className="font-semibold">
                      {endDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Judges */}
          <Card>
            <CardHeader>
              <CardTitle>Judges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {contest.judges.map((judge, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {judge.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{judge}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            {isApplicationOpen ? (
              <Button asChild className="w-full">
                <Link href={`/contests/${contest.id}/apply`}>
                  Apply for Contest
                </Link>
              </Button>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {now > applicationDeadline 
                    ? 'Application deadline has passed'
                    : 'Contest is not accepting applications'
                  }
                </AlertDescription>
              </Alert>
            )}
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/contests">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Contests
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 