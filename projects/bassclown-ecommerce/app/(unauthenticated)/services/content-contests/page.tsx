'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { 
  CheckCircle, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/home/CTASection";
import { ContestVideoThumbnail } from '@/components/contests/contest-video-thumbnail';
import FancyBurst from '@/components/icons/FancyBurst';
import FilmSpoolSimplified from '@/components/icons/FilmSpoolSimplified';
import FishChaseHero from '@/components/FishChaseHero';
import WeatheredBurst from '@/components/icons/WeatheredBurst';
import { Contest } from '@/lib/types';

export default function ContentContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contests?limit=4&status=open', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contests');
      }

      const result = await response.json();

      if (result.success && result.data?.contests) {
        const transformedContests: Contest[] = result.data.contests.map((contest: any) => ({
          id: contest.id,
          title: contest.title,
          description: contest.description || '',
          shortDescription: contest.shortDescription || contest.description?.substring(0, 100) || '',
          image: contest.image || '/images/assets/bass-clown-co-fish-chase.png',
          prize: contest.prize || 'Prize TBD',
          startDate: contest.startDate ? new Date(contest.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          endDate: contest.endDate ? new Date(contest.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          applicationDeadline: contest.applicationDeadline ? new Date(contest.applicationDeadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          submissionDeadline: contest.submissionDeadline ? new Date(contest.submissionDeadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: contest.status || 'open',
          category: contest.category || 'General',
          requirements: Array.isArray(contest.requirements) ? contest.requirements :
                        typeof contest.requirements === 'object' && contest.requirements !== null
                          ? Object.values(contest.requirements) as string[]
                          : [],
          judges: Array.isArray(contest.judges) ? contest.judges :
                  typeof contest.judges === 'object' && contest.judges !== null
                    ? Object.values(contest.judges) as string[]
                    : [],
          maxParticipants: contest.maxParticipants || 100,
          currentParticipants: contest.currentParticipants || 0,
          rules: contest.rules || '',
          submissionGuidelines: contest.submissionGuidelines || '',
          createdBy: contest.createdBy || contest.creatorName || 'Bass Clown Co',
          createdAt: contest.createdAt ? new Date(contest.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: contest.updatedAt ? new Date(contest.updatedAt).toISOString() : new Date().toISOString()
        }));

        setContests(transformedContests);
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-[#121212]">
      {/* Hero Section */}
      <FishChaseHero title="CONTENT CONTESTS!" description="Best Anglers, Best Content, Best Contests in the Industry!" />


      {/* Contest Grid */}
      <section className="py-8 bg-[#121212]">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-gray-800 h-64 rounded"></div>
              ))}
            </div>
          ) : contests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {contests.slice(0, 4).map((contest) => (
                <ContestVideoThumbnail
                  key={contest.id}
                  title={contest.title}
                  subtitle={contest.shortDescription || contest.description?.substring(0, 60) || 'Enter now!'}
                  imageSrc={contest.image || '/images/assets/bass-clown-co-fish-chase.png'}
                  imageAlt={contest.title}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fallback to default contests if none in database */}
              <ContestVideoThumbnail
                title="Bass Fishing Tournament"
                subtitle="Submit your best catch"
                imageSrc="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/photos/bass-fishing-tournement.jpeg"
                imageAlt="Fishing Contest"
              />
              <ContestVideoThumbnail
                title="Lure Showcase"
                subtitle="Show off your gear"
                imageSrc="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/photos/lure-showcase.jpg"
                imageAlt="Fishing Contest"
              />
              <ContestVideoThumbnail
                title="Fishing Story Contest"
                subtitle="Tell us your best tale"
                imageSrc="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/photos/fishing-story-contest.jpeg"
                imageAlt="Fishing Contest"
              />
              <ContestVideoThumbnail
                title="Video Technique Contest"
                subtitle="Show your fishing skills"
                imageSrc="https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/photos/video-technique-contest.jpeg"
                imageAlt="Fishing Contest"
              />
            </div>
          )}
        </div>
      </section>

      {/* Red Banner */}"
      <div className="w-full mt-12 text-center grid grid-cols-12 relative">
        <div className="col-span-12 md:col-span-11 md:col-start-2">
          <div className="w-full bg-red-600 py-8 relative">
            <h2 className="text-white text-xl md:text-4xl font-thin title-text phosphate md:absolute top-1/2 left-1/2 md:-translate-x-2/3 md:-translate-y-1/2 md:w-fit text-center">
              CONTENT CONTESTS
            </h2>
          </div>
        </div>
    </div>
      {/* Benefits Section */}
      <section className="space-y-12 pt-4 pb-12 bg-gradient-to-b from-[#414143] to-[#121212] via-[#121212]">
        <div className="relative w-full transform rotate-180">
          <Image src="/images/assets/video-reel-1.svg" 
              alt="Film Reel" 
              width={2560}
              height={44}
              className="object-cover saturate-50 contrast-150 brightness-150" />
        </div>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-gray-300 mb-8">
              Are you a photography enthusiast, an avid fisherman who knows how to handle a bass hook like a pro (and can record it)? Do you want to work with some of the biggest fishing tackle brands in the industry? Well, you&apos;re in the right place!
            </p>
            <p className="text-gray-300 mb-8">
              Bass Clown Co. is looking for talented anglers to showcase their skills in our content contests. Show us your creative side and get your work in front of major brands and our ever-growing community. From complete bass fishing to specific lure shots, we want to see it all.
            </p>

            <div className="space-y-8 mt-12">
              {/* Benefit 1 */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 text-blue-400">
                  <FilmSpoolSimplified size={48} className='text-gray-400' />
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-2">
                    Enter your fish on the line—it&apos;s your digital brag board.
                  </h3>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 text-blue-400">
                  <FilmSpoolSimplified size={48} className='text-gray-400' />
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-2">
                    Check the leaderboard to see where you stand in the rankings. When you see a campaign that gets you fired up, submit your entry and get to work.
                  </h3>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 text-blue-400">
                  <FilmSpoolSimplified size={48} className='text-gray-400' />
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-2">
                    We&apos;ll limit the number of entries per contest, so no overcrowded honey holes here.
                  </h3>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 text-blue-400">
                  <FilmSpoolSimplified size={48} className='text-gray-400' />
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-2">
                    Lucky few go straight into the winner&apos;s payouts, and top creators will be featured in a brand collaboration, with their content shared across multiple platforms and possibly even in a commercial.
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-gray-300 mt-8">
              Win or lose, you will still have fun. If you don&apos;t take the prize, we have an array of consolation prizes, and you&apos;ll still be connected to the fishing industry with a combined fan base of over 1 million followers.
            </p>
            <p className="text-gray-300 mt-4">
              So are you ready to cast your shot at the big leagues? Grab your camera, bring your A-game, and let&apos;s make some content that&apos;s like a legendary blowout!
            </p>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="py-12 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:divide-x md:divide-gray-800 md:divide-dashed">
            {/* Left Column - Become a Member */}
            <div className="p-8  text-center relative">
              <h2 className="title-text text-3xl md:text-4xl text-center text-white mb-6 relative z-10">
                BECOME A MEMBER
              </h2>
              <p className="text-gray-300 mb-6 relative z-10">
                NEED A FORM? SUBMISSION IS EASY! CLICK THE LINK! NO LINE!
              </p>
              <Button className="bg-red-600 hover:bg-red-700 text-white py-3 px-8 relative z-10 title-text text-md">
                GET FORM
              </Button>
              <WeatheredBurst className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 md:-translate-y-1/2 opacity-50 z-0 text-gray-500" size={500} />
            </div>

            {/* Right Column - Already a Member */}
            <div className="p-8 text-center relative">
              <h3 className="title-text text-2xl text-white mb-6 relative z-10">
                ALREADY A MEMBER
              </h3>
              <p className="text-gray-300 mb-4 relative z-10">
                Fill Out Your Forms and CLICK THE LINK BELOW TO LOGIN!
              </p>
              <div className="space-y-4 relative flex flex-col items-center">
                <Button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 w-1/2 relative z-10 title-text text-md">
                  LOG IN
                </Button>
                <Button variant="outline" className="border-red-600 bg-primary text-white hover:bg-red-600/10 hover:text-white hover:backdrop-blur-sm font-bold py-3 px-8 w-1/2 relative z-10 title-text text-md">
                  VIEW MORE CONTESTS
                </Button>
                <Button variant="outline" className="border-red-600 bg-black/70 text-white hover:bg-red-600/10 hover:text-white hover:backdrop-blur-sm font-bold py-3 px-8 w-1/2 relative z-10 title-text text-md">
                  SET UP NEW PROFILE
                </Button>
                <WeatheredBurst className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/3 opacity-50 z-0 text-gray-500 md:block hidden" size={500} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Brands Section */}
      <section className="pb-4 relative bg-gradient-to-b from-[#3F3F41] via-[#1D1D1F] to-[#1D1D1F]">
        <div className="w-full my-12 text-center grid grid-cols-12 relative">
          <div className="col-span-12 md:col-span-11 md:col-start-2">
            <div className="w-full bg-red-600 py-8 relative">
              <h2 className="text-white text-xl md:text-4xl font-thin title-text phosphate md:absolute top-1/2 left-1/2 md:-translate-x-[55%] md:-translate-y-1/2 md:w-full text-center line-clamp-2">
                CONTENT CONTESTS FOR BRANDS - <span className="font-bass-clown-cursive capitalize flex-1">More Casts, More Catches, More Content!</span>
              </h2>
            </div>
          </div>
        </div>
        <Image
          src="/images/assets/video-reel-1.svg"
          alt="Film Reel Divider"
          width={1200}
          height={40}
          className="w-full my-12 contrast-75 saturate-0 brightness-0"
        />

        

        {/* Why Join Section */}
        <section className="py-12  ">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="title-text text-3xl text-white mb-8">
                WHY JOIN?
              </h2>
              <p className="text-gray-300 mb-6">
                Want to maximize your content at a fraction of the cost? Instead of paying one creator to create content for your brand, why not get 10-20 pieces of killer content from some of the best anglers in the industry?
              </p>
              <p className="text-gray-300 mb-6">
                Work with talented creators from across the country—real anglers who know how to showcase your products in action.
              </p>
              <p className="text-gray-300 mb-6">
                Gain access to high-quality, authentic fishing content created specifically for your brand by passionate anglers.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="title-text text-3xl text-white mb-8">
                HOW IT WORKS:
              </h2>

              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 text-blue-400">
                    <FilmSpoolSimplified size={48} className='text-gray-400' />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold mb-2">
                      You pick a specific contest—because good things take time, just like it&apos;s proven catching under a dock.
                    </h3>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 text-blue-400">
                    <FilmSpoolSimplified size={48} className='text-gray-400' />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold mb-2">
                      When you&apos;re ready to run a contest, just set up the details and requirements—whether it&apos;s a killer product shot or an action packed on-the-water video.
                    </h3>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 text-blue-400">
                    <FilmSpoolSimplified size={48} className='text-gray-400' />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold mb-2">
                      We post the contest and content creators compete to bring you diverse content.
                    </h3>
                  </div>
                </div>
              </div>

              <p className="text-gray-300 mt-8">
                More Content. More engagement. More fishy goodness. Whether you&apos;re launching a new bait, putting a cast out, or just want some fresh marketing inspiration, this is the place to go. And proudly brought to you by Bass Clown Co.
              </p>
            </div>
          </div>
        </section>
        <div className="flex justify-center items-center">
          <div className="container my-12 flex justify-center items-center">
          <Image
              src="/images/assets/bass-clown-red-cream.png"
              alt="Bass Clown Logo"
              width={400}
              height={40}
              className="aspect-auto"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
    </main>
  );
}
