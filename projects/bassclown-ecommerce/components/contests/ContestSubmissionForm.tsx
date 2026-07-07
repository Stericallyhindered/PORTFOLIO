'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Contest, ContestSubmissionValues, contestSubmissionSchema } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Upload, FileVideo, FileImage, File } from 'lucide-react';

interface ContestSubmissionFormProps {
  contest: Contest;
  onSubmit: (values: ContestSubmissionValues) => Promise<void>;
}

export default function ContestSubmissionForm({ contest, onSubmit }: ContestSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<ContestSubmissionValues>({
    resolver: zodResolver(contestSubmissionSchema),
    defaultValues: {
      title: '',
      description: '',
      file: undefined,
      tags: '',
      additionalNotes: '',
    },
  });

  const handleSubmit = async (values: ContestSubmissionValues) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      await onSubmit(values);
      setSubmitStatus('success');
      form.reset();
      setSelectedFile(null);
    } catch (error) {
      setSubmitStatus('error');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue('file', file);
    }
  };

  const getFileIcon = (file: File | null) => {
    if (!file) return <Upload className="w-4 h-4" />;
    
    if (file.type.startsWith('video/')) {
      return <FileVideo className="w-4 h-4" />;
    } else if (file.type.startsWith('image/')) {
      return <FileImage className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const submissionDeadline = new Date(contest.submissionDeadline);
  const isDeadlinePassed = new Date() > submissionDeadline;

  if (isDeadlinePassed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Submission Deadline Passed</CardTitle>
          <CardDescription>
            The submission deadline for this contest was {submissionDeadline.toLocaleDateString()}.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (submitStatus === 'success') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            Submission Uploaded Successfully
          </CardTitle>
          <CardDescription>
            Your submission for "{contest.title}" has been uploaded and is now under review.
            You'll receive an email notification once your submission has been reviewed.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Content</CardTitle>
        <CardDescription>
          Upload your submission for "{contest.title}". Make sure to follow the submission guidelines below.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {submitStatus === 'error' && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There was an error uploading your submission. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Submission Guidelines</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap text-blue-900">
              {contest.submissionGuidelines}
            </pre>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter a title for your submission..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Give your submission a descriptive title.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your submission, creative process, or any relevant details..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 50 characters. Provide details about your submission.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Upload File</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="video/*,image/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        {getFileIcon(selectedFile)}
                        {selectedFile ? (
                          <div className="text-sm">
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <p className="font-medium">Click to upload a file</p>
                            <p className="text-gray-500">
                              Supported formats: Video, Image, PDF, DOC
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload your contest submission file. Maximum file size: 100MB.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="fishing, bass, tournament, outdoors..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add relevant tags separated by commas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about your submission..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share any additional context or information about your submission.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Once you submit your content, you cannot edit it. 
                Make sure everything is correct before submitting.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading Submission...
                </>
              ) : (
                'Submit Content'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 