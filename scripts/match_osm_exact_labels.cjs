const fs = require('fs');
const path = require('path');

const osmData = JSON.parse(fs.readFileSync('./scripts/osm_center_schools.json', 'utf8'));
const content = fs.readFileSync('./src/lib/constants/schools-bien-hoa.ts', 'utf8');

const osmSchools = osmData.elements.map(e => ({
  id: e.id,
  type: e.type,
  name: e.tags && e.tags.name,
  lat: e.lat || (e.center && e.center.lat),
  lon: e.lon || (e.center && e.center.lon)
})).filter(s => s.name);

console.log('Total named OSM schools:', osmSchools.length);

const blocks = content.split(/\{\s*id:\s*'/).slice(1);
const ourSchools = [];

blocks.forEach(block => {
  const id = (block.match(/^([^']+)'/) || [])[1];
  const name = (block.match(/name:\s*'([^']+)'/) || [])[1];
  const campus_name = (block.match(/campus_name:\s*'([^']+)'/) || [])[1] || null;
  const ward = (block.match(/ward:\s*'([^']+)'/) || [])[1];
  const lat = parseFloat((block.match(/lat:\s*([0-9.]+)/) || [])[1]);
  const lng = parseFloat((block.match(/lng:\s*([0-9.]+)/) || [])[1]);

  ourSchools.push({ id, name, campus_name, ward, lat, lng });
});

// Normalize string for fuzzy matching
function norm(str) {
  return str.toLowerCase()
    .replace(/^trường\s+/i, '')
    .replace(/^(đại học|cao đẳng|trung cấp|thpt|thcs|tiểu học|trung học phổ thông|trung học cơ sở)\s+/i, '')
    .replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

console.log('\n--- MATCHING RESULTS ---');
const matched = [];
const unmatched = [];

ourSchools.forEach(ours => {
  const ourNorm = norm(ours.name);
  // Find in OSM
  const found = osmSchools.find(osm => {
    const osmNorm = norm(osm.name);
    return osmNorm === ourNorm || osmNorm.includes(ourNorm) || ourNorm.includes(osmNorm);
  });

  if (found) {
    const distMeters = Math.hypot((ours.lat - found.lat) * 111320, (ours.lng - found.lon) * 111320 * Math.cos(ours.lat * Math.PI / 180));
    matched.push({
      id: ours.id,
      name: ours.name,
      ourLat: ours.lat,
      ourLng: ours.lng,
      osmName: found.name,
      osmLat: found.lat,
      osmLng: found.lon,
      distMeters: Math.round(distMeters)
    });
  } else {
    unmatched.push(ours);
  }
});

console.log(`Matched: ${matched.length} / ${ourSchools.length}`);
console.log(`Unmatched in 8km sample: ${unmatched.length}`);

// Print distance discrepancies
matched.sort((a, b) => b.distMeters - a.distMeters);
console.log('\nTop Discrepancies between our marker and OSM tile label:');
matched.slice(0, 25).forEach(m => {
  console.log(`[${m.distMeters}m off] ${m.name} (OSM label: "${m.osmName}")`);
  console.log(`   Our marker: [${m.ourLat}, ${m.ourLng}] -> OSM label: [${m.osmLat.toFixed(5)}, ${m.osmLng.toFixed(5)}]`);
});
