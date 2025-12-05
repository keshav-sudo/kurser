// Simple copy for now - TypeScript will compile at runtime with ts-node-dev
const fs = require('fs');
const path = require('path');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('✅ Build directory created');
console.log('ℹ️  Worker will run with ts-node in development and ts-node in production');
