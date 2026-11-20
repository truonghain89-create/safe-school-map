const https = require('https');
const fs = require('fs');

const query = `[out:json][timeout:30];
area["name"="Thành phố Biên Hòa"]->.a;
(
  node["amenity"~"school|college|university|kindergarten"](area.a);
  way["amenity"~"school|college|university|kindergarten"](area.a);
);
out center tags;`;

const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

async function tryEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    console.log(`Trying endpoint: ${endpoint}...`);
    const postData = 'data=' + encodeURIComponent(query);
    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'SafeSchoolMap-Audit/1.0'
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(new Error('JSON parse failed: ' + e.message));
          }
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data.slice(0, 150)}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', (err) => reject(err));

    req.write(postData);
    req.end();
  });
}

async function run() {
  for (const ep of endpoints) {
    try {
      const result = await tryEndpoint(ep);
      console.log(`Success with ${ep}! Elements found:`, result.elements.length);
      fs.writeFileSync('./scripts/osm_bien_hoa_schools.json', JSON.stringify(result, null, 2));
      console.log('Saved to ./scripts/osm_bien_hoa_schools.json');
      return;
    } catch (err) {
      console.log(`Failed with ${ep}:`, err.message);
    }
  }
}

run();
