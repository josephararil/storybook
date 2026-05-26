# Story Weaver

A mobile-first PWA for generating and reading bedtime stories.

## Stack

- React 18 + Babel **via CDN** — no build step, no `npm install`.
- Plain inline styles (Tailwind-equivalent values), Lucide-style icons drawn inline.
- Service worker for offline support; web app manifest for "Add to Home Screen".

## Run locally

Open `index.html` in any modern browser, or serve the folder with any static HTTP server:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

The service worker only registers over `http(s)://`, so PWA install + offline
won't work when opening via `file://`. Everything else does.

## Deploy to GitHub Pages

1. Push the repo.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Done — Pages serves `index.html` directly. No Actions workflow needed.

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell, fonts, mounts React |
| `app.jsx` | Theme + hash routing + top-level component |
| `screens.jsx` | Library · Create · Reader · Settings · Weaving · BottomNav |
| `cover.jsx` | Procedural story-cover illustrations (SVG scenes) |
| `data.js` | Mock story library + sample story body |
| `manifest.webmanifest` | PWA install metadata |
| `sw.js` | Offline cache service worker |
| `icon.svg` | App icon (crescent moon + star) |

## Routes

- `#/` — Library
- `#/create` — Story creator
- `#/me` — Profile / settings
- `#/story/:id` — Reader (overlay)
- `#/weaving` — Loading state while a new story is being generated

## Next

The Gemini call is mocked — `onWeave` in `app.jsx` waits 4.2s then opens the
"Sophie and the Sleepy Moon" story. Replace that timeout with a real fetch
when you wire the API in.
