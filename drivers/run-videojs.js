'use strict';

// Usage: node run-videojs.js <fixture-basename>
// Same flow as run-rendering.js, but targets fixtures/<fixture>-videojs.html
// and always drives Chrome — video.js renders cues itself (its own vtt.js
// fork, plain DOM + CSS, no native ::cue()/shadow DOM), so the underlying
// browser engine is just a host and doesn't affect the result the way it
// does for the native-rendering fixtures. Results land in
// results/videojs-<version>/ (label includes the video.js version, not the
// browser's).

const fs = require('fs');
const path = require('path');
const {
  buildDriver, serveFixtures, resultsDirFor, waitForLoadedMetadata, seekTo,
  screenshot, samplePixel, writeJSON,
} = require('./lib/harness');

const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures');
const VIDEOJS_VERSION = require('./node_modules/video.js/package.json').version;

async function main() {
  const [fixture] = process.argv.slice(2);
  if (!fixture) {
    console.error('Usage: node run-videojs.js <fixture-basename>');
    process.exit(1);
  }

  const checksPath = path.join(FIXTURES_DIR, `${fixture}.checks.json`);
  const checks = JSON.parse(fs.readFileSync(checksPath, 'utf8'));

  const server = await serveFixtures();
  const driver = await buildDriver('chrome');
  try {
    await driver.get(server.url(`${fixture}-videojs.html`));
    await waitForLoadedMetadata(driver);

    const label = `videojs-${VIDEOJS_VERSION}`;
    const dir = resultsDirFor(label);
    const out = { fixture, browser: label, cases: [] };

    for (const c of checks.cases) {
      await seekTo(driver, c.time);
      const pngPath = path.join(dir, `${fixture}-${c.label}.png`);
      await screenshot(driver, pngPath);

      const caseResult = { label: c.label, time: c.time, screenshot: path.basename(pngPath) };
      if (c.samples) {
        caseResult.samples = [];
        for (const s of c.samples) {
          const pixel = await samplePixel(driver, s.x, s.y);
          caseResult.samples.push({ label: s.label, x: s.x, y: s.y, pixel });
        }
      }
      out.cases.push(caseResult);
      console.log(`[${label}] ${fixture} / ${c.label} done`);
    }

    writeJSON(path.join(dir, `${fixture}.json`), out);
    console.log(`[${label}] ${fixture}.json written`);
  } finally {
    await driver.quit();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
