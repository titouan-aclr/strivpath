import { execSync } from 'child_process';
import { PrismaClient } from './prisma-client';

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@127.0.0.1:5432/strivpath_test_e2e';

async function globalSetup() {
  console.log('🔧 Setting up E2E test environment...');

  process.env.DATABASE_URL = E2E_DATABASE_URL;

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: E2E_DATABASE_URL,
      },
    },
  });

  try {
    await prisma.$connect();
    console.log('✅ Connected to E2E database');

    console.log('🔄 Applying database migrations...');
    execSync('pnpm --filter api prisma migrate deploy', {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: E2E_DATABASE_URL,
      },
    });
    console.log('✅ Migrations applied successfully');

    await prisma.$disconnect();
    console.log('✅ E2E test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error);
    await prisma.$disconnect();
    throw error;
  }
}

export default globalSetup;
