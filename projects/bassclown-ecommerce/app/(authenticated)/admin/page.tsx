'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Trophy, Gift, Building, TrendingUp, Eye } from 'lucide-react';

interface AnalyticsData {
  overview: {
    users: { total: number; new: number; premium: number; growthRate: string };
    contests: { total: number; active: number; submissions: { total: number; recent: number } };
    giveaways: { total: number; active: number; entries: { total: number; recent: number } };
  };
  trends: {
    userSignups: number;
    contestSubmissions: number;
    giveawayParticipation: number;
  };
  systemHealth: {
    activeContests: number;
    activeGiveaways: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [brandsTotal, setBrandsTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, brandsRes] = await Promise.all([
        fetch('/api/admin/analytics?period=30', { credentials: 'include' }),
        fetch('/api/admin/brands', { credentials: 'include' }),
      ]);
      if (analyticsRes.ok) {
        const analyticsJson = await analyticsRes.json();
        if (analyticsJson.success && analyticsJson.data) {
          setData(analyticsJson.data);
        }
      }
      if (brandsRes.ok) {
        const brandsJson = await brandsRes.json();
        if (brandsJson.success && brandsJson.data?.total != null) {
          setBrandsTotal(brandsJson.data.total);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              View Public Site
            </a>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data?.overview?.users?.total?.toLocaleString() ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{data?.overview?.users?.new ?? 0} this period (
                  {data?.overview?.users?.growthRate ?? '0'}% growth)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contests</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data?.overview?.contests?.active ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {data?.overview?.contests?.total ?? 0} total contests
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Giveaways</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data?.overview?.giveaways?.active ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {data?.overview?.giveaways?.total ?? 0} total giveaways
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brand Partners</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{brandsTotal ?? 0}</div>
                <p className="text-xs text-muted-foreground">From contests and giveaways</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" asChild>
              <Link href="/admin/contests/create">
                <Trophy className="h-6 w-6" />
                <span className="text-sm">Create Contest</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" asChild>
              <Link href="/admin/giveaways/create">
                <Gift className="h-6 w-6" />
                <span className="text-sm">New Giveaway</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" asChild>
              <Link href="/admin/users">
                <Users className="h-6 w-6" />
                <span className="text-sm">Manage Users</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" asChild>
              <Link href="/admin/analytics">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">View Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
