-- Portfolio Videos Seed Data for Bass Clown Co
-- Run this in Neon SQL Editor after creating the portfolio_videos table

-- Create portfolio_videos table if it doesn't exist
CREATE TABLE IF NOT EXISTS portfolio_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category VARCHAR(100) DEFAULT 'commercial',
  client_name VARCHAR(255),
  featured BOOLEAN DEFAULT false,
  featured_order INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert Featured Videos (for homepage)
INSERT INTO portfolio_videos (
  title,
  description,
  video_url,
  category,
  client_name,
  featured,
  featured_order,
  display_order,
  published
) VALUES
(
  'Bajio Sunglasses',
  'Experience the thrill of the chase with Bajio Sunglasses. This commercial showcases the perfect blend of adventure, humor, and craftmanship.',
  'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/bajio-test.mp4',
  'commercial',
  'Bajio',
  true,
  1,
  1,
  true
),
(
  'Wicked Bass Large Mouth',
  'You know what they say about those with a large mouth... Large jaws. Bass fishing is a sport that is known for its excitement and thrill, now you know why!',
  'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/wicked-bass-large-mouth.mp4',
  'commercial',
  'Wicked Bass',
  true,
  2,
  2,
  true
),
(
  'Sunline Premium Fishing Line',
  'Sunline Premium Fishing Line is a premium fishing line that is made with the best materials and is designed to last, with different lines for different types of fishing and scenarios.',
  'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/sunline.mp4',
  'commercial',
  'Sunline',
  true,
  3,
  3,
  true
);

-- Insert Portfolio Videos (for Our Work page)
INSERT INTO portfolio_videos (
  title,
  description,
  video_url,
  category,
  client_name,
  featured,
  featured_order,
  display_order,
  published
) VALUES
(
  'Stealth Batteries',
  'Bass Clown Co. Commercial for Stealth Batteries',
  'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/bass-clown-hero.mp4',
  'commercial',
  'Stealth Batteries',
  false,
  0,
  2,
  true
),
(
  'F8 Lifted Tournament',
  'Bass Clown Co. Tournament Coverage',
  'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/f8-lifted-tournement.mp4',
  'tournament',
  'F8 Lifted',
  false,
  0,
  3,
  true
),
(
  'WB Derby Reel',
  'Bass Clown Co. Commercial for Wicked Bass Derby Reel',
  'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/wb-derby-reel.mp4',
  'commercial',
  'Wicked Bass',
  false,
  0,
  4,
  true
),
(
  'Wicked Bass Ghost Of Jighead Jones',
  'Bass Clown Co. Commercial for Wicked Bass',
  'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/wicked-bass-ghost-of-jighead-jones.mp4',
  'commercial',
  'Wicked Bass',
  false,
  0,
  5,
  true
),
(
  'Wicked Bass Large Mouth',
  'Bass Clown Co. Commercial for Wicked Bass Large Mouth',
  'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/wicked-bass-large-mouth.mp4',
  'commercial',
  'Wicked Bass',
  false,
  0,
  6,
  true
)
ON CONFLICT DO NOTHING;

-- Verify videos were created
SELECT 
  id,
  title,
  client_name,
  featured,
  featured_order,
  display_order,
  published,
  created_at
FROM portfolio_videos
ORDER BY 
  featured DESC,
  featured_order ASC,
  display_order ASC,
  created_at DESC;

