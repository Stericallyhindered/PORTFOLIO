'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, ArrowRight, Users, Calendar, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import FishChaseHero from '@/components/FishChaseHero';
import { CTASection } from '@/components/home/CTASection';

export default function ContentContestsPage() {
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const contestRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetchContests();
  }, []);

  // Fade-in animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1 }
    );

    contestRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [contests]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contests?limit=100', {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch contests');

      const result = await response.json();
      if (result.success && result.data?.contests) {
        setContests(result.data.contests);
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Closed';
    if (diff === 0) return 'Last day!';
    if (diff === 1) return '1 day left';
    return `${diff} days left`;
  };

  return (
    <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream relative">
      {/* Hero */}
      <FishChaseHero
        title="CONTENT CONTESTS"
        description="Showcase your creative skills and win prizes. Compete in exclusive contests with top brands in the fishing industry."
      />

      {/* Contests Section */}
      <section className="relative py-16 md:py-24">
        {/* Dotted pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          {loading ? (
            <div className="space-y-16">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-[500px] bg-[#2D2D2D] rounded-xl" />
                </div>
              ))}
            </div>
          ) : contests.length > 0 ? (
            <div className="space-y-24">
              {contests.map((contest: any, index: number) => {
                const applicationDeadline = contest.applicationDeadline ? new Date(contest.applicationDeadline) : null;
                const endDate = contest.endDate ? new Date(contest.endDate) : null;
                const isApplicationDeadlinePassed = applicationDeadline ? new Date() > applicationDeadline : false;
                const isOpen = contest.status === 'open' && !isApplicationDeadlinePassed;
                const daysLeft = endDate ? getDaysRemaining(contest.endDate) : null;

                return (
                  <div
                    key={contest.id}
                    ref={(el) => { contestRefs.current[index] = el; }}
                    className="opacity-0 translate-y-8 transition-all duration-700 ease-out"
                  >
                    {/* Full-width contest card */}
                    <div className="relative rounded-2xl overflow-hidden bg-[#232323] border border-white/5 shadow-2xl">
                      {/* Contest image banner */}
                      {contest.image ? (
                        <div className="relative w-full h-[300px] md:h-[400px]">
                          <Image
                            src={contest.image}
                            alt={contest.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#232323] via-[#232323]/40 to-transparent" />

                          {/* Status + urgency badges floating on image */}
                          <div className="absolute top-6 left-6 flex items-center gap-3">
                            {isOpen ? (
                              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-600 text-white text-sm font-semibold shadow-lg">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                Open for Entries
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold">
                                {contest.status === 'judging' ? 'Judging in Progress' :
                                 contest.status === 'completed' ? 'Completed' :
                                 contest.status === 'draft' ? 'Coming Soon' :
                                 contest.status}
                              </span>
                            )}
                            {daysLeft && isOpen && (
                              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-600/90 text-white text-sm font-semibold shadow-lg">
                                <Clock className="h-3.5 w-3.5" />
                                {daysLeft}
                              </span>
                            )}
                          </div>

                          {/* Brand logo floating on image */}
                          {contest.brandLogo && (
                            <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md rounded-xl p-3 shadow-lg">
                              <div className="relative w-16 h-16 md:w-20 md:h-20">
                                <Image
                                  src={contest.brandLogo}
                                  alt={contest.brandName || 'Brand'}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                            </div>
                          )}

                          {/* Title overlaid on bottom of image */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                            {contest.brandName && (
                              <p className="text-cream/70 text-sm tracking-widest uppercase mb-2">
                                Presented by {contest.brandName}
                              </p>
                            )}
                            <h2 className="title-text text-3xl md:text-5xl lg:text-6xl text-white leading-tight">
                              {contest.title}
                            </h2>
                          </div>
                        </div>
                      ) : (
                        /* No image - text-only header */
                        <div className="relative p-8 md:p-12 bg-gradient-to-r from-[#2C3E50] to-[#34495E]">
                          <div className="flex items-start justify-between">
                            <div>
                              {contest.brandName && (
                                <p className="text-cream/70 text-sm tracking-widest uppercase mb-2">
                                  Presented by {contest.brandName}
                                </p>
                              )}
                              <h2 className="title-text text-3xl md:text-5xl text-white leading-tight mb-4">
                                {contest.title}
                              </h2>
                              <div className="flex items-center gap-3">
                                {isOpen ? (
                                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-600 text-white text-sm font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    Open for Entries
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-semibold">
                                    {contest.status}
                                  </span>
                                )}
                                {daysLeft && isOpen && (
                                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-600/90 text-white text-sm font-semibold">
                                    <Clock className="h-3.5 w-3.5" />
                                    {daysLeft}
                                  </span>
                                )}
                              </div>
                            </div>
                            {contest.brandLogo && (
                              <div className="hidden md:block relative w-24 h-24 flex-shrink-0">
                                <Image
                                  src={contest.brandLogo}
                                  alt={contest.brandName || 'Brand'}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contest body */}
                      <div className="p-6 md:p-10">
                        {/* Description */}
                        {(contest.shortDescription || contest.description) && (
                          <div className="mb-8">
                            <p className="text-cream/80 text-lg md:text-xl leading-relaxed max-w-4xl">
                              {contest.shortDescription || (contest.description?.length > 300
                                ? contest.description.substring(0, 300) + '...'
                                : contest.description)}
                            </p>
                          </div>
                        )}

                        {/* Stats row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                            <Trophy className="h-6 w-6 text-red-500 mx-auto mb-2" />
                            <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">Prize</p>
                            <p className="text-cream text-lg font-bold">{contest.prize || 'TBD'}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                            <Users className="h-6 w-6 text-red-500 mx-auto mb-2" />
                            <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">Spots</p>
                            <p className="text-cream text-lg font-bold">
                              {contest.currentParticipants || 0}
                              {contest.maxParticipants ? ` / ${contest.maxParticipants}` : ''}
                            </p>
                          </div>
                          {applicationDeadline && (
                            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                              <Calendar className="h-6 w-6 text-red-500 mx-auto mb-2" />
                              <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">Apply By</p>
                              <p className="text-cream text-lg font-bold">
                                {applicationDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          )}
                          {endDate && (
                            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
                              <Clock className="h-6 w-6 text-red-500 mx-auto mb-2" />
                              <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">Ends</p>
                              <p className="text-cream text-lg font-bold">
                                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Category + Requirements */}
                        {contest.category && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            <Badge className="bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30">
                              {contest.category}
                            </Badge>
                            {(Array.isArray(contest.requirements)
                              ? contest.requirements
                              : typeof contest.requirements === 'string'
                                ? (() => { try { return JSON.parse(contest.requirements); } catch { return []; } })()
                                : []
                            ).slice(0, 3).map((req: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-cream/60 border-white/10">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
                          <Button
                            asChild
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-white text-lg font-semibold px-8 py-6 rounded-lg shadow-lg transition-transform hover:scale-[1.02]"
                          >
                            <Link href={`/contests/${contest.id}`}>
                              {isOpen ? 'View Contest & Apply' : 'View Contest Details'}
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                          </Button>

                          {isOpen && (
                            <p className="flex items-center gap-2 text-cream/40 text-sm self-center">
                              <Star className="h-4 w-4" />
                              Membership required to apply ($9.99/month)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-20">
              <div className="relative inline-block mb-8">
                <Trophy className="h-24 w-24 text-cream/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border border-cream/10" />
                </div>
              </div>
              <h3 className="title-text text-3xl md:text-4xl text-cream mb-4">
                NO ACTIVE CONTESTS
              </h3>
              <p className="text-cream/50 text-lg max-w-lg mx-auto mb-8">
                We're cooking up something exciting. Check back soon for new contests 
                with amazing brands and prizes.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-6 rounded-lg"
              >
                <Link href="/register">
                  Sign Up to Get Notified
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* How It Works mini-section */}
      <section className="py-16 bg-[#232323] border-t border-white/5">
        <div className="container mx-auto px-4">
          <h2 className="title-text text-3xl md:text-4xl text-cream text-center mb-12">
            HOW CONTESTS WORK
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '01',
                title: 'Browse & Apply',
                desc: 'Find a contest that matches your skills and submit your application.'
              },
              {
                step: '02',
                title: 'Create & Submit',
                desc: 'Once accepted, create your content following the contest guidelines and submit before the deadline.'
              },
              {
                step: '03',
                title: 'Win Prizes',
                desc: 'Judges review all submissions. Winners are announced and prizes are awarded.'
              }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/20 border border-red-600/30 mb-4">
                  <span className="title-text text-2xl text-red-500">{item.step}</span>
                </div>
                <h3 className="title-text text-xl text-cream mb-2">{item.title}</h3>
                <p className="text-cream/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </main>
  );
}
