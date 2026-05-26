# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git & Deployment

Git is fully configured. Push directly to `main` and merge without asking for confirmation — no PR required.

The site is deployed via GitHub Pages from the `main` branch root. Pushing to `main` triggers a redeploy automatically (allow ~60 seconds).

## Running the App

Open `index.html` directly in a modern browser. There is no build step, no npm install, and no dev server — Babel transpiles JSX in-browser on page load. All dependencies (React 18, ReactDOM, Babel) are loaded from unpkg CDN.

The service worker only registers over `http(s)://` — PWA install and offline caching won't work when opening via `file://`. To test those features, serve locally:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Architecture

This is a **zero-build-tool React app** — no bundler, no package.json, no ES modules. Components are wired together via the `window` global:

- Each `.jsx` file uses `Object.assign(window, { ComponentName })` to export
- `index.html` loads scripts in dependency order via `<script type="text/babel">`
- Story data lives in `window.SW_STORIES` (set by `data.js`)

**Script load order matters** — `data.js` and `cover.jsx` must load before `screens.jsx`, and all of those before `app.jsx`.

## Hash Routing

Navigation is hash-based (`useHashRoute` in `app.jsx`):

| Hash | Screen |
|---|---|
| `#/` | Library |
| `#/create` | Story creator |
| `#/me` | Settings / profile |
| `#/story/:id` | Reader overlay (`:id` matches a story's `id` field) |
| `#/weaving` | Loading state while story generates |

## File Responsibilities

| File | Role |
|---|---|
| `index.html` | Entry point; CDN imports; script load order |
| `data.js` | 8 mock stories in `window.SW_STORIES` |
| `cover.jsx` | Procedural SVG story cover art; 8 scene types; 3 render modes |
| `screens.jsx` | All app screens: Library, Creator, Settings, Reader overlay, Weaving loader; inline `Icon` component library (Lucide-style SVG paths) |
| `app.jsx` | Root `StoryWeaverApp`; theme object; hash routing; mock `onWeave` handler |
| `sw.js` | Service worker — cache-first for app shell, opportunistically caches CDN assets |
| `manifest.webmanifest` | PWA install metadata |

## Story Data Shape

Each story in `window.SW_STORIES` has:

```js
{
  id,        // string — matches URL segment in #/story/:id
  title,
  category,
  rating,    // 1-5
  palette,   // [c1, c2, c3] hex strings — passed to Cover for gradient + tint()
  scene,     // string — must match a scene in cover.jsx's Scene component
  vocab,     // string[] — highlighted words
  body,      // string[] — paragraphs; {word} placeholders are vocab substitution points
}
```

## Cover Component

`cover.jsx` exports `Cover`. Three render modes (set via `mode` prop, driven by the active theme's `coverMode`):

- `'glow'` — soft glow, dark gradient base (Starry Night)
- `'pop'` — flat pastel, chunky (Dreamland Pop — not yet a full theme)
- `'line'` — gold line art on deep dark base (Constellation — not yet a full theme)

Current scenes: `moon`, `fox`, `unicorn`, `whale`, `dragon`, `bear`, `cloud`, `turtle`.

To add a scene: add a block inside the `Scene` function in `cover.jsx`. SVG coordinates assume a `200×200` viewBox. Add a matching `scene` value on a story in `data.js`.

## Theming System

The active theme is a single object passed as `t` prop to all screens. Only one theme is currently wired up:

- **TH_STARRY** — dark mode, `coverMode: 'glow'`, `navStyle: 'pill'`, `layout: 'grid'`

`navStyle` drives `BottomNav` rendering. `layout` drives the Library screen layout.

## Styling Conventions

- **All styles are inline** — no CSS files, no CSS-in-JS library, no class-based styling
- Global resets and font import live in the `<style>` block in `index.html`
- Animations use injected `<style>` tags with `@keyframes` (see `Weaving` in `screens.jsx`)

## Mock Gemini Integration

`onWeave` in `app.jsx` fakes an AI call with a `setTimeout` (4.2 s) then navigates to `/story/moon`. Replace that timeout with a real `fetch` to the Gemini API when wiring up generation.

## Service Worker Cache

The cache is keyed `storyweaver-v1` in `sw.js`. Bump this string when you need to invalidate cached assets across existing installs.
