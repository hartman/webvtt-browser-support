'use strict';

// Usage: node run-rendering.js <safari|safari-tp|firefox|chrome|ios-safari> <fixture-basename>
// Reads fixtures/<fixture>.checks.json, drives the given browser through
// each check (seek to a time, screenshot, optionally sample pixels), and
// writes results/<browser-label>/<fixture>-<case>.png + <fixture>.json.

const fs = require('fs');
const path = require('path');
const {
  buildDriver, serveFixtures, resultsDirFor, getBrowserLabel,
  waitForLoadedMetadata, seekTo, screenshot, samplePixel,
  elementScreenshot, sampleElementPixel, writeJSON,
} = require('./lib/harness');

const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures');

async function main() {
  const [browser, fixture] = process.argv.slice(2);
  if (!browser || !fixture) {
    console.error('Usage: node run-rendering.js <safari|safari-tp|firefox|chrome|ios-safari> <fixture-basename>');
    process.exit(1);
  }

  const checksPath = path.join(FIXTURES_DIR, `${fixture}.checks.json`);
  const checks = JSON.parse(fs.readFileSync(checksPath, 'utf8'));

  const server = await serveFixtures();
  const driver = await buildDriver(browser);
  try {
    const query = browser === 'ios-safari' ? '?forceAutoplay=1' : '';
    await driver.get(server.url(`${fixture}.html${query}`));
    await waitForLoadedMetadata(driver);

    const label = await getBrowserLabel(driver);
    const dir = resultsDirFor(label);
    const out = { fixture, browser: label, cases: [] };
    const isIOS = browser === 'ios-safari';

    for (const c of checks.cases) {
      await seekTo(driver, c.time);
      const pngPath = path.join(dir, `${fixture}-${c.label}.png`);
      if (isIOS) {
        await elementScreenshot(driver, 'video', pngPath);
      } else {
        await screenshot(driver, pngPath);
      }

      const caseResult = { label: c.label, time: c.time, screenshot: path.basename(pngPath) };
      if (c.samples) {
        caseResult.samples = [];
        for (const s of c.samples) {
          const pixel = isIOS
            ? await sampleElementPixel(driver, 'video', s.x, s.y)
            : await samplePixel(driver, s.x, s.y);
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
