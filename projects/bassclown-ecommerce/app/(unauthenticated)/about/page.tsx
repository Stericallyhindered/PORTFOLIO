"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import HookLine from "@/components/HookLine"; // Assuming this is still desired for the top fishing line
import { CTASection } from '@/components/home/CTASection';
import NonHomePolaroidFrame from "@/components/NonHomePolaroidFrame";
import FancyBurst from "@/components/icons/FancyBurst";
import FishChaseHero from "@/components/FishChaseHero";
import { ContentBanner } from "@/components/our-work/ContentBanner";
// import BassFishy from "@/components/BassFishy"; // Replaced by direct SVG or Image
// import Bubbles from "@/components/Bubbles"; // Not in the new design
// import VideoReelBottomHalfIcon from "@/components/videoReelBottom"; // May not be needed or replaced

// Metadata can be kept or updated if necessary, for now, keeping as is.
// export const metadata: Metadata = {
// title: 'About Us - Bass Clown Co',
// description: 'Learn about Bass Clown Co, a professional video production company specializing in fishing industry content with a unique blend of expertise and humor.',
// };

const teamMembersData = [
  {
    name: "NICK TESCHLER",
    role: "Nick - Co-Founder / Retired Professional Pond Pirate",
    imageText: "",
    bio: [
      "Nick is a 3rd generation Arizona native and a lifetime member of the \"one more cast\" club. His obsession with fishing started at the ripe age of 10, when he and his crew terrorized every golf course pond and community lake within biking distance. If it held water (and possibly a bass), Nick was chucking a Texas Rig in it.",
      "He went on to study business and mass communications at Arizona State, which basically means he knows how to sell you something and talk about it really well. After a brief stint in corporate America where he wore collared shirts and died inside. He said enough and ditched the dress shoes and went full-send into entrepreneurship. His ventures have ranged from e-commerce and medical spas to his own advertising agency, proving that his attention span is only rivaled by his lure collection.",
      "In 2018, he launched Fishin48, a brand that hosts bass fishing tournaments and guided trips around Arizona. When COVID hit and the ad game got T-boned, he shifted full throttle into Fishin48, which unexpectedly blew up and became a staple in the Arizona fishing community. Eventually, his advertising agency made its comeback, and Nick used that blend of creative chops and bass brain to help launch Bass Clown Co. a media circus of content, chaos, and cinematic glory made for fishermen, by fishermen (with Wi-Fi).",
      "When he's not wrangling rods or working on Bass Clown Co., Nick's at home with his wife Krystal his tall, blonde babe since 2015 and their three kids: Tillman, Taylen, and Tinsley. It's a full house, but someone's gotta pass on the art of skipping docks and dodging HOA security."
    ]
  },
  {
    name: "CONRAD DEMECS",
    role: "Conrad Demecs - Co-Founder | Bass Whisperer | Roofing Hustler Extraordinaire",
    imageText: "",
    bio: [
      "If you've ever seen a dude hurl a football-sized swimbait at a dock like it owes him money and then stick a 6-pounder while ordering roofing materials on Bluetooth, congratulations—you've witnessed Conrad Demecs in his natural habitat.",
      "Born and raised in the cactus-infested wilds of Phoenix, Arizona, Conrad was basically raised on crankbaits and crushed ice. At 28 years old, he's already stacked enough wins to make your favorite local legend start \"re-retiring.\" With a Major League Fishing Toyota Series W in 2023 and a BAM Pro Tour dub in 2024, this guy is proof that desert bass are real, and they will bite if you're dialed like he is. Sprinkle in some local team championship titles, regular season wins, and more side-bets won than Vegas can count, and yeah—Conrad's the real deal.",
      "But let's not pretend the man doesn't wear more hats than a Bass Pro mannequin. Monday through Friday, he's out-closing your cousin's roofing company with a baby monitor in one hand and a coffee the color of motor oil in the other. Come Saturday? He's skipping town with a rod locker full of secret weapons and a glint in his eye that says, \"Somebody's about to get humbled.\"",
      "Off the water, Conrad's a husband to the amazing Madison and dad to little Kopeland, who's already showing signs of having the gene for skipping jigs and skipping naps. He balances family, work, and the never-ending quest for five fish that make your year—like it's just another Tuesday.",
      "Whether he's picking apart a grass mat or pitching life advice with the same accuracy he flips a jig, Conrad brings heart, hustle, and a dead-serious love for this game. One minute he's deep in tournament mode; the next, he's filming a slow-mo hookset that makes you question your whole life.",
      "Conrad's not just climbing the ladder—he's fishing it, flipping it, and maybe installing shingles on it in the off-season. Watch out, because this roof-slinging, bass-slinging maniac is only getting started."
    ]
  },
  {
    name: "RYAN NELSON",
    role: "Ryan Nelson - Co-Founder / Marketing Mastermind / Outdoor Enthusiast",
    imageText: "",
    bio: [
      "Meet Ryan Nelson, Arizona's own joke slinging, deal-closing marketing mastermind who believes pitch decks should pack more punch than a stand up comedy special! Born in the heart of the desert, this Arizona native's been stirring up trouble and big ideas under the scorching sun his whole life. Married to his awesome partner, Mandy, and dad to two wild mini clowns, Rex and Rowan, Ryan's family keeps his creative fires burning hotter than a Phoenix summer. When he's not dreaming up viral campaigns or designing outdoor apparel, you might find him skydiving for \"research\" or bickering with his father-in-law over who broke the trolling motor (hint: it was totally the old man).",
      "As the founder of an award-winning Arizona media company, Ryan's comedy powered branding has helped businesses laugh their way to the bank, think late night infomercials, but with better jokes and bigger profits. At Bass Clown Co., he's cranking up the chaos with slick videography, bold marketing, and wilder stories that make brands pop. From viral social ads to cinematic video shoots, Ryan's comedy marketing genius delivers results that scream louder than a neon billboard."
    ]
  }
];

