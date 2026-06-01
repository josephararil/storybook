# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- CLAUDE: Update this file in the same commit as every structural change. No exceptions, no reminders needed.
     What counts: new/removed files, new exported functions, new component state or props, changed rendering
     behaviour, new UI flows, new API calls, changed data shapes, new routing. If you touched it, document it. -->

**Always update this file when you make structural changes** — new files, new state, new API methods, new routing, changed data shapes, new UI flows, changed rendering behaviour — without waiting to be asked. Same commit, every time.

## Git & Deployment

Git is fully configured. Always make a new branch if you are in `main` before starting new work. Once finished, merge all your code to that branch, and raise a PR to merge to `main` without needing approval.

The site is deployed via GitHub Pages from the `main` branch root. Once user accepts the PR to merge to `main`, this triggers a redeploy automatically after 60 seconds.

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
| `store.js` | All persistence and API logic; exports `window.SW`; IndexedDB wrapper, Gemini API calls, seed deletion, child profile, image compression, Google Drive integration |
| `cover.jsx` | Procedural SVG story cover art; 8 scene types; 3 render modes |
| `screens.jsx` | All app screens: Library, Creator, Settings, Reader, Weaving, ApiKeyModal, AddLinkModal, Toast; inline `Icon` component |
| `app.jsx` | Root `StoryWeaverApp`; theme object; hash routing; lifted state; all event handlers |
| `sw.js` | Service worker — network-first for app files (updates always propagate), cache-first for CDN assets (pinned versions) |
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

**AI-generated stories** (v2, persisted in IndexedDB `items` store) have:

```js
{
  id, title, category, rating, palette, scene, vocab,
  type:      'story',
  version:   2,                // v2 marker — anything without this is a legacy story
  pages:     [Page, ...],      // 4–14 entries (MIN_PAGES / MAX_PAGES constants in store.js)
  coverImage: 'data:image/webp;base64,...',  // still generated separately; null if failed
  coverDriveId: 'abc123XYZ',  // Google Drive file ID (optional)
  audioReady: false,           // true once whole-story audio WAV is stored (legacy path; per-page audio is M2)
  audioDriveId: 'abc123XYZ',  // Google Drive file ID for audio (optional)
  createdAt:  1234567890,      // Date.now() timestamp
}
```

**`Page` shape** (stored inline on the story object):

```js
{
  text:        "On-screen prose (≤ ~35 words, may contain {vocab} braces)",
  imagePrompt: "Dense scene description for image model (~40–60 words, no text/lettering)",
  audioPrompt: "Narration text (plain words, no braces) with 1–2 inline audio tags like [whispers]",
  // image and audio fields added in M2 (per-page asset generation — not yet implemented)
}
```

Audio data (WAV) is stored in a **separate IndexedDB object store** (`audio`, key `id`), not in the story object itself. `audioReady: true` on the story signals that audio is available locally.

**Legacy AI stories** (no `version` field, had `body: string[]`) will be wiped by a one-time migration in M2. Until then they render via the existing Reader unchanged.

**Link items** (manually added) have:

```js
{
  id, title, scene, palette,
  type:         'link',
  url:          'https://...',
  rating:       0,
  createdAt:    1234567890,
  coverImage:   'data:image/webp;base64,...',  // AI-generated cover (optional), or null/absent
  coverDriveId: 'abc123XYZ',                   // Google Drive file ID (optional)
}
```

## Persistence Layer (`window.SW`)

`store.js` exports the full API on `window.SW`:

