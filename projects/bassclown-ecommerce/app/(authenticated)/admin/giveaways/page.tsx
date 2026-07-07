'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Filter, MoreHorizontal, Eye, Edit, Gift, Users, Calendar, DollarSign, Loader2, Trash2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface Giveaway {
  id: string;
  title: string;
  description: string;
  prizeValue: string;
  maxEntries: number | null;
  entryCount: number;
  startDate: string;
  endDate: string;
  status: string;
  sponsor: string | null;
  createdAt: string;
}

export default function GiveawaysPage() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalEntries: 0,
    totalPrizeValue: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGiveaways();
  }, []);

  const fetchGiveaways = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/giveaways?limit=100', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch giveaways');
      }

      const result = await response.json();

      if (result.success && result.data?.giveaways) {
        const giveawaysList = result.data.giveaways.map((g: any) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          prizeValue: g.prizeValue,
          maxEntries: g.maxEntries,
          entryCount: g.entryCount || 0,
          startDate: g.startDate,
          endDate: g.endDate,
          status: g.status,
          sponsor: g.sponsor,
          createdAt: g.createdAt
        }));

        setGiveaways(giveawaysList);

        // Calculate stats
        const total = giveawaysList.length;
        const active = giveawaysList.filter((g: Giveaway) => g.status === 'active').length;
        const totalEntries = giveawaysList.reduce((sum: number, g: Giveaway) => sum + g.entryCount, 0);
        const totalPrizeValue = giveawaysList.reduce((sum: number, g: Giveaway) => {
          const value = parseFloat(g.prizeValue.replace(/[^0-9.]/g, '')) || 0;
          return sum + value;
        }, 0);

        setStats({ total, active, totalEntries, totalPrizeValue });
      }
    } catch (error) {
      console.error('Error fetching giveaways:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'upcoming': return 'secondary';
      case 'ended': return 'outline';
      case 'completed': return 'outline';
      case 'draft': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleDeleteGiveaway = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/giveaways/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const result = await response.json();
        alert(result.message || 'Failed to delete giveaway');
        return;
      }
      fetchGiveaways();
    } catch (error) {
      console.error('Error deleting giveaway:', error);
      alert('Failed to delete giveaway');
    }
  };

  const filteredGiveaways = giveaways.filter(giveaway =>
    giveaway.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (giveaway.sponsor && giveaway.sponsor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Giveaway Management</h1>
          <p className="text-gray-600 mt-1">Manage all giveaways and prize distributions</p>
        </div>
        <Link href="/admin/giveaways/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Giveaway
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Giveaways</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Giveaway</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEntries.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all giveaways</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Giveaway Entries</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {giveaways.find(g => g.status === 'active')?.entryCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">Current giveaway</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Giveaways Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Giveaways</CardTitle>
          <CardDescription>Manage and monitor all giveaway activities</CardDescription>
          <div className="flex items-center space-x-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search giveaways..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredGiveaways.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giveaway</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Prize Value</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGiveaways.map((giveaway) => (
                  <TableRow key={giveaway.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{giveaway.title}</div>
                        <div className="text-sm text-gray-600 line-clamp-1">{giveaway.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(giveaway.status) as any}>
                        {giveaway.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(giveaway.startDate).toLocaleDateString()}</div>
                        <div className="text-gray-500">to {new Date(giveaway.endDate).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{giveaway.entryCount.toLocaleString()}</div>
                        {giveaway.maxEntries && (
                          <div className="text-gray-500">of {giveaway.maxEntries.toLocaleString()}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{giveaway.prizeValue}</TableCell>
                    <TableCell>{giveaway.sponsor || '-'}</TableCell>
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
                            <Link href={`/admin/giveaways/${giveaway.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/giveaways/${giveaway.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Giveaway
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/giveaways/${giveaway.id}/entries`}>
                              View Entries ({giveaway.entryCount})
                            </Link>
                          </DropdownMenuItem>
                          {giveaway.status === 'active' && (
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/giveaways/${giveaway.id}/draw`}>
                                Draw Winners
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteGiveaway(giveaway.id, giveaway.title)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Giveaway
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No giveaways found</p>
              <Link href="/admin/giveaways/create">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Giveaway
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
