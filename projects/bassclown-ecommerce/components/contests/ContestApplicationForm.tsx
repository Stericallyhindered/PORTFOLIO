'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Contest, ContestApplicationValues, contestApplicationSchema } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface ContestApplicationFormProps {
  contest: Contest;
  onSubmit: (values: ContestApplicationValues) => Promise<void>;
}

export default function ContestApplicationForm({ contest, onSubmit }: ContestApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const form = useForm<ContestApplicationValues>({
    resolver: zodResolver(contestApplicationSchema),
    defaultValues: {
      experience: '',
      portfolio: '',
      motivation: '',
      equipment: '',
      availability: '',
      additionalInfo: '',
      agreedToTerms: false,
    },
  });

  const handleSubmit = async (values: ContestApplicationValues) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      await onSubmit(values);
      setSubmitStatus('success');
      form.reset();
    } catch (error) {
      setSubmitStatus('error');
      console.error('Application submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applicationDeadline = new Date(contest.applicationDeadline);
  const isDeadlinePassed = new Date() > applicationDeadline;

  if (isDeadlinePassed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Application Deadline Passed</CardTitle>
          <CardDescription>
            The application deadline for this contest was {applicationDeadline.toLocaleDateString()}.
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
            Application Submitted Successfully
          </CardTitle>
          <CardDescription>
            Your application for "{contest.title}" has been submitted and is now under review.
            You'll receive an email notification once your application has been reviewed.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for {contest.title}</CardTitle>
        <CardDescription>
          Complete the application form below to participate in this contest.
          All fields are required unless marked as optional.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {submitStatus === 'error' && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There was an error submitting your application. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Contest Requirements</h3>
          <div className="space-y-2">
            {contest.requirements.map((requirement, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
                <span className="text-sm">{requirement}</span>
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relevant Experience</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your relevant experience in fishing, video production, or related fields..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 50 characters. Tell us about your background and experience.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="portfolio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share a link to your portfolio, website, or relevant work samples.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why do you want to participate?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us what motivates you to participate in this contest..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 100 characters. Explain your motivation and what you hope to achieve.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment & Tools</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the equipment and tools you have access to..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    List your camera equipment, editing software, and any other relevant tools.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Availability</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your availability for the contest period..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Let us know your availability during the contest period and any scheduling constraints.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information you'd like to share..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share any additional information that might be relevant to your application.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agreedToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the terms and conditions
                    </FormLabel>
                    <FormDescription>
                      By checking this box, you agree to the contest rules and terms of participation.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 