'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Filter, MoreHorizontal, Eye, Edit, Users, Trophy, Calendar, DollarSign, ExternalLink, Trash2, CheckCircle, PauseCircle, XCircle } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface Contest {
  id: string;
  title: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  prize: string;
  currentParticipants: number;
  maxParticipants: number;
}

export default function AdminContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    applications: 0,
    prizePool: 0
  });

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contests?limit=100', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contests');
      }
      
      const result = await response.json();
      
      if (result.success && result.data?.contests) {
        const contestsList = result.data.contests;
        setContests(contestsList);
        
        // Calculate stats
        const active = contestsList.filter((c: Contest) => c.status === 'open').length;
        const prizePool = contestsList.reduce((sum: number, c: Contest) => {
          const match = c.prize?.match(/\$?(\d+)/);
          return sum + (match ? parseInt(match[1]) : 0);
        }, 0);
        
        // Get total applications count (would need separate API call for accuracy)
        const applicationsResponse = await fetch('/api/contests/stats', {
          credentials: 'include'
        });
        let totalApplications = 0;
        if (applicationsResponse.ok) {
          const appsResult = await applicationsResponse.json();
          totalApplications = appsResult.data?.totalApplications || 0;
        }
        
        setStats({
          total: contestsList.length,
          active,
          applications: totalApplications,
          prizePool
        });
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'judging': return 'secondary';
      case 'completed': return 'outline';
      case 'draft': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleStatusChange = async (id: string, title: string, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      open: 'Publish (Open)',
      draft: 'Unpublish (Draft)',
      closed: 'Close',
      judging: 'Move to Judging',
      completed: 'Mark Completed'
    };
    try {
      const response = await fetch(`/api/contests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) {
        const result = await response.json();
        alert(result.message || `Failed to update status`);
        return;
      }
      fetchContests();
    } catch (error) {
      console.error('Error updating contest status:', error);
      alert('Failed to update contest status');
    }
  };

  const handleDeleteContest = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/contests/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const result = await response.json();
        alert(result.message || 'Failed to delete contest');
        return;
      }
      fetchContests();
    } catch (error) {
      console.error('Error deleting contest:', error);
      alert('Failed to delete contest');
    }
  };

  const filteredContests = contests.filter(contest =>
    contest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contest.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contest Management</h1>
          <p className="text-gray-600 mt-1">Manage all contests and their lifecycle</p>
        </div>
        <Link href="/admin/contests/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Contest
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contests</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All contests</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.active}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.applications}</div>
                <p className="text-xs text-muted-foreground">All applications</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prize Pool</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">${stats.prizePool.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across all contests</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contests</CardTitle>
          <CardDescription>Manage and monitor all contest activities</CardDescription>
          <div className="flex items-center space-x-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search contests..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredContests.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No contests found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first contest.'}
              </p>
              <Link href="/admin/contests/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Contest
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contest</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContests.map((contest) => (
                  <TableRow key={contest.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contest.title}</div>
                        <div className="text-sm text-gray-600">{contest.category}</div>
                      </div>
                    </TableCell>
                    <TableCell>{contest.category}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(contest.status)}>
                        {contest.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(contest.startDate).toLocaleDateString()}</div>
                        <div className="text-gray-500">to {new Date(contest.endDate).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contest.currentParticipants || 0} / {contest.maxParticipants || '∞'}
                    </TableCell>
                    <TableCell>{contest.prize || 'TBD'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/contests/${contest.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/contests/${contest.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Contest
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          {contest.status !== 'open' && (
                            <DropdownMenuItem
                              className="text-green-600 focus:text-green-600"
                              onClick={() => handleStatusChange(contest.id, contest.title, 'open')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Publish (Open)
                            </DropdownMenuItem>
                          )}
                          {contest.status !== 'draft' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(contest.id, contest.title, 'draft')}
                            >
                              <PauseCircle className="h-4 w-4 mr-2" />
                              Unpublish (Draft)
                            </DropdownMenuItem>
                          )}
                          {contest.status !== 'closed' && contest.status !== 'draft' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(contest.id, contest.title, 'closed')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Close Contest
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/contests/${contest.id}/submissions`}>
                              View Submissions
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/contests/${contest.id}/collaborative-judging`}>
                              Manage Judging
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/contests/${contest.id}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Preview on Frontend
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteContest(contest.id, contest.title)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Contest
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 