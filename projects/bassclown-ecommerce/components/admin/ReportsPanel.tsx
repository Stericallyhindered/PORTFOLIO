'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Download, FileText, TrendingUp, Users, Trophy, DollarSign, Loader2 } from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  activeContests: number;
  activeGiveaways: number;
  totalEntries: number;
}

export default function ReportsPanel() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('/api/admin/analytics', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStats({
            totalUsers: result.data.totalUsers || 0,
            activeContests: result.data.activeContests || 0,
            activeGiveaways: result.data.activeGiveaways || 0,
            totalEntries: result.data.totalEntries || 0,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const reportTypes = [
    {
      id: 'user-activity',
      title: 'User Activity Report',
      description: 'Detailed analysis of user engagement and activity patterns',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      id: 'contest-performance',
      title: 'Contest Performance Report',
      description: 'Analytics on contest participation, submissions, and success rates',
      icon: Trophy,
      color: 'bg-yellow-500',
    },
    {
      id: 'revenue-analysis',
      title: 'Revenue Analysis',
      description: 'Financial performance and subscription revenue breakdown',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      id: 'platform-metrics',
      title: 'Platform Metrics',
      description: 'Overall platform health and key performance indicators',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loadingStats ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Registered accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contests</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeContests?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Giveaways</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeGiveaways?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEntries?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Contest + Giveaway entries</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="info">Report Info</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>
                Create comprehensive reports for platform analysis and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((report) => {
                  const Icon = report.icon;
                  return (
                    <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${report.color}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{report.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            setSelectedReportType(report.id);
                            setGenerateDialogOpen(true);
                          }}
                        >
                          <BarChart className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About Reports</CardTitle>
              <CardDescription>How the reporting system works</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-600">
                <p>Reports are generated on-demand based on live platform data. Select a report type, choose your date range, and the system will compile the data into a downloadable format.</p>
                <p>Available formats include PDF for visual reports and CSV for data analysis in spreadsheet applications.</p>
                <p>All reports pull data directly from the production database to ensure accuracy.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Report Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>Configure and generate your report</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="format">Format</Label>
              <Select value={reportFormat} onValueChange={(value: 'pdf' | 'csv') => setReportFormat(value)}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)} disabled={generating !== null}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedReportType) return;
                try {
                  setGenerating(selectedReportType);
                  const response = await fetch('/api/admin/reports/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      reportType: selectedReportType === 'user-activity' ? 'user' :
                                  selectedReportType === 'contest-performance' ? 'contest' :
                                  selectedReportType === 'revenue-analysis' ? 'platform' : 'admin',
                      format: reportFormat,
                      startDate: startDate || undefined,
                      endDate: endDate || undefined,
                    }),
                  });
                  if (!response.ok) throw new Error('Failed to generate report');
                  const result = await response.json();
                  if (result.success && result.data?.report?.url) {
                    toast({ title: 'Success', description: 'Report generated successfully' });
                    window.open(result.data.report.url, '_blank');
                    setGenerateDialogOpen(false);
                  } else {
                    throw new Error(result.message || 'Failed to generate report');
                  }
                } catch (err) {
                  console.error('Error generating report:', err);
                  toast({
                    title: 'Error',
                    description: err instanceof Error ? err.message : 'Failed to generate report',
                    variant: 'destructive',
                  });
                } finally {
                  setGenerating(null);
                }
              }}
              disabled={generating !== null}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
