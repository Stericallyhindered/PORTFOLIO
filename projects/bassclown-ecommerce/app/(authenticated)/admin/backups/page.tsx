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
  Database, 
  Download, 
  Upload, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BackupMetadata {
  id: string;
  type: 'full' | 'incremental' | 'differential' | 'schema_only' | 'data_only' | 'manual';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'expired';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  size: number;
  compressedSize?: number;
  location: string;
  checksum: string;
  version: string;
  metadata: any;
  errorMessage?: string;
}

interface BackupStatistics {
  totalBackups: number;
  totalSize: number;
  lastBackupTime?: Date;
  oldestBackupTime?: Date;
  successRate: number;
  averageBackupTime: number;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [statistics, setStatistics] = useState<BackupStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const { toast } = useToast();

  const [newBackup, setNewBackup] = useState({
    type: 'full' as 'full' | 'incremental' | 'schema_only' | 'data_only',
    description: '',
    compressionEnabled: true
  });

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/backups', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch backups');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setBackups((result.data.backups || []).map((b: any) => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: b.endTime ? new Date(b.endTime) : undefined
        })));
        setStatistics(result.data.statistics || null);
      }
    } catch (err) {
      console.error('Error fetching backups:', err);
      toast({
        title: "Error",
        description: "Failed to load backups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newBackup),
      });

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Backup created successfully",
        });
        setCreateDialogOpen(false);
        setNewBackup({
          type: 'full',
          description: '',
          compressionEnabled: true
        });
        fetchBackups();
      }
    } catch (err) {
      console.error('Error creating backup:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create backup',
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (backup: BackupMetadata) => {
    if (!confirm(`Are you sure you want to restore from backup ${backup.id}? This will overwrite current data.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/backups/${backup.id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          restoreType: 'full',
          validateBeforeRestore: true,
          createBackupBeforeRestore: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to restore backup');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Backup restored successfully",
        });
        setRestoreDialogOpen(false);
      }
    } catch (err) {
      console.error('Error restoring backup:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to restore backup',
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'running': return 'secondary';
      case 'failed': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Database Backups</h1>
          <p className="text-gray-600 mt-1">Manage database backups and recovery</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchBackups}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Backup</DialogTitle>
                  <DialogDescription>
                    Create a backup of the database
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="type">Backup Type</Label>
                    <Select
                      value={newBackup.type}
                      onValueChange={(value: any) => setNewBackup({ ...newBackup, type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Backup</SelectItem>
                        <SelectItem value="incremental">Incremental Backup</SelectItem>
                        <SelectItem value="schema_only">Schema Only</SelectItem>
                        <SelectItem value="data_only">Data Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newBackup.description}
                      onChange={(e) => setNewBackup({ ...newBackup, description: e.target.value })}
                      placeholder="Backup description..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="compression"
                      checked={newBackup.compressionEnabled}
                      onChange={(e) => setNewBackup({ ...newBackup, compressionEnabled: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="compression" className="cursor-pointer">
                      Enable compression
                    </Label>
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
                    onClick={handleCreateBackup}
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Backup'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Backups</p>
                    <p className="text-2xl font-bold">{statistics.totalBackups}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Size</p>
                    <p className="text-2xl font-bold">{formatFileSize(statistics.totalSize)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">{statistics.successRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Avg Time</p>
                    <p className="text-2xl font-bold">{Math.round(statistics.averageBackupTime / 1000)}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Backups List */}
        <Card>
          <CardHeader>
            <CardTitle>Backup History</CardTitle>
            <CardDescription>
              View and manage all database backups
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Backups Yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first backup to protect your data
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Backup
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getStatusColor(backup.status)}>
                          {backup.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {backup.type}
                        </Badge>
                        <span className="font-medium">{backup.id}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <span>
                          Created {formatDistanceToNow(backup.startTime, { addSuffix: true })}
                        </span>
                        <span>Size: {formatFileSize(backup.compressedSize || backup.size)}</span>
                        {backup.duration && (
                          <span>Duration: {Math.round(backup.duration / 1000)}s</span>
                        )}
                      </div>
                      {backup.metadata?.description && (
                        <p className="text-sm text-gray-600 mt-1">{backup.metadata.description}</p>
                      )}
                      {backup.errorMessage && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{backup.errorMessage}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {backup.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setRestoreDialogOpen(true);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/admin/backups/${backup.id}/download`, {
                              credentials: 'include'
                            });
                            if (res.ok) {
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `backup-${backup.id}.sql`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            } else {
                              toast({
                                title: "Download Failed",
                                description: "Could not download backup file. The backup may not be available.",
                                variant: "destructive"
                              });
                            }
                          } catch {
                            toast({
                              title: "Download Failed",
                              description: "An error occurred while downloading the backup.",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restore Dialog */}
        <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restore from Backup</DialogTitle>
              <DialogDescription>
                Restore the database from backup {selectedBackup?.id}
              </DialogDescription>
            </DialogHeader>
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This will overwrite all current data. Make sure to create a backup before restoring.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRestoreDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedBackup && handleRestore(selectedBackup)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Restore Backup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}

