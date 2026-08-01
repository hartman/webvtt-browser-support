'use strict';

// Drives Mobile Safari in the iOS Simulator via a locally running Appium
// server (XCUITest driver). Prerequisites:
//   1. Boot the target simulator (Xcode > Window > Devices and Simulators,
//      or `xcrun simctl boot <udid>` + `open -a Simulator`).
//   2. Start Appium in a separate terminal: `npx appium`.
//   3. Optionally set IOS_UDID (preferred) or IOS_DEVICE_NAME /
//      IOS_PLATFORM_VERSION env vars to select the device.

const path = require('path');
const {
  buildDriver, serveFixtures, resultsDirFor, getBrowserLabel, runFeatureDetect, writeJSON,
} = require('./lib/harness');

async function main() {
  const server = await serveFixtures();
  const driver = await buildDriver('ios-safari');
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
