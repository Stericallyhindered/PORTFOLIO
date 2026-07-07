'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Trophy, 
  Eye, 
  Heart, 
  Share2, 
  Download,
  RefreshCw,
  AlertCircle,
  Activity,
  Star,
  Target,
  Video,
  Calendar,
  Award,
  ThumbsUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

interface BrandAnalyticsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  overview: {
    totalContests: number;
    activeContests: number;
    totalSubmissions: number;
    totalViews: number;
    engagementRate: number;
    averageRating: number;
  };
  contests: Array<{
    id: string;
    title: string;
    status: string;
    submissions: number;
    views: number;
    engagementRate: number;
    averageRating: number;
    createdAt: string;
    endDate: string;
  }>;
  performance: {
    topPerformingContest: {
      title: string;
      submissions: number;
      engagementRate: number;
    };
    submissionTrends: Array<{
      date: string;
      submissions: number;
    }>;
    engagementMetrics: {
      totalLikes: number;
      totalShares: number;
      totalComments: number;
    };
  };
  demographics: {
    topLocations: Array<{
      location: string;
      percentage: number;
    }>;
    ageGroups: Array<{
      range: string;
      percentage: number;
    }>;
  };
}

export default function BrandAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<BrandAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const fetchBrandAnalytics = async (selectedPeriod: string = period) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/brand/analytics?period=${selectedPeriod}`, {
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
      console.error('Brand analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: "Failed to load brand analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBrandAnalytics();
  }, []);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    fetchBrandAnalytics(newPeriod);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBrandAnalytics();
  };

  const exportData = () => {
    if (!data) return;
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      brandName: user?.name || 'Unknown Brand',
      period: data.period,
      dateRange: data.dateRange,
      analytics: data
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-analytics-${period}days-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Brand analytics data has been exported successfully.",
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
          <h1 className="text-3xl font-bold text-gray-900">Brand Analytics</h1>
          <p className="text-gray-600 mt-1">Track your contest performance and audience engagement</p>
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
                <CardTitle className="text-sm font-medium">Total Contests</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalContests}</div>
                <p className="text-xs text-muted-foreground">
                  {data.overview.activeContests} currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalSubmissions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all contests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Contest page views
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.engagementRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Average across all contests
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Performing Contest
                </CardTitle>
                <CardDescription>Your best performing contest this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{data.performance.topPerformingContest.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Video className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600">{data.performance.topPerformingContest.submissions} submissions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">{data.performance.topPerformingContest.engagementRate}% engagement</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Engagement Rate</span>
                      <span>{data.performance.topPerformingContest.engagementRate}%</span>
                    </div>
                    <Progress value={data.performance.topPerformingContest.engagementRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Engagement Metrics
                </CardTitle>
                <CardDescription>Social engagement across all contests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Total Likes</span>
                    </div>
                    <span className="font-medium">{data.performance.engagementMetrics.totalLikes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Total Shares</span>
                    </div>
                    <span className="font-medium">{data.performance.engagementMetrics.totalShares.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Total Comments</span>
                    </div>
                    <span className="font-medium">{data.performance.engagementMetrics.totalComments.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contest Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Contest Performance</CardTitle>
              <CardDescription>Detailed performance metrics for all your contests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Contest</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-right py-2">Submissions</th>
                      <th className="text-right py-2">Views</th>
                      <th className="text-right py-2">Engagement</th>
                      <th className="text-right py-2">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.contests.map((contest) => (
                      <tr key={contest.id} className="border-b">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{contest.title}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(contest.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant={contest.status === 'active' ? 'default' : 'secondary'}>
                            {contest.status}
                          </Badge>
                        </td>
                        <td className="text-right py-3">{contest.submissions}</td>
                        <td className="text-right py-3">{contest.views.toLocaleString()}</td>
                        <td className="text-right py-3">{contest.engagementRate}%</td>
                        <td className="text-right py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span>{contest.averageRating}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>Where your audience is located</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.demographics.topLocations.map((location, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{location.location}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${location.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{location.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Age Demographics</CardTitle>
                <CardDescription>Age distribution of your audience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.demographics.ageGroups.map((group, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{group.range}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${group.percentage * 2}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{group.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
} 