'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Gift, AlertCircle, Crown, Loader2 } from 'lucide-react';
import { giveawayEntrySchema, GiveawayEntryValues, Giveaway } from '@/lib/types';

interface GiveawayEntryFormProps {
  giveaway: Giveaway;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GiveawayEntryForm({ giveaway, onSuccess, onError }: GiveawayEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<GiveawayEntryValues>({
    resolver: zodResolver(giveawayEntrySchema),
    defaultValues: {
      agreedToTerms: false,
      emailOptIn: false,
      shareOnSocial: false,
    },
  });

  const onSubmit = async (data: GiveawayEntryValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/giveaways/${giveaway.id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          entryType: 'free'
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to submit entry. Please try again.');
      }

      const result = await response.json();
      
      if (result.success) {
        setIsSubmitted(true);
        onSuccess?.();
      } else {
        throw new Error(result.message || 'Failed to submit entry');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">Entry Confirmed!</h3>
              <p className="text-sm text-green-700 mt-1">
                You've successfully entered the {giveaway.title} giveaway!
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 text-left">
              <h4 className="font-medium text-green-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• You'll receive a confirmation email shortly</li>
                <li>• Winners will be announced on {giveaway.endDate.toLocaleDateString()}</li>
                <li>• Check your email and our website for results</li>
                <li>• Good luck! 🍀</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Enter Giveaway
        </CardTitle>
        <CardDescription>
          Fill out the form below to enter this exciting giveaway!
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Giveaway Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Giveaway Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Prize Value:</span>
                  <span className="font-medium text-blue-900 ml-2">{giveaway.prizeValue}</span>
                </div>
                <div>
                  <span className="text-blue-600">Entries:</span>
                  <span className="font-medium text-blue-900 ml-2">
                    {giveaway.entryCount} / {giveaway.maxEntries}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Ends:</span>
                  <span className="font-medium text-blue-900 ml-2">
                    {giveaway.endDate.toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Your Odds:</span>
                  <span className="font-medium text-blue-900 ml-2">
                    1 in {giveaway.entryCount + 1}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Entry Options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="emailOptIn"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        Email notifications (optional)
                      </FormLabel>
                      <p className="text-sm text-gray-600">
                        Get notified about new giveaways and contest updates
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shareOnSocial"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        Share on social media (optional)
                      </FormLabel>
                      <p className="text-sm text-gray-600">
                        Share this giveaway on social media for bonus entries
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Terms Agreement */}
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
                    <FormLabel className="text-sm font-medium">
                      I agree to the terms and conditions *
                    </FormLabel>
                    <p className="text-sm text-gray-600">
                      By entering this giveaway, you agree to our terms and conditions, privacy policy, and giveaway rules.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entering Giveaway...
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-4 w-4" />
                  Enter Giveaway
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              One entry per person. Winner will be selected randomly and notified via email.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 