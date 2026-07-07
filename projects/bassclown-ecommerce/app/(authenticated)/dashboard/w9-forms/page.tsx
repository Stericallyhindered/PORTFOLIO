'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { W9FormComponent } from '@/components/w9/W9FormComponent';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Shield,
  Eye,
  Edit,
  Send
} from 'lucide-react';

interface W9Form {
  id: number;
  status: string;
  payeeName: string;
  businessType: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  expirationDate?: string;
  isValid: boolean;
}

export default function W9FormsPage() {
  const { data: session } = useSession();
  const [forms, setForms] = useState<W9Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState<W9Form | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');

  useEffect(() => {
    if (session?.user?.id) {
      fetchW9Forms();
    }
  }, [session]);

  const fetchW9Forms = async () => {
    try {
      const response = await fetch('/api/w9-forms');
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms || []);
      }
    } catch (error) {
      console.error('Error fetching W9 forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async (formData: unknown) => {
    try {
      const response = await fetch('/api/w9-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData })
      });

      if (response.ok) {
        await fetchW9Forms();
        setViewMode('list');
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        alert(`Error creating W9 form: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating W9 form:', error);
      alert('Failed to create W9 form');
    }
  };

  const handleUpdateForm = async (formData: unknown) => {
    if (!selectedForm) return;

    try {
      const response = await fetch(`/api/w9-forms/${selectedForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData })
      });

      if (response.ok) {
        await fetchW9Forms();
        setViewMode('list');
        setSelectedForm(null);
      } else {
        const error = await response.json();
        alert(`Error updating W9 form: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating W9 form:', error);
      alert('Failed to update W9 form');
    }
  };

  const handleSubmitForm = async (w9FormId: number) => {
    try {
      const response = await fetch(`/api/w9-forms/${w9FormId}/submit`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchW9Forms();
        alert('W9 form submitted successfully for review');
      } else {
        const error = await response.json();
        alert(`Error submitting W9 form: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting W9 form:', error);
      alert('Failed to submit W9 form');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'submitted':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpiringSoon = (expirationDate?: string) => {
    if (!expirationDate) return false;
    const expiry = new Date(expirationDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading W9 forms...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (viewMode === 'create') {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setViewMode('list')}
              className="mb-4"
            >
              ← Back to W9 Forms
            </Button>
          </div>
          <W9FormComponent
            onSubmit={handleCreateForm}
            onCancel={() => setViewMode('list')}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (viewMode === 'edit' && selectedForm) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('list');
                setSelectedForm(null);
              }}
              className="mb-4"
            >
              ← Back to W9 Forms
            </Button>
          </div>
          <W9FormComponent
            onSubmit={handleUpdateForm}
            onCancel={() => {
              setViewMode('list');
              setSelectedForm(null);
            }}
            readonly={selectedForm.status !== 'draft'}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (viewMode === 'view' && selectedForm) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('list');
                setSelectedForm(null);
              }}
              className="mb-4"
            >
              ← Back to W9 Forms
            </Button>
          </div>
          <W9FormComponent
            onCancel={() => {
              setViewMode('list');
              setSelectedForm(null);
            }}
            readonly={true}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Shield className="w-8 h-8" />
              W9 Tax Forms
            </h1>
            <p className="text-gray-400 mt-2">
              Manage your tax compliance forms for prize winnings and payments
            </p>
          </div>
          <Button onClick={() => setViewMode('create')}>
            <Plus className="w-4 h-4 mr-2" />
            New W9 Form
          </Button>
        </div>

        {/* Alerts for expiring forms */}
        {forms.some(form => form.isValid && isExpiringSoon(form.expirationDate)) && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have W9 forms that will expire soon. Please review and update them to maintain compliance.
            </AlertDescription>
          </Alert>
        )}

        {/* Forms List */}
        <div className="grid gap-4">
          {forms.length === 0 ? (
            <Card className="bg-[#2D2D2D] border-gray-700">
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No W9 Forms</h3>
                <p className="text-gray-400 mb-4">
                  You haven&apos;t created any W9 forms yet. Create your first form to get started.
                </p>
                <Button onClick={() => setViewMode('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create W9 Form
                </Button>
              </CardContent>
            </Card>
          ) : (
            forms.map((form) => (
              <Card key={form.id} className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <CardTitle className="text-white">{form.payeeName}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {form.businessType} • Created {formatDate(form.createdAt)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(form.status)}
                      {form.isValid && isExpiringSoon(form.expirationDate) && (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {form.submittedAt && (
                        <div>
                          <span className="text-gray-400">Submitted:</span>
                          <span className="text-white ml-2">{formatDate(form.submittedAt)}</span>
                        </div>
                      )}
                      {form.expirationDate && (
                        <div>
                          <span className="text-gray-400">Expires:</span>
                          <span className="text-white ml-2">{formatDate(form.expirationDate)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedForm(form);
                          setViewMode('view');
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {form.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedForm(form);
                            setViewMode('edit');
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {form.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleSubmitForm(form.id)}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 