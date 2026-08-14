import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const URI_FILE = path.resolve(__dirname, '.mongo-uri');
const backendRoot = path.resolve(__dirname, '../..');

if (fs.existsSync(URI_FILE)) {
  process.env.DATABASE_URL = fs.readFileSync(URI_FILE, 'utf8').trim();
}

if (process.env.DATABASE_URL?.includes('school_bus_test')) {
  execSync('npx prisma db push --skip-generate', {
    cwd: backendRoot,
    env: process.env,
    stdio: 'pipe',
  });
}
