'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Users, UserCheck, ExternalLink, Mail, Globe, Phone } from 'lucide-react';
import Link from 'next/link';

interface Creator {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  socialLinks: Record<string, string> | null;
  bio: string | null;
  subscription: string | null;
  subscriptionStatus: string | null;
  subscriptionPeriodEnd: string | null;
  createdAt: string;
  stats?: {
    contestApplications: number;
    contestSubmissions: number;
  };
}

interface CreatorsData {
  creators: Creator[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function AdminCreatorsPage() {
  const [data, setData] = useState<CreatorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCreators();
  }, [searchTerm, page]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (searchTerm) params.set('search', searchTerm);
      const response = await fetch(`/api/admin/creators?${params}`, {
        credentials: 'include',
      });
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

  const socialLinks = (creator: Creator) => {
    const links = creator.socialLinks as Record<string, string> | null;
    if (!links || typeof links !== 'object') return null;
    return Object.entries(links).filter(([, v]) => v);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Creator Management</h1>
          <p className="text-gray-600 mt-1">
            Content creators with active membership - social links, contact info, and stats
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.pagination.total}</div>
                <p className="text-xs text-muted-foreground">With active paid membership</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.creators.length}</div>
                <p className="text-xs text-muted-foreground">On this page</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Creators</CardTitle>
              <CardDescription>
                Users with pro/premium membership - view social media, contact info, contest stats
              </CardDescription>
              <div className="flex items-center space-x-2 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {data.creators.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No creators with active membership found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Social Links</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.creators.map((creator) => (
                      <TableRow key={creator.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{creator.name || 'Unknown'}</div>
                            {creator.bio && (
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {creator.bio}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {creator.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {creator.email}
                              </div>
                            )}
                            {creator.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {creator.phone}
                              </div>
                            )}
                            {creator.website && (
                              <div className="flex items-center gap-1 text-sm">
                                <Globe className="h-3 w-3" />
                                <a
                                  href={creator.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {creator.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {socialLinks(creator)?.map(([key, url]) => (
                              <a
                                key={key}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {key}
                              </a>
                            )) || <span className="text-gray-400">—</span>}
                          </div>
                        </TableCell>
                        <TableCell>{creator.stats?.contestApplications ?? 0}</TableCell>
                        <TableCell>{creator.stats?.contestSubmissions ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{creator.subscription || '—'}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/users/${creator.id}`}>
                            <Button variant="outline" size="sm">
                              View User
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

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
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">Failed to load creators</div>
      )}
    </div>
  );
}
