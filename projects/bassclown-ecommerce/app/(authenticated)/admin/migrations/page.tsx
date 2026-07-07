'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MigrationStatus {
  version: string;
  name: string;
  status: 'pending' | 'applied' | 'failed' | 'rolled_back';
  appliedAt?: Date;
  executionTime?: number;
  error?: string;
}

interface MigrationStatistics {
  totalMigrations: number;
  appliedMigrations: number;
  pendingMigrations: number;
  failedMigrations: number;
  averageExecutionTime: number;
  lastMigrationDate?: Date;
}

export default function MigrationsPage() {
  const [status, setStatus] = useState<{
    pending: MigrationStatus[];
    applied: MigrationStatus[];
    failed: MigrationStatus[];
  }>({
    pending: [],
    applied: [],
    failed: []
  });
  const [statistics, setStatistics] = useState<MigrationStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMigrationStatus();
  }, []);

  const fetchMigrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/migrations', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch migration status');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setStatus(result.data.status || { pending: [], applied: [], failed: [] });
        setStatistics(result.data.statistics || null);
      }
    } catch (err) {
      console.error('Error fetching migration status:', err);
      toast({
        title: "Error",
        description: "Failed to load migration status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunMigrations = async () => {
    try {
      setRunning(true);
      const response = await fetch('/api/admin/migrations', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to run migrations');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Migrations completed successfully",
        });
        fetchMigrationStatus();
      } else {
        throw new Error(result.message || 'Migration failed');
      }
    } catch (err) {
      console.error('Error running migrations:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to run migrations',
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const handleRollback = async (version: string) => {
    if (!confirm(`Are you sure you want to rollback migration ${version}? This action cannot be undone.`)) {
      return;
    }

    try {
      setRollingBack(version);
      const response = await fetch(`/api/admin/migrations/${version}/rollback`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to rollback migration');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Migration rolled back successfully",
        });
        fetchMigrationStatus();
      }
    } catch (err) {
      console.error('Error rolling back migration:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to rollback migration',
        variant: "destructive",
      });
    } finally {
      setRollingBack(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Database Migrations</h1>
          <p className="text-gray-600 mt-1">Manage database schema migrations</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchMigrationStatus}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {status.pending.length > 0 && (
              <Button
                onClick={handleRunMigrations}
                disabled={running}
              >
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Pending Migrations ({status.pending.length})
                  </>
                )}
              </Button>
            )}
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
                    <p className="text-sm text-gray-600">Total Migrations</p>
                    <p className="text-2xl font-bold">{statistics.totalMigrations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Applied</p>
                    <p className="text-2xl font-bold">{statistics.appliedMigrations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{statistics.pendingMigrations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold">{statistics.failedMigrations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pending Migrations */}
        {status.pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Migrations</CardTitle>
              <CardDescription>
                {status.pending.length} migration(s) waiting to be applied
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {status.pending.map((migration) => (
                  <div
                    key={migration.version}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">Pending</Badge>
                        <span className="font-medium">{migration.name}</span>
                      </div>
                      <p className="text-sm text-gray-500">{migration.version}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applied Migrations */}
        {status.applied.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Applied Migrations</CardTitle>
              <CardDescription>
                {status.applied.length} migration(s) successfully applied
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {status.applied.map((migration) => (
                  <div
                    key={migration.version}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default" className="bg-green-600">
                          Applied
                        </Badge>
                        <span className="font-medium">{migration.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{migration.version}</span>
                        {migration.appliedAt && (
                          <span>
                            Applied {formatDistanceToNow(new Date(migration.appliedAt), { addSuffix: true })}
                          </span>
                        )}
                        {migration.executionTime && (
                          <span>Duration: {migration.executionTime}ms</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRollback(migration.version)}
                      disabled={rollingBack === migration.version}
                    >
                      {rollingBack === migration.version ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Rollback
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed Migrations */}
        {status.failed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Failed Migrations</CardTitle>
              <CardDescription>
                {status.failed.length} migration(s) that failed during execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {status.failed.map((migration) => (
                  <Alert key={migration.version} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="destructive">Failed</Badge>
                            <span className="font-medium">{migration.name}</span>
                          </div>
                          <p className="text-sm">{migration.version}</p>
                          {migration.error && (
                            <p className="text-sm mt-2 text-red-600">{migration.error}</p>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Migrations */}
        {status.pending.length === 0 && status.applied.length === 0 && status.failed.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Migrations Found</h3>
              <p className="text-gray-500">
                Migration files should be placed in the /migrations directory
              </p>
            </CardContent>
          </Card>
        )}
      </div>
  );
}