export default function AboutPage() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
          }
        });
      },
      { threshold: 0.1 }
    );

    // Query for new elements if classes change, or keep generic for now
    const elements = document.querySelectorAll(".fade-in");
    elements.forEach((element) => observer.observe(element));

    return () => {
      elements.forEach((element) => observer.unobserve(element));
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col relative bg-[#1A1A1A] text-cream"> {/* Main background color */}

      {/* Hero Section */}
      <FishChaseHero title="WHO ARE THESE CLOWNS!" description="Our Two Greatest Loves: Creating Content And Fishing.... Why Not Do Both!" />

      {/* Team Members Section */}
      <section id="team-members" className="py-16 md:py-24 bg-[#1A1A1A] px-4 relative">
        
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
            {teamMembersData.map((member, index) => {
              // Define image sources for each team member
              let imageSrc = '/images/bass-clown-co-logo-wide.png'; // Default to logo
              if (member.name === 'NICK TESCHLER') {
                imageSrc = 'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/photos/nick-teschler.jpg';
              } else if (member.name === 'CONRAD DEMECS') {
                imageSrc = 'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/photos/conrad-demecs.jpg';
              }
              
              return (
                <div key={index} className="flex flex-col items-center text-center fade-in relative z-10">
                  {/* Polaroid Image */}
                  <NonHomePolaroidFrame imageSrc={imageSrc} caption={member.name} imageAlt={member.name} rotation={index % 2 === 0 ? '3deg' : '-3deg'} />
                <p className="font-phosphate text-lg text-cream mb-4 ">{member.imageText}</p>
                <h2 className="font-phosphate text-3xl md:text-4xl text-cream uppercase mb-2 title-text">{member.name}</h2>
                <p className="text-red-500 font-semibold text-sm md:text-base mb-4 px-2">{member.role}</p>
                <div className="space-y-4 text-sm md:text-base text-cream/90 text-left max-w-md mx-auto !relative !z-10">
                  {member.bio.map((paragraph, pIndex) => (
                    <p key={pIndex} className={pIndex > 0 ? "border-l-2 border-dotted border-gray-600 pl-4 ml-[-2px] relative z-10" : "relative z-10"}>
                      {paragraph}
                    </p>
                  ))}
                </div>
                </div>
              );
            })}
          </div>
        </div>
        <FancyBurst className="absolute top-0 left-0 w-full h-full opacity-10 z-0" size={1000} />
      </section>

      {/* WHY WE DO THIS CRAZY THING WE LOVE! Section */}
      <section id="why-we-do-it" className="py-16 md:py-24 text-cream px-4 relative"> {/* Vibrant Red Background */}
        <div className="text-center flex flex-col justify-end items-end w-screen">
          <ContentBanner BannerText="WHY WE DO THIS CRAZY THING WE LOVE!" />

          <div className="max-w-6xl mx-auto text-left space-y-10">
            <div>
              <h3 className="text-[#D40000] text-2xl md:text-3xl uppercase mb-3 text-left title-text">THE BASS CLOWN ORIGIN STORY</h3>
              <p className="text-sm md:text-base italic mb-6 text-left">(A tale of tournaments, t-shirts, and total nonsense)</p>
              <div className="space-y-4 text-base md:text-lg">
                <p>Bass Clown Co. wasn&apos;t born in a boardroom. It wasn&apos;t the result of a five year business plan or a tech accelerator. No, this circus started the way all great things do by accident and on a bass boat. Nick and Conrad first crossed paths in 2017 when Nick jumped into the Arizona tournament scene, wide eyed and slinging Jigs like he had something to prove. After a few derbs and a big win together, the two became fast friends working together with Fishin48 swapping stories, spots, and just enough smack talk to keep things interesting.</p>
                <p>Meanwhile, Ryan was out there doing his thing launching Wickedbass, a bass fishing apparel company with a twist: he was a wizard behind the camera, a menace in the editing room, and had a gift for making fishing look both cinematic and stupidly funny. Through a mutual friend, Nick and Ryan were introduced (read: forced to hang out), and before long, Ryan was filming Nick and Conrad doing what they do best: catching fish and talking trash.</p>
              </div>
            </div>

            <div>
              <h3 className="text-[#D40000] text-2xl md:text-3xl uppercase mb-3 text-left title-text">THE RESULT? VIDEO GOLD.</h3>
              <div className="space-y-4 text-base md:text-lg">
                <p>With Nick&apos;s background in advertising, Conrad&apos;s tournament brain, and Ryan&apos;s creative madness, it didn&apos;t take long to realize they were sitting on something special. Something equal parts media agency, fishing brand, and comedy experiment. And just like that Bass Clown Co. was born. A full-blown content circus dedicated to promoting the sport, roasting the industry, and making the best fishing media on planet Earth (or at least in Arizona). It&apos;s bass fishing, but with better lighting and worse decision-making.</p>
                <p>Welcome to the show!</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <Image src="/images/bass-clown-co-logo-wide.png" alt="Logo" width={600} height={40} className="h-24 w-auto mt-12" />
          
        </div>
        <Image
        src="/images/assets/video-reel-1.svg"
        alt="Film Reel Divider"
        width={1200}
        height={40}
        className="w-full my-12 absolute -bottom-10 left-0 right-0 translate-y-2/3 z-10"
      />
      </section>
      
      {/* CTA Section */}
      <CTASection />
    </main>
  );
}
