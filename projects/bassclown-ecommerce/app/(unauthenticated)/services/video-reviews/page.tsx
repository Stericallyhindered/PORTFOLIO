import type { Metadata } from 'next';
import Image from "next/image";
import { Play } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { CTASection } from "@/components/home/CTASection";
import { GridTitleLeft } from "@/components/video-reviews/grid-title-left";
import FancyBurst from '@/components/icons/FancyBurst';
import NonHomePolaroidFrame from '@/components/NonHomePolaroidFrame';
import { VideoThumbnail } from '@/components/video-reviews/video-thumbnail';
import FishChase from '@/public/images/assets/bass-clown-co-fish-chase.png';
import { VideoReviewForm } from '@/components/VideoReviewForm';
import WeatheredBurst from '@/components/icons/WeatheredBurst';
import FishChaseHero from '@/components/FishChaseHero';
import { ContentBanner } from '@/components/our-work/ContentBanner';

export const metadata: Metadata = {
  title: 'Video Reviews',
  description: 'Professional video review services for fishing products and equipment. Authentic and compelling content that builds trust with your audience.',
  alternates: {
    canonical: 'https://bassclown.com/services/video-reviews',
  },
};

export default function VideoReviews() {
  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-b from-[#1D1D1F] to-[#4E4C4D]">
      {/* Hero Section */}

      <FishChaseHero title="VIDEO REVIEWS!" description="Hook, Set, and Showcase" />

      {/* How Does It Work Section */}
      <GridTitleLeft title="HOW DOES IT WORK?">
            <p className="text-gray-300 mb-6">
              How do our video reviews work? Easy – just like setting the hook on a hungry bass! Simply send us your product, and we&apos;ll give it a basic review at no cost. That&apos;s right, free – cheaper than the one jig you lost in a tree last weekend. But if you really want to set the hook deep, we&apos;ve got options that&apos;ll make your brand the tournament champion of the industry.
            </p>
            <p className="text-gray-300 mb-6">
              Want to see your product in action? We offer 10-minute on-the-water reviews complete with real fish catches – because nothing sells better than a bass blowing up on your gear. But if you want to go full-send, we&apos;ve got the 20-minute show option, featuring fish catches, underwater footage, and an in-depth breakdown of your product. Whether it&apos;s topwater chaos, deep crank magic, or a finesse finesse – yeah, we said it twice – we can showcase your gear in all its glory.
            </p>
            <p className="text-gray-300">
              So, send it our way and let&apos;s put it to the test. Just don&apos;t blame us if it catches more fish than you do!
            </p>
      </GridTitleLeft>

      {/* Video Thumbnails Strip */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Video Thumbnail 1 */}
            <VideoThumbnail
              title="Bass Fishing Review"
              author="Bass Clown Co."
              imageSrc="/images/assets/bass-taking-picture.svg"
              imageAlt="Video review thumbnail showing film reel"
            />

            {/* Video Thumbnail 2 */}
            <VideoThumbnail
              title="Bass Fishing Review"
              author="Bass Clown Co."
              imageSrc="/images/assets/simple-burst.svg"
              imageAlt="Video review thumbnail showing film reel"
            />

            {/* Video Thumbnail 3 */}
            <VideoThumbnail
              title="New Lures from Yo-Ma..."
              author="Fisherman"
              imageSrc="/images/assets/fancy-burst.svg"
              imageAlt="Video review thumbnail showing film reel"
            />
          </div>
        </div>
      </section>
      <section className='relative flex flex-col items-center justify-center overflow-hidden'>
        <Image
          src="/images/assets/bubbles.svg"
          alt="Bubbles"
          width={400}
          height={400}
          className="absolute inset-0 translate-y-1/2 -translate-x-1/2 scale-x-[-1] opacity-40 saturate-0 contrast-200 "
        />
        <Image
          src="/images/assets/bubbles.svg"
          alt="Bubbles"
          width={400}
          height={400}
          className="absolute top-0 right-0 translate-x-1/2 scale-x-[-1] scale-y-[-1] rotate-180 z-0 opacity-40 saturate-0 contrast-200 "
        />
        <WeatheredBurst className='absolute -bottom-full translate-y-1/4 z-0 opacity-30 text-[#3D3D3D] sepia contrast-100 saturate-0' size={1750} />
        <GridTitleLeft title="FREE REVIEWS" className='my-16 border-b-4 border-dotted border-gray-200 z-10'>
          {/* Free Reviews Section */}
              <p className="text-gray-300 mb-8">
                At Bass Clown Co., our Free Reviews are exactly that – free, fun, and full of our signature bass clown flair. Got a product you want us to check out? Ship it our way and we&apos;ll hit it with a professional review using our trusted ReviewTemplate Style. We&apos;ll shoot the content, share it across our channels, and make sure your product gets eyeballs from <span className="text-red-500">bass-heads</span> across the country – all at no charge. But we don&apos;t stop there – once the review is live, your product joins our monthly member giveaways, complete with a bonus marketing push. It&apos;s a win-win-win: you get exposure, we get content, and someone gets free gear. Don&apos;t miss the gravy train – send us the goods, and we&apos;ll help you sell it with a smile (and maybe a few fishing puns).
              </p>
        </GridTitleLeft>

        <GridTitleLeft title="PAID REVIEWS" className='z-10'>
          {/* Paid Reviews Section */}
            <p className="text-gray-300 mb-8 relative">
              Got a hot new product you need to blast into the bass fishing universe? Our Paid Reviews are where the real fireworks happen. Whether you want underwater, slow-mo glory shots, hard-hitting fish catches, deep-dive how-tos, or a cinematic sizzle reel that makes your lure look like it belongs in Hollywood – we got you. Just give us the script (or let us wing it clown-style), and we&apos;ll cook up a custom review anywhere from 3 to 30 minutes long. You tell us what you want, and we&apos;ll make it slap harder than a topwater hit at sunrise. This is full-blown, bass-blasted content made to move product. Let&apos;s get loud, let&apos;s get weird, and let&apos;s get your gear in front of the people who actually fish.
            </p>
        </GridTitleLeft>
      </section> 

      {/* Red Banner CTA */}

      <section className="pt-6 pb-24 space-y-24 relative z-10 bg-[#121212]">
        <ContentBanner BannerText="FIND OUT NOW IF WE'RE THE RIGHT FIT FOR YOU!" />


      {/* Contact/Submission Form and Testimonials */}

        {/* Subtle Background Pattern */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', 
            backgroundSize: '30px 30px' 
          }}
        ></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Testimonial */}
            <div className="md:col-span-3 flex flex-col items-center">
              <NonHomePolaroidFrame imageSrc="/images/Stealth final apparel_circle logo-01.png" imageAlt="Stealth Batteries Testimonial" caption="Stealth Batteries" />
              <h3 className="text-xl font-bold text-white my-4 uppercase">Testimonial</h3>
              <div className="text-gray-300 text-center md:text-left">
                Bass Clown Co. did a great job on creating a video to promote Stealth Batteries. They were professional and easy to work with. We would definitely recommend them to anyone looking for any and all video needs!
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-6 uppercase text-center title-text">Send Us Your Product</h3>
                <VideoReviewForm />
              </div>
            </div>

            {/* Right Testimonial */}
            <div className="md:col-span-3 flex flex-col items-center">
              <NonHomePolaroidFrame imageSrc="/images/assets/bass-taking-picture.svg" imageAlt="OutcastLures Testimonial" caption="OutcastLures" rotation="3deg" />
              <h3 className="text-xl font-bold text-white my-4 uppercase">Testimonial</h3>
              <div className="text-gray-300">
                Bass Clown Co. delivered exactly what we needed. Their creativity and attention to detail made our product shine. The final video was top-notch and drove real engagement from our target audience.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with YouTube Section */}
      <section className="bg-[#4F504F] py-16 relative">
        <div className="relative flex items-center justify-center pointer-events-none">
          <Image
            src="/images/assets/bass-holding-lure.png"
            alt="Bass Fish with Sunglasses"
            width={400}
            height={300}
            quality={85}
            className="w-1/2 max-w-5xl relative z-10"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none ">
            <Image
              src="/images/assets/weathered-burst.svg"
              alt="Weathered Burst"
              width={1000}
              height={1000}
              className="w-full h-auto"
            />
          </div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <p className="text-white text-xl mb-6 uppercase title-text text-[#EDE9D9]">
            TO WATCH ALL OF OUR REVIEWS GO TO OUR YOUTUBE CHANNEL & CLICK THE LINK BELOW!
          </p>
          
          <div className="mb-8">
            <a 
              href="https://www.youtube.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <div className="bg-red-600 w-16 h-10 rounded-xl p-2 inline-flex items-center justify-center">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
              <span className="text-white text-xl ml-2 font-bold">YouTube</span>
            </a>
          </div>
          
          <div>
            <Image
              src="/images/assets/bass-clown-red-cream.png"
              alt="Bass Clown Co Logo"
              width={160}
              height={80}
              className="mx-auto"
            />
          </div>
        </div>
        <div className="absolute -bottom-10 left-0 right-0 flex items-center justify-center pointer-events-none z-10 ">
          <Image
            src="/images/assets/video-reel-1.svg"
            alt="Video Reel"
            width={1000}
            height={1000}
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
    </main>
  );
}
