const https = require('https');
const fs = require('fs');

const query = `[out:json][timeout:30];
(
  node["amenity"~"school|college|university|kindergarten"](around:15000,10.95,106.84);
  way["amenity"~"school|college|university|kindergarten"](around:15000,10.95,106.84);
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
  timeout: 30000
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log('Total OSM schools found in 15km:', json.elements.length);
        fs.writeFileSync('./scripts/osm_full_bien_hoa.json', JSON.stringify(json, null, 2), 'utf8');
        console.log('Saved to ./scripts/osm_full_bien_hoa.json');
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
