---
title: Support Matrix
---

[Intro](index.md) · [Source on GitHub](https://github.com/hartman/webvtt-browser-support)

# Feature support matrix

Legend: ✅ works as expected · ❌ does not work / not applied.

Every cell, including every iOS Safari cell, was independently confirmed per browser: screenshotted for rendering fixtures, DOM-dumped (`TextTrack.cues`/`getCueAsHTML()`) for timestamp parsing and API surface.

Styling cells reflect the default styling method, an in-file `WEBVTT STYLE` block, since that's how a real, standalone `.vtt` file actually declares its own styling.

The iOS Safari column reflects Simulator testing (see the [intro page](index.md)).

## API surface (`VTTCue`/`VTTRegion` feature detection)

| Feature | Chrome 151 | Firefox 153 | Safari 26.6 | Safari TP 27.0 | iOS Safari 26.5 |
|---|---|---|---|---|---|
| `VTTCue` constructor + core props | ✅ | ✅ | ✅ | ✅ | ✅ |
| `VTTCue.lineAlign` / `.positionAlign` | ❌ missing | ✅ | ✅ | ✅ | ✅ |
| `VTTCue.region` | ❌ missing (no `VTTRegion`) | ✅ | ✅ | ✅ | ✅ |
| `VTTRegion` constructor | ❌ | ✅ | ✅ | ✅ | ✅ |
| `<region>` block parsing → cue.region | ❌ (n/a) | ✅ | ✅ | ✅ | ✅ |

## Regions

| Feature | Chrome 151 | Firefox 153 | Safari 26.6 | Safari TP 27.0 | iOS Safari 26.5 |
|---|---|---|---|---|---|
| Region layout (anchor/width) + multi-cue stacking | ❌ falls back to normal cue | ✅ | ✅ | ✅ | ✅ |
| `::cue-region()` background styling (bare) | n/a | ❌ not applied | ❌ not applied | ❌ not applied | ❌ not applied |
| `::cue-region(#id)` background styling (selector arg) | n/a | ❌ not applied | ❌ not applied | ❌ not applied | ❌ not applied |
| Region layout overrides `line`/`position`/`size`/`vertical` | n/a ‡ | ✅ | ✅ | ✅ | ✅ |

‡ Chrome has no regions to fall back to, so it applies these settings directly to the cue instead of ignoring them like the other three browsers do.

## Markup tags & timestamps

| Feature | Chrome 151 | Firefox 153 | Safari 26.6 | Safari TP 27.0 | iOS Safari 26.5 |
|---|---|---|---|---|---|
| `<i>` italic markup → native style | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<b>` bold markup → native style | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<u>` underline markup → native style | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<b><i>` nested markup | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<ruby>`/`<rt>` layout (annotation above base) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<c.class>` class span | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<lang>` tag renders content | ✅ | ✅ | ✅ | ✅ | ✅ |
| Internal timestamp tag parsing (`<00:00:01.000>` → `getCueAsHTML()` timestamp node) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Short internal timestamp tag `<MM:SS.mmm>` (no hours) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Overlapping/simultaneous cue stacking (2 or 3 cues) | ✅ | ✅ | ✅ | ✅ | ✅ |

## VTT cue settings

| Feature | Chrome 151 | Firefox 153 | Safari 26.6 | Safari TP 27.0 | iOS Safari 26.5 |
|---|---|---|---|---|---|
| `line` / `position` / `align` / `size` (explicit %) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `line:N` (line-number snap-to-lines) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `line:-N` (negative line, count from bottom) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `position:P%,line-left`/`line-right` (`positionAlign`) | ❌ entire setting dropped, falls back to `auto` ¤ | ✅ | ✅ | ✅ | ✅ |
| `line:P%,start`/`end` (`lineAlign`) | ❌ entire setting dropped, falls back to `auto` ¤ | ✅ | ✅ | ✅ | ✅ |
| `align:end` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `vertical:rl` (rotated glyphs) | ✅ | ❌ renders horizontal | ✅ | ✅ | ✅ |
| `vertical:lr` (rotated glyphs, opposite direction) | ✅ | ❌ renders horizontal | ✅ | ✅ | ✅ |
| Text wraps inside a narrow `size` | ❌ overflows/clips as one line, no wrap | ✅ | ✅ | ✅ | ✅ |

¤ This syntax is in the current spec, but under live dispute: see "A few smaller things worth knowing" on the [intro page](index.md) for why Chrome dropped it.

## `::cue()` selector types

| Feature | Chrome 151 | Firefox 153 | Safari 26.6 | Safari TP 27.0 | iOS Safari 26.5 |
|---|---|---|---|---|---|
| `::cue()` bare (no argument), `color` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `::cue()` bare, `background-color` | ❌ **silently ignored** | ✅ | ✅ | ✅ | ✅ |
| `::cue(.class)` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `::cue(v[voice=...])` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `::cue(i)` / `::cue(u)` / `::cue(b)` bare tag selectors | ✅ | ❌ | ✅ | ✅ | ✅ |
| `::cue(ruby)` / `::cue(rt)` independently styled | ✅ | ❌ | ✅ | ✅ | ✅ |
| `::cue(v)` bare (no voice filter) | ✅ | ❌ | ✅ | ✅ | ✅ |
| `::cue(b.class)` compound tag+class selector | ✅ | ❌ | ✅ | ✅ | ✅ |
| `::cue(v[voice=...].class)` compound attr+class selector | ✅ | ❌ | ✅ | ✅ | ✅ |
| `::cue(#id)` | ❌ | ❌ | ❌ | ✅ § | ❌ |
| `::cue(:lang(xx))` (unquoted ident) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `::cue(:past)` / `::cue(:future)` on plain text (no element wrapping) | ❌ * | ❌ | ❌ | ❌ | ❌ |
| `::cue(c.class:past)` / `::cue(*.class:past)` on per-segment `<c>`-wrapped text | ✅ | ❌ | ✅ | ✅ | ✅ |
| Same, but one element wraps the *whole* cue instead of one per segment | ❌ no internal split (whole element renders one color) | ❌ | ❌ no internal split | ❌ no internal split | ❌ no internal split |

\* Per spec, text nodes aren't selectable at all. See the intro page's karaoke section for the fix (wrap each segment in its own element).

§ Renders as a full-width bar across the cue line, not a tight box like a native `::cue()` match normally produces. Likely a different, newer code path, not the same feature simply re-enabled.

## CSS properties on `::cue()`

| Property | Chrome 151 | Firefox 153 | Safari 26.6 | Safari TP 27.0 | iOS Safari 26.5 |
|---|---|---|---|---|---|
| `color` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `background-color` (with an argument selector) | ✅ | ❌ | ✅ | ✅ | ✅ |
| `background-image` | ✅ | ❌ | ❌ † | ❌ † | ❌ † |
| `font` shorthand (style/weight/size/family) | ✅ | ❌ | ✅ | ✅ | ✅ |
| `line-height` | ⚠️ not observable (blocked by the no-wrap bug above) | ❌ | ✅ | ✅ | ✅ |
| `opacity` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `outline` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `text-decoration` (incl. `wavy`/color) | ✅ | ❌ | ✅ | ✅ | ✅ |
| `text-shadow` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `visibility: hidden` | ✅ | ❌ | ✅ | ✅ | ✅ |
| `white-space: pre` (preserves runs of spaces) | ✅ | ❌ | ✅ | ✅ | ✅ |
| `ruby-position` | ❌ ¶ | ❌ | ❌ | ❌ | ❌ |
| `text-combine-upright` (in `vertical:rl` text) | ✅ | ❌ | ✅ | ✅ | ✅ |

¶ Chrome supports this property generally outside WebVTT, since Chrome 84. It's specifically inert inside `::cue()`'s permitted-property set.

† Fails via the default `STYLE`-block method in Firefox, Safari, and Safari TP — **Chrome is the only browser where `STYLE`-block `background-image` works at all.** Works fine everywhere via the secondary page-level-`<style>`/external-stylesheet methods, tiling the checkerboard correctly — the only property where those methods diverge from the default. The animated-formats tables below confirm and extend this same fact across GIF/APNG/WebP/SVG and a bare (class-free) selector.

Every selector type and property above was also checked via those two secondary methods, and matched the default `STYLE`-block result exactly, except the one `background-image` row.

## Animated `background-image` formats

Whether an animated background shows up — and whether it actually animates — depends as much on *how the image is referenced* as on its format.

Network-referenced image (a URL, not a data URI), via page-level `<style>` — the only method that reaches Firefox/Safari/Safari TP at all, since none of them fetch network images from inside a `STYLE` block (same restriction as the `background-image` row above):

| Format | Chrome 151 | Firefox 153 | Safari 26.6 | Safari TP 27.0 |
|---|---|---|---|---|
| Animated GIF | ✅ animates | ✅ animates ‖ | ✅ animates | ✅ animates |
| Animated PNG (APNG) | ✅ animates | ✅ animates ‖ | ✅ animates | ✅ animates |
| Animated WebP | ✅ animates | ✅ animates ‖ | ✅ animates | ✅ animates |
| SVG animated via SMIL (`<animate>`) | ❌ frozen | ❌ frozen ‖ | ❌ frozen | ❌ frozen |
| SVG animated via CSS `@keyframes` | ❌ frozen | ❌ frozen ‖ | ❌ frozen | ❌ frozen |

Base64 data URI, in the `.vtt` file's own `STYLE` block (i.e. the one way any of this could reach a real, self-contained subtitle file's default styling method) — this is the same Chrome-only `STYLE`-block restriction as the `background-image` row above (†), now confirmed across every format here and with a bare, class-free selector:

