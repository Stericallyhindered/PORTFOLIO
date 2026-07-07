import { Service, Project, NavItem, SocialLink, ServiceBlock } from "@/lib/types";
import { Mail, Phone, Clock, MapPin, Pen, Rocket, Star, Megaphone, Share2, Calendar, Video, Camera, Film, PenSquare, BrainCircuit, FileText } from "lucide-react";

export const COMPANY_NAME = "Bass Clown Co";
export const COMPANY_ADDRESS = "";
export const COMPANY_PHONE = "";
export const COMPANY_EMAIL = "info@bassclown.com";

export const NAV_ITEMS: NavItem[] = [
  {
    label: "HOME",
    href: "/",
  },
  {
    label: "OUR WORK",
    href: "/our-work",
  },
  {
    label: "WHAT WE OFFER",
    href: "/services",
    subItems: [
      {
        label: "All Services",
        href: "/services",
      },
      {
        label: "Video Reviews",
        href: "/services/video-reviews",
      },
      {
        label: "Content Contests",
        href: "/services/content-contests",
      },
      {
        label: "Brand & Product Development",
        href: "/services/brand-and-product-development",
      },
    ],
  },
  {
    label: "ABOUT US",
    href: "/about",
  },
  {
    label: "CONTENT CONTESTS",
    href: "/content-contests",
  },
  {
    label: "GIVEAWAYS",
    href: "/giveaways",
  },
  {
    label: "BLOG",
    href: "/blog",
  },
  {
    label: "CONTACT US",
    href: "/contact",
  },
];

export const SERVICES: Service[] = [
  {
    title: "Brand Development Videos",
    description: "Professional video content to establish and strengthen your brand identity and messaging.",
    icon: Pen,
    image: "/images/assets/bass-clown-co-fish-chase.png",
  },
  {
    title: "Product Launch Videos",
    description: "Engaging videos to showcase your new products and create excitement around your launch.",
    icon: Rocket,
    image: "/images/assets/bass-taking-picture.svg",
  },
  {
    title: "Product Review Videos",
    description: "Authentic and compelling product reviews to build trust and showcase real-world applications.",
    icon: Star,
    image: "/images/assets/video-reel-1.svg",
  },
  {
    title: "Promotional Videos",
    description: "Eye-catching promotional content designed to increase engagement and drive conversions.",
    icon: Megaphone,
    image: "/images/assets/bubbles.svg",
  },
  {
    title: "Video Content Promotions",
    description: "Strategic promotion of your video content across multiple platforms to maximize reach and impact.",
    icon: Share2,
    image: "/images/assets/bass-clown-co-fish-chase.png",
  },
  {
    title: "Video Event Promotions",
    description: "Comprehensive video coverage of your events to extend their reach and create lasting impressions.",
    icon: Calendar,
    image: "/images/assets/bass-taking-picture.svg",
  },
];

export const PROJECTS: Project[] = [
  {
    title: "Outdoor Brand Campaign",
    description: "Series of promotional videos for a leading outdoor equipment company.",
    image: "/images/assets/bass-clown-co-fish-chase.png",
    category: "Brand Development",
  },
  {
    title: "Fishing Gear Product Launch",
    description: "Comprehensive video package for new fishing gear product line release.",
    image: "/images/assets/bass-taking-picture.svg",
    category: "Product Launch",
  },
  {
    title: "Tackle Box Review Series",
    description: "In-depth video reviews of the latest fishing tackle and accessories.",
    image: "/images/assets/video-reel-1.svg",
    category: "Product Review",
  },
  {
    title: "Summer Fishing Tournament",
    description: "Event coverage and promotional content for regional fishing competition.",
    image: "/images/assets/bubbles.svg",
    category: "Event Promotion",
  },
  {
    title: "Fishing Resort Promotional Campaign",
    description: "Multi-platform video campaign showcasing premier fishing destinations.",
    image: "/images/assets/bass-clown-co-fish-chase.png",
    category: "Promotional",
  },
  {
    title: "Fishing Techniques Tutorial Series",
    description: "Educational video content featuring expert fishing techniques and tips.",
    image: "/images/assets/bass-taking-picture.svg",
    category: "Content Creation",
  },
];

