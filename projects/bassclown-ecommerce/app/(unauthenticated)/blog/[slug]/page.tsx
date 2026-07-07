'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { Calendar, User, Tag, ArrowLeft } from "lucide-react";
import { CTASection } from '@/components/home/CTASection';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  images: string[] | null;
  videos: any[] | null;
  category: string | null;
  tags: string[] | null;
  authorName: string | null;
  published: boolean;
  publishedAt: string | null;
  views: number;
  createdAt: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/${slug}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch blog post');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPost(result.data);
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </section>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream">
        <section className="container mx-auto px-4 py-12 md:py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <Link href="/blog">
            <Button variant="outline">Back to Blog</Button>
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#1A1A1A] text-cream">
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        <Link href="/blog">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        {post.featuredImage && (
          <div className="relative h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="flex flex-wrap items-center mb-6 text-sm text-cream/70">
          <div className="flex items-center mr-4 mb-2 md:mb-0">
            <Calendar className="h-4 w-4 mr-1.5 text-red-500" />
            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()}
          </div>
          {post.authorName && (
            <div className="flex items-center mr-4 mb-2 md:mb-0">
              <User className="h-4 w-4 mr-1.5 text-red-500" />
              {post.authorName}
            </div>
          )}
          {post.category && (
            <div className="flex items-center mb-2 md:mb-0">
              <Tag className="h-4 w-4 mr-1.5 text-red-500" />
              {post.category}
            </div>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl font-phosphate text-cream mb-6 title-text">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-xl text-cream/80 mb-8 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div 
          className="prose prose-invert prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
            {post.images.map((img, index) => (
              <div key={index} className="relative h-64 rounded-lg overflow-hidden">
                <Image
                  src={img}
                  alt={`${post.title} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {post.videos && post.videos.length > 0 && (
          <div className="space-y-4 my-8">
            {post.videos.map((video, index) => (
              <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  src={video.url}
                  controls
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-cream border-cream/30">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <CTASection />
    </main>
  );
}
