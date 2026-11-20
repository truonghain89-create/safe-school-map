const https = require('https');
const fs = require('fs');
const path = require('path');

const schoolsFile = path.join(__dirname, '../src/lib/constants/schools-bien-hoa.ts');
const content = fs.readFileSync(schoolsFile, 'utf8');

const blocks = content.split(/\{\s*id:\s*'/).slice(1);
const schools = [];

blocks.forEach(block => {
  const id = (block.match(/^([^']+)'/) || [])[1];
  const name = (block.match(/name:\s*'([^']+)'/) || [])[1];
  const ward = (block.match(/ward:\s*'([^']+)'/) || [])[1];
  const lat = parseFloat((block.match(/lat:\s*([0-9.]+)/) || [])[1]);
  const lng = parseFloat((block.match(/lng:\s*([0-9.]+)/) || [])[1]);
  schools.push({ id, name, ward, lat, lng });
});

console.log('Total schools to check:', schools.length);

function searchOSM(query) {
  return new Promise((resolve) => {
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) + '&format=json&limit=3';
    const req = https.get(url, { headers: { 'User-Agent': 'SafeSchoolMap-Audit/1.0 (contact@safeschoolmap.edu.vn)' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch(e) {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
  });
}

// Sample test first 10 schools
async function testBatch() {
  const sample = schools.slice(0, 10);
  for (const s of sample) {
    // Try query with school name and Bien Hoa
    const res = await searchOSM(`${s.name} Biên Hòa`);
    if (res.length > 0) {
      console.log(`[OSM MATCH] ${s.name} -> lat: ${res[0].lat}, lon: ${res[0].lon} (current: ${s.lat}, ${s.lng})`);
      console.log(`   OSM name: ${res[0].display_name}`);
    } else {
      console.log(`[NO OSM MATCH] ${s.name}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

testBatch();