| Format | Chrome 151 | Firefox 153 | Safari 26.6 | Safari TP 27.0 |
|---|---|---|---|---|
| Animated GIF | ✅ animates | ❌ † | ❌ † | ❌ † |
| Animated PNG (APNG) | ✅ animates | ❌ † | ❌ † | ❌ † |
| Animated WebP | ✅ animates | ❌ † | ❌ † | ❌ † |
| SVG animated via SMIL (`<animate>`) | ✅ animates | ❌ † | ❌ † | ❌ † |
| SVG animated via CSS `@keyframes` | ✅ animates | ❌ † | ❌ † | ❌ † |

The SVG rows are the interesting reversal: a **network-loaded** SVG's own animation never plays anywhere (treated as a fully static image, like `<img src="*.svg">`), but the identical SVG **base64-encoded** animates normally — in all four browsers, once it's actually reachable (page-level `<style>`, since `STYLE` block only reaches Chrome). Encoding, not format, is what determines whether an SVG's own animation runs.

‖ Firefox can't reach any of these through `::cue(.class)` at all (same argument-selector failure as the selector-types table above) — verified separately with a bare, class-free `::cue{}` rule instead, where the underlying animation behavior turns out identical to the other three browsers.

Not independently re-tested on iOS Safari for either table on this page.

