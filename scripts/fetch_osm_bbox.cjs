const https = require('https');
const fs = require('fs');

const query = `[out:json][timeout:25];
(
  node["amenity"~"school|college|university"](10.84,106.76,11.02,106.96);
  way["amenity"~"school|college|university"](10.84,106.76,11.02,106.96);
);
out center tags;`;

const endpoints = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter'
];

function tryEndpoint(ep) {
  return new Promise((resolve, reject) => {
    console.log('Trying', ep);
    const postData = 'data=' + encodeURIComponent(query);
    const url = new URL(ep);
    
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
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
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch(e) {
            reject(new Error('Parse error'));
          }
        } else {
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  for (const ep of endpoints) {
    try {
      const data = await tryEndpoint(ep);
      console.log('Success with', ep, 'Total elements:', data.elements.length);
      fs.writeFileSync('./scripts/osm_bien_hoa_bbox.json', JSON.stringify(data, null, 2), 'utf8');
      console.log('Saved to ./scripts/osm_bien_hoa_bbox.json');
      return;
    } catch(err) {
      console.log('Failed', ep, err.message);
    }
  }
}

run();
