const https = require('https');

const sample = [
  'Trường THPT Lê Hồng Phong Biên Hòa',
  'Trường THPT Nam Hà Biên Hòa',
  'Trường THPT Chu Văn An Biên Hòa',
  'Trường THPT Nguyễn Hữu Cảnh Biên Hòa',
  'Trường THCS Tam Hiệp Biên Hòa'
];

function queryNominatim(query) {
  return new Promise((resolve) => {
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) + '&format=json&addressdetails=1&limit=2';
    const req = https.get(url, { headers: { 'User-Agent': 'SafeSchoolMap-Audit/1.0 (audit@safeschoolmap.edu.vn)' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
  });
}

async function run() {
  for (const s of sample) {
    const res = await queryNominatim(s);
    if (res.length > 0) {
      console.log(`[FOUND] ${s} -> lat: ${res[0].lat}, lon: ${res[0].lon} | ${res[0].display_name}`);
    } else {
      console.log(`[NOT FOUND] ${s}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

run();
