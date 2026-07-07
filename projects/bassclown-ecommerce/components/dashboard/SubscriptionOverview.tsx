'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, CreditCard, Crown, Loader2 } from 'lucide-react';

interface SubscriptionData {
  subscription: string | null;
  subscriptionStatus: string | null;
  subscriptionPeriodEnd: string | null;
  subscriptionPeriodStart: string | null;
  isActive: boolean;
  daysRemaining: number;
  features: {
    contestParticipation: boolean;
    giveawayEntries: boolean;
    monthlyPoints: number;
    supportLevel: string;
    features: string[];
  };
}

export const SubscriptionOverview: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) return;
    try {
      setCancelling(true);
      const response = await fetch('/api/users/subscription', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        await fetchSubscription();
        alert('Subscription cancelled. You will retain access until the end of your billing period.');
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleChangePlan = () => {
    window.location.href = '/dashboard/billing';
  };

  if (loading) {
    return (
      <Card className="bg-[#2D2D2D] border-gray-700">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  const plan = subscription?.subscription || 'free';
  const status = subscription?.subscriptionStatus || 'inactive';
  const isActive = subscription?.isActive || false;
  const periodEnd = subscription?.subscriptionPeriodEnd ? new Date(subscription.subscriptionPeriodEnd) : null;
  const features = subscription?.features;

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          Current Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white capitalize">{plan} Plan</h3>
            <p className="text-gray-400">{plan === 'free' ? 'No active subscription' : 'Monthly billing'}</p>
          </div>
          <Badge variant="secondary" className={`${isActive ? 'bg-green-600' : status === 'cancelled' ? 'bg-yellow-600' : 'bg-gray-600'} text-white`}>
            {isActive ? 'Active' : status === 'cancelled' ? 'Cancelled' : status || 'Inactive'}
          </Badge>
        </div>

        {plan !== 'free' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Plan</p>
                <p className="text-white font-semibold capitalize">{plan} - $9.99/mo</p>
              </div>
            </div>
            {periodEnd && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">{status === 'cancelled' ? 'Access Until' : 'Next Billing'}</p>
                  <p className="text-white font-semibold">{periodEnd.toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {features && features.features && features.features.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Included Features:</p>
            <ul className="space-y-1">
              {features.features.map((feature, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                  <span className="text-green-500">✓</span> {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {subscription?.daysRemaining !== undefined && subscription.daysRemaining > 0 && (
          <p className="text-sm text-gray-400">{subscription.daysRemaining} days remaining in current period</p>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={handleChangePlan}
          >
            {plan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
          </Button>
          {isActive && plan !== 'free' && (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancelSubscription}
              disabled={cancelling}
            >
              {cancelling ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelling...</> : 'Cancel Subscription'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
