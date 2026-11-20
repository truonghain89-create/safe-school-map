const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2 && !line.startsWith('#')) {
    process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

// Import the action directly
async function testActionOutputs() {
  const { getPublicStatisticsAction } = require('../src/app/actions/public-statistics.ts');
}
