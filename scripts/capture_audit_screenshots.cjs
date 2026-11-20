const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\Users\\Public\\chrome_audit_profile';
const EVIDENCE_DIR = path.resolve('prompt10_audit_evidence');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function sendCdpCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function runBrowserAudit() {
  console.log('--- KHỞI CHẠY CHROME CDP HEADLESS VÀ TRỰC TIẾP CHỤP BẰNG CHỨNG ---');
  
  // Launch Chrome
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      `--user-data-dir=${USER_DATA_DIR}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  // Wait for CDP port
  let cdpReady = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      await fetchJson('http://127.0.0.1:9222/json/version');
      cdpReady = true;
      break;
    } catch {}
  }

  if (!cdpReady) {
    console.error('Không thể kết nối Chrome CDP sau 6s');
    chromeProcess.kill();
    return;
  }

  console.log('Chrome CDP kết nối thành công!');
  const targets = await fetchJson('http://127.0.0.1:9222/json/list');
  const target = targets[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolve) => ws.addEventListener('open', resolve));

  // Enable Page, Runtime, DOM
  await sendCdpCommand(ws, 'Page.enable');
  await sendCdpCommand(ws, 'Runtime.enable');

  const pagesToTest = [
    {
      name: '01_homepage_desktop.png',
      url: 'http://localhost:3000/',
      width: 1920,
      height: 1080,
      waitMs: 2500,
      desc: 'Trang chủ Desktop 1920px (Hero hoạt cảnh xe máy điện, 3 thẻ cam kết)'
    },
    {
      name: '02_map_desktop.png',
      url: 'http://localhost:3000/ban-do',
      width: 1920,
      height: 1080,
      waitMs: 3500,
      desc: 'Bản đồ GIS trường học & điểm nóng an toàn Desktop'
    },
    {
      name: '03_submit_form.png',
      url: 'http://localhost:3000/gui-phan-anh',
      width: 1920,
      height: 1080,
      waitMs: 2000,
      desc: 'Biểu mẫu gửi phản ánh an toàn giao thông'
    },
    {
      name: '04_lookup_page.png',
      url: 'http://localhost:3000/tra-cuu',
      width: 1920,
      height: 1080,
      waitMs: 2000,
      desc: 'Tra cứu tiến độ xử lý phản ánh theo mã'
    },
    {
      name: '05_statistics_dashboard.png',
      url: 'http://localhost:3000/thong-ke',
      width: 1920,
      height: 1080,
      waitMs: 2500,
      desc: 'Dashboard thống kê công khai & biểu đồ phân tích'
    },
    {
      name: '06_about_page.png',
      url: 'http://localhost:3000/gioi-thieu',
      width: 1920,
      height: 1080,
      waitMs: 2000,
      desc: 'Giới thiệu dự án Safe School Map'
    },
    {
      name: '07_login_page.png',
      url: 'http://localhost:3000/dang-nhap',
      width: 1920,
      height: 1080,
      waitMs: 2000,
      desc: 'Trang đăng nhập quản trị (Staff / Verifier / Approver)'
    },
    {
      name: '08_mobile_home.png',
      url: 'http://localhost:3000/',
      width: 390,
      height: 844,
      mobile: true,
      waitMs: 2500,
      desc: 'Trang chủ Mobile (iPhone 14 / 390px, thanh menu & Hero responsive)'
    },
    {
      name: '09_mobile_map.png',
      url: 'http://localhost:3000/ban-do',
      width: 390,
      height: 844,
      mobile: true,
      waitMs: 3500,
      desc: 'Bản đồ GIS Mobile (390px, thanh công cụ & toggle lớp bản đồ)'
    },
    {
      name: '10_mobile_stats.png',
      url: 'http://localhost:3000/thong-ke',
      width: 390,
      height: 844,
      mobile: true,
      waitMs: 2500,
      desc: 'Dashboard thống kê Mobile (390px, thẻ chỉ số xếp dọc)'
    },
  ];

  const browserAuditResults = [];

  for (const page of pagesToTest) {
    console.log(`Đang kiểm thử: ${page.desc} [${page.url}]...`);
    
    // Set viewport
    await sendCdpCommand(ws, 'Emulation.setDeviceMetricsOverride', {
      width: page.width,
      height: page.height,
      deviceScaleFactor: 1,
      mobile: !!page.mobile,
    });

    // Navigate
    await sendCdpCommand(ws, 'Page.navigate', { url: page.url });
    await new Promise((r) => setTimeout(r, page.waitMs));

    // Evaluate console errors or runtime health
    const evalRes = await sendCdpCommand(ws, 'Runtime.evaluate', {
      expression: `({
        title: document.title,
        heading: document.querySelector('h1')?.innerText || '',
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        buttonsCount: document.querySelectorAll('button').length,
        linksCount: document.querySelectorAll('a').length,
      })`,
      returnByValue: true,
    });

    const pageInfo = evalRes.result?.value || {};

    // Capture Screenshot
    const shot = await sendCdpCommand(ws, 'Page.captureScreenshot', {
      format: 'png',
    });

    const outPath = path.join(EVIDENCE_DIR, page.name);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    const sizeKb = Math.round(shot.data.length * 0.75 / 1024);

    console.log(` -> Đã lưu: ${page.name} (${sizeKb} KB) | Overflow ngang: ${pageInfo.hasHorizontalOverflow ? 'CÓ (FAIL)' : 'KHÔNG (PASS)'} | Tiêu đề: "${pageInfo.title}"`);

    browserAuditResults.push({
      file: page.name,
      url: page.url,
      viewport: `${page.width}x${page.height}`,
      description: page.desc,
      sizeKb,
      title: pageInfo.title,
      hasOverflow: pageInfo.hasHorizontalOverflow,
      buttons: pageInfo.buttonsCount,
      links: pageInfo.linksCount,
      verdict: pageInfo.hasHorizontalOverflow ? 'WARN' : 'PASS',
    });
  }

  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'browser_audit_results.json'),
    JSON.stringify(browserAuditResults, null, 2)
  );

  console.log('\n--- HOÀN THÀNH TOÀN BỘ CHỤP ẢNH BẰNG CHỨNG LIVE BROWSER ---');
  ws.close();
  chromeProcess.kill();
}

runBrowserAudit().catch((err) => {
  console.error('Lỗi kiểm thử browser:', err);
  process.exit(1);
});
