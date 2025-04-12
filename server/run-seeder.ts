import { seedDatabase } from './seed-data';
import { db } from './db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    await seedDatabase();
    // Close the database connection
    await db.execute(sql`SELECT 1`).then(() => console.log('Database connection verified'));
    process.exit(0);
  } catch (error) {
    console.error('Error running seeder:', error);
    process.exit(1);
  }
}

main();