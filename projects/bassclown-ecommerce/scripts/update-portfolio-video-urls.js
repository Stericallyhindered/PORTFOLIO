/**
 * Update Portfolio Video URLs to Match Uploaded Files
 * The uploaded files have date prefixes in their filenames
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

function loadDatabaseUrl() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^DATABASE_URL="?(.+?)"?$/m);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return process.env.DATABASE_URL;
}

const DATABASE_URL = loadDatabaseUrl();

// Mapping of old filename to new filename with date prefix
const urlMapping = {
  'videos/bajio-test.mp4': 'videos/2025-07-17_bajio-test.mp4',
  'videos/bass-clown-hero.mp4': 'videos/2025-07-17_bass-clown-hero.mp4',
  'videos/f8-lifted-tournement.mp4': 'videos/2025-07-17_f8-lifted-tournement.mp4',
  'videos/sunline.mp4': 'videos/2025-07-17_sunline.mp4',
  'videos/wb-derby-reel.mp4': 'videos/2025-07-17_wb-derby-reel.mp4',
  'videos/wicked-bass-ghost-of-jighead-jones.mp4': 'videos/2025-07-17_wicked-bass-ghost-of-jighead-jones.mp4',
  'videos/wicked-bass-large-mouth.mp4': 'videos/2025-07-17_wicked-bass-large-mouth.mp4',
};

const baseUrl = 'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/';

async function updateUrls() {
  const sql = neon(DATABASE_URL);
  
  console.log('🔄 Updating portfolio video URLs...\n');
  
  try {
    // Get all videos
    const videos = await sql`
      SELECT id, title, video_url
      FROM portfolio_videos
    `;
    
    console.log(`Found ${videos.length} videos to check\n`);
    
    let updated = 0;
    
    for (const video of videos) {
      // Extract just the filename part from the URL
      const oldUrl = video.video_url;
      const urlPath = oldUrl.replace(baseUrl, '');
      
      // Check if this needs updating
      if (urlMapping[urlPath]) {
        const newUrl = baseUrl + urlMapping[urlPath];
        
        console.log(`📹 Updating: ${video.title}`);
        console.log(`   Old: ${oldUrl}`);
        console.log(`   New: ${newUrl}`);
        
        await sql`
          UPDATE portfolio_videos
          SET video_url = ${newUrl},
              updated_at = NOW()
          WHERE id = ${video.id}
        `;
        
        updated++;
        console.log(`   ✅ Updated\n`);
      } else {
        console.log(`✓ ${video.title} - URL already correct\n`);
      }
    }
    
    console.log(`\n✨ Update complete! Updated ${updated} videos.`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

updateUrls()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

