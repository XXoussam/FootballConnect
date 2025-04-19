import { spawn } from 'child_process';
import supabase from './supabase';

async function main() {
  try {
    console.log('Running Supabase seeder...');
    
    // Run the Supabase seeder script as a child process
    const seederProcess = spawn('npx', ['tsx', 'server/seed-supabase.ts'], { 
      stdio: 'inherit',
      shell: true
    });
    
    seederProcess.on('close', async (code) => {
      if (code === 0) {
        // Verify Supabase connection
        const { data, error } = await supabase.from('users').select('id').limit(1);
        if (!error) {
          console.log('Supabase connection verified');
        } else {
          console.error('Supabase connection error:', error);
        }
      } else {
        console.error(`Seeder process exited with code ${code}`);
      }
      process.exit(code || 0);
    });
  } catch (error) {
    console.error('Error running seeder:', error);
    process.exit(1);
  }
}

main();