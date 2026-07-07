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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FileText, Plus, Download, Eye, Edit, Trash2, ExternalLink, AlertCircle, Image } from 'lucide-react';
import Link from 'next/link';

interface MediaKit {
  id: string;
  title: string;
  type: 'brand' | 'creator' | 'contest';
  status: 'draft' | 'published' | 'archived';
  pdfUrl?: string;
  htmlUrl?: string;
  shareToken?: string;
  isPublic: boolean;
  downloadCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MediaKitTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'brand' | 'creator' | 'contest';
  isActive: boolean;
  isPremium: boolean;
  previewImageUrl?: string;
}

export default function MediaKitsPage() {
  const [mediaKits, setMediaKits] = useState<MediaKit[]>([]);
  const [templates, setTemplates] = useState<MediaKitTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKit, setNewKit] = useState({
    title: '',
    description: '',
    templateId: '',
    type: 'creator' as 'brand' | 'creator' | 'contest',
    isPublic: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMediaKits();
    fetchTemplates();
  }, []);

  const fetchMediaKits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/media-kits', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch media kits: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.mediaKits) {
        setMediaKits(result.data.mediaKits.map((kit: any) => ({
          ...kit,
          createdAt: new Date(kit.createdAt),
          updatedAt: new Date(kit.updatedAt)
        })));
      } else {
        throw new Error(result.message || 'Failed to fetch media kits');
      }
    } catch (err) {
      console.error('Error fetching media kits:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching media kits');
      toast({
        title: "Error",
        description: "Failed to load media kits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/media-kits/templates', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.templates) {
          setTemplates(result.data.templates);
        }
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleCreateMediaKit = async () => {
    if (!newKit.title || !newKit.templateId) {
      toast({
        title: "Validation Error",
        description: "Title and template are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      
      const response = await fetch('/api/media-kits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newKit),
      });

      if (!response.ok) {
        throw new Error(`Failed to create media kit: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Media kit created successfully",
        });
        setCreateDialogOpen(false);
        setNewKit({
          title: '',
          description: '',
          templateId: '',
          type: 'creator',
          isPublic: false
        });
        fetchMediaKits(); // Refresh the list
      } else {
        throw new Error(result.message || 'Failed to create media kit');
      }
    } catch (err) {
      console.error('Error creating media kit:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create media kit',
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleGeneratePDF = async (kitId: string) => {
    try {
      const response = await fetch(`/api/media-kits/${kitId}/generate-pdf`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const result = await response.json();
      
      if (result.success && result.data?.pdfUrl) {
        toast({
          title: "Success",
          description: "PDF generated successfully",
        });
        fetchMediaKits(); // Refresh to get updated PDF URL
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const filteredTemplates = templates.filter(t => t.type === newKit.type);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-[#2D2D2D] border-gray-700">
                <Skeleton className="aspect-video w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && mediaKits.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Alert variant="destructive" className="bg-[#2D2D2D] border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-white">
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchMediaKits}>
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
            <h1 className="text-3xl font-bold text-white mb-2">Media Kits</h1>
            <p className="text-gray-400">
              Create and manage your professional media kits to showcase your work and collaborate with brands
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Media Kit
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#2D2D2D] border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Create New Media Kit</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Choose a template and customize your media kit
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={newKit.type} 
                    onValueChange={(value: 'brand' | 'creator' | 'contest') => {
                      setNewKit({ ...newKit, type: value, templateId: '' });
                    }}
                  >
                    <SelectTrigger id="type" className="bg-[#1D1D1D] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2D2D2D] border-gray-700">
                      <SelectItem value="creator">Creator</SelectItem>
                      <SelectItem value="brand">Brand</SelectItem>
                      <SelectItem value="contest">Contest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template">Template *</Label>
                  <Select 
                    value={newKit.templateId} 
                    onValueChange={(value) => setNewKit({ ...newKit, templateId: value })}
                  >
                    <SelectTrigger id="template" className="bg-[#1D1D1D] border-gray-700 text-white">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2D2D2D] border-gray-700">
                      {filteredTemplates.length === 0 ? (
                        <SelectItem value="" disabled>No templates available for this type</SelectItem>
                      ) : (
                        filteredTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} {template.isPremium && '(Premium)'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newKit.title}
                    onChange={(e) => setNewKit({ ...newKit, title: e.target.value })}
                    placeholder="My Professional Media Kit"
                    className="bg-[#1D1D1D] border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newKit.description}
                    onChange={(e) => setNewKit({ ...newKit, description: e.target.value })}
                    placeholder="Brief description of your media kit..."
                    rows={3}
                    className="bg-[#1D1D1D] border-gray-700 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newKit.isPublic}
                    onChange={(e) => setNewKit({ ...newKit, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isPublic" className="cursor-pointer">
                    Make this media kit publicly shareable
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={creating}
                  className="bg-[#1D1D1D] border-gray-700 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateMediaKit}
                  disabled={creating || !newKit.title || !newKit.templateId}
                >
                  {creating ? 'Creating...' : 'Create Media Kit'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {mediaKits.length === 0 ? (
          <Card className="bg-[#2D2D2D] border-gray-700">
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Media Kits Yet</h3>
              <p className="text-gray-400 mb-4">
                Create your first media kit to showcase your work and attract brand collaborations
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Media Kit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediaKits.map((kit) => (
              <Card key={kit.id} className="bg-[#2D2D2D] border-gray-700 hover:bg-[#3D3D3D] transition-colors">
                <div className="aspect-video bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                  {kit.pdfUrl ? (
                    <Image className="w-16 h-16 text-purple-300" />
                  ) : (
                    <FileText className="w-16 h-16 text-purple-300" />
                  )}
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-white">{kit.title}</CardTitle>
                      <CardDescription className="text-gray-400 capitalize">{kit.type} Media Kit</CardDescription>
                    </div>
                    <Badge variant={kit.status === 'published' ? 'default' : kit.status === 'draft' ? 'secondary' : 'outline'}>
                      {kit.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Views</span>
                      <span className="text-white">{kit.viewCount}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Downloads</span>
                      <span className="text-white">{kit.downloadCount}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Created</span>
                      <span className="text-white">{kit.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/dashboard/media-kits/${kit.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    {kit.status === 'draft' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleGeneratePDF(kit.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Generate PDF
                      </Button>
                    )}
                    {kit.pdfUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(kit.pdfUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {kit.shareToken && kit.isPublic && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">Public Share Link:</p>
                      <div className="flex gap-2">
                        <Input
                          value={`${window.location.origin}/media-kit/${kit.shareToken}`}
                          readOnly
                          className="text-xs bg-[#1D1D1D] border-gray-700 text-white"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/media-kit/${kit.shareToken}`);
                            toast({
                              title: "Copied",
                              description: "Share link copied to clipboard",
                            });
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

