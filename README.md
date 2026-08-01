# WebVTT Browser Support Test Suite

Validates native WebVTT rendering/styling support across the browsers installed on this machine (Chrome, Firefox, Safari, Safari Technology Preview, iOS Safari via Simulator) using WebDriver and Appium.

See **REPORT.md** for findings. See `fixtures/` for the test pages and `results/` for the raw screenshots/JSON backing every claim.

## Setup

```sh
cd drivers
npm install
brew install geckodriver   # if not already installed
```

Safari and Safari Technology Preview each require "Allow Remote Automation" enabled once in their own Develop/Advanced settings menu before `safaridriver` can attach to them.

### iOS Safari (Simulator)

Driven via Appium's XCUITest driver rather than a vendor WebDriver endpoint — Apple doesn't ship one for iOS.

1. Xcode's bundled Simulator runtime must match Xcode's own SDK version (check with `xcrun simctl list runtimes` vs `xcodebuild -showsdks`); if missing, `xcodebuild -downloadPlatform iOS`.
2. Boot the target simulator: `xcrun simctl boot <udid> && open -a Simulator`.
3. Start Appium in a separate terminal: `cd drivers && npm run appium`.
4. Run: `IOS_UDID=<udid> IOS_DEVICE_NAME="iPhone 17" node run-ios-safari.js` (or `run-rendering.js ios-safari <fixture>`).

First run builds WebDriverAgent against the simulator, which takes a few minutes. If a session fails with `Unknown application display identifier com.facebook.WebDriverAgentRunner.xctrunner`, CoreSimulatorService has gotten into a bad state — `xcrun simctl shutdown all && killall -9 com.apple.CoreSimulator.CoreSimulatorService`, then reboot the simulator and retry.

Two iOS-specific quirks the harness works around (see comments in `lib/harness.js`):
- iOS Safari never buffers a paused `<video>` and blocks script-triggered `play()` outside a real user gesture (which WebDriver clicks don't count as) — the fixture server rewrites `<video>` to declarative `autoplay playsinline` on the fly for iOS requests only (`?forceAutoplay=1`), which is exempt from the gesture requirement for muted media.
- Appium's `takeScreenshot()` captures the whole device screen (status bar + Safari chrome), not just the viewport like desktop WebDriver — screenshots/pixel samples for `ios-safari` are cropped to the `<video>` element instead.

## Running

```sh
cd drivers
node run-chrome.js                          # feature-detection only, all browsers have run-<browser>.js
node run-rendering.js <browser> <fixture>    # <browser>: chrome | firefox | safari | safari-tp | ios-safari
                                              # <fixture>: any basename under fixtures/*.html (without .html)
```

Each rendering fixture pairs an `.html` page, a `.vtt` file, and a `.checks.json` describing which timestamps to seek to and which pixel coordinates (if any) to sample. Output goes to `results/<browser>-<version>/`.

## Fixture naming convention

Each rendering fixture exists in up to three styling variants, all serving the exact same cues:

- `<name>.html` / `<name>.vtt`: the **primary/default** variant. Styling is declared in an in-file `WEBVTT STYLE` block, since that's the method a real, standalone `.vtt` file actually uses in practice.
- `<name>-page-style.html` / `<name>-page-style.vtt`: the same rules declared in a page-level `<style>` block instead, to check for parity against the default method.
- `<name>-ext.html` / `<name>-ext.css`: the same rules again, in an external stylesheet, referencing `<name>-page-style.vtt` (no `STYLE` block, so the external CSS is unambiguously what's being tested).

Only `<name>.checks.json` needs to exist as an original; `-page-style.checks.json` is a copy (same case labels/timings, since the cues are identical). See `REPORT.md`'s finding on `STYLE`-block-vs-page-CSS parity for why this distinction turned out to matter (`background-image` behaves differently between the default and secondary methods in Safari/Safari TP).

## Adding a new fixture

1. Add `fixtures/<name>.html` (no page-level `::cue` styling) + `<name>.vtt` (cues + a `STYLE` block with the `::cue()`/`::cue-region()` rules) + `<name>.checks.json` (`cases: [{label, time, samples: [{label, x, y}]}]`).
2. For the page-level-`<style>` variant, add `<name>-page-style.html` (the same rules moved into a page `<style>` block) + `<name>-page-style.vtt` (same cues, no `STYLE` block) + a copied `<name>-page-style.checks.json`.
3. For the external-stylesheet variant, add `<name>-ext.html` + `<name>-ext.css`, both referencing `<name>-page-style.vtt`.
4. Run it through all 4 desktop browsers (and iOS Safari, if warranted) via `run-rendering.js`.
5. Update REPORT.md.

## Interpreting results

For each `run-rendering.js <browser> <fixture>` run, `results/<browser>-<version>/` gets one `<fixture>-<case>.png` screenshot per check plus one `<fixture>.json` with the pixel samples (`{r,g,b,a}` per named coordinate) and screenshot filenames.

- **Pixel samples are a fast first pass, not the final word.** They catch obvious color/pass-fail differences cheaply, but coordinates land differently depending on cue-box height, text length, or (for iOS) the element-cropped screenshot's scale factor; a differing sample can be a real rendering difference or just a coordinate landing in a different part of the box. Always open the actual `.png` (both browsers side by side) before writing up a finding.
- **Cross-check a claim against its counterpart fixture(s).** A `<name>` (STYLE block) vs `<name>-page-style` (page CSS) diff is only a real finding if it's reproducible: rerun the affected fixture/browser once before trusting a single-run diff; genuine flakiness exists (e.g. iOS Safari occasionally paints a blank/undecoded `<video>` frame independent of any WebVTT behavior).
- **For parsing-only fixtures** (`NOTE` blocks, entity decoding, internal timestamps, BOM handling), a screenshot alone can't confirm correctness — use `node dump-parsing.js <browser> <fixture>` to dump `TextTrack.cues`/`getCueAsHTML()` directly and compare the DOM structure, not just the rendered pixels.
- Once a finding is confirmed reproducible and visually verified, write it up in `REPORT.md` (see its existing findings for the level of detail/evidence expected), then summarize into `site/` if it's publish-worthy.
