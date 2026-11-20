const https = require('https');

function searchOSM(query) {
  return new Promise((resolve) => {
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) + '&format=json&limit=3';
    const req = https.get(url, { headers: { 'User-Agent': 'SafeSchoolMap-Audit/1.0 (test@safeschoolmap.edu.vn)' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
  });
}

async function test() {
  const tests = [
    'THPT Tam Hiệp Biên Hòa',
    'THPT Trấn Biên Biên Hòa',
    'THPT Chuyên Lương Thế Vinh Biên Hòa',
    'THPT Ngô Quyền Biên Hòa',
    'Đại học Lạc Hồng Biên Hòa',
    'Đại học Đồng Nai Lê Quý Đôn',
    'THCS Tam Hiệp Biên Hòa',
    'Tiểu học Tam Hiệp Biên Hòa',
    'Tiểu học Nguyễn Du Biên Hòa',
    'THCS Hùng Vương Biên Hòa',
    'THCS Trần Hưng Đạo Biên Hòa',
    'THCS Bình Đa Biên Hòa'
  ];

  for (const t of tests) {
    const res = await searchOSM(t);
    if (res.length > 0) {
      console.log(`[FOUND] "${t}" -> lat: ${res[0].lat}, lon: ${res[0].lon}`);
      console.log(`   Label: ${res[0].display_name}`);
    } else {
      console.log(`[NOT FOUND] "${t}"`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

test();
