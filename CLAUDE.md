# CLAUDE.md

## What this repo is

A test harness that drives real, installed browser binaries (not Playwright's bundled engines) via WebDriver to check native WebVTT rendering/styling support, plus — separately — video.js's own JS-based captions renderer for comparison. Results back every claim in `REPORT.md` (a working file, not published) and get summarized into `site/` (the published GitHub Pages report).

## Architecture

- `drivers/lib/harness.js` — shared helpers used by every driver script: `serveFixtures()` (local HTTP server for `fixtures/`, with Range support required for `<video>` seeking), `buildDriver(browserName)` (WebDriver session per browser, including the `ios-safari`/Appium special case), `seekTo`/`screenshot`/`samplePixel` (drive playback and capture evidence), `runFeatureDetect` (dumps `VTTCue`/`VTTRegion`/`TextTrack` API surface).
- `drivers/run-<browser>.js` — one script per browser (`chrome`, `firefox`, `safari`, `safari-tp`, `ios-safari`), each running `api-detect.html` through `runFeatureDetect`.
- `drivers/run-rendering.js <browser> <fixture>` — the actual per-fixture driver: reads `fixtures/<fixture>.checks.json`, seeks to each listed time, screenshots, samples any listed pixel coordinates, writes `results/<browser>-<version>/<fixture>-<case>.png` + `<fixture>.json`.
- `drivers/run-videojs.js <fixture>` — same checks-driven flow, but always hosts under Chrome and targets `fixtures/<fixture>-videojs.html` instead of the native fixture. video.js renders cues itself (own `vtt.js` fork, plain light-DOM + CSS, no `::cue()`/shadow DOM), so the underlying browser engine is just a host and doesn't affect the result. Results land in `results/videojs-<version>/`.
- `fixtures/<name>.html` + `.vtt` + `.checks.json` — one test scenario. `.checks.json` is `{ cases: [{ label, time, samples: [{ label, x, y }] }] }`. `<name>.vtt` styles itself via an in-file `WEBVTT STYLE` block (the default/primary method, since that's how a real standalone `.vtt` file actually ships its styling). `<name>-page-style.html`/`.vtt` and `<name>-ext.html`/`.css` are the two secondary variants (page-level `<style>`, external stylesheet), which reference the same `-page-style.vtt` (no `STYLE` block, so the external/page CSS is unambiguously what's under test) and are proven to match the default method except for one property (`background-image` in Safari/Safari TP, see `REPORT.md` finding #12/#15). `<name>-videojs.html` is the video.js variant, with CSS rewritten to target video.js's real DOM instead of `::cue()` (see below); video.js parses an in-file `STYLE` block without erroring but ignores it entirely, same as page-level CSS, since it implements no `::cue()` support at all.
- `results/<browser-label>/` — every screenshot + JSON backing a claim in `REPORT.md`. Browser label is `<name>-<version>` (native) or `videojs-<version>` (video.js), derived automatically from WebDriver capabilities / `video.js/package.json`.

## video.js fixtures: DOM mapping

video.js disables the native `<video>`'s text track (`video.textTracks.length` is `0`) and manages cues itself via `player.textTracks()`, rendering into `.vjs-text-track-display > ... > .vjs-text-track-cue`. This was reverse-engineered by dumping live DOM (`document.querySelector('.vjs-text-track-cue').outerHTML`) before writing any fixture CSS — don't assume, verify against the actual DOM if extending these fixtures. Key mappings:

- `<b>`/`<i>`/`<u>`/`<ruby>`/`<rt>` → their literal HTML tags, styleable directly.
- `<c.class>` → `<span class=" class">` — plain class selectors, no `!important` needed (no inline style on these spans).
- `<v Name>` → `<span title="Name">` — **no `<v>` element, no `voice` attribute**; use `[title="Name"]`.
- `<lang xx>` → `<span lang="xx">` — real native `:lang()` CSS applies, not a WebVTT-specific reimplementation.
- A cue's `.id` never reaches the DOM anywhere — there's no way to replicate `::cue(#id)` styling in vanilla video.js.
- Default/bare cue styling (color/background) is set as an **inline style** on a wrapper `<div>` inside `.vjs-text-track-cue` — author CSS needs `!important` and must target `.vjs-text-track-cue > div`, not the outer box (which stays transparent).
- Internal cue timestamps (`<00:00:01.000>`) become inert `<?timestamp N?>` processing-instruction nodes; the cue's DOM is never re-rendered on `timeupdate`, so there is no `:past`/`:future` equivalent at all — don't write CSS for it, there's nothing to select.
- `window.VTTRegion` is `undefined` — no region support; region-anchored cues fall back to normal auto-stacked layout, same as Chrome's fallback.

## Workflow

- `REPORT.md` and `site/` are both gitignored on `main` — `REPORT.md` is a working file (raw findings, one section per browser/renderer), never published as-is. `site/` is the consolidated, publish-ready summary, pushed to a separate `gh-pages` branch for GitHub Pages (not part of `main`'s history).
- When adding a new test surface (a fixture, a browser, a renderer like video.js): build the fixture(s) + driver, run it, visually inspect a representative sample of the resulting screenshots (don't trust pixel samples alone for subtle findings), then consolidate into `REPORT.md`, then summarize into `site/tables.md` (+ `index.md`/`findings.md` if there's a headline finding worth a narrative section).
- Adding a fixture: see `README.md`'s "Adding a new fixture" section.
