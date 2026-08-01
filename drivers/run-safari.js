'use strict';

const path = require('path');
const {
  buildDriver, serveFixtures, resultsDirFor, getBrowserLabel, runFeatureDetect, writeJSON,
} = require('./lib/harness');

async function main() {
  const server = await serveFixtures();
  const driver = await buildDriver('safari');
  try {
    await driver.get(server.url('api-detect.html'));
    await driver.sleep(2000);
    const result = await runFeatureDetect(driver);
    const label = await getBrowserLabel(driver);
    const dir = resultsDirFor(label);
    writeJSON(path.join(dir, 'api-detect.json'), result);
    console.log(`[${label}] api-detect.json written`);
  } finally {
    await driver.quit();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
