# Meteor dB

Simple cross-platform dB meter as a PWA (iOS, Android, mac/Windows).

## Features
- Big live dB readout (approx SPL)
- Smaller averaged reading in the corner
- Slider for averaging window (Realtime → 60 s)
- Orientation toggle (Auto / Landscape / Portrait — CSS rotation)
- Screen Wake Lock so phone does not sleep while metering
- Installable PWA, works offline after first load

## Run locally

Microphone access requires `https://` or `http://localhost`. From the project root:

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000> in Chrome / Safari / Edge.

## Install on phone

1. Serve over LAN with HTTPS (e.g. `caddy` or `mkcert` + `http-server -S`), or host on Netlify / GitHub Pages.
2. Open the URL in mobile Safari / Chrome.
3. iOS: Share → Add to Home Screen.
4. Android: install prompt or browser menu → Install app.

## Calibration

The displayed SPL is `dBFS + 90`. This is a rough constant offset, not a true SPL calibration. Actual SPL will vary by device and mic position. For accurate work, calibrate against a reference meter (not implemented).

## Wake lock

Uses the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API). Supported on:
- Chrome / Edge / Android: long-standing.
- Safari iOS 16.4+ (March 2023) and macOS Safari 16.4+.

Older iOS will show a status message; install as a standalone PWA to mitigate auto-sleep there.

## Files

- `index.html` — full app (HTML + CSS + JS)
- `manifest.webmanifest` — PWA manifest
- `sw.js` — service worker, cache-first
- `icons/icon-192.png`, `icons/icon-512.png` — generated placeholder icons
