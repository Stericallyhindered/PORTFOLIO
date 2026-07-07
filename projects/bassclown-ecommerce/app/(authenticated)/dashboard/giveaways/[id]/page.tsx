'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Gift, Users, Trophy, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface GiveawayData {
  id: string;
  title: string;
  description: string;
  longDescription: string | null;
  prizeValue: string;
  entryCount: number;
  maxEntries: number | null;
  startDate: string;
  endDate: string;
  status: string;
  image: string | null;
  rules: string[];
  prizeItems: string[];
  sponsor: string | null;
}

export default function GiveawayDetailPage() {
  const params = useParams();
  const [giveaway, setGiveaway] = useState<GiveawayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) fetchGiveaway();
  }, [params?.id]);

  const fetchGiveaway = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/giveaways/${params.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Giveaway not found');
      const result = await response.json();
      if (result.success && result.data) {
        const g = result.data;
        setGiveaway({
          id: g.id,
          title: g.title,
          description: g.description || '',
          longDescription: g.longDescription || null,
          prizeValue: g.prizeValue || 'Prize TBD',
          entryCount: g.entryCount || 0,
          maxEntries: g.maxEntries || null,
          startDate: g.startDate || '',
          endDate: g.endDate || '',
          status: g.status || 'active',
          image: g.image || null,
          rules: Array.isArray(g.rules) ? g.rules : [],
          prizeItems: Array.isArray(g.prizeItems) ? g.prizeItems : [],
          sponsor: g.sponsor || null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load giveaway');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><Skeleton className="h-96" /></div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !giveaway) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/giveaways"><ArrowLeft className="w-4 h-4 mr-2" />Back to Giveaways</Link>
        </Button>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Giveaway not found'}</p>
        </div>
      </div>
    );
  }

  const isActive = giveaway.status === 'active';
  const endDate = giveaway.endDate ? new Date(giveaway.endDate) : null;
  const startDate = giveaway.startDate ? new Date(giveaway.startDate) : null;
  const daysLeft = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/giveaways"><ArrowLeft className="w-4 h-4 mr-2" />Back to Giveaways</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{giveaway.title}</CardTitle>
                  <CardDescription className="text-base">{giveaway.description}</CardDescription>
                </div>
                <Badge variant={isActive ? 'default' : 'outline'}>
                  {isActive ? 'Active' : giveaway.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {giveaway.image ? (
                <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                  <Image src={giveaway.image} alt={giveaway.title} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center rounded-lg mb-4">
                  <Gift className="w-24 h-24 text-blue-500" />
                </div>
              )}
              {giveaway.longDescription && (
                <div className="text-gray-700 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: giveaway.longDescription }} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Prize Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Prize Value</span>
                  <span className="text-xl font-bold text-green-600">{giveaway.prizeValue}</span>
                </div>
                {giveaway.sponsor && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sponsored By</span>
                    <span className="font-medium">{giveaway.sponsor}</span>
                  </div>
                )}
                {giveaway.prizeItems.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">What&apos;s Included:</h4>
                      <ul className="space-y-2">
                        {giveaway.prizeItems.map((item, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {giveaway.rules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Rules & Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {giveaway.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold text-sm mt-1">{index + 1}.</span>
                      <span className="text-sm text-gray-700">{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Giveaway Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {startDate && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Started</span>
                    </div>
                    <span className="text-sm">{startDate.toLocaleDateString()}</span>
                  </div>
                )}
                {endDate && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Ends</span>
                    </div>
                    <span className="text-sm">{endDate.toLocaleDateString()}</span>
                  </div>
                )}
                {isActive && daysLeft > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Time Left</span>
                    <span className="text-sm font-medium">{daysLeft} days</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Entries</span>
                  </div>
                  <span className="text-sm font-medium">{giveaway.entryCount}{giveaway.maxEntries ? ` / ${giveaway.maxEntries}` : ''}</span>
                </div>
              </div>

              <Separator />

              {isActive && (
                <Button asChild className="w-full" size="lg">
                  <Link href="/giveaways">Enter Giveaway</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{giveaway.entryCount}</div>
                  <div className="text-sm text-gray-600">Total Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{daysLeft > 0 ? daysLeft : 0}</div>
                  <div className="text-sm text-gray-600">Days Left</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{giveaway.prizeValue}</div>
                <div className="text-sm text-gray-600">Prize Value</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
