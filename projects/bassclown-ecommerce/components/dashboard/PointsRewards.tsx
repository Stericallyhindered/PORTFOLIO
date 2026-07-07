'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, ShoppingCart, Percent, Loader2 } from 'lucide-react';

// Rewards catalog - these are the available rewards on the platform
// In the future this could come from an API, but for now these are the fixed offerings
const REWARDS_CATALOG = [
  {
    id: 'contest-waiver',
    title: 'Contest Entry Fee Waiver',
    description: 'Skip the entry fee for any video contest',
    pointsCost: 150,
    type: 'service',
    available: true,
    icon: '🎯',
  },
  {
    id: 'merch-discount',
    title: '20% Merchandise Discount',
    description: 'Get 20% off any Bass Clown Co. merchandise',
    pointsCost: 200,
    type: 'discount',
    available: true,
    icon: '🛍️',
  },
  {
    id: 'tshirt',
    title: 'Bass Clown Co. T-Shirt',
    description: 'Official Bass Clown Co. branded t-shirt',
    pointsCost: 500,
    type: 'merchandise',
    available: true,
    icon: '👕',
  },
  {
    id: 'priority-review',
    title: 'Video Review Priority',
    description: 'Get your video reviewed within 24 hours',
    pointsCost: 300,
    type: 'service',
    available: true,
    icon: '⚡',
  },
  {
    id: 'consultation',
    title: 'Custom Video Consultation',
    description: '30-minute one-on-one video consultation',
    pointsCost: 800,
    type: 'service',
    available: true,
    icon: '🎬',
  },
  {
    id: 'hoodie',
    title: 'Bass Clown Co. Hoodie',
    description: 'Premium Bass Clown Co. hoodie',
    pointsCost: 750,
    type: 'merchandise',
    available: false,
    icon: '🧥',
  },
];

export const PointsRewards: React.FC = () => {
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/points/balance', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCurrentPoints(result.data.currentBalance || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch points balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId: string, pointsCost: number) => {
    if (currentPoints < pointsCost) {
      alert('Not enough points for this reward.');
      return;
    }

    if (!confirm(`Redeem ${pointsCost} points for this reward?`)) return;

    try {
      setRedeemingId(rewardId);
      // Use the points purchase API to process redemption
      const response = await fetch('/api/points/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rewardId,
          pointsCost,
          type: 'redeem'
        })
      });

      if (response.ok) {
        alert('Reward redeemed successfully! Check your email for details.');
        await fetchBalance();
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to redeem reward. Please try again.');
      }
    } catch (err) {
      console.error('Redemption error:', err);
      alert('Failed to redeem reward. Please try again.');
    } finally {
      setRedeemingId(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-blue-600';
      case 'discount': return 'bg-green-600';
      case 'merchandise': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'service': return <Gift className="w-4 h-4" />;
      case 'discount': return <Percent className="w-4 h-4" />;
      case 'merchandise': return <ShoppingCart className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="bg-[#2D2D2D] border-gray-700">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-400" />
          Available Rewards
          <Badge variant="secondary" className="ml-auto bg-yellow-600 text-white">
            {currentPoints.toLocaleString()} pts available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {REWARDS_CATALOG.map((reward) => (
            <div
              key={reward.id}
              className={`p-4 bg-[#1A1A1A] rounded-lg border border-gray-600 ${
                !reward.available ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{reward.icon}</span>
                  <div>
                    <h3 className="text-white font-medium">{reward.title}</h3>
                    <p className="text-sm text-gray-400">{reward.description}</p>
                  </div>
                </div>
                
                <Badge 
                  variant="secondary" 
                  className={`${getTypeColor(reward.type)} text-white flex items-center gap-1`}
                >
                  {getTypeIcon(reward.type)}
                  {reward.type}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-semibold">
                    {reward.pointsCost} points
                  </span>
                  {!reward.available && (
                    <Badge variant="secondary" className="bg-gray-600 text-white">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleRedeem(reward.id, reward.pointsCost)}
                  disabled={!reward.available || currentPoints < reward.pointsCost || redeemingId === reward.id}
                  className={`${
                    currentPoints >= reward.pointsCost && reward.available
                      ? 'bg-[#8B4513] hover:bg-[#A0522D]'
                      : 'bg-gray-600 cursor-not-allowed'
                  } text-white`}
                >
                  {redeemingId === reward.id ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Redeeming...</>
                  ) : currentPoints >= reward.pointsCost && reward.available ? (
                    'Redeem'
                  ) : (
                    'Not Enough Points'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