| Method | Description |
|---|---|
| `itemsAll()` | Load all user-created items from IndexedDB, sorted newest-first |
| `itemPut(item)` | Upsert an item into IndexedDB |
| `itemDelete(id)` | Delete an item from IndexedDB |
| `audioGet(id)` | Load a WAV data URL from the `audio` IDB store by story ID (returns null if absent) |
| `audioPut(id, dataUrl)` | Upsert a WAV data URL into the `audio` IDB store |
| `audioDelete(id)` | Delete audio from the `audio` IDB store |
| `mergeItems(persisted)` | Merge IndexedDB items with seeds (respects deleted seeds) |
| `getApiKey() / setApiKey(k) / hasApiKey() / validateApiKey(k)` | Gemini API key via localStorage |
| `getTextModel() / setTextModel(m)` | Text generation model (default `gemini-3.5-flash`) via localStorage `sw_text_model` |
| `getImageModel() / setImageModel(m)` | Image generation model (default `gemini-3.1-flash-image-preview`) via localStorage `sw_image_model` |
| `getAudioModel() / setAudioModel(m)` | TTS model (default `gemini-3.1-flash-tts-preview`) via localStorage `sw_audio_model` |
| `getAudioVoice() / setAudioVoice(v)` | TTS voice name (default `'Aoede'`) via localStorage `sw_audio_voice` |
| `getAudioSystemPrompt() / setAudioSystemPrompt(s)` | TTS narration instructions override via localStorage `sw_audio_sys_prompt`; empty uses built-in |
| `getDefaultAudioSystemPrompt()` | Returns the built-in TTS narration prompt |
| `getCustomSystemPrompt() / setCustomSystemPrompt(s)` | Custom story system prompt override via localStorage `sw_system_prompt`; empty string clears (uses built-in) |
| `getDefaultSystemPrompt()` | Returns the built-in `buildSystemPrompt()` rendered with default form values and current child name — used by the UI to populate the prompt editor |
| `getChildName() / setChildName(n)` | Child's name (default `'Sophie'`) via localStorage |
| `getChildBirthday() / setChildBirthday(d)` | Birthday via localStorage |
| `getSampleImage() / setSampleImage(url) / clearSampleImage()` | Reference photo (Settings upload) via localStorage |
| `compressImageForStorage(file)` | Compress uploaded image to WebP/JPEG ≤1024px |
| `saveSeedRating(id, n)` | Persist star rating for a seed story via localStorage |
| `deleteSeed(id)` | Mark a seed story as deleted (localStorage `sw_deleted_seeds`) |
| `getSeedDeletions()` | Return array of deleted seed IDs |
| `uniqueId(base, existingIds)` | Generate a unique kebab-case ID |
| `slugify(title)` | Convert title to kebab-case |
| `weaveStory(form, existingIds, signal, onProgress)` | Parallel AI story generation: text + image run simultaneously; audio starts as soon as text finishes. Returns `{ ...story, audioPromise, audioReady: false }` — caller awaits `audioPromise` in the background after navigating to the story. |
| `generateAudio(story, signal)` | Calls Gemini TTS (`gemini-3.1-flash-tts-preview`, voice Aoede) to narrate a story; returns a WAV data URL or null |
| `generateLinkCover(description, signal)` | Generate a cover image for a linked storybook; `description` is a free-text prompt about the book; returns a WebP data URL or throws |
| `drive.isConnected()` | Returns true if a Drive account email is stored in localStorage |
| `drive.getEmail()` | Returns the connected Google account email (or `''`) |
| `drive.connect()` | Triggers OAuth2 popup (account picker), fetches user email, creates `StoryWeaver/covers/` and `StoryWeaver/audio/` folders, stores folder IDs in localStorage |
| `drive.disconnect()` | Revokes the access token and clears all `sw_drive_*` localStorage keys |
| `drive.uploadCover(storyId, dataUrl)` | Uploads a cover data URL to Drive as `{storyId}-cover.webp` in the covers folder; returns the Drive file ID |
| `drive.fetchCover(fileId)` | Downloads a file from Drive by ID and returns it as a data URL |
| `drive.uploadAudio(storyId, dataUrl)` | Uploads a WAV audio data URL to Drive as `{storyId}-audio.wav` in the audio folder; returns the Drive file ID |
| `drive.fetchAudio(fileId)` | Downloads an audio file from Drive by ID and returns it as a data URL |
| `drive.migrateCovers(items, onProgress)` | Uploads all items that have `coverImage` but no `coverDriveId`; updates each item in IndexedDB; calls `onProgress({total,done,title})` per item |
| `drive.getStorageInfo()` | Returns Drive quota object `{limit, usage, usageInDrive}` |
| `drive.pushSync()` | Serializes all localStorage (excluding `sw_gemini_key`) + all IndexedDB items → creates/overwrites `storyweaver-sync.json` in the `StoryWeaver/` Drive folder |
| `drive.pullSync()` | Downloads `storyweaver-sync.json` from Drive, restores localStorage keys and upserts IndexedDB items, then reloads the page |

### Google Drive localStorage keys

| Key | Contents |
|---|---|
| `sw_drive_email` | Connected Google account email; presence indicates connected state |
| `sw_drive_root_id` | Drive folder ID for `StoryWeaver/` |
| `sw_drive_covers_id` | Drive folder ID for `StoryWeaver/covers/` |
| `sw_drive_audio_id` | Drive folder ID for `StoryWeaver/audio/` |

All Drive keys are included in Drive sync (not sensitive — no tokens stored). The OAuth2 access token lives in memory only and expires after 1 hour; re-auth triggers a brief Google popup.

### Seed Deletion Architecture

Seeds are static and never stored in IndexedDB. Deleted seeds are tracked in `localStorage` under `sw_deleted_seeds` (JSON array of IDs). `mergeItems()` filters them on every call. The `onDelete` handler in `app.jsx` branches: seeds → `window.SW.deleteSeed(id)`, non-seeds → `window.SW.itemDelete(id)`.

## Gemini AI Integration

### Models

Models are user-configurable via Settings → Gemini AI (stored in localStorage):

