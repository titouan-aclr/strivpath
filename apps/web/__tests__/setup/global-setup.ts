import { execSync } from 'child_process';

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@127.0.0.1:5432/strivpath_test_e2e';

async function globalSetup() {
  console.log('🔧 Setting up E2E test environment...');

  process.env.DATABASE_URL = E2E_DATABASE_URL;

  try {
    console.log('🔄 Applying database migrations...');
    execSync('pnpm --filter api db:migrate:deploy', {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: E2E_DATABASE_URL,
      },
    });
    console.log('✅ E2E test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error);
    throw error;
  }
}

export default globalSetup;
