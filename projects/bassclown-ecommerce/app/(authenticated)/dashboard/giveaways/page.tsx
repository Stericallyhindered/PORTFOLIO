'use client';

import { Suspense, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Gift, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Giveaway } from '@/lib/types';

function GiveawayCard({ giveaway }: { giveaway: Giveaway }) {
  const isActive = giveaway.status === 'active';
  const isUpcoming = giveaway.status === 'upcoming';
  const endDate = giveaway.endDate instanceof Date ? giveaway.endDate : new Date(giveaway.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const entryPercentage = giveaway.maxEntries ? (giveaway.entryCount / giveaway.maxEntries) * 100 : 0;
  
  return (
    <Card className="bg-[#2D2D2D] border-gray-700 hover:bg-[#3D3D3D] transition-colors">
      <div className="aspect-video bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <Gift className="w-16 h-16 text-blue-300" />
      </div>
      
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-white">{giveaway.title}</CardTitle>
            <CardDescription className="mt-2 text-gray-400">{giveaway.description}</CardDescription>
          </div>
          <Badge variant={isActive ? "default" : isUpcoming ? "secondary" : "outline"}>
            {giveaway.status.charAt(0).toUpperCase() + giveaway.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Prize Value</span>
            <span className="font-bold text-green-400">{giveaway.prizeValue}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Entries</span>
            <span className="font-medium text-white">{giveaway.entryCount} / {giveaway.maxEntries || '∞'}</span>
          </div>
          
          {giveaway.maxEntries && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(entryPercentage, 100)}%` }}
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Ends {endDate.toLocaleDateString()}</span>
          </div>
          {isActive && daysLeft > 0 && (
            <span className="text-yellow-400 font-medium">
              {daysLeft} days left
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/giveaways/${giveaway.id}`}>
              View Details
            </Link>
          </Button>
          {!isActive && (
            <Button variant="outline" className="flex-1" disabled>
              {isUpcoming ? 'Coming Soon' : 'Ended'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default function GiveawaysPage() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchGiveaways();
  }, []);

  const fetchGiveaways = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/giveaways?limit=100', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch giveaways: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.giveaways) {
        // Transform API data to match Giveaway type
        const transformedGiveaways: Giveaway[] = result.data.giveaways.map((giveaway: any) => ({
          id: giveaway.id,
          title: giveaway.title,
          description: giveaway.description || '',
          longDescription: giveaway.longDescription,
          prizeValue: giveaway.prizeValue || 'Prize TBD',
          entryCount: 0, // Will be fetched separately for each giveaway
          maxEntries: giveaway.maxEntries || null,
          startDate: giveaway.startDate ? new Date(giveaway.startDate) : new Date(),
          endDate: giveaway.endDate ? new Date(giveaway.endDate) : new Date(),
          status: (giveaway.status || 'upcoming') as 'active' | 'upcoming' | 'ended',
          image: giveaway.image || '/images/giveaway-fishing-gear.jpg',
          rules: Array.isArray(giveaway.rules) ? giveaway.rules : [],
          prizeItems: Array.isArray(giveaway.prizeItems) ? giveaway.prizeItems : [],
          sponsor: giveaway.sponsor,
          createdBy: giveaway.createdBy,
          createdAt: giveaway.createdAt ? new Date(giveaway.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: giveaway.updatedAt ? new Date(giveaway.updatedAt).toISOString() : new Date().toISOString()
        }));

        // Fetch entry counts for each giveaway
        const giveawaysWithCounts = await Promise.all(
          transformedGiveaways.map(async (giveaway) => {
            try {
              const entryResponse = await fetch(`/api/giveaways/${giveaway.id}/enter`, {
                method: 'GET',
                credentials: 'include',
              });
              
              if (entryResponse.ok) {
                const entryResult = await entryResponse.json();
                if (entryResult.success && entryResult.data?.totalEntries !== undefined) {
                  return {
                    ...giveaway,
                    entryCount: entryResult.data.totalEntries
                  };
                }
              }
            } catch (err) {
              console.error(`Error fetching entry count for giveaway ${giveaway.id}:`, err);
            }
            return giveaway;
          })
        );

        setGiveaways(giveawaysWithCounts);
      } else {
        throw new Error(result.message || 'Failed to fetch giveaways');
      }
    } catch (err) {
      console.error('Error fetching giveaways:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching giveaways');
      toast({
        title: "Error",
        description: "Failed to load giveaways. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const activeGiveaways = giveaways.filter((g: Giveaway) => g.status === 'active');
  const upcomingGiveaways = giveaways.filter((g: Giveaway) => g.status === 'upcoming');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-[#2D2D2D] border-gray-700">
                <Skeleton className="aspect-video w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && giveaways.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Alert variant="destructive" className="bg-[#2D2D2D] border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-white">
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchGiveaways}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Giveaways</h1>
          <p className="text-gray-400">
            Enter our exciting giveaways and win amazing bass fishing prizes!
          </p>
        </div>

        {/* Active Giveaways */}
        {activeGiveaways.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Gift className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-white">Active Giveaways</h2>
              <Badge variant="default">{activeGiveaways.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGiveaways.map(giveaway => (
                <GiveawayCard key={giveaway.id} giveaway={giveaway} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Giveaways */}
        {upcomingGiveaways.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-white">Upcoming Giveaways</h2>
              <Badge variant="secondary">{upcomingGiveaways.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingGiveaways.map(giveaway => (
                <GiveawayCard key={giveaway.id} giveaway={giveaway} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {activeGiveaways.length === 0 && upcomingGiveaways.length === 0 && (
          <Card className="bg-[#2D2D2D] border-gray-700">
            <CardContent className="p-8 text-center">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Active Giveaways</h3>
              <p className="text-gray-400">
                Check back soon for exciting new giveaways!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 