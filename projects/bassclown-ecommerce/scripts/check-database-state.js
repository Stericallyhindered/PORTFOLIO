/**
 * Check Current Database State
 * Checks what tables and data exist in the database
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

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found');
  process.exit(1);
}

async function checkDatabase() {
  const sql = neon(DATABASE_URL);
  
  console.log('🔍 Checking database state...\n');
  
  try {
    // Check if users table exists and count
    const usersCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`👥 Users table: ${usersCount[0].count} records`);
    
    // Check contests
    try {
      const contestsCount = await sql`SELECT COUNT(*) as count FROM contests`;
      console.log(`🏆 Contests table: ${contestsCount[0].count} records`);
    } catch (e) {
      console.log(`🏆 Contests table: Does not exist or error`);
    }
    
    // Check portfolio_videos
    try {
      const videosCount = await sql`SELECT COUNT(*) as count FROM portfolio_videos`;
      console.log(`🎬 Portfolio videos table: ${videosCount[0].count} records`);
    } catch (e) {
      console.log(`🎬 Portfolio videos table: Does not exist or error`);
    }
    
    // Check giveaways
    try {
      const giveawaysCount = await sql`SELECT COUNT(*) as count FROM giveaways`;
      console.log(`🎁 Giveaways table: ${giveawaysCount[0].count} records`);
    } catch (e) {
      console.log(`🎁 Giveaways table: Does not exist or error`);
    }
    
    // Check all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`\n📋 All tables (${tables.length} total):`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

checkDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

