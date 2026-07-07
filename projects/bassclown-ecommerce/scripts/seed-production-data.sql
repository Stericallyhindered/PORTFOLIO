-- Production Seed Data for Bass Clown Co
-- Run this in Neon SQL Editor after database setup

-- First, get the admin user ID (replace with actual email if different)
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM users WHERE email = 'Nick@bassclown.com' LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found. Please create admin user first.';
  END IF;

  -- Insert Production Contests
  INSERT INTO contests (
    id,
    title,
    description,
    short_description,
    image,
    prize,
    start_date,
    end_date,
    application_deadline,
    submission_deadline,
    status,
    category,
    requirements,
    judges,
    max_participants,
    current_participants,
    rules,
    submission_guidelines,
    created_by,
    created_at,
    updated_at
  ) VALUES
  (
    gen_random_uuid(),
    'Best Bass Fishing Video 2025',
    'Show us your best bass fishing skills in this exciting video contest. Submit your most impressive catch, technique demonstration, or fishing adventure. Winner gets premium fishing gear and equipment worth $2,000! This is your chance to showcase your fishing expertise and win incredible prizes while joining a community of passionate anglers.',
    'Submit your best bass fishing video for a chance to win premium fishing gear worth $2,000',
    '/images/assets/bass-clown-co-fish-chase.png',
    '$2,000 in Fishing Gear',
    NOW(),
    NOW() + INTERVAL '90 days',
    NOW() + INTERVAL '60 days',
    NOW() + INTERVAL '75 days',
    'open',
    'Video Production',
    '["Original video content only", "Minimum 2 minutes, maximum 10 minutes", "High definition (1080p or higher)", "Include brief description of technique or location", "Must demonstrate bass fishing skills"]'::jsonb,
    '[]'::jsonb,
    100,
    0,
    'All content must be original and shot within the contest period. No copyrighted music without permission. Submissions will be judged on technique, creativity, and video quality.',
    'Upload your video in MP4 format, maximum 500MB. Include title, description, and location if applicable. Ensure video quality is HD (1080p minimum).',
    admin_user_id,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Fishing Photography Challenge',
    'Capture stunning fishing moments, landscapes, and wildlife in this photography contest. Show us the beauty of fishing through your lens. Submit up to 5 photos showcasing your best fishing photography skills.',
    'Photography contest for fishing and outdoor enthusiasts',
    '/images/assets/bass-clown-co-fish-chase.png',
    '$1,000 Photography Equipment',
    NOW(),
    NOW() + INTERVAL '60 days',
    NOW() + INTERVAL '45 days',
    NOW() + INTERVAL '55 days',
    'open',
    'Photography',
    '["Original photography only", "High resolution (minimum 2000x2000px)", "Fishing or outdoor theme", "Minimal post-processing allowed", "Submit up to 5 photos"]'::jsonb,
    '[]'::jsonb,
    75,
    0,
    'Photos must be original and taken within contest period. Light editing allowed but no heavy manipulation. Judged on composition, technical quality, and storytelling.',
    'Upload in JPEG format, maximum 10MB per image. Include brief description of location and story behind each photo.',
    admin_user_id,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Fishing Blog Writing Contest',
    'Write compelling articles about fishing experiences, techniques, or gear reviews. Share your knowledge and stories with the fishing community. The best article will be published on our blog and win $500 cash prize.',
    'Write engaging fishing articles and win writing opportunities',
    '/images/assets/bass-clown-co-fish-chase.png',
    '$500 + Publishing Opportunity',
    NOW(),
    NOW() + INTERVAL '45 days',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '40 days',
    'open',
    'Writing',
    '["Original written content only", "Minimum 1,000 words", "Fishing-related topic", "Proper grammar and structure", "Include relevant images if available"]'::jsonb,
    '[]'::jsonb,
    50,
    0,
    'Content must be original and well-researched. Proper citations required for any references. Judged on writing quality, originality, and value to fishing community.',
    'Submit in PDF or Word format. Include title, author bio, and any supporting images. Ensure content is well-structured with clear headings.',
    admin_user_id,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Production contests seeded successfully!';
END $$;

-- Verify contests were created
SELECT 
  id,
  title,
  status,
  category,
  prize,
  created_at
FROM contests
ORDER BY created_at DESC
LIMIT 10;