export const SERVICE_BLOCKS: ServiceBlock[] = [
  {
    title: "CINEMATIC COMMERCIALS",
    description: "Because your brand deserves more than a GoPro and a dream. When your product deserves more than a selfie and a shaky phone clip, we bust out the heavy artillery. Drones, gimbals, slow motion, dramatic music - we'll make your brand look like it just walked off a movie set. Cinematic, scroll-stopping, and just the right amount of ridiculous. Spielberg probably couldn't help.",
    bannerColor: "orange",
    polaroidVideo: "https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/bass-clown-hero.mp4",
    polaroidCaption: "Cinematic Commercial Example",
    icon: "public/images/bass-clown-co-logo-cream.svg",
    expandedDescription: "Because your brand deserves more than a GoPro and a dream. When your product deserves more than a selfie and a shaky phone clip, we bust out the heavy artillery. Drones, gimbals, slow motion, dramatic music - we'll make your brand look like it just walked off a movie set. Cinematic, scroll-stopping, and just the right amount of ridiculous. Spielberg probably couldn't help.",
  },
  {
    title: "CONTENT CONTESTS",
    description: "Where creators and brands collide - in the best way possible. Welcome to the rodeo of creativity. Our Content Contests pair talented video creators and fishing brands to whip up thumb-stopping, head-turning, 'Wait, who made that?!' content. We get killer content, creators get their moment to shine, and we all get to laugh at someone trying to film a topwater blowup with one hand. Big fun. Bigger exposure. Some actual exposure settings, too.",
    bannerColor: "orange",
    polaroidVideo: "https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/sunline.mp4",
    polaroidCaption: "Sunline Premium Fishing Line",
    icon: "/images/assets/film-reel-icon.svg",
    expandedDescription: "Like that little 12-incher that somehow manages to hook itself on tournament day. The Dink might be small, but it's got heart! This package includes one custom 30-second commercial to showcase your brand in all its glory. Need a little more juice? We can stretch the runtime - just like you'd stretch a fish on the bump board. It's the perfect choice for brands looking to get their feet wet without going all-in... yet.\n\nOur contest platform connects your brand with hundreds of talented creators who are hungry to showcase their skills. Each contest is carefully curated to match your brand's aesthetic and messaging goals. We handle everything from creator vetting to final video delivery, ensuring you get professional-quality content that resonates with your target audience.\n\nThe best part? You get multiple creative perspectives on your brand, giving you a diverse library of content to use across all your marketing channels. It's like having an entire creative team working for you, but way more fun and significantly more fish puns.",
  },
  {
    title: "MARKETING",
    description: "Strategy moves rapidly. Results may include increased sales and soaring laughter. This isn't your uncle's Facebook ad campaign. We blend creative strategy with on-the-water street smarts to build marketing plans that actually speak to anglers... and anyone else brave enough to forget them. From digital ads to influencer campaigns to launching your brand like a shaky head into cover, we've got you covered.",
    bannerColor: "orange",
    polaroidVideo: "https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/f8-lifted-tournement.mp4",
    polaroidCaption: "F48 Lifted Trucks Tournament",
    icon: "/images/assets/film-reel-icon.svg",
    expandedDescription: "We don't just throw marketing spaghetti at the wall to see what sticks (though we do love a good fishing pasta metaphor). Our marketing strategies are built on data, insights, and a deep understanding of what makes anglers tick. We know the difference between a weekend warrior and a tournament pro, and we craft messages that resonate with each audience.\n\nOur services include social media management, influencer partnerships, email marketing campaigns, and paid advertising across all major platforms. We track everything from engagement rates to conversion metrics, ensuring every dollar spent is working as hard as a bass boat motor on tournament day.\n\nThe result? Marketing that doesn't feel like marketing. Content that educates, entertains, and ultimately drives sales. Because the best marketing doesn't feel like you're being sold to - it feels like you're getting let in on the best-kept secret in fishing.",
  },
  {
    title: "BRAND MANAGEMENT",
    description: "Your brand new best friend - with a very specific sense of humor. From the way your logo looks to the way your brand talks, we'll help fine-tune your identity until it stands out like a chartreuse crankbait in a mud hole. We're here to steer the ship, shape the vibe, and make sure your brand doesn't disappear in the 'sea of meh' fishing companies trying to be the next big thing.",
    bannerColor: "blue",
    polaroidVideo: "https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/bajio-test.mp4",
    polaroidCaption: "Bajio",
    icon: "/images/assets/film-reel-icon.svg",
  },
  {
    title: "CONTENT WRITING",
    description: "We write words that make your brand sound like it has a pulse. We write things so you don't have to. Website copy, social posts, ads, brand voice - whatever it is, we'll wordsmith the heck out of it. Equal parts smart and stupid (in the best way), we'll make sure your message comes through loud, clear, and catchy enough to make people stop scrolling mid-scroll.",
    bannerColor: "blue",
    polaroidVideo: "https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/wb-derby-reel.mp4",
    polaroidCaption: "WICKEDBASS Derby Reel",
    icon: "/images/assets/film-reel-icon.svg",
  },
  {
    title: "PHOTOGRAPHY",
    description: "Fish, fashion, products - we shoot it all, and we shoot it right. Legends say if we can take a photo so clean even your mom will comment on it. Whether it's product shots, lifestyle content, or pure action glory, we'll capture the moments that make your brand feel alive - and like it actually catches fish. No filters (okay maybe a few), just pure camera sorcery.",
    bannerColor: "orange",
    polaroidVideo: "https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/wicked-bass-large-mouth.mp4",
    polaroidCaption: "Behind the Scenes",
    icon: "/images/assets/film-reel-icon.svg",
    expandedDescription: "From sunrise to sunset, we're armed with cameras and ready to capture the magic. Our photography services cover everything from studio product shots that make your lures look like jewelry, to on-the-water action shots that make viewers feel like they're right there in the boat with you.\n\nWe specialize in lifestyle photography that tells your brand's story authentically. Whether it's the quiet concentration of a angler at dawn, the explosive action of a bass breaking the surface, or the satisfied smile of a successful day on the water, we capture the emotions that connect your audience to your brand.\n\nOur equipment arsenal includes professional cameras, underwater housings, drones for aerial shots, and lighting equipment that can make even the murkiest lake look like a crystal-clear paradise. Because great photography isn't just about having good gear - it's about knowing how to use it to tell your story.",
  },
];

export const BUSINESS_HOURS = [
  { day: "Monday - Friday", hours: "7:00 AM - 5:00 PM" },
  { day: "Saturday", hours: "By appointment only" },
  { day: "Sunday", hours: "Closed" },
];

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: "Instagram",
    url: "https://www.instagram.com/bassclownco/",
    label: "Follow us on Instagram",
  },
];
