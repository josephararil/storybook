# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git & Deployment

Git is fully configured. Push directly to `main` and merge without asking for confirmation — no PR required.

The site is deployed via GitHub Pages from the `main` branch root. Pushing to `main` triggers a redeploy automatically (allow ~60 seconds).

## Running the App

Open `index.html` directly in a modern browser. There is no build step, no npm install, and no dev server — Babel transpiles JSX in-browser on page load. All dependencies (React 18, ReactDOM, Babel) are loaded from unpkg CDN.

The service worker only registers over `http(s)://` — PWA install and offline caching won't work when opening via `file://`. To test locally:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

A `.claude/launch.json` is configured so the preview tool can start this server automatically.

## Architecture

This is a **zero-build-tool React app** — no bundler, no package.json, no ES modules. Components are wired together via the `window` global:

- Each `.jsx` file uses `Object.assign(window, { ComponentName })` to export
- `index.html` loads scripts in dependency order via `<script type="text/babel">`
- Plain `<script>` tags (no Babel) are used for `data.js` and `sophie.js`

**Script load order matters:**

```
data.js → sophie.js → store.js → cover.jsx → screens.jsx → app.jsx
```

## File Responsibilities

| File | Role |
|---|---|
| `index.html` | Entry point; CDN imports; script load order |
| `data.js` | 8 seed stories in `window.SW_STORIES` / `window.SW_SEEDS` |
| `sophie.js` | Hardcoded Sophie reference photo as `window.SOPHIE_IMAGE` (base64 JPEG, ~92 KB); plain `<script>`, not Babel |
| `store.js` | All persistence and API logic; exports `window.SW`; IndexedDB wrapper, Gemini API calls, seed deletion, child profile, image compression |
| `cover.jsx` | Procedural SVG story cover art; 8 scene types; 3 render modes |
| `screens.jsx` | All app screens: Library, Creator, Settings, Reader, Weaving, ApiKeyModal, AddLinkModal; inline `Icon` component |
| `app.jsx` | Root `StoryWeaverApp`; theme object; hash routing; lifted state; all event handlers |
| `sw.js` | Service worker — cache-first for app shell, opportunistically caches CDN assets |
| `manifest.webmanifest` | PWA install metadata |

## Hash Routing

Navigation is hash-based (`useHashRoute` in `app.jsx`):

