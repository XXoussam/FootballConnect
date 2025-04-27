import { spawn } from 'child_process';
import supabase from './supabase';
import { seedContentDatabase } from './seed-data';
import * as fs from 'fs';
import * as path from 'path';

// Import the main function from add-auth-users

async function main() {
  try {
    console.log('Running database seeder...');
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const seedType = args[0] || 'content'; // Default to content if no argument provided
    
    if (seedType === 'content') {
      // Skip the user seeding step since users already exist
      console.log('Step 1: Skipping user seeding as users already exist in the database...');
      
      // Only call the content seeding function
      console.log('Step 2: Seeding content (posts, comments, likes, opportunities, events, connections)...');
      await seedContentDatabase();
    }else {
      console.log('Invalid seed type. Use "users", "content", "add-users", or "all"');
      process.exit(1);
    }
    
    // Verify Supabase connection
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (!error) {
      console.log('Seeding completed and Supabase connection verified');
    } else {
      console.error('Supabase connection error:', error);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error running seeder:', error);
    process.exit(1);
  }
}

main();