```js
// Defaults (overridden by sw_text_model / sw_image_model in localStorage)
const DEFAULT_TEXT_MODEL  = "gemini-3.5-flash";
const DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image";
```

### Image API helper (`callImageApi`)

`imageCall` (story covers) and `generateLinkCover` (link covers) both delegate to a private `callImageApi(prompt, signal)` in `store.js`. It:

- Resolves the reference image: Sophie's hardcoded photo (`window.SOPHIE_IMAGE`) → Settings upload (`getSampleImage()`) → none
- Applies a 45-second hard timeout via a nested `AbortController`
- POSTs to `getImageModel()` with the no-`generationConfig` format (see critical note below)
- Returns a compressed WebP data URL via `compressToWebp`

Do not inline this logic into callers; add new image call sites by calling `callImageApi` instead.

### Story Generation Flow (`weaveStory`)

Generation is **parallel** — text and image run simultaneously; audio starts as soon as text is done:

1. **`onProgress('text', null)`** — signals both text and image are starting (shown as parallel spinners in Weaving screen)
2. **`textCall` + `imageCall` in parallel** — text and image fire simultaneously. `imageCall` delegates to `callImageApi` (3-attempt retry with sanitized prompts). `onProgress('imageRetry', reason)` is emitted on each fallback.
3. **`textCall` resolves** → `generateAudio(story, signal)` starts immediately (does not wait for image). Audio runs in background.
4. **`onProgress('imagePending', story)`** — text done, image still running, audio running. UI stores `story` so user can skip at any time.
5. **`imageCall` resolves** → `weaveStory` returns `{ ...story, type: 'story', coverImage, createdAt, audioPromise, audioReady: false }`.
6. **`onWeave` in `app.jsx`** saves the story (without audio), navigates to reader immediately, then awaits `audioPromise` in the background. When audio resolves, `audioPut` + `itemPut` update `audioReady: true` and the listener button appears.

`onProgress` phase keys:
- `'text'` / null — both text + image starting
- `'imageRetry'` / reason — image retry fallback
- `'imagePending'` / story — text done, audio started, image still running

`onWeave` in `app.jsx` extracts `audioData` from the result, calls `audioPut(id, audioData)` to store it in the `audio` IDB store, then saves the story (without `audioData`) via `itemPut`.

### Image Safety & Retry Logic

`callImageApi` wraps `callImageApiOnce` with automatic fallbacks to handle Google's safety filters:
- **Attempt 1** (45 s): original prompt + reference image
- **Attempt 2** (30 s): `sanitizeImagePrompt(prompt)` + reference image — strips "featuring [name]", "Feature the child [name] prominently", replaces "child" with "illustrated character"
- **Attempt 3** (30 s): sanitized prompt, no reference image

Each fallback emits `onProgress('imageRetry', reason)` (`'adjusting_prompt'` or `'no_reference'`), which `app.jsx` maps to a human-readable sub-message shown in the Weaving screen. All failures result in `null` (story saves without a cover).

### Image API Payload (critical — do not change format)

```js
body: JSON.stringify({
  contents: [{ role: 'user', parts }],
  generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
})
```

Both `role: 'user'` and `generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }` are required. Omitting either causes a 400 or silent hang. Endpoint must be `v1beta` — `v1` rejects `responseModalities` as an unknown field. Do not call `callImageApiOnce` directly from new code; always go through `callImageApi` so retries are included.

### System Prompt (`buildSystemPrompt`)

Generated dynamically per request using a sectioned structure:

| Section | Contents |
|---|---|
| `[CHARACTER & TONE]` | Dynamic child name; companion line (specific if `form.character` set, generic otherwise); tone word; atmosphere; restricted words |
| `[STYLE & FORMATTING]` | Prose sentence rules **or** AABB rhyme rules; vocabulary brace requirement |
| `[NARRATIVE ARC]` | Dynamic page count (`targetPages = clamp(round(length / 0.65), MIN_PAGES, MAX_PAGES)`); named page beats: Discovery → Exploration (middle pages) → Comfort → Resolution |
| `[PAGE FIELDS]` | Per-page rules: `text` (≤ ~35 words, vocab braces here only), `imagePrompt` (~40–60 words, no text/lettering), `audioPrompt` (plain narration + 1–2 audio tags from curated list) |
| `[JSON SCHEMA OUTPUT]` | Valid enum values, palette format, id format; `pages` array count |

If a custom system prompt is saved via the AI Configuration panel (`sw_system_prompt` in localStorage), it replaces the built-in entirely. `getDefaultSystemPrompt()` returns the built-in rendered with default form values and the current child name — used by the modal's "Load default" button.

### AI Configuration Panel (`ApiKeyModal` component)

Opened from Settings → **Gemini AI** row. A full-screen scrollable overlay with four sections:

1. **API Key** — validates against Gemini's `/v1beta/models` endpoint before saving
2. **AI Models** — editable text inputs for text, image, and audio models; plus TTS voice selector (chip presets: Aoede, Charon, Fenrir, Kore, Puck, Zephyr) with free-text fallback; all save on blur/click
3. **System Prompt** — textarea for `getCustomSystemPrompt()`; "Load default" populates built-in prompt; "Clear override" reverts to built-in; saves on button click
4. **Audio Narration Prompt** — textarea for `getAudioSystemPrompt()`; same load/clear/save pattern; controls TTS narration style and pacing

## Child Name

The child's name is stored in localStorage (`sw_child_name`, default `'Sophie'`) and lifted into `StoryWeaverApp` state as `childName`. It is passed as a prop to `Library`, `Creator`, and `Settings`. Changing the name in Settings calls `onNameChange` → updates both state and localStorage so all screens re-render with the new name without a page reload.

Do **not** read `window.SW.getChildName()` directly inside screen components — use the `childName` prop instead.

## Creator Form

The Creator screen lifts all form state into `app.jsx`:

| State | Default | Description |
|---|---|---|
| `context` | `"<childName> played in the garden…"` | Today's context / seed for the story |
| `vocab` | `['curious','tiny','gentle']` | Vocabulary words to weave in |
| `length` | `4` | Target minutes (2–8) |
| `tone` | `3` | 1=Calming → 5=Adventurous |
| `storyStyle` | `'prose'` | `'prose'` or `'rhyme'` (AABB couplets) |
| `character` | `''` | Optional character the child meets; free text or preset chip |

`CHARACTER_PRESETS` in `screens.jsx` = `['Rapunzel', 'a friendly dragon', 'a talking fox', 'a magical mermaid', 'a cloud fairy', 'a baby unicorn']`.

## Weaving Screen (Loading State)

`Weaving` component shows a phase progress list during generation. Phases reflect parallel execution:

- **phase `'text'`** — "Writing your story" + "Painting the cover" **both show active spinners** (running in parallel)
- **phase `'imagePending'`** — "Writing your story" shows ✓, "Painting the cover" + "Recording narration" both show spinners. "Skip cover · Read now" button appears when `onSkipImage` prop is non-null.
- **Cancel** button always visible
- Elapsed time counter (shown after 2s)
- Error state auto-dismisses after 4s and navigates back to `/create`

`getState(key)` in `Weaving` maps phase string → per-row state (`'done'`, `'active'`, `'pending'`) with special logic for parallel phases.

Race conditions are handled via `ignoreWeaveRef` (a `useRef`): set to `true` on cancel or skip before any async continuation checks it. `onSkipImage` calls `abortRef.current.abort()` to immediately cancel image + audio in-flight.

## Toast Notifications

`Toast({ toasts, onDismiss })` in `screens.jsx` renders error/success banners above the bottom nav. `addToast(msg, type)` in `app.jsx` auto-dismisses after 7s. Used for background failures (audio narration) that can't surface through the Weaving screen.

## AddLinkModal (Link a Storybook)

Opened from Creator → "Gemini Storybook" card, or the pencil edit button on any link in the library. Fields:

| Field | Notes |
|---|---|
| Gemini URL | Required; opens in a new tab when the card is tapped |
| Title | Required |
| Scene | SVG fallback scene — only shown when no `coverImage` |
| Palette | SVG fallback palette — only shown when no `coverImage` |
| Cover Image | Optional AI-generated cover; free-text prompt → `generateLinkCover` |

**Cover generation flow:**
1. User types a description of the storybook in the textarea
2. "Generate cover" calls `window.SW.generateLinkCover(description, signal)`
3. The local `AbortController` is stored in `abortRef`; a `useEffect` cleanup aborts it on unmount
4. On success: `coverImage` state is set; the SVG `<Cover>` preview is replaced by a `<img>` with a × to clear it
5. `coverImage` (data URL or null) is always included in the `onSave` payload and spread onto the item in `onSaveLink`

## Library Cards (`StoryCard`, `EditorialGrid`)

Both `StoryCard` (grid layouts) and the hero slot in `EditorialGrid` render `item.coverImage` as an `<img>` when the field is present and non-null. Otherwise they fall back to the SVG `<Cover>` component. This applies to both AI-generated stories and linked storybooks that have had a cover generated.

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

The cache is keyed `storyweaver-v3` in `sw.js`. Bump this string when you need to force-clear CDN caches on existing installs (app files are network-first and don't need a bump).

**Local dev note:** app files are network-first so they always load fresh when online. CDN resources are still cached aggressively. If you need a completely clean slate, unregister the SW and clear caches:
```js
(await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister());
(await caches.keys()).forEach(k => caches.delete(k));
location.reload(true);
```
The preview tool only serves **committed** files — commit before verifying in the browser.
