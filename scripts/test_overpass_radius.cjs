const https = require('https');
const fs = require('fs');

const query = `[out:json][timeout:20];
(
  node["amenity"~"school|college|university"](around:8000,10.95,106.84);
  way["amenity"~"school|college|university"](around:8000,10.95,106.84);
);
out center tags;`;

const postData = 'data=' + encodeURIComponent(query);
const req = https.request({
  hostname: 'overpass-api.de',
  port: 443,
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'SafeSchoolMap-Audit/1.0'
  },
  timeout: 20000
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log('Total OSM schools found in 8km around center:', json.elements.length);
        fs.writeFileSync('./scripts/osm_center_schools.json', JSON.stringify(json, null, 2), 'utf8');
        const named = json.elements.filter(e => e.tags && e.tags.name).map(e => ({
          name: e.tags.name,
          lat: e.lat || (e.center && e.center.lat),
          lon: e.lon || (e.center && e.center.lon)
        }));
        console.log('Named schools count:', named.length);
        console.log('Sample named schools:', named.slice(0, 15));
      } catch(e) {
        console.log('JSON parse error:', e.message);
      }
    } else {
      console.log('Response body preview:', data.slice(0, 150));
    }
  });
});

req.on('error', err => console.log('Req error:', err.message));
req.write(postData);
req.end();
