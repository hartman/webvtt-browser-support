'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { Builder, By } = require('selenium-webdriver');
const { PNG } = require('pngjs');

const RESULTS_DIR = path.resolve(__dirname, '..', '..', 'results');
const FIXTURES_DIR = path.resolve(__dirname, '..', '..', 'fixtures');

const MIME_TYPES = {
  '.html': 'text/html',
  '.vtt': 'text/vtt',
  '.mp4': 'video/mp4',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.css': 'text/css',
};

/**
 * Serves fixtures/ over plain HTTP so <track>/<video> loads work the same
 * way across browsers (file:// triggers inconsistent CORS behavior).
 * Returns { url(name), close() }.
 */
function serveFixtures(port = 8642) {
  const server = http.createServer((req, res) => {
    const [rawPath, queryString] = req.url.split('?');
    const reqPath = decodeURIComponent(rawPath);
    const forceAutoplay = new URLSearchParams(queryString || '').get('forceAutoplay') === '1';
    const filePath = path.join(FIXTURES_DIR, reqPath);
    if (!filePath.startsWith(FIXTURES_DIR)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.stat(filePath, (statErr, stat) => {
      if (statErr) {
        res.writeHead(404);
        res.end();
        return;
      }
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      // iOS Safari never buffers a paused video (data-saving policy) and
      // blocks script-triggered play() outside a real user gesture, which
      // WebDriver-issued clicks don't count as. Declarative `autoplay` set
      // in markup is exempt from that gesture requirement for muted video,
      // so rewrite it in on the fly rather than editing the shared fixture
      // files (which are also used, unmodified, by the other browsers).
      if (ext === '.html' && forceAutoplay) {
        fs.readFile(filePath, 'utf8', (readErr, html) => {
          if (readErr) {
            res.writeHead(500);
            res.end();
            return;
          }
          const patched = html.replace(/<video\b(?![^>]*\bautoplay\b)/i, '<video autoplay playsinline');
          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': Buffer.byteLength(patched),
          });
          res.end(patched);
        });
        return;
      }

      const range = req.headers.range;
      if (range) {
        const match = /bytes=(\d+)-(\d*)/.exec(range);
        const start = match ? parseInt(match[1], 10) : 0;
        const end = match && match[2] ? parseInt(match[2], 10) : stat.size - 1;
        res.writeHead(206, {
          'Content-Type': contentType,
          'Content-Length': end - start + 1,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    });
  });
  return new Promise((resolve) => {
    server.listen(port, () => {
      resolve({
        url: (name) => `http://localhost:${port}/${name}`,
        close: () => server.close(),
      });
    });
  });
}

/**
 * Builds a WebDriver session. `browserName` is one of "safari", "safari-tp",
 * "firefox", "chrome", "ios-safari".
 *
 * "ios-safari" drives Mobile Safari in the iOS Simulator via a locally
 * running Appium server (XCUITest driver), not a browser-vendor
 * WebDriver endpoint. Start Appium separately (`npx appium`) and boot the
 * target simulator before running; device selection is via env vars
 * IOS_UDID (preferred) or IOS_DEVICE_NAME/IOS_PLATFORM_VERSION.
 */
async function buildDriver(browserName) {
  const builder = new Builder();
  if (browserName === 'safari-tp') {
    const safari = require('selenium-webdriver/safari');
    const options = new safari.Options();
    options.setTechnologyPreview(true);
    options.setBrowserName('Safari Technology Preview');
    return builder.forBrowser('safari').setSafariOptions(options).build();
  }
  if (browserName === 'ios-safari') {
    const caps = {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      browserName: 'Safari',
      'appium:newCommandTimeout': 300,
    };
    caps['appium:deviceName'] = process.env.IOS_DEVICE_NAME || 'iPhone 15';
    if (process.env.IOS_UDID) {
      caps['appium:udid'] = process.env.IOS_UDID;
    } else if (process.env.IOS_PLATFORM_VERSION) {
      caps['appium:platformVersion'] = process.env.IOS_PLATFORM_VERSION;
    }
    const driver = await builder
      .usingServer(process.env.APPIUM_SERVER_URL || 'http://localhost:4723')
      .withCapabilities(caps)
      .build();
    // XCUITest's default async-script timeout is effectively 0, unlike
    // desktop WebDriver endpoints which default to 30s per spec.
    await driver.manage().setTimeouts({ script: 30000 });
    return driver;
  }
  return builder.forBrowser(browserName).build();
}

function resultsDirFor(label) {
  const dir = path.join(RESULTS_DIR, label);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function getBrowserLabel(driver) {
  const caps = await driver.getCapabilities();
  if (caps.get('platformName') === 'iOS' || caps.get('platformName') === 'ios') {
    const platformVersion = caps.get('platformVersion') || caps.get('appium:platformVersion') || 'unknown';
    const deviceName = caps.get('deviceName') || caps.get('appium:deviceName') || 'unknown';
    return `ios-safari-${platformVersion}-${deviceName}`.replace(/\s+/g, '_');
  }
  const name = caps.get('browserName') || 'unknown';
  const version = caps.get('browserVersion') || caps.get('version') || 'unknown';
  return `${name}-${version}`.replace(/\s+/g, '_');
}

async function runFeatureDetect(driver) {
  return driver.executeScript(() => {
    const out = {};

    // VTTCue
    try {
      const hasVTTCue = typeof window.VTTCue === 'function';
      out.VTTCue = { present: hasVTTCue };
      if (hasVTTCue) {
        const cue = new window.VTTCue(0, 1, 'test');
        out.VTTCue.props = {};
        for (const p of ['region', 'vertical', 'snapToLines', 'line', 'lineAlign',
          'position', 'positionAlign', 'size', 'align', 'text', 'id']) {
          out.VTTCue.props[p] = p in cue ? typeof cue[p] : 'missing';
        }
      }
    } catch (e) {
      out.VTTCue = { present: false, error: String(e) };
    }

    // VTTRegion
    try {
      const hasVTTRegion = typeof window.VTTRegion === 'function';
      out.VTTRegion = { present: hasVTTRegion };
      if (hasVTTRegion) {
        const region = new window.VTTRegion();
        out.VTTRegion.props = {};
        for (const p of ['id', 'width', 'lines', 'regionAnchorX', 'regionAnchorY',
          'viewportAnchorX', 'viewportAnchorY', 'scroll']) {
          out.VTTRegion.props[p] = p in region ? typeof region[p] : 'missing';
        }
      }
    } catch (e) {
      out.VTTRegion = { present: false, error: String(e) };
    }

    // TextTrack / track element basics
    const video = document.querySelector('video');
    out.trackElement = !!video;
    if (video) {
      out.textTracksLength = video.textTracks ? video.textTracks.length : null;
      if (video.textTracks && video.textTracks.length) {
        const tt = video.textTracks[0];
        out.textTrack = {
          kind: tt.kind,
          mode: tt.mode,
          cuesPresent: !!tt.cues,
          cueCount: tt.cues ? tt.cues.length : null,
          activeCuesPresent: !!tt.activeCues,
        };
      }
    }

    return out;
  });
}

async function waitForLoadedMetadata(driver) {
  await driver.executeAsyncScript((callback) => {
    const video = document.querySelector('video');
    if (video.readyState >= 1) return callback();
    video.addEventListener('loadedmetadata', () => callback(), { once: true });
  });
}

/**
 * Seeks the page's <video> to `seconds` and waits for the 'seeked' event
 * before returning, plus a small settle delay for cue re-render.
 */
async function seekTo(driver, seconds) {
  await driver.executeAsyncScript((t, callback) => {
    const video = document.querySelector('video');
    const done = () => {
      video.removeEventListener('seeked', done);
      setTimeout(callback, 150);
    };
    video.addEventListener('seeked', done);
    video.currentTime = t;
  }, seconds);
}

async function screenshot(driver, destPath) {
  const data = await driver.takeScreenshot();
  fs.writeFileSync(destPath, Buffer.from(data, 'base64'));
  return destPath;
}

/**
 * Subtitle/region overlays are composited by the browser (UA shadow DOM),
 * not drawable to an in-page <canvas> — so pixel checks decode the actual
 * screenshot PNG. Screenshots are captured at devicePixelRatio, so CSS
 * pixel coordinates must be scaled before sampling.
 */
async function samplePixel(driver, cssX, cssY) {
  const dpr = await driver.executeScript(() => window.devicePixelRatio || 1);
  const data = await driver.takeScreenshot();
  const png = PNG.sync.read(Buffer.from(data, 'base64'));
  const x = Math.round(cssX * dpr);
  const y = Math.round(cssY * dpr);
  const idx = (png.width * y + x) << 2;
  return {
    r: png.data[idx],
    g: png.data[idx + 1],
    b: png.data[idx + 2],
    a: png.data[idx + 3],
  };
}

/**
 * Element-cropped equivalents of screenshot()/samplePixel(), for drivers
 * whose full-page takeScreenshot() includes browser/OS chrome around the
 * viewport (Appium/XCUITest captures the whole device screen, not just the
 * viewport, unlike desktop WebDriver endpoints). Cropping to the <video>
 * element makes (0,0) the video's top-left corner again, matching what the
 * fixed CSS-pixel sample coordinates assume.
 */
async function elementScreenshot(driver, cssSelector, destPath) {
  const el = await driver.findElement(By.css(cssSelector));
  const data = await el.takeScreenshot();
  fs.writeFileSync(destPath, Buffer.from(data, 'base64'));
  return destPath;
}

async function sampleElementPixel(driver, cssSelector, cssX, cssY) {
  const el = await driver.findElement(By.css(cssSelector));
  const rect = await el.getRect();
  const data = await el.takeScreenshot();
  const png = PNG.sync.read(Buffer.from(data, 'base64'));
  const dprX = png.width / rect.width;
  const dprY = png.height / rect.height;
  const x = Math.round(cssX * dprX);
  const y = Math.round(cssY * dprY);
  const idx = (png.width * y + x) << 2;
  return {
    r: png.data[idx],
    g: png.data[idx + 1],
    b: png.data[idx + 2],
    a: png.data[idx + 3],
  };
}

async function writeJSON(destPath, obj) {
  fs.writeFileSync(destPath, JSON.stringify(obj, null, 2));
}

module.exports = {
  buildDriver,
  serveFixtures,
  resultsDirFor,
  getBrowserLabel,
  runFeatureDetect,
  waitForLoadedMetadata,
  seekTo,
  screenshot,
  samplePixel,
  elementScreenshot,
  sampleElementPixel,
  writeJSON,
};
