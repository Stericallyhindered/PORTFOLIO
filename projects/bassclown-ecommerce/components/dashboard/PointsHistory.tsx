'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Plus, Minus, Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  referenceType: string | null;
  createdAt: string;
}

export const PointsHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const fetchHistory = async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(`/api/points/history?page=${pageNum}&limit=10`, { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const newTransactions = result.data.transactions || [];
          if (pageNum === 1) {
            setTransactions(newTransactions);
          } else {
            setTransactions(prev => [...prev, ...newTransactions]);
          }
          setHasMore(result.data.pagination?.hasNext || false);
          setPage(pageNum);
        }
      }
    } catch (err) {
      console.error('Failed to fetch points history:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earned':
      case 'purchased':
        return <Plus className="w-4 h-4 text-green-400" />;
      case 'spent':
        return <Minus className="w-4 h-4 text-red-400" />;
      default:
        return <History className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'earned':
      case 'purchased':
        return 'text-green-400';
      case 'spent':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'earned': return 'bg-green-600';
      case 'purchased': return 'bg-blue-600';
      case 'spent': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className="bg-[#2D2D2D] border-gray-700">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <History className="w-5 h-5" />
          Points History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No points transactions yet</p>
            <p className="text-sm text-gray-500 mt-1">Earn points by participating in contests and activities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-lg border border-gray-600"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-[#2D2D2D] rounded-full">
                    {getTypeIcon(transaction.type)}
                  </div>
                  
                  <div>
                    <p className="text-white font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()} at {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-semibold ${getAmountColor(transaction.type)}`}>
                      {transaction.type === 'earned' || transaction.type === 'purchased' ? '+' : '-'}{Math.abs(transaction.amount)} points
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(transaction.type)} text-white text-xs`}
                    >
                      {transaction.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {hasMore && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => fetchHistory(page + 1)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
              ) : (
                'Load More History'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