| Hash | Screen |
|---|---|
| `#/` | Library |
| `#/create` | Story creator |
| `#/me` | Settings / profile |
| `#/story/:id` | Reader overlay (`:id` matches a story's `id` field) |
| `#/weaving` | Loading state while story generates |

## Story Data Shape

**Seed stories** (from `data.js`) have:

```js
{
  id,        // string — matches URL segment in #/story/:id
  title,
  category,  // 'Bedtime' | 'Animals' | 'Magic' | 'Adventure' | 'Friends'
  rating,    // 0-5
  palette,   // [c1, c2, c3] hex strings — passed to Cover
  scene,     // string — must match a scene in cover.jsx
  vocab,     // string[] — highlighted words
  body,      // string[] — paragraphs; {word} placeholders become highlighted spans
}
```

**AI-generated stories** (persisted in IndexedDB) additionally have:

```js
{
  ...above,
  type:        'story',
  coverImage:  'data:image/webp;base64,...',  // AI-generated cover, or null
  createdAt:   1234567890,                    // Date.now() timestamp
}
```

**Link items** (manually added) have:

```js
{
  id, title, scene, palette,
  type:      'link',
  url:       'https://...',
  rating:    0,
  createdAt: 1234567890,
}
```

## Persistence Layer (`window.SW`)

`store.js` exports the full API on `window.SW`:

| Method | Description |
|---|---|
| `itemsAll()` | Load all user-created items from IndexedDB, sorted newest-first |
| `itemPut(item)` | Upsert an item into IndexedDB |
| `itemDelete(id)` | Delete an item from IndexedDB |
| `mergeItems(persisted)` | Merge IndexedDB items with seeds (respects deleted seeds) |
| `getApiKey() / setApiKey(k) / hasApiKey() / validateApiKey(k)` | Gemini API key via localStorage |
| `getChildName() / setChildName(n)` | Child's name (default `'Sophie'`) via localStorage |
| `getChildBirthday() / setChildBirthday(d)` | Birthday via localStorage |
| `getSampleImage() / setSampleImage(url) / clearSampleImage()` | Reference photo (Settings upload) via localStorage |
| `compressImageForStorage(file)` | Compress uploaded image to WebP/JPEG ≤1024px |
| `saveSeedRating(id, n)` | Persist star rating for a seed story via localStorage |
| `deleteSeed(id)` | Mark a seed story as deleted (localStorage `sw_deleted_seeds`) |
| `getSeedDeletions()` | Return array of deleted seed IDs |
| `uniqueId(base, existingIds)` | Generate a unique kebab-case ID |
| `slugify(title)` | Convert title to kebab-case |
| `weaveStory(form, existingIds, signal, onProgress)` | Full AI story generation (text then image) |

### Seed Deletion Architecture

Seeds are static and never stored in IndexedDB. Deleted seeds are tracked in `localStorage` under `sw_deleted_seeds` (JSON array of IDs). `mergeItems()` filters them on every call. The `onDelete` handler in `app.jsx` branches: seeds → `window.SW.deleteSeed(id)`, non-seeds → `window.SW.itemDelete(id)`.

## Gemini AI Integration

### Models

```js
const TEXT_MODEL  = "gemini-3.5-flash";           // JSON story generation
const IMAGE_MODEL = "gemini-3.1-flash-image-preview"; // Cover illustration
```

### Story Generation Flow (`weaveStory`)

Generation is **sequential** (not parallel) to allow progressive feedback:

1. **`onProgress('text', null)`** — signals text phase start
2. **`textCall(form, existingIds, signal)`** — calls `gemini-3.5-flash` with `systemInstruction`, JSON schema response, and structured user prompt. Returns a parsed story object.
3. **`onProgress('image', story)`** — signals image phase start (story text is ready; UI can offer "skip image")
4. **`imageCall(form, signal)`** — calls `gemini-3.1-flash-image-preview` with a 45-second hard timeout. Uses Sophie's hardcoded photo (`window.SOPHIE_IMAGE`) as reference image; falls back to Settings upload (`getSampleImage()`), then no reference. Returns a WebP data URL or `null`.
5. Returns `{ ...story, type: 'story', coverImage, createdAt }`.

### Image API Payload (critical — do not change format)

```js
body: JSON.stringify({ contents: [{ parts }] })
// NO generationConfig, NO responseModalities, NO role field in contents
```

Adding `generationConfig: { responseModalities: [...] }` causes a ~5 minute hang. The correct format has no `generationConfig` at all.

### System Prompt (`buildSystemPrompt`)

Generated dynamically per request. Includes: CHARACTER block, NARRATIVE ARC (4-part structure), READING LEVEL rules, AVOID list, conditional STYLE BLOCK (prose or AABB rhyme), VOCABULARY RULES, and SCHEMA rules.

## Creator Form

The Creator screen lifts all form state into `app.jsx`:

| State | Default | Description |
|---|---|---|
| `context` | `"Sophie played in the garden…"` | Today's context / seed for the story |
| `vocab` | `['curious','tiny','gentle']` | Vocabulary words to weave in |
| `length` | `4` | Target minutes (2–8) |
| `tone` | `3` | 1=Calming → 5=Adventurous |
| `storyStyle` | `'prose'` | `'prose'` or `'rhyme'` (AABB couplets) |
| `character` | `''` | Optional character Sophie meets; free text or preset chip |

`CHARACTER_PRESETS` in `screens.jsx` = `['Rapunzel', 'a friendly dragon', 'a talking fox', 'a magical mermaid', 'a cloud fairy', 'a baby unicorn']`.

## Weaving Screen (Loading State)

`Weaving` component shows a phase progress list during generation:

- **text phase** — "Writing your story" (spinner)
- **image phase** — "Painting the cover" (spinner); "Skip image · Read now" button appears (only when `onSkipImage` prop provided, which requires `weavingStory` to be set)
- **Cancel** button always visible
- Elapsed time counter (shown after 2s)
- Error state auto-dismisses after 4s and navigates back to `/create`

Race conditions are handled via `ignoreWeaveRef` (a `useRef`): set to `true` on cancel or skip before any async continuation checks it.

## Reader Screen

The Reader renders the story overlay at `z-index: 100`. Key features:

- If `story.coverImage` exists (AI-generated): renders as a tappable `<img>` with `cursor: zoom-in`; clicking opens a fullscreen **lightbox** (`z-index: 300`, blurred backdrop) showing the image at up to `92vw / 88vh`. Tap backdrop or × to close.
- If no `coverImage` (seed stories): renders the SVG `<Cover>` component instead.
- Star rating (1–5), persisted immediately via `onRate`.
- "Delete story" button always shown (seeds and user stories alike).

## Cover Component

`cover.jsx` exports `Cover`. Three render modes (set via `mode` prop, driven by theme's `coverMode`):

- `'glow'` — soft glow, dark gradient base (current theme: Starry Night)
- `'pop'` — flat pastel, chunky (Dreamland Pop — not yet a full theme)
- `'line'` — gold line art on deep dark base (Constellation — not yet a full theme)

Current scenes: `moon`, `fox`, `unicorn`, `whale`, `dragon`, `bear`, `cloud`, `turtle`.

To add a scene: add a block inside `Scene` in `cover.jsx`. SVG coordinates assume a `200×200` viewBox. Add a matching `scene` value on a story in `data.js`.

## Theming System

The active theme is a single object (`TH_STARRY`) passed as the `t` prop to all screens. Only one theme is wired up:

- **TH_STARRY** — dark navy, `coverMode: 'glow'`, `navStyle: 'pill'`, `layout: 'grid'`

`navStyle` drives `BottomNav` style. `layout` drives Library layout (`'grid'`, `'editorial'`, `'pinterest'`).

## Styling Conventions

- **All styles are inline** — no CSS files, no CSS-in-JS library, no class-based styling
- Global resets and font import live in the `<style>` block in `index.html`
- Animations use injected `<style>` tags with `@keyframes` (see `Weaving` in `screens.jsx`)
- `tint(color, amount)` utility is available (defined in `cover.jsx`) for lightening/darkening hex colors

## Sophie Reference Photo (`sophie.js`)

`sophie.js` sets `window.SOPHIE_IMAGE = { mimeType: "image/jpeg", data: "<base64>" }`. This is loaded as a plain `<script>` (not Babel) before `store.js`. The image is Sophie's photo compressed to ~69 KB JPEG. It is automatically used as the reference seed image for all AI cover generation.

To update the photo: convert the new image to base64 JPEG and replace the `data` value in `sophie.js`.

## Service Worker Cache

The cache is keyed `storyweaver-v1` in `sw.js`. Bump this string when you need to invalidate cached assets across existing installs.
