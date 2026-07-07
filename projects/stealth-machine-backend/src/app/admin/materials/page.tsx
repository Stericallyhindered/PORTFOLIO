'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Upload, FileText, Video, Image, Eye, Download, 
  X, Trash2, Edit, Check, AlertCircle 
} from 'lucide-react';

interface Material {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileType: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  machineModel: string | null;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
}

interface UploadResult {
  url: string;
  pathname: string;
  filename: string;
  size: number;
  contentType: string;
  fileType: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    category: 'manuals',
    machineModel: '',
    tags: '',
    isPublished: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, [search, category]);

  const fetchMaterials = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      params.set('limit', '100');
      
      const response = await fetch(`/api/materials?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMaterials(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'video': return Video;
      case 'image': return Image;
      default: return FileText;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'manuals': return 'bg-blue-100 text-blue-700';
      case 'videos': return 'bg-red-100 text-red-700';
      case 'schematics': return 'bg-green-100 text-green-700';
      case 'troubleshooting': return 'bg-yellow-100 text-yellow-700';
      case 'contracts': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Auto-fill title from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setNewMaterial(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadFile(file);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setNewMaterial(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('folder', 'materials');
      
      // Simulate progress (actual progress would need XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const uploadRes = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Upload failed');
      }
      
      const result = await uploadRes.json();
      setUploadProgress(100);
      setUploadResult(result.data);
      
      // Step 2: Create material record
      const createRes = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMaterial.title,
          description: newMaterial.description || null,
          category: newMaterial.category,
          fileType: result.data.fileType,
          fileUrl: result.data.url,
          machineModel: newMaterial.machineModel || null,
          tags: newMaterial.tags ? newMaterial.tags.split(',').map((t: string) => t.trim()) : [],
          isPublished: newMaterial.isPublished,
        }),
      });
      
      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || 'Failed to create material');
      }
      
      // Success! Close modal and refresh
      alert('Material uploaded successfully!');
      resetUploadModal();
      fetchMaterials();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const resetUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadProgress(0);
    setUploadResult(null);
    setNewMaterial({
      title: '',
      description: '',
      category: 'manuals',
      machineModel: '',
      tags: '',
      isPublished: true,
    });
  };

  // Edit handlers
  const handleEdit = (material: Material) => {
    setEditingMaterial({ ...material });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMaterial) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/materials/${editingMaterial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingMaterial.title,
          description: editingMaterial.description,
          category: editingMaterial.category,
          machineModel: editingMaterial.machineModel,
          tags: editingMaterial.tags,
          isPublished: editingMaterial.isPublished,
        }),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update');
      }
      
      alert('Material updated successfully!');
      setShowEditModal(false);
      setEditingMaterial(null);
      fetchMaterials();
    } catch (error: any) {
      console.error('Update error:', error);
      alert(`Update failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const handleDeleteClick = (material: Material) => {
    setDeletingMaterial(material);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMaterial) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/materials/${deletingMaterial.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete');
      }
      
      alert('Material deleted successfully!');
      setShowDeleteConfirm(false);
      setDeletingMaterial(null);
      fetchMaterials();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Delete failed: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Materials</h1>
          <p className="text-gray-500">Manage PDFs, videos, and documents</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Material
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search materials..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="manuals">Manuals</option>
              <option value="videos">Videos</option>
              <option value="schematics">Schematics</option>
              <option value="troubleshooting">Troubleshooting</option>
              <option value="contracts">Contracts</option>
            </select>
            <div className="text-sm text-gray-500">
              {materials.length} materials
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Loading...</div>
        ) : materials.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No materials found. Upload your first material to get started.
          </div>
        ) : (
          materials.map((material) => {
            const FileIcon = getFileIcon(material.fileType);
            return (
              <Card key={material.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-24 bg-gray-100 flex items-center justify-center">
                  {material.thumbnailUrl ? (
                    <img
                      src={material.thumbnailUrl}
                      alt={material.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileIcon className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-gray-900 truncate text-sm">{material.title}</h3>
                  
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getCategoryColor(material.category)}`}>
                      {material.category}
                    </span>
                    {material.machineModel && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {material.machineModel}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Eye className="h-3 w-3" />
                      {material.viewCount}
                      <span className={`px-1.5 py-0.5 rounded ${material.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {material.isPublished ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(material)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Download className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Upload Material</h2>
              <button onClick={resetUploadModal} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* File Drop Zone */}
              {!uploadFile ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600">Drag and drop a file here, or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, Video, or Image files</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.mp4,.webm,.mov,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{uploadFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button 
                      onClick={() => setUploadFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {uploading && (
                    <div className="mt-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-smt-red transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{uploadProgress}% uploaded</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Metadata Form */}
              <div className="space-y-3">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Material title"
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <textarea
                    className="w-full h-20 p-2 rounded-md border border-input bg-background text-sm resize-none"
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category *</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={newMaterial.category}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="manuals">Manuals</option>
                      <option value="videos">Videos</option>
                      <option value="schematics">Schematics</option>
                      <option value="troubleshooting">Troubleshooting</option>
                      <option value="contracts">Contracts</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Machine Model</Label>
                    <Input
                      value={newMaterial.machineModel}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, machineModel: e.target.value }))}
                      placeholder="e.g., SL-4020"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Tags</Label>
                  <Input
                    value={newMaterial.tags}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Comma-separated tags"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={newMaterial.isPublished}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isPublished" className="cursor-pointer">Publish immediately</Label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={resetUploadModal} disabled={uploading}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!uploadFile || !newMaterial.title || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Material</h2>
              <button onClick={() => { setShowEditModal(false); setEditingMaterial(null); }} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={editingMaterial.title}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <textarea
                  className="w-full h-20 p-2 rounded-md border border-input bg-background text-sm resize-none"
                  value={editingMaterial.description || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={editingMaterial.category}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, category: e.target.value })}
                  >
                    <option value="manuals">Manuals</option>
                    <option value="videos">Videos</option>
                    <option value="schematics">Schematics</option>
                    <option value="troubleshooting">Troubleshooting</option>
                    <option value="contracts">Contracts</option>
                  </select>
                </div>
                
                <div>
                  <Label>Machine Model</Label>
                  <Input
                    value={editingMaterial.machineModel || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, machineModel: e.target.value })}
                    placeholder="e.g., SL-4020"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsPublished"
                  checked={editingMaterial.isPublished}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, isPublished: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="editIsPublished" className="cursor-pointer">Published</Label>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">File: {editingMaterial.fileUrl.split('/').pop()}</p>
                <p className="text-xs text-gray-500">Views: {editingMaterial.viewCount}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingMaterial(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Delete Material</h2>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="mt-4 text-gray-700">
                Are you sure you want to delete <strong>{deletingMaterial.title}</strong>?
              </p>
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeletingMaterial(null); }}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleConfirmDelete} 
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
