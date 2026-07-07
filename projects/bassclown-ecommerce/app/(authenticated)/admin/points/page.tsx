'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, Users, TrendingUp, ArrowUpDown, Search, RefreshCw } from 'lucide-react';

interface PointsTransaction {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function AdminPointsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalPointsIssued: 0,
    totalPointsSpent: 0,
    totalTransactions: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    fetchPointsData();
  }, []);

  const fetchPointsData = async () => {
    try {
      setLoading(true);

      // Fetch recent transactions from points history
      const historyRes = await fetch('/api/points/history?limit=100', {
        credentials: 'include',
      });

      if (historyRes.ok) {
        const historyResult = await historyRes.json();
        if (historyResult.success && historyResult.data?.transactions) {
          const txns = historyResult.data.transactions;
          setTransactions(txns);

          // Calculate stats from transactions
          const issued = txns
            .filter((t: PointsTransaction) => t.amount > 0)
            .reduce((sum: number, t: PointsTransaction) => sum + t.amount, 0);
          const spent = txns
            .filter((t: PointsTransaction) => t.amount < 0)
            .reduce((sum: number, t: PointsTransaction) => sum + Math.abs(t.amount), 0);
          const uniqueUsers = new Set(txns.map((t: PointsTransaction) => t.userId)).size;

          setStats({
            totalPointsIssued: issued,
            totalPointsSpent: spent,
            totalTransactions: txns.length,
            activeUsers: uniqueUsers,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching points data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) =>
    (txn.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (txn.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Points System</h1>
          <p className="text-gray-600 mt-1">Monitor and manage the points economy</p>
        </div>
        <Button variant="outline" onClick={fetchPointsData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points Issued</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  +{stats.totalPointsIssued.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Points earned by users</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points Spent</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  -{stats.totalPointsSpent.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Points redeemed</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Users with point activity</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All points transactions across the platform</CardDescription>
          <div className="flex items-center space-x-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user or description..."
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
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No transactions match your search' : 'No point transactions yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{txn.userName || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{txn.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={txn.amount > 0 ? 'default' : 'secondary'}>
                        {txn.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{txn.description}</TableCell>
                    <TableCell className="text-right">
                      <span className={txn.amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {txn.amount > 0 ? '+' : ''}{txn.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(txn.createdAt).toLocaleDateString()}
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
