import type { Metadata } from 'next';
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { CTASection } from '@/components/home/CTASection';
import HookLine from "@/components/HookLine";

export const metadata: Metadata = {
  title: 'Store',
  description: 'Shop for Bass Clown Co branded merchandise and fishing accessories.',
  alternates: {
    canonical: 'https://bassclown.com/store',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

// TODO: Replace with API call to fetch products
// const products: any[] = []; // Empty - ready for products API

/* Sample products data - for future use when store API is ready
const products = [
  {
    id: 1,
    name: "Bass Clown Co T-Shirt",
    description: "Premium cotton t-shirt with our signature logo.",
    price: 24.99,
    rating: 5,
    category: "Apparel",
    image: "/images/assets/bass-clown-co-fish-chase.png"
  },
  {
    id: 2,
    name: "Fishing Cap",
    description: "Adjustable breathable cap for fishing adventures.",
    price: 19.99,
    rating: 4,
    category: "Apparel",
    image: "/images/assets/bass-taking-picture.svg"
  },
  {
    id: 3,
    name: "Video Tutorials Bundle",
    description: "Digital download of our premium fishing technique tutorials.",
    price: 49.99,
    rating: 5,
    category: "Digital",
    image: "/images/assets/video-reel-1.svg"
  },
  {
    id: 4,
    name: "Tackle Box Stickers",
    description: "Set of 5 waterproof vinyl stickers featuring our fun designs.",
    price: 8.99,
    rating: 4,
    category: "Accessories",
    image: "/images/assets/bubbles.svg"
  },
  {
    id: 5,
    name: "Premium Fishing Hoodie",
    description: "Warm and comfortable hoodie for cool morning fishing trips.",
    price: 39.99,
    rating: 5,
    category: "Apparel",
    image: "/images/assets/bass-clown-co-fish-chase.png"
  },
  {
    id: 6,
    name: "Bass Clown Co Tumbler",
    description: "24oz insulated tumbler to keep your drinks cool or hot.",
    price: 22.99,
    rating: 4,
    category: "Accessories",
    image: "/images/assets/bass-taking-picture.svg"
  },
];
*/

const categories = [
  "All",
  "Apparel",
  "Accessories",
  "Digital"
];

export default function Store() {
  const products: any[] = []; // Empty - ready for products API

  return (
    <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream relative">
      {/* Hero Section */}
      <section 
        id="store-hero" 
        className="relative min-h-[50vh] md:min-h-[40vh] flex flex-col items-center justify-center overflow-hidden py-16 md:py-20 px-4"
        style={{ backgroundColor: '#2C3E50' }}
      >
        <HookLine
          size={80}
          color="#ECE9D9"
          className="absolute top-0 left-1/2 -translate-x-1/2 z-[1]"
        />
        <div className="absolute inset-0 bg-black/30 z-[1]"></div>
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center text-center">
          <h1 className="font-phosphate text-5xl md:text-7xl tracking-wider text-cream uppercase mb-4 text-shadow-lg title-text">
            THE BASS CLOWN STORE
          </h1>
          <p className="text-lg md:text-xl tracking-wide text-cream/90 font-phosphate max-w-3xl title-text">
            Shop for Bass Clown Co branded merchandise and fishing accessories. 
            Show your love for fishing content with our quality products.
          </p>
        </div>
      </section>
      
      {/* Products Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-3xl font-phosphate text-cream mb-4 title-text">Store Coming Soon!</h2>
            <p className="text-cream/80 text-lg mb-8 max-w-2xl mx-auto">
              We're working on bringing you amazing Bass Clown Co branded merchandise and fishing accessories. 
              Check back soon for exciting products!
            </p>
            <div className="bg-[#2D2D2D] p-8 md:p-12 rounded-lg text-center shadow-xl max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-phosphate text-cream mb-4 title-text">Looking for Custom Merchandise?</h2>
              <p className="text-cream/80 mb-6 leading-relaxed">
                We offer custom-branded merchandise for fishing brands and organizations. 
                Create promotional items that showcase your brand with our quality products.
              </p>
              <Link 
                href="/contact" 
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-phosphate title-text px-8 py-3 rounded-md shadow-lg hover:shadow-xl transition-all text-lg"
              >
                Contact for Custom Orders
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center mb-12 gap-3">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className={`px-5 py-2.5 rounded-full text-sm font-phosphate title-text transition-colors ${
                    index === 0 
                      ? "bg-red-600 text-white shadow-md" 
                      : "bg-slate-700 text-cream/80 hover:bg-slate-600 shadow-sm"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-16">
              {products.map((product) => (
                <div key={product.id} className="bg-[#2D2D2D] rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-shadow flex flex-col">
                  <div className="relative h-56 w-full">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < product.rating ? "text-yellow-400" : "text-cream/30"
                          }`} 
                          fill={i < product.rating ? "currentColor" : "none"}
                        />
                      ))}
                      <span className="text-xs text-cream/60 ml-2">({product.rating}.0)</span>
                    </div>
                    <h2 className="text-xl font-phosphate text-cream mb-2 title-text flex-grow min-h-[3em]">{product.name}</h2>
                    <div className="flex items-center justify-between mt-auto pt-3">
                      <span className="text-xl font-phosphate title-text text-yellow-400">${product.price}</span>
                      <button className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full shadow-md hover:shadow-lg transition-all">
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Custom Merchandise CTA */}
            <div className="bg-[#2D2D2D] p-8 md:p-12 rounded-lg text-center shadow-xl max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-phosphate text-cream mb-4 title-text">Looking for Custom Merchandise?</h2>
              <p className="text-cream/80 mb-6 leading-relaxed">
                We offer custom-branded merchandise for fishing brands and organizations. 
                Create promotional items that showcase your brand with our quality products.
              </p>
              <Link 
                href="/contact" 
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-phosphate title-text px-8 py-3 rounded-md shadow-lg hover:shadow-xl transition-all text-lg"
              >
                Contact for Custom Orders
              </Link>
            </div>
          </>
        )}
      </section>
      
      <CTASection />
    </main>
  );
}
