'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, TrendingUp, Star, Gift } from 'lucide-react';

interface PointsBalance {
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }[];
}

export const PointsOverview: React.FC = () => {
  const [pointsData, setPointsData] = useState<PointsBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/points/balance', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setPointsData(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch points:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-[#2D2D2D] border-gray-700">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentBalance = pointsData?.currentBalance || 0;
  const totalEarned = pointsData?.totalEarned || 0;
  const totalSpent = pointsData?.totalSpent || 0;

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-500" />
          Points Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
            <div className="text-2xl font-bold text-white">{currentBalance.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Current Balance</div>
          </div>
          
          <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
            <div className="text-2xl font-bold text-green-400">{totalEarned.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Earned</div>
          </div>
          
          <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
            <div className="text-2xl font-bold text-red-400">{totalSpent.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Spent</div>
          </div>
        </div>

        {/* Recent Activity from real data */}
        {pointsData?.recentTransactions && pointsData.recentTransactions.length > 0 && (
          <div className="border-t border-gray-600 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Recent Activity</span>
            </div>
            <div className="space-y-2">
              {pointsData.recentTransactions.slice(0, 3).map((tx) => (
                <div key={tx.id} className="flex justify-between text-sm">
                  <span className="text-gray-400">{tx.description}</span>
                  <span className={tx.type === 'earned' || tx.type === 'purchased' ? 'text-green-400' : 'text-red-400'}>
                    {tx.type === 'earned' || tx.type === 'purchased' ? '+' : '-'}{Math.abs(tx.amount)} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-600 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Ways to Earn</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Contest Participation</span>
              <span className="text-white">100 points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Video Submission</span>
              <span className="text-white">50 points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Monthly Review</span>
              <span className="text-white">25 points</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
