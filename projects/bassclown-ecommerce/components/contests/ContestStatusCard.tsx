'use client';

import { Contest, ContestApplication, ContestSubmission } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, XCircle, AlertCircle, Upload, Eye, Trophy } from 'lucide-react';
import Link from 'next/link';

interface ContestStatusCardProps {
  contest: Contest;
  application?: ContestApplication;
  submission?: ContestSubmission;
}

const getApplicationStatusIcon = (status: ContestApplication['status']) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-yellow-500" />;
  }
};

const getApplicationStatusColor = (status: ContestApplication['status']) => {
  switch (status) {
    case 'approved':
      return 'bg-green-500';
    case 'rejected':
      return 'bg-red-500';
    default:
      return 'bg-yellow-500';
  }
};

const getSubmissionStatusIcon = (status: ContestSubmission['status']) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'under_review':
      return <AlertCircle className="w-4 h-4 text-blue-500" />;
    default:
      return <Upload className="w-4 h-4 text-gray-500" />;
  }
};

const getSubmissionStatusColor = (status: ContestSubmission['status']) => {
  switch (status) {
    case 'approved':
      return 'bg-green-500';
    case 'rejected':
      return 'bg-red-500';
    case 'under_review':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

export default function ContestStatusCard({ contest, application, submission }: ContestStatusCardProps) {
  const applicationDeadline = new Date(contest.applicationDeadline);
  const submissionDeadline = new Date(contest.submissionDeadline);
  const isApplicationApproved = application?.status === 'approved';
  const canSubmit = isApplicationApproved && contest.status === 'open' && new Date() <= submissionDeadline;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{contest.title}</CardTitle>
            <CardDescription className="mt-1">
              {contest.category} • Prize: {contest.prize}
            </CardDescription>
          </div>
                     <Badge variant="outline">
             {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
           </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Application Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">Application Status</h4>
            {application && getApplicationStatusIcon(application.status)}
          </div>
          
          {application ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Applied: {new Date(application.applicationDate).toLocaleDateString()}
                </span>
                <Badge className={`${getApplicationStatusColor(application.status)} text-white`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </div>
              
              {application.status === 'rejected' && application.rejectionReason && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Rejection Reason:</strong> {application.rejectionReason}
                  </p>
                </div>
              )}
              
              {application.status === 'approved' && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Congratulations!</strong> Your application has been approved. 
                    You can now submit your content.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No application submitted
            </div>
          )}
        </div>

        <Separator />

        {/* Submission Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">Submission Status</h4>
            {submission && getSubmissionStatusIcon(submission.status)}
          </div>
          
          {submission ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Submitted: {new Date(submission.submissionDate).toLocaleDateString()}
                </span>
                <Badge className={`${getSubmissionStatusColor(submission.status)} text-white`}>
                  {submission.status.replace('_', ' ').charAt(0).toUpperCase() + submission.status.slice(1)}
                </Badge>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">{submission.title}</p>
                <p className="text-sm text-gray-600 mt-1">{submission.description}</p>
              </div>
              
              {submission.feedback && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Feedback:</strong> {submission.feedback}
                  </p>
                </div>
              )}
              
              {submission.score && (
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Score: {submission.score}/100</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              {isApplicationApproved ? 'No submission yet' : 'Application must be approved first'}
            </div>
          )}
        </div>

        <Separator />

        {/* Important Dates */}
        <div>
          <h4 className="font-semibold mb-2">Important Dates</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Application Deadline:</span>
              <span className={new Date() > applicationDeadline ? 'text-red-500' : ''}>
                {applicationDeadline.toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Submission Deadline:</span>
              <span className={new Date() > submissionDeadline ? 'text-red-500' : ''}>
                {submissionDeadline.toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Contest Ends:</span>
              <span>{new Date(contest.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/contests/${contest.id}`}>
              <Eye className="w-4 h-4 mr-2" />
              View Contest
            </Link>
          </Button>
          
          {canSubmit && !submission && (
            <Button asChild className="flex-1">
              <Link href={`/contests/${contest.id}/submit`}>
                <Upload className="w-4 h-4 mr-2" />
                Submit Content
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 