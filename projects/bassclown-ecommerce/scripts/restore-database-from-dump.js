/**
 * Restore PostgreSQL Database from Dump File
 * 
 * This script attempts to restore the database dump using Node.js
 * Since pg_restore isn't available, we'll try to extract and execute SQL
 * 
 * Usage:
 *   node scripts/restore-database-from-dump.js
 * 
 * Note: PostgreSQL custom format dumps require pg_restore.
 * This script provides an alternative for Windows environments.
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Load DATABASE_URL from .env.local
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
  console.error('❌ Error: DATABASE_URL environment variable is required');
  console.error('   Make sure DATABASE_URL is set in .env.local');
  process.exit(1);
}

const DUMP_FILE = path.join(__dirname, '../../bass-clown-database.2025.08.07.dump');

if (!fs.existsSync(DUMP_FILE)) {
  console.error(`❌ Error: Dump file not found: ${DUMP_FILE}`);
  process.exit(1);
}

console.log('📦 Database Restore Script');
console.log('==========================\n');
console.log(`Dump file: ${DUMP_FILE}`);
console.log(`Database: ${DATABASE_URL.split('@')[1]?.split('/')[1] || 'unknown'}\n`);

async function checkPgRestore() {
  try {
    const { stdout } = await execAsync('pg_restore --version');
    console.log(`✅ pg_restore found: ${stdout.trim()}`);
    return true;
  } catch (error) {
    console.log('❌ pg_restore not found');
    return false;
  }
}

async function restoreWithPgRestore() {
  console.log('\n🔄 Attempting restore with pg_restore...\n');
  
  // Extract connection details from DATABASE_URL
  const url = new URL(DATABASE_URL);
  const host = url.hostname;
  const port = url.port || '5432';
  const database = url.pathname.slice(1);
  const username = url.username;
  const password = url.password;

  // Build pg_restore command
  const cmd = `pg_restore -h ${host} -p ${port} -U ${username} -d ${database} --clean --if-exists --verbose "${DUMP_FILE}"`;
  
  // Set password via environment variable
  process.env.PGPASSWORD = password;

  try {
    console.log('Executing pg_restore...');
    const { stdout, stderr } = await execAsync(cmd, {
      env: { ...process.env, PGPASSWORD: password },
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('WARNING')) console.error(stderr);
    
    console.log('\n✅ Database restored successfully!');
    return true;
  } catch (error) {
    console.error('\n❌ Restore failed:', error.message);
    console.error('\n💡 Alternative: Use Neon Console to restore');
    console.error('   1. Go to: https://console.neon.tech');
    console.error('   2. Select your project');
    console.error('   3. Use "Import" feature or SQL Editor');
    console.error('   4. Or install PostgreSQL client tools');
    return false;
  }
}

async function main() {
  const hasPgRestore = await checkPgRestore();
  
  if (hasPgRestore) {
    await restoreWithPgRestore();
  } else {
    console.log('\n💡 To restore the database dump:');
    console.log('\n   Option 1: Install PostgreSQL client tools');
    console.log('   - Download from: https://www.postgresql.org/download/windows/');
    console.log('   - Or use: https://www.postgresql.org/ftp/pgadmin/pgadmin4/v8.0/windows/');
    console.log('   - Then run: npm run restore-database');
    console.log('\n   Option 2: Use Neon Console');
    console.log('   1. Go to: https://console.neon.tech');
    console.log('   2. Select your project > SQL Editor');
    console.log('   3. If Neon supports it, use the Import/Restore feature');
    console.log('   4. Or manually extract SQL and paste it');
    console.log('\n   Option 3: Extract dump to SQL (requires pg_restore)');
    console.log('   pg_restore --clean --if-exists -f extracted.sql "bass-clown-database.2025.08.07.dump"');
    console.log('   Then paste extracted.sql into Neon SQL Editor\n');
    
    console.log('⚠️  Note: The dump file is in PostgreSQL custom format');
    console.log('   This requires pg_restore tool to restore.\n');
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });

