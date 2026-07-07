'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Contest, ContestSubmissionValues } from '@/lib/types';
import ContestSubmissionForm from '@/components/contests/ContestSubmissionForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Users, 
  FileText, 
  AlertTriangle, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  Upload
} from 'lucide-react';
import Link from 'next/link';

export default function ContestSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{
    canSubmit: boolean;
    submission?: {
      title: string;
      status: string;
      createdAt: string;
    };
  } | null>(null);

  useEffect(() => {
    const fetchContestAndStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch contest details
        const contestResponse = await fetch(`/api/contests/${params.id}`);
        if (!contestResponse.ok) {
          throw new Error('Failed to fetch contest');
        }
        const contestResult = await contestResponse.json();
        if (contestResult.success && contestResult.data) {
          const contestData = contestResult.data;
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

        // Fetch submission status
        const statusResponse = await fetch(`/api/contests/${params.id}/submit`);
        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          if (statusResult.success && statusResult.data) {
            setSubmissionStatus(statusResult.data);
            setIsApproved(statusResult.data.canSubmit || false);
            setHasExistingSubmission(!!statusResult.data.submission);
          }
        }
      } catch (err) {
        console.error('Error fetching contest data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contest');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchContestAndStatus();
    }
  }, [params.id]);

  const uploadFile = async (file: File): Promise<string> => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (isVideo) {
      // Upload video using the video upload API
      const response = await fetch(`/api/upload/video?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload video');
      }
      
      const data = await response.json();
      return data.data.upload.url;
    } else if (isImage) {
      // Upload image using the image upload API
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }
      
      const data = await response.json();
      return data.data.url;
    } else {
      throw new Error('Unsupported file type. Please upload a video or image file.');
    }
  };

  const handleSubmissionSubmit = async (values: ContestSubmissionValues) => {
    try {
      if (!values.file) {
        throw new Error('Please select a file to upload');
      }

      // Show upload progress
      toast({
        title: "Uploading file...",
        description: "Please wait while we upload your submission",
      });

      // Upload the file first
      const fileUrl = await uploadFile(values.file);
      
      // Determine file type
      let fileType: 'video' | 'image' | 'document' = 'document';
      if (values.file.type.startsWith('video/')) {
        fileType = 'video';
      } else if (values.file.type.startsWith('image/')) {
        fileType = 'image';
      }

      // Submit the contest entry
      const submissionData = {
        title: values.title,
        description: values.description,
        fileUrl: fileUrl,
        fileType: fileType,
        tags: values.tags || '',
        additionalNotes: values.additionalNotes || ''
      };

      const response = await fetch(`/api/contests/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit entry');
      }

      const data = await response.json();
      
      toast({
        title: "Success!",
        description: "Your submission has been uploaded successfully",
      });

      // Redirect to contest page or show success state
      router.push(`/contests/${params.id}`);
      
    } catch (error) {
      console.error('Submission upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload submission",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading contest details...</span>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contest Not Found</h1>
          <p className="text-gray-600 mb-4">The contest you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild>
            <Link href="/contests">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contests
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const submissionDeadline = new Date(contest.submissionDeadline);
  const isSubmissionOpen = now <= submissionDeadline && contest.status === 'open';

  if (hasExistingSubmission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button asChild variant="outline">
              <Link href={`/contests/${contest.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contest
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <CardTitle className="text-green-700">Submission Already Submitted</CardTitle>
              </div>
              <CardDescription>
                You have already submitted an entry for this contest.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissionStatus?.submission && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Your Submission</h3>
                    <p className="text-gray-600">Title: {submissionStatus.submission.title}</p>
                    <p className="text-gray-600">Status: {submissionStatus.submission.status}</p>
                    <p className="text-gray-600">
                      Submitted: {new Date(submissionStatus.submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button asChild>
                      <Link href="/dashboard/contests">View My Submissions</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/contests/${contest.id}`}>Back to Contest</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button asChild variant="outline">
              <Link href={`/contests/${contest.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contest
              </Link>
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You need an approved application to submit content for this contest. 
              Please apply for the contest first.
            </AlertDescription>
          </Alert>

          <div className="mt-6">
            <Button asChild>
              <Link href={`/contests/${contest.id}/apply`}>
                Apply for Contest
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isSubmissionOpen) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button asChild variant="outline">
              <Link href={`/contests/${contest.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contest
              </Link>
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {now > submissionDeadline 
                ? 'The submission deadline has passed for this contest.'
                : 'This contest is not currently accepting submissions.'
              }
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="outline" className="mb-4">
            <Link href={`/contests/${contest.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contest
            </Link>
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Your Entry</h1>
              <p className="text-gray-600">Contest: {contest.title}</p>
            </div>
            <Badge variant="secondary">
              <Clock className="w-4 h-4 mr-1" />
              {Math.ceil((submissionDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days left
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <ContestSubmissionForm 
              contest={contest} 
              onSubmit={handleSubmissionSubmit}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contest Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Contest Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Prize</h4>
                  <p className="text-gray-600">{contest.prize}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Submission Deadline</h4>
                  <p className="text-gray-600">
                    {new Date(contest.submissionDeadline).toLocaleDateString()}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Participants</h4>
                  <p className="text-gray-600">
                    {contest.currentParticipants} / {contest.maxParticipants}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Judging Criteria */}
            <Card>
              <CardHeader>
                <CardTitle>Judging Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Technical Skill</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Video Quality</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Creativity</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Educational Value</span>
                    <span className="font-semibold">20%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li>• Ensure good lighting and audio quality</li>
                  <li>• Keep file size under 500MB</li>
                  <li>• Use MP4 format for best compatibility</li>
                  <li>• Test your video before uploading</li>
                  <li>• Include clear narration or captions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
