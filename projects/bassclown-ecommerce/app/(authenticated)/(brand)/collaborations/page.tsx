'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Plus, MessageSquare, FileText, CheckCircle, XCircle, Clock, DollarSign, Calendar, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Proposal {
  id: string;
  collaborationId: string;
  proposedBy: string;
  proposalType: string;
  message: string;
  budget: string;
  timeline: string;
  deliverables: any[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  collaboration?: any;
  brandName?: string;
}

interface Collaboration {
  id: string;
  brandId: string;
  creatorId: string;
  title: string;
  description: string;
  type: string;
  status: string;
  budget: string;
  createdAt: Date;
}

export default function BrandCollaborationsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('collaborations');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'collaborations') {
        const response = await fetch('/api/brand/collaborations', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch collaborations: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.data?.collaborations) {
          setCollaborations(result.data.collaborations.map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt)
          })));
        }
      } else {
        const response = await fetch('/api/brand/collaborations/proposals?role=brand', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch proposals: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.data?.proposals) {
          setProposals(result.data.proposals.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt)
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-[#2D2D2D] border-gray-700">
                <Skeleton className="h-48 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && collaborations.length === 0 && proposals.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Alert variant="destructive" className="bg-[#2D2D2D] border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-white">
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchData}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Brand Collaborations</h1>
            <p className="text-gray-400">
              Manage collaboration proposals and partnerships with creators
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Collaboration
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#2D2D2D] border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Collaboration Proposal</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Send a collaboration proposal to a creator
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Alert className="bg-blue-900/20 border-blue-700">
                  <AlertDescription className="text-blue-300">
                    Collaboration proposal form coming soon. Use the API directly or create via admin panel.
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-[#2D2D2D]">
            <TabsTrigger value="collaborations">Collaborations ({collaborations.length})</TabsTrigger>
            <TabsTrigger value="proposals">Proposals ({proposals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="collaborations" className="space-y-6">
            {collaborations.length === 0 ? (
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardContent className="p-8 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Collaborations Yet</h3>
                  <p className="text-gray-400 mb-4">
                    Start collaborating with creators by sending a proposal
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Collaboration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collaborations.map((collaboration) => (
                  <Card key={collaboration.id} className="bg-[#2D2D2D] border-gray-700 hover:bg-[#3D3D3D] transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-white">{collaboration.title}</CardTitle>
                          <CardDescription className="text-gray-400 capitalize">{collaboration.type}</CardDescription>
                        </div>
                        <Badge variant={
                          collaboration.status === 'approved' || collaboration.status === 'active' ? 'default' :
                          collaboration.status === 'negotiating' ? 'secondary' :
                          collaboration.status === 'cancelled' ? 'destructive' : 'outline'
                        }>
                          {collaboration.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <DollarSign className="w-4 h-4" />
                          <span>Budget: ${collaboration.budget}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>Created {collaboration.createdAt.toLocaleDateString()}</span>
                        </div>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/brand/collaborations/${collaboration.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="proposals" className="space-y-6">
            {proposals.length === 0 ? (
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardContent className="p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Proposals</h3>
                  <p className="text-gray-400">
                    Your collaboration proposals will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <Card key={proposal.id} className="bg-[#2D2D2D] border-gray-700">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white">Proposal</CardTitle>
                          <CardDescription className="text-gray-400">
                            Created {proposal.createdAt.toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          proposal.status === 'accepted' ? 'default' :
                          proposal.status === 'rejected' ? 'destructive' :
                          proposal.status === 'expired' ? 'secondary' : 'outline'
                        }>
                          {proposal.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-300">{proposal.message}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Budget:</span>
                            <span className="ml-2 text-white font-semibold">${proposal.budget}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Timeline:</span>
                            <span className="ml-2 text-white">{proposal.timeline}</span>
                          </div>
                        </div>
                        {proposal.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message Creator
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

