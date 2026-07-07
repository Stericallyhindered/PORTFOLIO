'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  referenceType: string | null;
  createdAt: string;
}

export const BillingHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    try {
      setLoading(true);
      // Fetch points transaction history as billing history proxy
      const response = await fetch('/api/points/history?limit=20', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTransactions(result.data.transactions || []);
          setSummary(result.data.summary || null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch billing history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'earned': return 'bg-green-600';
      case 'spent': return 'bg-red-600';
      case 'purchased': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className="bg-[#2D2D2D] border-gray-700">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#2D2D2D] border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No transactions yet</p>
            <p className="text-sm text-gray-500 mt-1">Your billing and points transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-lg border border-gray-600"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-white font-semibold">{tx.description || tx.type}</p>
                    <p className="text-sm text-gray-400">
                      {tx.referenceType ? `${tx.referenceType} • ` : ''}
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'earned' || tx.type === 'purchased' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'earned' || tx.type === 'purchased' ? '+' : ''}{tx.amount} pts
                    </p>
                    <Badge variant="secondary" className={`${getStatusColor(tx.type)} text-white text-xs`}>
                      {tx.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {summary && (
          <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-600">
            <div className="text-center">
              <p className="text-sm text-gray-400">Total Earned</p>
              <p className="text-white font-semibold">{summary.totalEarned || 0} pts</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Total Spent</p>
              <p className="text-white font-semibold">{summary.totalSpent || 0} pts</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Purchased</p>
              <p className="text-white font-semibold">{summary.totalPurchased || 0} pts</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
