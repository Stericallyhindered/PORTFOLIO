'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Trophy, 
  Gift, 
  DollarSign, 
  Calendar, 
  Download,
  RefreshCw,
  AlertCircle,
  Activity,
  Star,
  Target
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AnalyticsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  overview: {
    users: {
      total: number;
      new: number;
      premium: number;
      growthRate: string;
    };
    contests: {
      total: number;
      active: number;
      submissions: {
        total: number;
        recent: number;
      };
    };
    giveaways: {
      total: number;
      active: number;
      entries: {
        total: number;
        recent: number;
      };
    };
    points: {
      totalEarned: number;
      totalSpent: number;
      totalPurchased: number;
      netCirculation: number;
    };
  };
  trends: {
    userSignups: number;
    contestSubmissions: number;
    giveawayParticipation: number;
  };
  systemHealth: {
    activeContests: number;
    activeGiveaways: number;
    userEngagement: {
      submissionRate: string;
      giveawayParticipationRate: string;
    };
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (selectedPeriod: string = period) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    fetchAnalytics(newPeriod);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const exportData = () => {
    if (!data) return;
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      period: data.period,
      dateRange: data.dateRange,
      analytics: data
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bass-clown-co-analytics-${period}days-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Analytics data has been exported successfully.",
    });
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600 mt-1">Monitor platform performance and user engagement</p>
          {data && (
            <p className="text-sm text-gray-500 mt-1">
              Data from {new Date(data.dateRange.start).toLocaleDateString()} to {new Date(data.dateRange.end).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData} disabled={!data}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.users.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={data.overview.users.growthRate.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                    {data.overview.users.growthRate}
                  </span> growth rate
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {data.overview.users.new} new users • {data.overview.users.premium} premium
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contests</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.contests.active}</div>
                <p className="text-xs text-muted-foreground">
                  of {data.overview.contests.total} total contests
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {data.overview.contests.submissions.recent} recent submissions
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Circulation</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.points.netCirculation.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Net points in circulation
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {data.overview.points.totalEarned.toLocaleString()} earned • {data.overview.points.totalSpent.toLocaleString()} spent
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.systemHealth.userEngagement.submissionRate}</div>
                <p className="text-xs text-muted-foreground">
                  Contest submission rate
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {data.systemHealth.userEngagement.giveawayParticipationRate} giveaway participation
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>Platform performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Contests</span>
                    <Badge variant={data.systemHealth.activeContests > 0 ? "default" : "secondary"}>
                      {data.systemHealth.activeContests}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Giveaways</span>
                    <Badge variant={data.systemHealth.activeGiveaways > 0 ? "default" : "secondary"}>
                      {data.systemHealth.activeGiveaways}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Engagement</span>
                    <Badge variant="outline">
                      {data.systemHealth.userEngagement.submissionRate}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Activity in the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New User Signups</span>
                    <span className="font-medium">{data.trends.userSignups}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Contest Submissions</span>
                    <span className="font-medium">{data.trends.contestSubmissions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Giveaway Entries</span>
                    <span className="font-medium">{data.trends.giveawayParticipation}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Points Economy
                </CardTitle>
                <CardDescription>Points system overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Earned</span>
                    <span className="font-medium text-green-600">+{data.overview.points.totalEarned.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Spent</span>
                    <span className="font-medium text-red-600">-{data.overview.points.totalSpent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Purchased</span>
                    <span className="font-medium text-blue-600">+{data.overview.points.totalPurchased.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between font-medium">
                      <span>Net Circulation</span>
                      <span>{data.overview.points.netCirculation.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>User registrations over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Interactive chart coming soon</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Showing {data.trends.userSignups} new users in {data.period}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contest Activity</CardTitle>
                <CardDescription>Contest submissions and participation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Interactive chart coming soon</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {data.trends.contestSubmissions} submissions in {data.period}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
} 