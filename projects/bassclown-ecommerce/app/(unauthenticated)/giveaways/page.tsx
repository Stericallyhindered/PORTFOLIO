'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Gift, Users, AlertCircle, Crown, Loader2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { GiveawayEntryForm } from '@/components/giveaways/GiveawayEntryForm';
import { Giveaway } from '@/lib/types';
import { CTASection } from '@/components/home/CTASection';
import Link from 'next/link';

export default function GiveawaysPage() {
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEntries, setUserEntries] = useState(0);
  const [additionalEntryPrice, setAdditionalEntryPrice] = useState<number | null>(null);
  const [purchasingEntries, setPurchasingEntries] = useState(false);

  useEffect(() => {
    fetchActiveGiveaway();
  }, []);

  const fetchActiveGiveaway = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/giveaways?limit=1&status=active', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch giveaway');
      }

      const result = await response.json();

      if (result.success && result.data?.giveaways && result.data.giveaways.length > 0) {
        const giveawayData = result.data.giveaways[0];
        const transformedGiveaway: Giveaway = {
          id: giveawayData.id,
          title: giveawayData.title,
          description: giveawayData.description || '',
          longDescription: giveawayData.longDescription,
          prizeValue: giveawayData.prizeValue || 'Prize TBD',
          entryCount: giveawayData.entryCount || 0,
          maxEntries: giveawayData.maxEntries || null,
          startDate: giveawayData.startDate ? new Date(giveawayData.startDate) : new Date(),
          endDate: giveawayData.endDate ? new Date(giveawayData.endDate) : new Date(),
          status: (giveawayData.status || 'active') as 'active' | 'upcoming' | 'ended',
          image: giveawayData.image || '/images/assets/bass-clown-co-fish-chase.png',
          rules: Array.isArray(giveawayData.rules) ? giveawayData.rules : 
                 typeof giveawayData.rules === 'object' && giveawayData.rules !== null
                   ? Object.values(giveawayData.rules) as string[]
                   : [],
          prizeItems: Array.isArray(giveawayData.prizeItems) ? giveawayData.prizeItems : [],
          category: giveawayData.category || 'Gear',
          sponsor: giveawayData.sponsor,
          createdBy: giveawayData.createdBy,
          createdAt: giveawayData.createdAt ? new Date(giveawayData.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: giveawayData.updatedAt ? new Date(giveawayData.updatedAt).toISOString() : new Date().toISOString()
        };
        setGiveaway(transformedGiveaway);
        setAdditionalEntryPrice(giveawayData.additionalEntryPrice ? parseFloat(giveawayData.additionalEntryPrice) : null);
        fetchUserEntries(giveawayData.id);
      } else {
        setGiveaway(null);
      }
    } catch (err) {
      console.error('Error fetching giveaway:', err);
      setError('Failed to load giveaway. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEntries = async (giveawayId: string) => {
    try {
      const response = await fetch(`/api/giveaways/${giveawayId}/entries`, {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.entries) {
          setUserEntries(result.data.entries.length);
        }
      }
    } catch (err) {
      console.error('Error fetching user entries:', err);
    }
  };

  const handleEntrySuccess = () => {
    if (giveaway) {
      fetchUserEntries(giveaway.id);
      fetchActiveGiveaway(); // Refresh to update entry count
    }
  };

  const handlePurchaseEntries = async (quantity: number = 1) => {
    if (!giveaway || !additionalEntryPrice) return;

    setPurchasingEntries(true);
    try {
      const response = await fetch(`/api/giveaways/${giveaway.id}/purchase-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to purchase entries');
      }

      const result = await response.json();
      if (result.success) {
        handleEntrySuccess();
        alert(`Successfully purchased ${quantity} additional ${quantity === 1 ? 'entry' : 'entries'}!`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to purchase entries';
      alert(errorMessage);
    } finally {
      setPurchasingEntries(false);
    }
  };

  if (loading) {
    return (
      <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <Skeleton className="h-96 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream">
        <section className="container mx-auto px-4 py-12 md:py-16 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Giveaway</h2>
          <p className="text-cream/60 mb-6">{error}</p>
          <Button onClick={fetchActiveGiveaway}>Try Again</Button>
        </section>
      </main>
    );
  }

  if (!giveaway) {
    return (
      <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream">
        <section className="container mx-auto px-4 py-12 md:py-16 text-center">
          <Gift className="h-16 w-16 text-cream/40 mx-auto mb-4" />
          <h1 className="text-4xl font-phosphate text-cream mb-4 title-text">No Active Giveaway</h1>
          <p className="text-cream/60 text-lg mb-8 max-w-2xl mx-auto">
            There's no active giveaway at the moment. Check back soon for exciting prizes!
          </p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </section>
        <CTASection />
      </main>
    );
  }

  const timeRemaining = giveaway.endDate.getTime() - Date.now();
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream">
      {/* Hero Section with Giveaway Image */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {giveaway.image && (
          <div className="absolute inset-0 z-0">
            <Image
              src={giveaway.image}
              alt={giveaway.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-black/60 z-10"></div>
          </div>
        )}
        <div className="container mx-auto px-4 relative z-20 text-center">
          <h1 className="font-phosphate text-5xl md:text-7xl tracking-wider text-cream uppercase mb-4 text-shadow-lg title-text">
            {giveaway.title}
          </h1>
          {giveaway.description && (
            <p className="text-xl md:text-2xl text-cream/90 font-phosphate max-w-3xl mx-auto mb-6 title-text">
              {giveaway.description}
            </p>
          )}
          <div className="flex items-center justify-center gap-6 text-cream/80">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{daysRemaining > 0 ? `${daysRemaining}d ${hoursRemaining}h` : `${hoursRemaining}h`} remaining</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>{giveaway.entryCount} {giveaway.entryCount === 1 ? 'entry' : 'entries'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Left Column - Giveaway Details */}
          <div className="space-y-6">
            {giveaway.longDescription && (
              <Card className="bg-[#2D2D2D] border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-phosphate text-cream mb-4 title-text">About This Giveaway</h2>
                  <div 
                    className="text-cream/80 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: giveaway.longDescription }}
                  />
                </CardContent>
              </Card>
            )}

            <Card className="bg-[#2D2D2D] border-slate-700">
              <CardContent className="p-6">
                <h2 className="text-2xl font-phosphate text-cream mb-4 title-text flex items-center gap-2">
                  <Gift className="h-6 w-6 text-red-500" />
                  Prize Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-cream/60">Prize Value:</span>
                    <span className="text-cream font-semibold ml-2">{giveaway.prizeValue}</span>
                  </div>
                  {giveaway.prizeItems && giveaway.prizeItems.length > 0 && (
                    <div>
                      <span className="text-cream/60">Includes:</span>
                      <ul className="list-disc list-inside mt-2 text-cream/80">
                        {giveaway.prizeItems.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {giveaway.sponsor && (
                    <div>
                      <span className="text-cream/60">Sponsored by:</span>
                      <span className="text-cream font-semibold ml-2">{giveaway.sponsor}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {giveaway.rules && giveaway.rules.length > 0 && (
              <Card className="bg-[#2D2D2D] border-slate-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-phosphate text-cream mb-4 title-text">Rules & Guidelines</h2>
                  <ul className="space-y-2 text-cream/80">
                    {giveaway.rules.map((rule: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Entry Form */}
          <div className="space-y-6">
            <Card className="bg-[#2D2D2D] border-slate-700">
              <CardContent className="p-6">
                <h2 className="text-2xl font-phosphate text-cream mb-4 title-text flex items-center gap-2">
                  <Crown className="h-6 w-6 text-red-500" />
                  Enter Giveaway
                </h2>
                
                {userEntries > 0 && (
                  <div className="mb-4 p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 font-semibold">
                      ✓ You have {userEntries} {userEntries === 1 ? 'entry' : 'entries'} in this giveaway!
                    </p>
                  </div>
                )}

                <GiveawayEntryForm 
                  giveaway={giveaway} 
                  onSuccess={handleEntrySuccess}
                />

                {additionalEntryPrice && userEntries > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <h3 className="text-lg font-semibold text-cream mb-3">Buy Additional Entries</h3>
                    <p className="text-cream/60 mb-4 text-sm">
                      Increase your chances of winning by purchasing additional entries. Each entry costs ${additionalEntryPrice.toFixed(2)}.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePurchaseEntries(1)}
                        disabled={purchasingEntries}
                        className="flex-1 bg-slate-700 border-slate-600 text-cream hover:bg-slate-600"
                      >
                        {purchasingEntries ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Buy 1 Entry (${additionalEntryPrice.toFixed(2)})
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handlePurchaseEntries(5)}
                        disabled={purchasingEntries}
                        className="flex-1 bg-slate-700 border-slate-600 text-cream hover:bg-slate-600"
                      >
                        {purchasingEntries ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Buy 5 Entries (${(additionalEntryPrice * 5).toFixed(2)})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>Membership Required:</strong> You must have an active membership ($9.99/month) to enter giveaways. 
                    Members automatically get one free entry per giveaway and can purchase additional entries.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <CTASection />
    </main>
  );
}
