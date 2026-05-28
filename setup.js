const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = __dirname;
const frontend = path.join(root, 'frontend-main');
const backend = path.join(root, 'backend-main');

function run(cmd, cwd) {
  console.log(`\n📦 Running: ${cmd} in ${cwd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function spawnInWindow(cmd, cwd, label) {
  console.log(`\n🚀 Starting ${label} in a new terminal...`);
  const proc = spawn(
    'cmd.exe',
    ['/c', `start cmd.exe /k "cd /d "${cwd}" && ${cmd}"`],
    {
      cwd,
      shell: false,
      detached: true,
    },
  );
  proc.unref();
  proc.on('error', (err) => console.error(`❌ ${label} error:`, err.message));
  return proc;
}

// Step 1: npm i in root (installs archiver for zip script)
console.log('\n=== Step 1: Installing root dependencies ===');
run('npm install', root);

// Step 2: npm i in backend
console.log('\n=== Step 2: Installing backend dependencies ===');
if (fs.existsSync(backend)) {
  run('npm install', backend);
} else {
  console.warn('⚠️  backend-main folder not found, skipping.');
}

// Step 3: npm i in frontend
console.log('\n=== Step 3: Installing frontend dependencies ===');
if (fs.existsSync(frontend)) {
  run('npm install', frontend);
} else {
  console.warn('⚠️  frontend-main folder not found, skipping.');
}

// Step 4: Start both servers in separate terminal windows
console.log('\n=== Step 4: Starting servers ===');
spawnInWindow('npm run dev', backend, 'Backend (npm run dev)');
spawnInWindow('npx ng serve', frontend, 'Frontend (ng serve)');

console.log('\n✅ Both servers are starting in separate terminal windows.\n');
