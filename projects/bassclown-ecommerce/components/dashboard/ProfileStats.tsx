'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Trophy, Video, Star, TrendingUp, Award, Coins } from 'lucide-react';

interface UserStats {
  contestsApplied: number;
  contestsWon: number;
  giveawaysEntered: number;
  pointsBalance: number;
}

export const ProfileStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch points balance for stats
      const pointsRes = await fetch('/api/points/balance', { credentials: 'include' });
      let pointsBalance = 0;
      if (pointsRes.ok) {
        const pointsResult = await pointsRes.json();
        if (pointsResult.success && pointsResult.data) {
          pointsBalance = pointsResult.data.currentBalance || 0;
        }
      }

      // Fetch user profile for more stats
      const profileRes = await fetch('/api/users/profile', { credentials: 'include' });
      let contestsApplied = 0;
      let contestsWon = 0;
      let giveawaysEntered = 0;
      if (profileRes.ok) {
        const profileResult = await profileRes.json();
        if (profileResult.success && profileResult.data) {
          contestsApplied = profileResult.data.contestsApplied || 0;
          contestsWon = profileResult.data.contestsWon || 0;
          giveawaysEntered = profileResult.data.giveawaysEntered || 0;
        }
      }

      setStats({
        contestsApplied,
        contestsWon,
        giveawaysEntered,
        pointsBalance,
      });
    } catch (err) {
      console.error('Failed to fetch profile stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'bass-admin': return 'Bass Admin';
      case 'brand-admin': return 'Brand Admin';
      case 'member': return 'Member';
      case 'guest': return 'Guest';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'bass-admin': return 'bg-red-600';
      case 'brand-admin': return 'bg-purple-600';
      case 'member': return 'bg-blue-600';
      case 'guest': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const statItems = [
    {
      label: 'Contests Applied',
      value: stats?.contestsApplied?.toString() || '0',
      icon: Trophy,
      color: 'text-yellow-500'
    },
    {
      label: 'Contests Won',
      value: stats?.contestsWon?.toString() || '0',
      icon: Award,
      color: 'text-green-500'
    },
    {
      label: 'Giveaways Entered',
      value: stats?.giveawaysEntered?.toString() || '0',
      icon: Star,
      color: 'text-blue-500'
    },
    {
      label: 'Points Balance',
      value: stats?.pointsBalance?.toLocaleString() || '0',
      icon: Coins,
      color: 'text-yellow-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <Card className="bg-[#2D2D2D] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Profile Summary</span>
            <Badge className={`${getRoleBadgeColor(user?.role || '')} text-white`}>
              {getRoleDisplayName(user?.role || '')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Calendar size={16} />
            <span>Joined {user?.joinDate || 'Recently'}</span>
          </div>
          <div className="text-sm text-gray-300">
            {user?.name ? `${user.name} - ` : ''}Active member of the Bass Clown Co community, contributing to video production and content creation in the fishing industry.
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card className="bg-[#2D2D2D] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </>
          ) : (
            statItems.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="text-sm text-gray-300">{stat.label}</span>
                  </div>
                  <span className="text-lg font-semibold text-white">{stat.value}</span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
