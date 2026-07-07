'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users } from 'lucide-react';

interface Entry {
  id: string;
  userId: string;
  entryNumber: number;
  entryType: string | null;
  purchasePrice: string | null;
  status: string;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

interface EntriesData {
  giveaway: { id: string; title: string };
  entries: Entry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function AdminGiveawayEntriesPage() {
  const params = useParams();
  const giveawayId = params.id as string;
  const [data, setData] = useState<EntriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchEntries();
  }, [giveawayId, page]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/giveaways/${giveawayId}/entries?page=${page}&limit=50`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/giveaways/${giveawayId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Giveaway
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Giveaway Entries</h1>
            <p className="text-gray-600 mt-1">{data?.giveaway?.title || 'Loading...'}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : data ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Entries ({data.pagination.total})
            </CardTitle>
            <CardDescription>Users who have entered this giveaway</CardDescription>
          </CardHeader>
          <CardContent>
            {data.entries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No entries yet</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Entry #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.userName || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{entry.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>{entry.entryNumber}</TableCell>
                        <TableCell>{entry.entryType || 'free'}</TableCell>
                        <TableCell>
                          {entry.purchasePrice ? `$${entry.purchasePrice}` : '—'}
                        </TableCell>
                        <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Page {data.pagination.page} of {data.pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!data.pagination.hasPrev}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!data.pagination.hasNext}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 text-gray-500">Failed to load entries</div>
      )}
    </div>
  );
}
