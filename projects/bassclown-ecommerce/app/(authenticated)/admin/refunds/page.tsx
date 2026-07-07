'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Plus, 
  Search,
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Refund {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  receipt_number?: string;
  payment_intent?: string;
  charge?: string;
  created: number;
  metadata?: Record<string, any>;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [newRefund, setNewRefund] = useState({
    paymentIntentId: '',
    chargeId: '',
    amount: '',
    reason: 'requested_by_customer' as 'duplicate' | 'fraudulent' | 'requested_by_customer',
    reasonDescription: '',
    userId: ''
  });

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/refunds', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch refunds');
      }

      const result = await response.json();
      if (result.success && result.data?.refunds) {
        setRefunds(result.data.refunds);
      }
    } catch (err) {
      console.error('Error fetching refunds:', err);
      toast({
        title: "Error",
        description: "Failed to load refunds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRefund = async () => {
    if (!newRefund.paymentIntentId && !newRefund.chargeId) {
      toast({
        title: "Validation Error",
        description: "Either Payment Intent ID or Charge ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentIntentId: newRefund.paymentIntentId || undefined,
          chargeId: newRefund.chargeId || undefined,
          amount: newRefund.amount ? parseFloat(newRefund.amount) : undefined,
          reason: newRefund.reason,
          reasonDescription: newRefund.reasonDescription || undefined,
          userId: newRefund.userId || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create refund');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Refund created successfully",
        });
        setCreateDialogOpen(false);
        setNewRefund({
          paymentIntentId: '',
          chargeId: '',
          amount: '',
          reason: 'requested_by_customer',
          reasonDescription: '',
          userId: ''
        });
        fetchRefunds();
      }
    } catch (err) {
      console.error('Error creating refund:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create refund',
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleViewRefund = async (refundId: string) => {
    try {
      const response = await fetch(`/api/admin/refunds/${refundId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.refund) {
          setSelectedRefund(result.data.refund);
          setViewDialogOpen(true);
        }
      }
    } catch (err) {
      console.error('Error fetching refund details:', err);
    }
  };

  const formatAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'canceled': return 'outline';
      default: return 'outline';
    }
  };

  const filteredRefunds = refunds.filter(refund =>
    refund.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.payment_intent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.charge?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Refunds</h1>
          <p className="text-gray-600 mt-1">Manage payment refunds</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchRefunds}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Refund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Refund</DialogTitle>
                  <DialogDescription>
                    Process a refund for a payment
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="paymentIntentId">Payment Intent ID</Label>
                    <Input
                      id="paymentIntentId"
                      value={newRefund.paymentIntentId}
                      onChange={(e) => setNewRefund({ ...newRefund, paymentIntentId: e.target.value })}
                      placeholder="pi_..."
                    />
                    <p className="text-xs text-gray-500 mt-1">OR</p>
                  </div>
                  <div>
                    <Label htmlFor="chargeId">Charge ID</Label>
                    <Input
                      id="chargeId"
                      value={newRefund.chargeId}
                      onChange={(e) => setNewRefund({ ...newRefund, chargeId: e.target.value })}
                      placeholder="ch_..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (Optional - leave empty for full refund)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={newRefund.amount}
                      onChange={(e) => setNewRefund({ ...newRefund, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Select
                      value={newRefund.reason}
                      onValueChange={(value: any) => setNewRefund({ ...newRefund, reason: value })}
                    >
                      <SelectTrigger id="reason">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="duplicate">Duplicate</SelectItem>
                        <SelectItem value="fraudulent">Fraudulent</SelectItem>
                        <SelectItem value="requested_by_customer">Requested by Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reasonDescription">Reason Description (Optional)</Label>
                    <Textarea
                      id="reasonDescription"
                      value={newRefund.reasonDescription}
                      onChange={(e) => setNewRefund({ ...newRefund, reasonDescription: e.target.value })}
                      placeholder="Additional details about the refund..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="userId">User ID (Optional)</Label>
                    <Input
                      id="userId"
                      value={newRefund.userId}
                      onChange={(e) => setNewRefund({ ...newRefund, userId: e.target.value })}
                      placeholder="User ID for notification"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateRefund}
                    disabled={creating || (!newRefund.paymentIntentId && !newRefund.chargeId)}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Create Refund'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search refunds by ID, payment intent, or charge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Refunds List */}
        <Card>
          <CardHeader>
            <CardTitle>Refund History</CardTitle>
            <CardDescription>
              {filteredRefunds.length} refund(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRefunds.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Refunds Found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try a different search term' : 'No refunds have been processed yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRefunds.map((refund) => (
                  <div
                    key={refund.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getStatusColor(refund.status)}>
                          {refund.status}
                        </Badge>
                        <span className="font-medium">{refund.id}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <span className="font-semibold text-gray-900">
                          {formatAmount(refund.amount, refund.currency)}
                        </span>
                        {refund.payment_intent && (
                          <span>Payment: {refund.payment_intent.substring(0, 20)}...</span>
                        )}
                        {refund.charge && (
                          <span>Charge: {refund.charge.substring(0, 20)}...</span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(refund.created * 1000), { addSuffix: true })}
                        </span>
                      </div>
                      {refund.reason && (
                        <p className="text-sm text-gray-600 mt-1">Reason: {refund.reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRefund(refund.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Refund Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Refund Details</DialogTitle>
              <DialogDescription>
                Detailed information about the refund
              </DialogDescription>
            </DialogHeader>
            {selectedRefund && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Refund ID</Label>
                    <p className="font-medium">{selectedRefund.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Status</Label>
                    <Badge variant={getStatusColor(selectedRefund.status)}>
                      {selectedRefund.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Amount</Label>
                    <p className="font-medium text-lg">
                      {formatAmount(selectedRefund.amount, selectedRefund.currency)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Created</Label>
                    <p className="font-medium">
                      {new Date(selectedRefund.created * 1000).toLocaleString()}
                    </p>
                  </div>
                  {selectedRefund.payment_intent && (
                    <div>
                      <Label className="text-sm text-gray-500">Payment Intent</Label>
                      <p className="font-medium font-mono text-sm">{selectedRefund.payment_intent}</p>
                    </div>
                  )}
                  {selectedRefund.charge && (
                    <div>
                      <Label className="text-sm text-gray-500">Charge</Label>
                      <p className="font-medium font-mono text-sm">{selectedRefund.charge}</p>
                    </div>
                  )}
                  {selectedRefund.reason && (
                    <div>
                      <Label className="text-sm text-gray-500">Reason</Label>
                      <p className="font-medium capitalize">{selectedRefund.reason.replace('_', ' ')}</p>
                    </div>
                  )}
                  {selectedRefund.receipt_number && (
                    <div>
                      <Label className="text-sm text-gray-500">Receipt Number</Label>
                      <p className="font-medium">{selectedRefund.receipt_number}</p>
                    </div>
                  )}
                </div>
                {selectedRefund.metadata && Object.keys(selectedRefund.metadata).length > 0 && (
                  <div>
                    <Label className="text-sm text-gray-500">Metadata</Label>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedRefund.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}

