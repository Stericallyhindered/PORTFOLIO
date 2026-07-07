'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Trophy, FileText, TrendingUp } from 'lucide-react';

interface DashboardStats {
  activeProjects: number;
  contestsEntered: number;
  reviewsSubmitted: number;
  totalEarnings: number;
}

export const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    contestsEntered: 0,
    reviewsSubmitted: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchStats();
    }
  }, [user]);

  const statsConfig = [
    {
      title: 'Active Projects',
      value: stats.activeProjects.toString(),
      icon: Video,
      description: 'Currently in production',
      color: 'text-blue-500'
    },
    {
      title: 'Contests Entered',
      value: stats.contestsEntered.toString(),
      icon: Trophy,
      description: 'This month',
      color: 'text-yellow-500'
    },
    {
      title: 'Reviews Submitted',
      value: stats.reviewsSubmitted.toString(),
      icon: FileText,
      description: 'Awaiting approval',
      color: 'text-green-500'
    },
    {
      title: 'Total Earnings',
      value: `$${stats.totalEarnings.toLocaleString()}`,
      icon: TrendingUp,
      description: 'This quarter',
      color: 'text-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-lg">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-red-100">
          Here's what's happening with your projects and contests.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-[#2D2D2D] border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {loading ? '...' : stat.value}
                </div>
                <p className="text-xs text-gray-400">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 