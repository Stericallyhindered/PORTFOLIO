'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Gift, Users, Calendar, ExternalLink } from 'lucide-react';

interface Giveaway {
  id: string;
  title: string;
  description: string;
  longDescription: string | null;
  prizeValue: string;
  maxEntries: number | null;
  startDate: string;
  endDate: string;
  status: string;
  image: string | null;
  sponsor: string | null;
  additionalEntryPrice: string | null;
}

interface GiveawayData {
  giveaway: Giveaway;
  stats: { totalEntries: number; isActive: boolean; timeRemaining: number };
  recentEntries?: Array<{
    id: string;
    userName: string | null;
    userEmail: string | null;
    entryNumber: number;
    entryType: string | null;
    createdAt: string;
  }>;
}

export default function AdminGiveawayDetailPage() {
  const params = useParams();
  const giveawayId = params.id as string;
  const [data, setData] = useState<GiveawayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGiveaway();
  }, [giveawayId]);

  const fetchGiveaway = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/giveaways/${giveawayId}`, {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'upcoming':
        return 'secondary';
      case 'ended':
      case 'completed':
        return 'outline';
      case 'draft':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Link href="/admin/giveaways">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Giveaways
          </Button>
        </Link>
        <p className="text-gray-500">Giveaway not found</p>
      </div>
    );
  }

  const { giveaway, stats, recentEntries } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/giveaways">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Giveaways
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{giveaway.title}</h1>
            <p className="text-gray-600 mt-1">
              {giveaway.sponsor ? `Sponsored by ${giveaway.sponsor}` : '—'} • {giveaway.status}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/giveaways" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Frontend
            </a>
          </Button>
          <Link href={`/admin/giveaways/${giveawayId}/edit`}>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Giveaway
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <Badge variant={getStatusColor(giveaway.status)} className="w-fit">
              {giveaway.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {giveaway.image && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={giveaway.image}
                  alt={giveaway.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <p className="text-gray-600">{giveaway.description}</p>
            {giveaway.longDescription && (
              <p className="text-gray-600 whitespace-pre-wrap">{giveaway.longDescription}</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prize Value</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{giveaway.prizeValue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entries</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <p className="text-xs text-muted-foreground">
                {giveaway.maxEntries ? `of ${giveaway.maxEntries} max` : 'unlimited'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dates</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div>{new Date(giveaway.startDate).toLocaleDateString()}</div>
                <div className="text-gray-500">to {new Date(giveaway.endDate).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
          {giveaway.additionalEntryPrice && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Additional Entry Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">${giveaway.additionalEntryPrice}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
          <CardDescription>Latest entries for this giveaway</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/admin/giveaways/${giveawayId}/entries`}>
            <Button variant="outline" size="sm" className="mb-4">
              View All Entries ({stats.totalEntries})
            </Button>
          </Link>
          {recentEntries && recentEntries.length > 0 ? (
            <div className="space-y-2">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium">{entry.userName || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{entry.userEmail}</div>
                  </div>
                  <div className="text-sm">
                    Entry #{entry.entryNumber} • {entry.entryType || 'free'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No entries yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Draw Winners</CardTitle>
          <CardDescription>Run the giveaway draw when the contest has ended</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/admin/giveaways/${giveawayId}/draw`}>
            <Button>Go to Draw Winners</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
