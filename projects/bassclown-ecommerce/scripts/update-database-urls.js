/**
 * Update Database URLs After Blob Upload
 * 
 * This script updates the database with new blob URLs if they changed
 * after uploading to Vercel Blob storage.
 * 
 * Usage:
 *   node scripts/update-database-urls.js
 * 
 * Environment Variables Required:
 *   DATABASE_URL - Neon PostgreSQL connection string
 *   BLOB_UPLOAD_RESULTS - Path to blob-upload-results.json (optional)
 */

// CommonJS version for Node.js
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
const RESULTS_FILE = process.env.BLOB_UPLOAD_RESULTS || 
  path.join(__dirname, '../..', 'blob-upload-results.json');

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

// Original URLs from backup metadata
const BACKUP_URLS = {
  // Videos
  'videos/bajio-test.mp4': 'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/bajio-test.mp4',
  'videos/bass-clown-hero.mp4': 'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/bass-clown-hero.mp4',
  'videos/f8-lifted-tournement.mp4': 'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/f8-lifted-tournement.mp4',
  'videos/sunline.mp4': 'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/sunline.mp4',
  'videos/wb-derby-reel.mp4': 'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/wb-derby-reel.mp4',
  'videos/wicked-bass-ghost-of-jighead-jones.mp4': 'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com/videos/wicked-bass-ghost-of-jighead-jones.mp4',
  'videos/wicked-bass-large-mouth.mp4': 'https://blo3rw5wwgi5el.public.blob.vercel-storage.com/videos/wicked-bass-large-mouth.mp4',
};

async function updateDatabase() {
  const sql = neon(DATABASE_URL);
  
  // If we have upload results, use those URLs
  let urlMap = {};
  if (fs.existsSync(RESULTS_FILE)) {
    const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    [...results.videos, ...results.photos].forEach(item => {
      // Map by original pathname (e.g., "videos/bajio-test.mp4")
      urlMap[item.originalPath] = item.url;
    });
  } else {
    // Otherwise assume URLs are the same (production restore scenario)
    console.log('⚠️  No upload results found. Assuming URLs are unchanged.');
    urlMap = BACKUP_URLS;
  }

  console.log('\n🔄 Updating database URLs...\n');

  // Update portfolio_videos table
  for (const [pathname, newUrl] of Object.entries(urlMap)) {
    if (pathname.startsWith('videos/')) {
      const oldUrl = BACKUP_URLS[pathname];
      if (oldUrl && oldUrl !== newUrl) {
        console.log(`📹 Updating portfolio_videos: ${pathname}`);
        console.log(`   Old: ${oldUrl}`);
        console.log(`   New: ${newUrl}`);
        
        try {
          await sql`
            UPDATE portfolio_videos
            SET video_url = ${newUrl},
                updated_at = NOW()
            WHERE video_url = ${oldUrl}
          `;
          console.log(`   ✅ Updated\n`);
        } catch (error) {
          console.error(`   ❌ Error: ${error.message}\n`);
        }
      }
    }
  }

  // Update contests table (if they have image URLs pointing to blobs)
  console.log('📋 Checking contests for blob URLs...');
  try {
    const contests = await sql`
      SELECT id, image, title
      FROM contests
      WHERE image LIKE '%blob.vercel-storage.com%'
    `;
    
    for (const contest of contests) {
      console.log(`   Found contest with blob image: ${contest.title}`);
      // You may need to update these if the URLs changed
    }
  } catch (error) {
    console.error(`   ❌ Error checking contests: ${error.message}`);
  }

  // Update giveaways table (if they have image URLs)
  console.log('\n🎁 Checking giveaways for blob URLs...');
  try {
    const giveaways = await sql`
      SELECT id, image, title
      FROM giveaways
      WHERE image LIKE '%blob.vercel-storage.com%'
    `;
    
    for (const giveaway of giveaways) {
      console.log(`   Found giveaway with blob image: ${giveaway.title}`);
    }
  } catch (error) {
    console.error(`   ❌ Error checking giveaways: ${error.message}`);
  }

  console.log('\n✨ Database URL update complete!');
}

updateDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });

