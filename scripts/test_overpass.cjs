const https = require('https');

const query = `[out:json][timeout:30];
(
  node["amenity"~"school|college|university"](10.83,106.77,11.02,106.98);
  way["amenity"~"school|college|university"](10.83,106.77,11.02,106.98);
);
out center;`;

const url = 'https://overpass.kumi.systems/api/interpreter?data=' + encodeURIComponent(query);

console.log('Querying Overpass API for schools in Biên Hòa bounding box...');
https.get(url, { headers: { 'User-Agent': 'SafeSchoolMap-Audit/1.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Overpass success! Elements count in Bien Hoa bbox:', json.elements?.length);
      const fs = require('fs');
      fs.writeFileSync('scripts/osm_schools_bien_hoa.json', JSON.stringify(json.elements, null, 2), 'utf8');
      console.log('Saved to scripts/osm_schools_bien_hoa.json');
    } catch (e) {
      console.error('Parse error. Response:', data.slice(0, 400));
    }
  });
}).on('error', (e) => {
  console.error('Request error:', e.message);
});
