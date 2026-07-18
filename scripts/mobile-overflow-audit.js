const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..', 'public');
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const widths = [320, 360, 375, 390, 414, 430];
const pages = [
  'index.html',
  'shop.html',
  'collections.html',
  'product.html',
  'checkout.html',
  'dashboard.html',
  'affiliate.html',
  'affiliate-dashboard.html',
  'track-order.html',
  'journal.html',
  'terms-conditions.html'
];

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html';
  if (file.endsWith('.css')) return 'text/css';
  if (file.endsWith('.js')) return 'text/javascript';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    }).on('error', reject);
  });
}

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.id = 0;
    this.pending = new Map();
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        message.error ? reject(message.error) : resolve(message.result);
      }
    };
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

async function waitForDebugger(port) {
  for (let i = 0; i < 80; i += 1) {
    try {
      const pages = await requestJson(`http://127.0.0.1:${port}/json/list`);
      const page = pages.find(item => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Edge remote debugger did not start.');
}

async function main() {
  const server = http.createServer((req, res) => {
    const clean = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
    const file = path.join(root, clean);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType(file) });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const sitePort = server.address().port;
  const debugPort = 9223;
  const userDataDir = path.join('C:\\tmp', `zavora-edge-${Date.now()}`);
  const browser = spawn(edge, [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions',
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${debugPort}`,
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    const version = await waitForDebugger(debugPort);
    const socket = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    });
    const cdp = new Cdp(socket);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    const failures = [];
    for (const page of pages) {
      for (const width of widths) {
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width,
          height: 900,
          deviceScaleFactor: 2,
          mobile: true
        });
        await cdp.send('Page.navigate', { url: `http://127.0.0.1:${sitePort}/${page}` });
        await new Promise(resolve => setTimeout(resolve, 700));
        const result = await cdp.send('Runtime.evaluate', {
          returnByValue: true,
          expression: `(() => {
            const doc = document.documentElement;
            const offenders = Array.from(document.querySelectorAll('*')).map(el => {
              const rect = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              return {
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                cls: String(el.className || '').slice(0, 80),
                left: Math.round(rect.left * 100) / 100,
                right: Math.round(rect.right * 100) / 100,
                width: Math.round(rect.width * 100) / 100,
                position: style.position,
                overflowX: style.overflowX
              };
            }).filter(item => {
              const fullyOffscreen = item.right <= 0 || item.left >= innerWidth;
              return !fullyOffscreen && (item.right > innerWidth + 1 || item.left < -1);
            }).slice(0, 8);
            return {
              innerWidth,
              scrollWidth: doc.scrollWidth,
              bodyScrollWidth: document.body ? document.body.scrollWidth : 0,
              offenders
            };
          })()`
        });
        const value = result.result.value;
        if (value.scrollWidth > width + 1 || value.offenders.length) {
          failures.push({ page, width, ...value });
        }
      }
    }

    if (failures.length) {
      console.log(`FAIL: ${failures.length} viewport checks still have overflow.`);
      for (const failure of failures.slice(0, 25)) {
        console.log(`${failure.page} @ ${failure.width}px: doc=${failure.scrollWidth}, body=${failure.bodyScrollWidth}, viewport=${failure.innerWidth}`);
        for (const item of failure.offenders.slice(0, 3)) {
          console.log(`  ${item.tag}${item.id ? `#${item.id}` : ''}${item.cls ? `.${item.cls.replace(/\s+/g, '.')}` : ''} left=${item.left} right=${item.right} width=${item.width} pos=${item.position}`);
        }
      }
      process.exitCode = 1;
    } else {
      console.log(`PASS: no horizontal overflow at ${widths.join(', ')}px across ${pages.length} pages.`);
    }
    socket.close();
  } finally {
    browser.kill();
    server.close();
    setTimeout(() => {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
    }, 250);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
