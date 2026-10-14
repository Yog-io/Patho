import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Patho Platform: Backend API (Port 5001) + Frontend (Port 3000)...');

const server = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'skillsarthi-ai'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DISABLE_HMR: process.env.DISABLE_HMR ?? 'false' }
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit();
});

