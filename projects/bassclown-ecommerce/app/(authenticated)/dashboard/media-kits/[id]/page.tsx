'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Download, 
  ExternalLink,
  AlertCircle,
  FileText,
  Edit
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MediaKit {
  id: string;
  title: string;
  description?: string;
  type: 'brand' | 'creator' | 'contest';
  status: 'draft' | 'published' | 'archived';
  kitData: any;
  customization?: any;
  generatedPdfUrl?: string;
  shareToken?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function MediaKitEditorPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id as string;
  
  const [mediaKit, setMediaKit] = useState<MediaKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMediaKit();
  }, [kitId]);

  const fetchMediaKit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/media-kits/${kitId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch media kit: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.mediaKit) {
        setMediaKit({
          ...result.data.mediaKit,
          createdAt: new Date(result.data.mediaKit.createdAt),
          updatedAt: new Date(result.data.mediaKit.updatedAt)
        });
      } else {
        throw new Error(result.message || 'Failed to fetch media kit');
      }
    } catch (err) {
      console.error('Error fetching media kit:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: "Failed to load media kit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!mediaKit) return;

    try {
      setSaving(true);
      
      const response = await fetch(`/api/media-kits/${kitId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: mediaKit.title,
          description: mediaKit.description,
          kitData: mediaKit.kitData,
          customization: mediaKit.customization,
          status: mediaKit.status,
          isPublic: mediaKit.isPublic
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save media kit: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Media kit saved successfully",
        });
        fetchMediaKit(); // Refresh
      } else {
        throw new Error(result.message || 'Failed to save media kit');
      }
    } catch (err) {
      console.error('Error saving media kit:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to save media kit',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true);
      
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
        fetchMediaKit(); // Refresh to get PDF URL
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card className="bg-[#2D2D2D] border-gray-700">
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !mediaKit) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Alert variant="destructive" className="bg-[#2D2D2D] border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-white">{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchMediaKit}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!mediaKit) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Alert className="bg-[#2D2D2D] border-gray-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-white">Media kit not found</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const kitData = mediaKit.kitData || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/media-kits')}
              className="bg-[#1D1D1D] border-gray-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Media Kit</h1>
              <p className="text-gray-400 mt-1">{mediaKit.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="bg-[#1D1D1D] border-gray-700 text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            {mediaKit.generatedPdfUrl ? (
              <Button
                variant="outline"
                onClick={() => window.open(mediaKit.generatedPdfUrl, '_blank')}
                className="bg-[#1D1D1D] border-gray-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                View PDF
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleGeneratePDF}
                disabled={generatingPDF}
                className="bg-[#1D1D1D] border-gray-700 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                {generatingPDF ? 'Generating...' : 'Generate PDF'}
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <Card className="bg-[#2D2D2D] border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Badge variant={mediaKit.status === 'published' ? 'default' : 'secondary'}>
                {mediaKit.status}
              </Badge>
              <div className="text-sm text-gray-400">
                Last updated: {mediaKit.updatedAt.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {previewMode ? (
          /* Preview Mode */
          <Card className="bg-[#2D2D2D] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-8 rounded-lg">
                <div className="text-center mb-8 pb-6 border-b-2 border-red-600">
                  <h1 className="text-4xl font-bold text-red-600 mb-2">{mediaKit.title}</h1>
                  <h2 className="text-2xl text-blue-600 mb-4">{kitData.userInfo?.name || 'Your Name'}</h2>
                  {mediaKit.description && <p className="text-gray-600">{mediaKit.description}</p>}
                </div>
                
                {kitData.stats && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-orange-500 pb-2">
                      Performance Statistics
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded border-t-4 border-red-600">
                        <div className="text-3xl font-bold text-red-600">{kitData.stats.totalContests || 0}</div>
                        <div className="text-sm text-gray-600 mt-1">Total Contests</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded border-t-4 border-red-600">
                        <div className="text-3xl font-bold text-red-600">{kitData.stats.totalWins || 0}</div>
                        <div className="text-sm text-gray-600 mt-1">Wins</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded border-t-4 border-red-600">
                        <div className="text-3xl font-bold text-red-600">{kitData.stats.winRate?.toFixed(1) || 0}%</div>
                        <div className="text-sm text-gray-600 mt-1">Win Rate</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded border-t-4 border-red-600">
                        <div className="text-3xl font-bold text-red-600">{kitData.stats.totalPoints || 0}</div>
                        <div className="text-sm text-gray-600 mt-1">Points</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded border-t-4 border-red-600">
                        <div className="text-3xl font-bold text-red-600">{kitData.stats.averageScore?.toFixed(1) || 0}</div>
                        <div className="text-sm text-gray-600 mt-1">Avg Score</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded border-t-4 border-red-600">
                        <div className="text-3xl font-bold text-red-600">{kitData.stats.contestsThisYear || 0}</div>
                        <div className="text-sm text-gray-600 mt-1">This Year</div>
                      </div>
                    </div>
                  </div>
                )}

                {kitData.portfolio && kitData.portfolio.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 border-b-2 border-orange-500 pb-2">
                      Portfolio Highlights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {kitData.portfolio.slice(0, 6).map((item: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                          <h4 className="font-bold text-red-600 mb-2">{item.title || 'Untitled'}</h4>
                          {item.contestName && <p className="text-sm text-gray-600"><strong>Contest:</strong> {item.contestName}</p>}
                          {item.score && <p className="text-sm text-gray-600"><strong>Score:</strong> {item.score}</p>}
                          <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {kitData.contact && (
                  <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-red-600">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Contact & Collaboration</h3>
                    {kitData.userInfo?.email && <p className="mb-2"><strong>Email:</strong> {kitData.userInfo.email}</p>}
                    <p className="mb-2"><strong>Preferred Contact:</strong> {kitData.contact.preferredContact || 'Email'}</p>
                    <p className="mb-2"><strong>Availability:</strong> {kitData.contact.availability || 'Available'}</p>
                    {kitData.contact.collaborationInterests && kitData.contact.collaborationInterests.length > 0 && (
                      <p><strong>Interests:</strong> {kitData.contact.collaborationInterests.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Edit Mode */
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="bg-[#1D1D1D] border-gray-700">
              <TabsTrigger value="basic" className="text-white">Basic Info</TabsTrigger>
              <TabsTrigger value="content" className="text-white">Content</TabsTrigger>
              <TabsTrigger value="settings" className="text-white">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-white">Title *</Label>
                    <Input
                      id="title"
                      value={mediaKit.title}
                      onChange={(e) => setMediaKit({ ...mediaKit, title: e.target.value })}
                      className="bg-[#1D1D1D] border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={mediaKit.description || ''}
                      onChange={(e) => setMediaKit({ ...mediaKit, description: e.target.value })}
                      rows={4}
                      className="bg-[#1D1D1D] border-gray-700 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Content Overview</CardTitle>
                  <CardDescription className="text-gray-400">
                    Content is automatically generated from your contest submissions and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-white">
                    <div>
                      <strong>Total Contests:</strong> {kitData.stats?.totalContests || 0}
                    </div>
                    <div>
                      <strong>Total Wins:</strong> {kitData.stats?.totalWins || 0}
                    </div>
                    <div>
                      <strong>Portfolio Items:</strong> {kitData.portfolio?.length || 0}
                    </div>
                    <p className="text-gray-400 text-sm mt-4">
                      To update content, participate in more contests and improve your statistics.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="bg-[#2D2D2D] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={mediaKit.isPublic}
                      onChange={(e) => setMediaKit({ ...mediaKit, isPublic: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isPublic" className="text-white cursor-pointer">
                      Make this media kit publicly shareable
                    </Label>
                  </div>
                  {mediaKit.shareToken && mediaKit.isPublic && (
                    <div>
                      <Label className="text-white">Share Link</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={`${window.location.origin}/media-kit/${mediaKit.shareToken}`}
                          readOnly
                          className="bg-[#1D1D1D] border-gray-700 text-white"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/media-kit/${mediaKit.shareToken}`);
                            toast({
                              title: "Copied",
                              description: "Share link copied to clipboard",
                            });
                          }}
                          className="bg-[#1D1D1D] border-gray-700 text-white"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
