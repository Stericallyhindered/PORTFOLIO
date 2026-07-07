'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  MessageCircle,
  Save,
  ArrowLeft,
  ArrowRight,
  Eye,
  Download,
  Flag,
  Check,
  X,
  Loader2
} from 'lucide-react';

interface Submission {
  id: string;
  contestId: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  status: string;
  score: string | null;
  feedback: string | null;
  judgeNotes: string | null;
  userName: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface JudgingCriteria {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
}

interface ExistingJudging {
  criteriaScores?: {
    technique: number;
    creativity: number;
    video_quality: number;
    entertainment: number;
    adherence: number;
  };
  overallRating?: number;
  totalScore?: number;
  judgeNotes?: string;
}

export default function JudgingInterfacePage() {
  const params = useParams();
  const contestId = params.id as string;
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<{[key: string]: number}>({});
  const [comments, setComments] = useState('');
  const [overallRating, setOverallRating] = useState(0);
  const [judgeStatus, setJudgeStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [judgeNotes, setJudgeNotes] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [judgingCriteria, setJudgingCriteria] = useState<JudgingCriteria[]>([]);
  const [existingJudging, setExistingJudging] = useState<ExistingJudging | null>(null);

  const currentSubmission = submissions[currentIndex];

  // Load submissions for the contest
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch(`/api/contests/${contestId}/submissions`);
        if (!response.ok) throw new Error('Failed to fetch submissions');
        
        const data = await response.json();
        setSubmissions(data.data.submissions || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast({
          title: "Error",
          description: "Failed to load submissions",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [contestId]);

  // Load submission details for judging when current submission changes
  useEffect(() => {
    if (currentSubmission) {
      const fetchSubmissionDetails = async () => {
        try {
          const response = await fetch(`/api/contests/${contestId}/submissions/${currentSubmission.id}/judge`);
          if (!response.ok) throw new Error('Failed to fetch submission details');
          
          const data = await response.json();
          setJudgingCriteria(data.data.judgingCriteria || []);
          setExistingJudging(data.data.existingJudging);
          
          // If there's existing judging data, populate the form
          if (data.data.existingJudging) {
            const existing = data.data.existingJudging;
            if (existing.criteriaScores) {
              setScores(existing.criteriaScores);
            }
            if (existing.overallRating) {
              setOverallRating(existing.overallRating);
            }
            if (existing.judgeNotes) {
              setJudgeNotes(existing.judgeNotes);
            }
            if (currentSubmission.feedback) {
              setComments(currentSubmission.feedback);
            }
            if (currentSubmission.status) {
              setJudgeStatus(currentSubmission.status as 'pending' | 'approved' | 'rejected');
            }
          }
        } catch (error) {
          console.error('Error fetching submission details:', error);
          toast({
            title: "Error",
            description: "Failed to load submission details",
            variant: "destructive",
          });
        }
      };

      fetchSubmissionDetails();
    }
  }, [currentSubmission, contestId]);

  const handleScoreChange = (criteriaId: string, value: number[]) => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: value[0]
    }));
  };

  const calculateTotalScore = () => {
    return judgingCriteria.reduce((total, criteria) => {
      const score = scores[criteria.id] || 0;
      return total + (score * criteria.weight / 100);
    }, 0);
  };

  const handleSubmitJudgment = async () => {
    if (!currentSubmission) return;
    
    // Validate required fields
    if (Object.keys(scores).length === 0 || overallRating === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide scores for all criteria and an overall rating",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/contests/${contestId}/submissions/${currentSubmission.id}/judge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scores,
          comments,
          overallRating,
          status: judgeStatus,
          judgeNotes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit judgment');
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Judgment submitted successfully",
      });

