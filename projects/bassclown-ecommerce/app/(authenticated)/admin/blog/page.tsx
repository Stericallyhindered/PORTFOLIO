'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Image as ImageIcon, 
  Video, 
  FileText,
  Loader2,
  Save,
  X,
  Upload,
  Globe,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  images: string[] | null;
  videos: any[] | null;
  category: string | null;
  tags: string[] | null;
  authorName: string | null;
  published: boolean;
  publishedAt: string | null;
  featured: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  metaKeywords?: string[] | null;
}

export default function BlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    images: [] as string[],
    videos: [] as any[],
    category: '',
    tags: [] as string[],
    published: false,
    featured: false,
    seoTitle: '',
    seoDescription: '',
    metaKeywords: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const featuredImageRef = useRef<HTMLInputElement>(null);
  const additionalImageRef = useRef<HTMLInputElement>(null);
  const videoUrlRef = useRef<HTMLInputElement>(null);
  const videoTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blog?limit=100&published=false', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }

      const result = await response.json();

      if (result.success && result.data?.posts) {
        setPosts(result.data.posts);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.message || 'Upload failed');
        return null;
      }

      const result = await response.json();
      if (result.success && result.data?.url) {
        return result.data.url;
      }
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
      return null;
    }
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFeatured(true);
    const url = await uploadFile(file);
    if (url) {
      setFormData(prev => ({ ...prev, featuredImage: url }));
    }
    setUploadingFeatured(false);
    if (featuredImageRef.current) featuredImageRef.current.value = '';
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const url = await uploadFile(file);
    if (url) {
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), url]
      }));
    }
    setUploadingImage(false);
    if (additionalImageRef.current) additionalImageRef.current.value = '';
  };

  const handleAddVideo = () => {
    const url = videoUrlRef.current?.value?.trim();
    const title = videoTitleRef.current?.value?.trim() || '';
    if (url) {
      setFormData(prev => ({
        ...prev,
        videos: [...(prev.videos || []), { url, title, thumbnail: '' }]
      }));
      if (videoUrlRef.current) videoUrlRef.current.value = '';
      if (videoTitleRef.current) videoTitleRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const handleRemoveVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingPost 
        ? `/api/blog/${editingPost.id}`
        : '/api/blog';
      
      const method = editingPost ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          publishedAt: formData.published ? new Date().toISOString() : null
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to save blog post');
      }

      setIsDialogOpen(false);
      setEditingPost(null);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      console.error('Error saving blog post:', error);
      alert(error.message || 'Failed to save blog post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      images: [],
      videos: [],
      category: '',
      tags: [],
      published: false,
      featured: false,
      seoTitle: '',
      seoDescription: '',
      metaKeywords: []
    });
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featuredImage: post.featuredImage || '',
      images: post.images || [],
      videos: post.videos || [],
      category: post.category || '',
      tags: post.tags || [],
      published: post.published,
      featured: post.featured,
      seoTitle: post.seoTitle ?? '',
      seoDescription: post.seoDescription ?? '',
      metaKeywords: post.metaKeywords ?? []
    });
    setIsDialogOpen(true);
  };

  const handleTogglePublish = async (post: BlogPost) => {
    const newPublished = !post.published;
    try {
      const response = await fetch(`/api/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          published: newPublished,
          publishedAt: newPublished ? new Date().toISOString() : null
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        alert(err?.message || 'Failed to update');
        return;
      }

      fetchPosts();
    } catch (error) {
      console.error('Error toggling publish:', error);
      alert('Failed to update blog post.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete blog post');
      }

      fetchPosts();
    } catch (error) {
      console.error('Error deleting blog post:', error);
      alert('Failed to delete blog post. Please try again.');
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600 mt-1">Create and manage blog posts with images, videos, and rich content</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingPost(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Blog Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="blog-dialog-desc">
            <DialogHeader>
              <DialogTitle>{editingPost ? 'Edit Blog Post' : 'Create Blog Post'}</DialogTitle>
              <DialogDescription id="blog-dialog-desc">
                Create a fully featured blog post with images, videos, and rich text content
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="Enter your blog post title"
                />
                {formData.slug && (
                  <p className="text-xs text-gray-500">
                    URL: /blog/<span className="font-medium">{formData.slug}</span>
                  </p>
                )}
                <input type="hidden" name="slug" value={formData.slug} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  placeholder="Short summary for blog listings..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={15}
                  required
                  placeholder="Full blog post content (HTML supported)..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">You can use HTML tags for formatting: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;blockquote&gt;, &lt;a href=&quot;...&quot;&gt;</p>
              </div>

              {/* Featured Image - File Upload */}
              <div className="space-y-2">
                <Label>Featured Image</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={featuredImageRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFeaturedImageUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => featuredImageRef.current?.click()}
                    disabled={uploadingFeatured}
                  >
                    {uploadingFeatured ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" />Upload Image</>
                    )}
                  </Button>
                  <span className="text-sm text-gray-500">or enter URL:</span>
                  <Input
                    type="url"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1"
                  />
                </div>
                {formData.featuredImage && (
                  <div className="relative w-full h-48 mt-2 border rounded overflow-hidden group">
                    <Image
                      src={formData.featuredImage}
                      alt="Featured"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Images - File Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Additional Images</Label>
                  <div className="flex gap-2">
                    <input
                      ref={additionalImageRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAdditionalImageUpload}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => additionalImageRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                      ) : (
                        <><ImageIcon className="h-4 w-4 mr-2" />Upload Image</>
                      )}
                    </Button>
                  </div>
                </div>
                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative h-24 border rounded group overflow-hidden">
                        <Image
                          src={img}
                          alt={`Image ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos - URL Input */}
              <div className="space-y-2">
                <Label>Videos</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={videoUrlRef}
                    type="url"
                    placeholder="Video URL (YouTube, Vimeo, or direct)"
                    className="flex-1"
                  />
                  <Input
                    ref={videoTitleRef}
                    type="text"
                    placeholder="Title (optional)"
                    className="w-48"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddVideo}>
                    <Video className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                {formData.videos && formData.videos.length > 0 && (
                  <div className="space-y-2">
                    {formData.videos.map((video, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                        <Video className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{video.title || 'Untitled Video'}</p>
                          <p className="text-xs text-gray-500 truncate">{video.url}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVideo(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Video Production, Industry Insights"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                    }))}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorName">Author Name</Label>
                  <Input
                    id="authorName"
                    value={formData.excerpt ? undefined : undefined}
                    disabled
                    placeholder="Auto-filled from your account"
                    className="text-gray-500"
                  />
                  <p className="text-xs text-gray-500">Author is set automatically from your account</p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                  />
                  <Label htmlFor="published">Published</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </div>

              {/* SEO Section */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">SEO Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="Custom title for search engines"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seoDescription">SEO Description</Label>
                    <Textarea
                      id="seoDescription"
                      value={formData.seoDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                      rows={2}
                      placeholder="Meta description for search engines"
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="metaKeywords">Meta Keywords (comma-separated)</Label>
                  <Input
                    id="metaKeywords"
                    value={formData.metaKeywords?.join(', ') || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      metaKeywords: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                    }))}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingPost ? 'Update' : 'Create'} Post
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{posts.length}</p>
              <p className="text-sm text-gray-500">Total Posts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{posts.filter(p => p.published).length}</p>
              <p className="text-sm text-gray-500">Published</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{posts.filter(p => !p.published).length}</p>
              <p className="text-sm text-gray-500">Drafts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{posts.reduce((sum, p) => sum + (p.views || 0), 0)}</p>
              <p className="text-sm text-gray-500">Total Views</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
          <CardDescription>Manage your blog content - create, edit, publish, and delete posts</CardDescription>
          <div className="flex items-center space-x-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search posts..." 
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
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.featuredImage && (
                          <div className="relative w-12 h-8 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={post.featuredImage}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-gray-500">/{post.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{post.category || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {post.published ? (
                          <Badge variant="default" className="bg-green-600">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                        {post.featured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {post.images && post.images.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <ImageIcon className="h-3 w-3 mr-1" />{post.images.length}
                          </Badge>
                        )}
                        {post.videos && post.videos.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Video className="h-3 w-3 mr-1" />{post.videos.length}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{post.views || 0}</TableCell>
                    <TableCell>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(post)}
                          title={post.published ? 'Unpublish' : 'Publish'}
                          className={post.published ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {post.published ? <EyeOff className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                        </Button>
                        {post.published && (
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <Button variant="ghost" size="sm" title="View on site">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(post)}
                          title="Edit post"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                          title="Delete post"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No blog posts found</p>
              <p className="text-sm text-gray-500 mb-4">Create your first blog post to get started</p>
              <Button onClick={() => { setEditingPost(null); resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
