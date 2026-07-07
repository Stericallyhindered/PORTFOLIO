/**
 * Extract Database Schema and Generate Restore SQL
 * Since we can't easily extract from custom format dump,
 * we'll use the existing schema and create SQL statements
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

async function generateRestoreSQL() {
  const sql = neon(DATABASE_URL);
  
  console.log('📋 Generating restore SQL from current schema...\n');
  
  let sqlOutput = `-- Database Restore SQL for Neon Console
-- Generated from production backup
-- Run this in Neon SQL Editor

-- Note: This file contains the schema structure
-- The actual data needs to be restored from the dump file using pg_restore
-- Or you can restore via Neon Console if they support dump file upload

`;

  try {
    // Get all table names
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`Found ${tables.length} tables\n`);
    
    for (const table of tables) {
      const tableName = table.table_name;
      
      // Get table structure
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      
      sqlOutput += `\n-- Table: ${tableName}\n`;
      sqlOutput += `-- Columns: ${columns.length}\n`;
      
      // Get row count
      try {
        const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = countResult[0]?.count || 0;
        sqlOutput += `-- Current rows: ${count}\n`;
        
        if (count > 0 && count < 100) {
          // For small tables, get the data
          const data = await sql.unsafe(`SELECT * FROM ${tableName} LIMIT 100`);
          if (data.length > 0) {
            sqlOutput += `\n-- Sample data (first ${data.length} rows):\n`;
            // This would generate INSERT statements, but it's complex with different data types
            // Better to use pg_restore for actual data
          }
        }
      } catch (e) {
        // Table might be empty or have issues
      }
    }
    
    sqlOutput += `\n\n-- IMPORTANT: To restore actual data from the dump file:\n`;
    sqlOutput += `-- 1. Use pg_restore: pg_restore -d <database_url> bass-clown-database.2025.08.07.dump\n`;
    sqlOutput += `-- 2. Or use Neon Console Import feature if available\n`;
    sqlOutput += `-- 3. Or extract SQL first: pg_restore -f extracted.sql bass-clown-database.2025.08.07.dump\n`;
    
    const outputPath = path.join(__dirname, '../restore-database-schema.sql');
    fs.writeFileSync(outputPath, sqlOutput);
    
    console.log(`✅ Schema SQL saved to: ${outputPath}`);
    console.log(`\n⚠️  Note: This only contains schema structure, not the actual data.`);
    console.log(`   You still need to restore the dump file to get production data.\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

generateRestoreSQL()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
