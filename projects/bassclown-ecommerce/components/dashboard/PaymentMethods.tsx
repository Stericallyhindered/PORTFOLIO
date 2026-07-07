'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Plus, ExternalLink } from 'lucide-react';

export const PaymentMethods: React.FC = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/subscription', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSubscription(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManagePayments = async () => {
    // Redirect to Stripe customer portal if available, otherwise to subscription page
    try {
      const response = await fetch('/api/subscriptions', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.currentSubscription?.subscriptionId) {
          // User has a Stripe subscription - direct them to manage it
          window.location.href = '/dashboard/billing';
          return;
        }
      }
    } catch (err) {
      console.error('Error:', err);
    }
    window.location.href = '/dashboard/billing';
  };

  if (loading) {
    return (
      <Card className="bg-[#2D2D2D] border-gray-700">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasSubscription = subscription?.subscription && subscription.subscription !== 'free';
  const hasStripeCustomer = !!subscription?.stripeCustomerId;

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasStripeCustomer ? (
          <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">💳</span>
                <span className="text-white font-medium">Payment on file</span>
              </div>
              {hasSubscription && (
                <Badge variant="secondary" className="bg-green-600 text-white">Active</Badge>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Your payment method is managed through Stripe. Click below to update your payment details.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManagePayments}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              Manage Payment Methods
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-[#1A1A1A] rounded-lg border border-gray-600 text-center">
            <p className="text-gray-400 mb-3">No payment method on file</p>
            <p className="text-sm text-gray-500 mb-4">Add a payment method when you subscribe to a plan.</p>
          </div>
        )}

        {!hasSubscription && (
          <Button
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => window.location.href = '/dashboard/billing'}
          >
            <Plus className="w-4 h-4 mr-2" />
            {hasStripeCustomer ? 'Update Payment Method' : 'Subscribe & Add Payment'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