      // Update the submission in the local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === currentSubmission.id 
          ? { ...sub, status: judgeStatus, score: data.data.judging.totalScore.toString(), feedback: comments }
          : sub
      ));

      // Move to next submission
      if (currentIndex < submissions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        resetJudgingForm();
      }
    } catch (error) {
      console.error('Error submitting judgment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit judgment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetJudgingForm = () => {
    setScores({});
    setComments('');
    setOverallRating(0);
    setJudgeStatus('pending');
    setJudgeNotes('');
    setExistingJudging(null);
  };

  const goToPreviousSubmission = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetJudgingForm();
    }
  };

  const goToNextSubmission = () => {
    if (currentIndex < submissions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetJudgingForm();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading submissions...</span>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Judging Interface</h1>
          <p className="text-gray-600">No submissions found for this contest.</p>
        </div>
      </div>
    );
  }

  if (!currentSubmission) {
    return <div>No submissions found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Judging Interface</h1>
            <p className="text-gray-600 mt-2">
              Submission {currentIndex + 1} of {submissions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={goToPreviousSubmission} disabled={currentIndex === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button variant="outline" onClick={goToNextSubmission} disabled={currentIndex === submissions.length - 1}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player and Submission Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4 relative">
                  {currentSubmission.fileType === 'video' ? (
                    <video 
                      src={currentSubmission.fileUrl} 
                      controls
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <img 
                      src={currentSubmission.fileUrl} 
                      alt={currentSubmission.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                </div>
                
                {/* Video Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="outline">
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submission Details */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{currentSubmission.title}</CardTitle>
                    <CardDescription className="mt-2">
                      Submitted by {currentSubmission.userName} on {new Date(currentSubmission.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    currentSubmission.status === 'approved' ? 'default' :
                    currentSubmission.status === 'rejected' ? 'destructive' :
                    currentSubmission.status === 'under_review' ? 'secondary' :
                    'outline'
                  }>
                    {currentSubmission.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-gray-700">{currentSubmission.description}</p>
                  </div>
                  
                  {existingJudging && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Previous Judgment</h4>
                      <p className="text-sm text-blue-700">
                        Total Score: {existingJudging.totalScore?.toFixed(1)}/10
                      </p>
                      {existingJudging.overallRating && (
                        <p className="text-sm text-blue-700">
                          Overall Rating: {existingJudging.overallRating}/5 stars
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scoring Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scoring Criteria</CardTitle>
                <CardDescription>Rate each criterion from 0-10</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {judgingCriteria.map((criteria) => (
                    <div key={criteria.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="font-medium">{criteria.name}</Label>
                        <span className="text-sm text-gray-500">
                          {scores[criteria.id] || 0}/{criteria.maxScore} ({criteria.weight}%)
                        </span>
                      </div>
                      <Slider
                        value={[scores[criteria.id] || 0]}
                        onValueChange={(value) => handleScoreChange(criteria.id, value)}
                        max={criteria.maxScore}
                        min={0}
                        step={0.5}
                        className="w-full"
                      />
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <Label className="font-semibold">Total Score</Label>
                      <span className="text-lg font-bold text-blue-600">
                        {calculateTotalScore().toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comments & Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="comments">Comments</Label>
                    <Textarea
                      id="comments"
                      placeholder="Provide detailed feedback..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="judge-notes">Judge Notes (Internal)</Label>
                    <Textarea
                      id="judge-notes"
                      placeholder="Internal notes for other judges..."
                      value={judgeNotes}
                      onChange={(e) => setJudgeNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="overall-rating">Overall Rating</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setOverallRating(star)}
                          className={`w-8 h-8 ${
                            star <= overallRating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                          }`}
                        >
                          <Star className="w-6 h-6" />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {overallRating > 0 ? `${overallRating}/5` : 'No rating'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Decision</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={judgeStatus} onValueChange={(value: 'pending' | 'approved' | 'rejected') => setJudgeStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="approved">Approve</SelectItem>
                      <SelectItem value="rejected">Reject</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSubmitJudgment}
                      className="flex-1"
                      disabled={Object.keys(scores).length === 0 || overallRating === 0 || submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Submit Judgment
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 