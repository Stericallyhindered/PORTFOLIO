'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Crown, Gift, Trophy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PastGiveaway {
  id: string;
  title: string;
  description: string;
  prizeValue: string;
  entryCount: number;
  startDate: string;
  endDate: string;
  status: string;
  image: string | null;
  sponsor: string | null;
}

export default function GiveawayHistoryPage() {
  const [giveaways, setGiveaways] = useState<PastGiveaway[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastGiveaways();
  }, []);

  const fetchPastGiveaways = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/giveaways?status=ended&limit=50', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      if (result.success && result.data?.giveaways) {
        setGiveaways(result.data.giveaways.map((g: any) => ({
          id: g.id,
          title: g.title,
          description: g.description || '',
          prizeValue: g.prizeValue || 'N/A',
          entryCount: g.entryCount || 0,
          startDate: g.startDate || '',
          endDate: g.endDate || '',
          status: g.status,
          image: g.image || null,
          sponsor: g.sponsor || null,
        })));
      }
    } catch (err) {
      console.error('Error fetching past giveaways:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Giveaway History</h1>
            <p className="text-gray-600">Browse past giveaways and their results</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/giveaways">View Active Giveaways</Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{giveaways.length}</div>
              <div className="text-sm text-gray-600">Past Giveaways</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {giveaways.reduce((sum, g) => sum + g.entryCount, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {giveaways.filter(g => g.sponsor).length}
              </div>
              <div className="text-sm text-gray-600">Sponsored</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-48" /></CardContent></Card>
          ))}
        </div>
      ) : giveaways.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {giveaways.map((giveaway) => (
            <Card key={giveaway.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{giveaway.title}</CardTitle>
                    <CardDescription>{giveaway.description}</CardDescription>
                  </div>
                  <Badge variant="outline">Ended</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {giveaway.image ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <Image src={giveaway.image} alt={giveaway.title} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-lg">
                      <Gift className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Prize Value</span>
                        <span className="font-bold text-green-600">{giveaway.prizeValue}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Entries</span>
                        <span className="font-medium">{giveaway.entryCount}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {giveaway.sponsor && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Sponsor</span>
                          <span className="font-medium">{giveaway.sponsor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {giveaway.startDate ? new Date(giveaway.startDate).toLocaleDateString() : '?'} -{' '}
                      {giveaway.endDate ? new Date(giveaway.endDate).toLocaleDateString() : '?'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Giveaways</h3>
          <p className="text-gray-600">Past giveaways will appear here once they&apos;re completed</p>
        </div>
      )}
    </div>
  );
}
