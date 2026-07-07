'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Cloud, 
  CloudUpload, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Settings,
  FileText,
  Image,
  Video,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DropboxSyncStatus {
  isEnabled: boolean;
  lastSync?: Date;
  totalFiles: number;
  syncedFiles: number;
  pendingFiles: number;
  errorFiles: number;
}

interface DropboxCredentials {
  accessToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken?: string;
}

interface SyncSettings {
  syncPaths: string[];
  excludePatterns: string[];
  maxFileSize: number;
  allowedFileTypes: string[];
}

export default function DropboxSyncPanel() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<DropboxSyncStatus>({
    isEnabled: false,
    totalFiles: 0,
    syncedFiles: 0,
    pendingFiles: 0,
    errorFiles: 0
  });
  const [credentials, setCredentials] = useState<DropboxCredentials>({
    accessToken: '',
    clientId: '',
    clientSecret: '',
    refreshToken: ''
  });
  const [settings, setSettings] = useState<SyncSettings>({
    syncPaths: ['/'],
    excludePatterns: ['.DS_Store', 'Thumbs.db', '*.tmp'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFileTypes: ['image/*', 'video/*', 'application/pdf']
  });
  const [showSettings, setShowSettings] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/dropbox/sync');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.data);
        setIsConnected(data.data.isEnabled);
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleConnect = async () => {
    if (!credentials.accessToken || !credentials.clientId || !credentials.clientSecret) {
      toast({
        title: "Missing Credentials",
        description: "Please provide all required Dropbox credentials",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/dropbox/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...credentials,
          ...settings
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        toast({
          title: "Sync Started",
          description: data.message || "Dropbox sync has been initiated",
        });
        loadSyncStatus();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start sync');
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start Dropbox sync",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setCredentials({
      accessToken: '',
      clientId: '',
      clientSecret: '',
      refreshToken: ''
    });
    toast({
      title: "Disconnected",
      description: "Dropbox sync has been disabled",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSyncProgress = (): number => {
    if (syncStatus.totalFiles === 0) return 0;
    return (syncStatus.syncedFiles / syncStatus.totalFiles) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Dropbox Integration
          </CardTitle>
          <CardDescription>
            Sync your files with Dropbox for backup and easy access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  To use Dropbox sync, you need to provide your Dropbox app credentials. 
                  Create a Dropbox app at{' '}
                  <a 
                    href="https://www.dropbox.com/developers/apps" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    developers.dropbox.com
                  </a>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="Enter your Dropbox access token"
                    value={credentials.accessToken}
                    onChange={(e) => setCredentials(prev => ({ ...prev, accessToken: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="Enter your app client ID"
                    value={credentials.clientId}
                    onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    placeholder="Enter your app client secret"
                    value={credentials.clientSecret}
                    onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="refreshToken">Refresh Token (Optional)</Label>
                  <Input
                    id="refreshToken"
                    type="password"
                    placeholder="Enter refresh token if available"
                    value={credentials.refreshToken}
                    onChange={(e) => setCredentials(prev => ({ ...prev, refreshToken: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleConnect} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4 mr-2" />
                      Connect & Start Sync
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Connected to Dropbox</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>

              {/* Sync Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sync Progress</span>
                  <span>{syncStatus.syncedFiles} of {syncStatus.totalFiles} files</span>
                </div>
                <Progress value={getSyncProgress()} className="w-full" />
              </div>

              {/* Sync Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{syncStatus.totalFiles}</div>
                  <div className="text-sm text-gray-600">Total Files</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{syncStatus.syncedFiles}</div>
                  <div className="text-sm text-gray-600">Synced</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{syncStatus.pendingFiles}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{syncStatus.errorFiles}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>

              {syncStatus.lastSync && (
                <div className="text-sm text-gray-600">
                  Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Settings */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
            <CardDescription>
              Configure what files to sync and how
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="syncPaths">Sync Paths (one per line)</Label>
              <textarea
                id="syncPaths"
                className="w-full min-h-[80px] p-2 border rounded-md"
                placeholder="/&#10;/Photos&#10;/Documents"
                value={settings.syncPaths.join('\n')}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  syncPaths: e.target.value.split('\n').filter(path => path.trim()) 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="excludePatterns">Exclude Patterns (one per line)</Label>
              <textarea
                id="excludePatterns"
                className="w-full min-h-[80px] p-2 border rounded-md"
                placeholder=".DS_Store&#10;Thumbs.db&#10;*.tmp"
                value={settings.excludePatterns.join('\n')}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  excludePatterns: e.target.value.split('\n').filter(pattern => pattern.trim()) 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={Math.round(settings.maxFileSize / (1024 * 1024))}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  maxFileSize: parseInt(e.target.value) * 1024 * 1024 
                }))}
              />
            </div>

            <div>
              <Label>Allowed File Types</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['image/*', 'video/*', 'application/pdf', 'text/*'].map(type => (
                  <Badge
                    key={type}
                    variant={settings.allowedFileTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        allowedFileTypes: prev.allowedFileTypes.includes(type)
                          ? prev.allowedFileTypes.filter(t => t !== type)
                          : [...prev.allowedFileTypes, type]
                      }));
                    }}
                  >
                    {type === 'image/*' && <Image className="w-3 h-3 mr-1" />}
                    {type === 'video/*' && <Video className="w-3 h-3 mr-1" />}
                    {type === 'application/pdf' && <FileText className="w-3 h-3 mr-1" />}
                    {type === 'text/*' && <FileText className="w-3 h-3 mr-1" />}
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>How to Set Up Dropbox Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>1.</strong> Go to <a href="https://www.dropbox.com/developers/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Dropbox Developer Console</a></p>
            <p><strong>2.</strong> Create a new app with "Full Dropbox" access</p>
            <p><strong>3.</strong> Generate an access token in your app settings</p>
            <p><strong>4.</strong> Copy the App key (Client ID) and App secret (Client Secret)</p>
            <p><strong>5.</strong> Enter these credentials above to start syncing</p>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> This is a demo implementation. In production, you would use OAuth 2.0 flow 
              for secure authentication instead of manually entering credentials.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
} 