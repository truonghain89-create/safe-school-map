const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000' + path, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function run() {
  const bando = await get('/ban-do');
  console.log('/ban-do Status:', bando.status, 'Body length:', bando.data.length);
  console.log('Has "Trường học":', bando.data.includes('Trường học'));
  console.log('Has "Hotspot":', bando.data.includes('Hotspot'));
  console.log('Has "Biên Hòa":', bando.data.includes('Biên Hòa'));

  const home = await get('/');
  console.log('/ Status:', home.status, 'Body length:', home.data.length);
  console.log('Has "Gửi phản ánh ngay":', home.data.includes('Gửi phản ánh ngay'));
  console.log('Has "Xem bản đồ tương tác":', home.data.includes('Xem bản đồ tương tác'));
}

run().catch(console.error);