## Parsing edge cases

| Feature | Chrome 151 | Firefox 153 | Safari 26.6 | Safari TP 27.0 | iOS Safari 26.5 |
|---|---|---|---|---|---|
| Page-level `<style>` / external stylesheet match the default `STYLE`-block method | ✅ identical | ✅ identical | ⚠️ except `background-image` | ⚠️ except `background-image` | ✅ identical |
| `NOTE` block ignored / never rendered | ✅ | ✅ | ✅ | ✅ | ✅ |
| `NOTE` block swallows an adjacent non-blank line (no blank-line terminator) | ✅ (cue id dropped, per spec) | ❌ (terminates NOTE early, next line wrongly parsed as cue id) | ✅ | ✅ | ✅ |
| BOM-prefixed file parses | ✅ | ✅ | ✅ | ✅ | ✅ |
| Short cue timing `MM:SS.mmm` (no hours) | ✅ | ✅ | ✅ | ✅ | ✅ |
| HTML character references (`&amp;` `&lt;` `&gt;` `&nbsp;` `&lrm;`) decode correctly in `getCueAsHTML()` | ✅ | ✅ | ✅ | ✅ | ✅ |

## video.js

video.js 8.23.9 implements **none** of the WebVTT CSS styling spec: no `::cue()`, no `::cue-region()`, no shadow DOM.
It paints cues itself as plain HTML. A developer can reverse-engineer its internal DOM and write different, non-standard CSS that visually approximates a `::cue()` rule, but an in-file `STYLE` block (this report's default styling method for native browsers) parses fine and is then silently ignored, same as page-level CSS.

What *is* comparable is the WebVTT parsing/cue-settings model video.js implements independently of any CSS:

| Feature | video.js 8.23.9 |
|---|---|
| Cue-settings layout (`line`/`position`/`align`/`size`, `positionAlign`/`lineAlign` comma syntax, `vertical:rl`/`lr`, narrow-`size` wrapping) | ✅ matches Firefox/Safari/STP, better than Chrome (see above) |
| `<region>` / `VTTRegion` support | ❌ none at all (same fallback as Chrome) |
| `:past`/`:future` karaoke highlighting | ❌ not implemented, cues never re-render on timeupdate |
| Styling one specific cue by its `.id` | ❌ impossible, id never reaches the DOM at all |
| Short `MM:SS.mmm` cue-level timing (no hours) | ❌ cue silently never appears, genuine parser bug |
| Internal short timestamp `<MM:SS.mmm>` | ✅ |
| HTML entities incl. double-escaping edge case | ✅ |
| Overlapping/simultaneous cue stacking | ✅ |
