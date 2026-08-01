'use strict';

// Usage: node dump-parsing.js <browser> <fixture>
// DOM-dump check for parsing fixtures: for each cue on the default track,
// prints .id and the innerHTML of getCueAsHTML() (entity decoding, internal
// timestamp nodes, NOTE-block adjacent-id swallowing) rather than relying on
// a screenshot alone. Prints to stdout as JSON; doesn't write to results/.

const { buildDriver, serveFixtures, waitForLoadedMetadata } = require('./lib/harness');

async function main() {
  const [browser, fixture] = process.argv.slice(2);
  if (!browser || !fixture) {
    console.error('Usage: node dump-parsing.js <browser> <fixture>');
    process.exit(1);
  }

  const server = await serveFixtures();
  const driver = await buildDriver(browser);
  try {
    const query = browser === 'ios-safari' ? '?forceAutoplay=1' : '';
    await driver.get(server.url(`${fixture}.html${query}`));
    await waitForLoadedMetadata(driver);

    const dump = await driver.executeScript(() => {
      const video = document.querySelector('video');
      const tt = video.textTracks[0];
      const out = [];
      for (const cue of tt.cues) {
        const frag = cue.getCueAsHTML();
        const div = document.createElement('div');
        div.appendChild(frag);
        out.push({ id: cue.id, startTime: cue.startTime, endTime: cue.endTime, html: div.innerHTML });
      }
      return out;
    });

    console.log(JSON.stringify(dump, null, 2));
  } finally {
    await driver.quit();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
