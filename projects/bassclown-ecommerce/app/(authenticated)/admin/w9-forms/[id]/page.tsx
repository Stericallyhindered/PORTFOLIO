'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Download,
  AlertCircle,
  Calendar,
  User,
  Building,
  MapPin,
  Shield
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface W9FormDetails {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  businessName: string | null;
  businessType: string | null;
  taxClassification: string | null;
  payeeName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  tinType: string;
  formData: {
    taxIdNumber: string;
  };
  isCertified: boolean;
  certificationDate: Date | null;
  signature: string | null;
  isSubjectToBackupWithholding: boolean;
  backupWithholdingReason: string | null;
  status: string;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  formFileUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function W9FormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  
  const [form, setForm] = useState<W9FormDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFormDetails();
  }, [formId]);

  const fetchFormDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/w9-forms/${formId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch W9 form: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.form) {
        setForm(result.data.form);
      } else {
        throw new Error(result.message || 'Failed to fetch W9 form');
      }
    } catch (err) {
      console.error('Error fetching W9 form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: "Failed to load W9 form details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      
      const response = await fetch(`/api/admin/w9-forms/${formId}/generate-pdf`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.pdfUrl) {
        toast({
          title: "Success",
          description: "PDF generated successfully",
        });
        // Update form with PDF URL
        if (form) {
          setForm({ ...form, formFileUrl: result.data.pdfUrl });
        }
        // Open PDF in new tab
        window.open(result.data.pdfUrl, '_blank');
      } else {
        throw new Error(result.message || 'Failed to generate PDF');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to generate PDF',
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleReview = async () => {
    if (!form) return;

    try {
      setReviewing(true);
      
      const response = await fetch(`/api/admin/w9-forms/${formId}/review`, {
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
        setRejectionReason('');
        fetchFormDetails(); // Refresh form details
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

  const openReviewDialog = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setRejectionReason('');
    setReviewDialogOpen(true);
  };

  if (loading) {
    return (
      <>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error && !form) {
    return (
      <>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchFormDetails}>Retry</Button>
        </div>
      </>
    );
  }

  if (!form) {
    return (
      <>
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>W9 form not found</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  const statusColors = {
    draft: 'outline',
    submitted: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    expired: 'outline'
  } as const;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/w9-forms')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">W9 Form Details</h1>
              <p className="text-gray-600 mt-1">Form ID: {form.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {form.formFileUrl ? (
              <Button
                variant="outline"
                onClick={() => window.open(form.formFileUrl!, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                View PDF
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleGeneratePDF}
                disabled={generatingPDF}
              >
                <FileText className="h-4 w-4 mr-2" />
                {generatingPDF ? 'Generating...' : 'Generate PDF'}
              </Button>
            )}
            {form.status === 'submitted' && (
              <>
                <Button
                  variant="default"
                  onClick={() => openReviewDialog('approve')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => openReviewDialog('reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant={statusColors[form.status as keyof typeof statusColors] || 'outline'}>
                  {form.status}
                </Badge>
                {form.isCertified && (
                  <Badge variant="default">
                    <Shield className="h-3 w-3 mr-1" />
                    Certified
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Submitted: {form.submittedAt ? new Date(form.submittedAt).toLocaleString() : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500">Name</Label>
              <p className="font-medium">{form.user?.name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Email</Label>
              <p className="font-medium">{form.user?.email || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">User ID</Label>
              <p className="font-medium font-mono text-sm">{form.userId}</p>
            </div>
          </CardContent>
        </Card>

        {/* Form Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Form Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">Payee Name</Label>
                <p className="font-medium">{form.payeeName}</p>
              </div>
              {form.businessName && (
                <div>
                  <Label className="text-sm text-gray-500">Business Name</Label>
                  <p className="font-medium">{form.businessName}</p>
                </div>
              )}
              <div>
                <Label className="text-sm text-gray-500">Business Type</Label>
                <p className="font-medium">{form.businessType || 'Individual'}</p>
              </div>
              {form.taxClassification && (
                <div>
                  <Label className="text-sm text-gray-500">Tax Classification</Label>
                  <p className="font-medium">{form.taxClassification}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{form.address}</p>
              <p className="text-gray-600">
                {form.city}, {form.state} {form.zipCode}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tax Identification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tax Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500">TIN Type</Label>
              <p className="font-medium uppercase">{form.tinType}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Tax ID Number</Label>
              <p className="font-medium font-mono">
                {form.formData?.taxIdNumber ? 
                  form.formData.taxIdNumber.replace(/(\d{2})(\d{2})(\d{5})/, '$1-$2-$3') : 
                  'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Certification */}
        <Card>
          <CardHeader>
            <CardTitle>Certification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {form.isCertified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {form.isCertified ? 'Form is certified' : 'Form is not certified'}
              </span>
            </div>
            {form.certificationDate && (
              <div>
                <Label className="text-sm text-gray-500">Certification Date</Label>
                <p className="font-medium">
                  {new Date(form.certificationDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {form.signature && (
              <div>
                <Label className="text-sm text-gray-500">Signature</Label>
                <div className="mt-2">
                  <img 
                    src={form.signature} 
                    alt="Signature" 
                    className="max-w-xs border rounded"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup Withholding */}
        {form.isSubjectToBackupWithholding && (
          <Card>
            <CardHeader>
              <CardTitle>Backup Withholding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">Subject to backup withholding: Yes</p>
                {form.backupWithholdingReason && (
                  <div>
                    <Label className="text-sm text-gray-500">Reason</Label>
                    <p className="font-medium">{form.backupWithholdingReason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Information */}
        {form.reviewedAt && (
          <Card>
            <CardHeader>
              <CardTitle>Review Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Reviewed At</Label>
                <p className="font-medium">
                  {new Date(form.reviewedAt).toLocaleString()}
                </p>
              </div>
              {form.reviewNotes && (
                <div>
                  <Label className="text-sm text-gray-500">Review Notes</Label>
                  <p className="font-medium">{form.reviewNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
            {reviewAction === 'reject' && (
              <div className="space-y-4 py-4">
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

