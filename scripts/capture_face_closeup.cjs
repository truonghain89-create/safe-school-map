const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\Users\\Public\\chrome_audit_profile_face';
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
      '--remote-debugging-port=9226',
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
      await fetchJson('http://127.0.0.1:9226/json/version');
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
    const targets = await fetchJson('http://127.0.0.1:9226/json/list');
    const target = targets[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener('open', resolve));

    await sendCdpCommand(ws, 'Page.enable');
    await sendCdpCommand(ws, 'DOM.enable');
    await sendCdpCommand(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Navigating to http://localhost:3000...');
    await sendCdpCommand(ws, 'Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 3500));

    // Evaluate rider position on screen
    const evalRes = await sendCdpCommand(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector('.anim-rider svg');
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        })()
      `,
      returnByValue: true,
    });

    const rect = evalRes?.result?.value;
    console.log('Rider rect:', rect);

    if (rect) {
      // Capture crisp clip of rider
      const clipRes = await sendCdpCommand(ws, 'Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: Math.max(0, rect.x - 20),
          y: Math.max(0, rect.y - 20),
          width: rect.width + 40,
          height: rect.height + 40,
          scale: 2,
        },
      });
      const riderCropPath = path.join(EVIDENCE_DIR, 'shot_rider_closeup.png');
      fs.writeFileSync(riderCropPath, Buffer.from(clipRes.data, 'base64'));
      console.log('Saved closeup screenshot to:', riderCropPath);

      // Capture close crop of head & face
      const faceClipRes = await sendCdpCommand(ws, 'Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: rect.x + rect.width * 0.28,
          y: rect.y,
          width: rect.width * 0.35,
          height: rect.height * 0.45,
          scale: 3,
        },
      });
      const faceCropPath = path.join(EVIDENCE_DIR, 'shot_face_closeup.png');
      fs.writeFileSync(faceCropPath, Buffer.from(faceClipRes.data, 'base64'));
      console.log('Saved face closeup screenshot to:', faceCropPath);
    }

    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

capture().catch(console.error);
