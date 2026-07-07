/**
 * Verify Portfolio Videos URLs
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

async function verifyVideos() {
  const sql = neon(DATABASE_URL);
  
  console.log('🎬 Checking portfolio videos...\n');
  
  try {
    const videos = await sql`
      SELECT id, title, video_url, featured, published
      FROM portfolio_videos
      ORDER BY featured DESC, display_order ASC
    `;
    
    console.log(`Found ${videos.length} videos:\n`);
    videos.forEach(v => {
      console.log(`  ${v.featured ? '⭐' : '  '} ${v.title}`);
      console.log(`     URL: ${v.video_url}`);
      console.log(`     Published: ${v.published}\n`);
    });
    
    // Check if URLs match the uploaded blobs
    const expectedBaseUrl = 'https://blo3rw5wwgi5exel.public.blob.vercel-storage.com';
    const matchingUrls = videos.filter(v => v.video_url.includes(expectedBaseUrl));
    
    console.log(`\n✅ Videos with correct blob URLs: ${matchingUrls.length}/${videos.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyVideos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

