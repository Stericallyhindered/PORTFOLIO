'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface BrandStats {
  activeContests: number;
  totalEntries: number;
  pendingReview: number;
  thisMonth: number;
}

export function BrandDashboardStats() {
  const router = useRouter();
  const [stats, setStats] = useState<BrandStats>({
    activeContests: 0,
    totalEntries: 0,
    pendingReview: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/brand/analytics?period=30');
        const data = await response.json();
        if (data.success) {
          const now = new Date();
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          
          // Calculate stats from analytics data
          setStats({
            activeContests: data.data.overview?.activeContests || 0,
            totalEntries: data.data.overview?.totalSubmissions || 0,
            pendingReview: data.data.contests?.reduce((acc: number, contest: any) => {
              return acc + (contest.submissions?.filter((s: any) => s.status === 'submitted').length || 0);
            }, 0) || 0,
            thisMonth: data.data.performance?.submissionTrends?.reduce((acc: number, trend: any) => {
              const trendDate = new Date(trend.date);
              return trendDate >= thisMonthStart ? acc + (trend.count || 0) : acc;
            }, 0) || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch brand stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Brand Dashboard</h1>
      <p className="text-gray-600 mb-4">Manage your contests, campaigns, and brand content</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">Active Contests</h3>
          <p className="text-2xl font-bold text-blue-700">
            {loading ? '...' : stats.activeContests}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900">Total Entries</h3>
          <p className="text-2xl font-bold text-green-700">
            {loading ? '...' : stats.totalEntries}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900">Pending Review</h3>
          <p className="text-2xl font-bold text-purple-700">
            {loading ? '...' : stats.pendingReview}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-900">This Month</h3>
          <p className="text-2xl font-bold text-orange-700">
            {loading ? '...' : stats.thisMonth}
          </p>
        </div>
      </div>
    </div>
  );
}


