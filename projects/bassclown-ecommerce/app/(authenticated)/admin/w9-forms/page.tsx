'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Search, CheckCircle, XCircle, Eye, FileText, AlertCircle, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface W9Form {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  businessName: string | null;
  businessType: string | null;
  name: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired';
  submittedAt: Date | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

export default function AdminW9FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<W9Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedForm, setSelectedForm] = useState<W9Form | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchW9Forms();
  }, [statusFilter]);

  const fetchW9Forms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await fetch(`/api/admin/w9-forms${statusParam}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch W9 forms: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.forms) {
        setForms(result.data.forms);
      } else {
        throw new Error(result.message || 'Failed to fetch W9 forms');
      }
    } catch (err) {
      console.error('Error fetching W9 forms:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching W9 forms');
      toast({
        title: "Error",
        description: "Failed to load W9 forms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedForm) return;

    try {
      setReviewing(true);
      
      const response = await fetch(`/api/admin/w9-forms/${selectedForm.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: reviewAction,
          rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to review W9 form: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: reviewAction === 'approve' 
            ? 'W9 form approved successfully' 
            : 'W9 form rejected successfully',
        });
        setReviewDialogOpen(false);
        setSelectedForm(null);
        setRejectionReason('');
        fetchW9Forms(); // Refresh the list
      } else {
        throw new Error(result.message || 'Failed to review W9 form');
      }
    } catch (err) {
      console.error('Error reviewing W9 form:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to review W9 form',
        variant: "destructive",
      });
    } finally {
      setReviewing(false);
    }
  };

  const openReviewDialog = (form: W9Form, action: 'approve' | 'reject') => {
    setSelectedForm(form);
    setReviewAction(action);
    setRejectionReason('');
    setReviewDialogOpen(true);
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = 
      form.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const counts = {
    submitted: forms.filter(f => f.status === 'submitted').length,
    approved: forms.filter(f => f.status === 'approved').length,
    rejected: forms.filter(f => f.status === 'rejected').length,
    total: forms.length
  };

  if (loading) {
    return (
      <>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error && forms.length === 0) {
    return (
      <>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchW9Forms}>
            Retry
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">W9 Form Review</h1>
            <p className="text-gray-600 mt-1">Review and manage W9 tax forms submitted by users</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{counts.submitted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or business..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Forms Table */}
        <Card>
          <CardHeader>
            <CardTitle>W9 Forms</CardTitle>
            <CardDescription>
              {filteredForms.length} form{filteredForms.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredForms.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No W9 forms found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Business Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{form.userName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{form.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{form.businessName || form.name}</TableCell>
                      <TableCell>{form.businessType || 'Individual'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          form.status === 'approved' ? 'default' :
                          form.status === 'rejected' ? 'destructive' :
                          form.status === 'submitted' ? 'secondary' : 'outline'
                        }>
                          {form.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {form.submittedAt 
                          ? new Date(form.submittedAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/w9-forms/${form.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          {form.status === 'submitted' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openReviewDialog(form, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openReviewDialog(form, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reviewAction === 'approve' ? 'Approve W9 Form' : 'Reject W9 Form'}
              </DialogTitle>
              <DialogDescription>
                {reviewAction === 'approve'
                  ? 'Are you sure you want to approve this W9 form? This action cannot be undone.'
                  : 'Please provide a reason for rejecting this W9 form.'}
              </DialogDescription>
            </DialogHeader>
            {selectedForm && (
              <div className="space-y-4 py-4">
                <div>
                  <Label>User</Label>
                  <p className="text-sm text-gray-600">
                    {selectedForm.userName} ({selectedForm.userEmail})
                  </p>
                </div>
                <div>
                  <Label>Form Name</Label>
                  <p className="text-sm text-gray-600">{selectedForm.name}</p>
                </div>
                {reviewAction === 'reject' && (
                  <div>
                    <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      rows={4}
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
                disabled={reviewing}
              >
                Cancel
              </Button>
              <Button
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                onClick={handleReview}
                disabled={reviewing || (reviewAction === 'reject' && !rejectionReason.trim())}
              >
                {reviewing ? 'Processing...' : reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

