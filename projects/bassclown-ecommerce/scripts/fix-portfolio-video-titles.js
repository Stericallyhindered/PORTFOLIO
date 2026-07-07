/**
 * Fix Portfolio Video Titles
 * - Change "WICKED BASS" to "WICKEDBASS" (one word)
 * - Change "F8 Lifted Tournament" to "F48 Lifted Trucks Tournament"
 * - Remove duplicate "Bajio Sunglasses" video (keep "Bajio")
 */

require('dotenv').config({ path: '.env.local' });
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { portfolioVideos } = require('../lib/db/schema');
const { eq, like, or } = require('drizzle-orm');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function fixVideoTitles() {
  console.log('🔧 Fixing Portfolio Video Titles...\n');

  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  try {
    // 1. Fix "WICKED BASS" to "WICKEDBASS" (one word)
    console.log('1. Fixing "WICKED BASS" to "WICKEDBASS"...');
    const wickedBassVideos = await db
      .select()
      .from(portfolioVideos)
      .where(like(portfolioVideos.title, '%WICKED BASS%'));

    for (const video of wickedBassVideos) {
      const newTitle = video.title.replace(/WICKED BASS/gi, 'WICKEDBASS');
      await db
        .update(portfolioVideos)
        .set({ title: newTitle, updatedAt: new Date() })
        .where(eq(portfolioVideos.id, video.id));
      console.log(`   ✓ Updated: "${video.title}" → "${newTitle}"`);
    }

    // 2. Fix "F8 Lifted Tournament" to "F48 Lifted Trucks Tournament"
    console.log('\n2. Fixing "F8 Lifted Tournament" to "F48 Lifted Trucks Tournament"...');
    const f8Videos = await db
      .select()
      .from(portfolioVideos)
      .where(like(portfolioVideos.title, '%F8%Lifted%Tournament%'));

    for (const video of f8Videos) {
      const newTitle = video.title
        .replace(/F8\s*Lifted\s*Tournament/gi, 'F48 Lifted Trucks Tournament')
        .replace(/F8\s*Lifted/gi, 'F48 Lifted Trucks');
      await db
        .update(portfolioVideos)
        .set({ title: newTitle, updatedAt: new Date() })
        .where(eq(portfolioVideos.id, video.id));
      console.log(`   ✓ Updated: "${video.title}" → "${newTitle}"`);
    }

    // 3. Remove duplicate "Bajio Sunglasses" video (keep "Bajio")
    console.log('\n3. Removing duplicate "Bajio Sunglasses" video...');
    const bajioVideos = await db
      .select()
      .from(portfolioVideos)
      .where(like(portfolioVideos.title, '%Bajio%'));

    // Find the "Bajio Sunglasses" duplicate
    const bajioSunglasses = bajioVideos.find(v => 
      v.title.toLowerCase().includes('sunglasses')
    );
    
    if (bajioSunglasses) {
      // Check if there's a "Bajio" without "Sunglasses"
      const bajioOnly = bajioVideos.find(v => 
        !v.title.toLowerCase().includes('sunglasses') && 
        v.id !== bajioSunglasses.id
      );

      if (bajioOnly) {
        // Delete the "Bajio Sunglasses" duplicate
        await db
          .delete(portfolioVideos)
          .where(eq(portfolioVideos.id, bajioSunglasses.id));
        console.log(`   ✓ Deleted duplicate: "${bajioSunglasses.title}" (ID: ${bajioSunglasses.id})`);
        console.log(`   ✓ Kept: "${bajioOnly.title}" (ID: ${bajioOnly.id})`);
      } else {
        // If no "Bajio" only exists, rename "Bajio Sunglasses" to "Bajio"
        await db
          .update(portfolioVideos)
          .set({ 
            title: 'Bajio',
            updatedAt: new Date() 
          })
          .where(eq(portfolioVideos.id, bajioSunglasses.id));
        console.log(`   ✓ Renamed: "${bajioSunglasses.title}" → "Bajio"`);
      }
    } else {
      console.log('   ℹ No "Bajio Sunglasses" video found');
    }

    console.log('\n✅ All fixes completed successfully!');
  } catch (error) {
    console.error('\n❌ Error fixing video titles:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixVideoTitles()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
