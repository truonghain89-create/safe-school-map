const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\Users\\Public\\chrome_audit_profile_hero';
const EVIDENCE_DIR = path.resolve('prompt10_audit_evidence');

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

async function capture() {
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=9225',
      `--user-data-dir=${USER_DATA_DIR}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let cdpReady = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      await fetchJson('http://127.0.0.1:9225/json/version');
      cdpReady = true;
      break;
    } catch {}
  }

  if (!cdpReady) {
    console.error('Không thể kết nối Chrome CDP');
    chromeProcess.kill();
    return;
  }

  try {
    const targets = await fetchJson('http://127.0.0.1:9225/json/list');
    const target = targets[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener('open', resolve));

    await sendCdpCommand(ws, 'Page.enable');
    await sendCdpCommand(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Navigating to http://localhost:3000...');
    await sendCdpCommand(ws, 'Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 3500));

    // Full page hero screenshot
    const fullRes = await sendCdpCommand(ws, 'Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(EVIDENCE_DIR, 'shot_hero_after_fix.png');
    fs.writeFileSync(fullPath, Buffer.from(fullRes.data, 'base64'));
    console.log('Saved hero screenshot to:', fullPath);

    // Zoomed-in on the rider character
    await sendCdpCommand(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1200,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 1000));
    const zoomRes = await sendCdpCommand(ws, 'Page.captureScreenshot', { format: 'png' });
    const zoomPath = path.join(EVIDENCE_DIR, 'shot_hero_rider_zoomed.png');
    fs.writeFileSync(zoomPath, Buffer.from(zoomRes.data, 'base64'));
    console.log('Saved zoomed screenshot to:', zoomPath);

    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

capture().catch(console.error);
