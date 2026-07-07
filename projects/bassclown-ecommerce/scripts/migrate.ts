#!/usr/bin/env tsx

import { migrationCLI } from '../lib/database-migrations';

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'status':
        await migrationCLI.status();
        break;
      
      case 'migrate':
      case 'up':
        await migrationCLI.migrate();
        break;
      
      case 'rollback':
      case 'down':
        const version = args[0];
        if (!version) {
          console.error('Error: Version required for rollback');
          console.log('Usage: npm run migrate rollback <version>');
          process.exit(1);
        }
        await migrationCLI.rollback(version);
        break;
      
      case 'generate':
      case 'create':
        const name = args[0];
        const description = args[1];
        if (!name) {
          console.error('Error: Migration name required');
          console.log('Usage: npm run migrate generate <name> [description]');
          process.exit(1);
        }
        await migrationCLI.generate(name, description);
        break;
      
      case 'verify':
      case 'check':
        await migrationCLI.verify();
        break;
      
      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;
      
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Bass Clown Co. Database Migration Tool

Usage:
  npm run migrate <command> [options]

Commands:
  status                    Show migration status
  migrate, up              Run all pending migrations
  rollback, down <version> Rollback a specific migration
  generate, create <name>  Generate a new migration file
  verify, check            Verify migration integrity
  help                     Show this help message

Examples:
  npm run migrate status
  npm run migrate migrate
  npm run migrate generate "add user preferences table"
  npm run migrate rollback 20240101T120000_add_user_preferences_table
  npm run migrate verify

For more information, see the documentation.
`);
}

// Run the CLI
main().catch(console.error); 