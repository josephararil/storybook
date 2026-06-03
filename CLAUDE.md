# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- CLAUDE: Update this file in the same commit as every structural change. No exceptions, no reminders needed.
     What counts: new/removed files, new exported functions, new component state or props, changed rendering
     behaviour, new UI flows, new API calls, changed data shapes, new routing. If you touched it, document it. -->

**Always update this file when you make structural changes** — new files, new state, new API methods, new routing, changed data shapes, new UI flows, changed rendering behaviour — without waiting to be asked. Same commit, every time.

## Git & Deployment

Git is fully configured. Always make a new branch if you are in `main` before starting new work. Once finished, merge all your code to that branch, and raise a PR to merge to `main` without needing approval.

The site is deployed via GitHub Pages from the `main` branch root. Once user accepts the PR to merge to `main`, this triggers a redeploy automatically after 60 seconds.

### Vercel deployment (proxy / shareable version)

The repo also includes a Vercel configuration (`vercel.json`) that enables a server-side proxy so the app can be shared without distributing an API key:

- **`api/gemini.js`** — Node.js serverless function. Receives requests at `https://api.josepharari.com/api/gemini?path=/v1beta/...`, forwards them to Google with `x-goog-api-key: process.env.GEMINI_API_KEY`, and returns the response verbatim. Includes CORS headers so it can be called cross-origin from the GitHub Pages front-end.
- **`vercel.json`** — sets `maxDuration: 60` for the function (image/audio calls can take up to 45 s; Vercel Pro plan required for the full 60 s; Hobby plan enforces a 10 s limit which may cause occasional timeouts on slow image generations) and adds a catch-all rewrite so all non-`/api/` paths serve `index.html`.
- **`GEMINI_API_KEY`** — must be set in the Vercel dashboard (Project → Settings → Environment Variables). Never committed to the repo.

**Architecture:** GitHub Pages at `josepharari.com/storybook` serves the front-end. The Vercel project is used exclusively as the API host at `api.josepharari.com`. These are independent deployments — the two DNS records coexist without conflict:

```
josepharari.com        CNAME → josephararil.github.io    (GitHub Pages — all projects)
api.josepharari.com    CNAME → cname.vercel-dns.com      (Vercel — function only)
```

When deploying / setting up for the first time:
1. Import the GitHub repo in the Vercel dashboard.
2. Add `GEMINI_API_KEY` as an environment variable.
3. In the Vercel project: Settings → Domains → add `api.josepharari.com`.
4. In your DNS provider: add a CNAME record `api` → `cname.vercel-dns.com`.
5. Deploy. Clients default to proxy mode when they have no personal key stored.

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
- Plain `<script>` tags (no Babel) are used for `data.js`, `sophie.js`, and `apiTracker.js`

**Script load order matters:**

```
data.js → sophie.js → apiTracker.js → store.js → cover.jsx → screens.jsx → callIndicator.jsx → app.jsx
```

## File Responsibilities

| File | Role |
|---|---|
| `index.html` | Entry point; CDN imports; script load order |
| `data.js` | 8 seed stories in `window.SW_STORIES` / `window.SW_SEEDS` |
| `sophie.js` | Hardcoded Sophie reference photo as `window.SOPHIE_IMAGE` (base64 JPEG, ~92 KB); plain `<script>`, not Babel |
| `apiTracker.js` | Plain `<script>` (no Babel); exports `window.SW_TRACKER`; in-memory ring buffer + IDB persistence for Gemini call events |
| `store.js` | All persistence and API logic; exports `window.SW`; IndexedDB wrapper, Gemini API calls, seed deletion, child profile, image compression, Google Drive integration |
| `cover.jsx` | Procedural SVG story cover art; 8 scene types; 3 render modes |
| `screens.jsx` | All app screens: Library, Creator, Settings (incl. Event Log), Reader, Weaving, ApiKeyModal, AddLinkModal, Toast; inline `Icon` component |
| `callIndicator.jsx` | Floating Gemini call indicator pill + tray; exports `window.CallIndicator` and `window.useApiCalls` hook |
| `app.jsx` | Root `StoryWeaverApp`; theme object; hash routing; lifted state; all event handlers; mounts `<CallIndicator>` |
| `sw.js` | Service worker — network-first for app files (updates always propagate), cache-first for CDN assets (pinned versions) |
| `manifest.webmanifest` | PWA install metadata |
| `api/gemini.js` | Vercel serverless proxy — forwards Gemini API calls with a server-side key; see Vercel deployment section |
| `vercel.json` | Vercel config: 60 s function timeout + catch-all rewrite for SPA routing |

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
  type:       'story',
  version:    2,                // v2 marker — anything without this is a legacy story
  pages:      [Page, ...],      // 4–14 entries (MIN_PAGES / MAX_PAGES constants in store.js)
  coverImage: 'data:image/webp;base64,...',  // = pages[0].image for library tile; null if all images failed
  coverDriveId: 'abc123XYZ',   // Google Drive file ID for page-1 cover (optional)
  audioReady: false,            // true once ALL per-page audio has settled in the audio IDB store
  createdAt:  1234567890,       // Date.now() timestamp
}
```

**`Page` shape** (stored inline on the story object):

```js
{
  text:        "On-screen prose (≤ ~35 words, may contain {vocab} braces)",
  imagePrompt: "Dense scene description for image model (~40–60 words, no text/lettering)",
  audioPrompt: "Narration text (plain words, no braces) with 1–2 inline audio tags like [whispers]",
  image:       'data:image/webp;base64,...' | null,  // inlined at weave time; null if image failed
}
```

Per-page audio is stored in the **`audio` IndexedDB store** keyed as `${storyId}::${pageIdx}`. The database (`storyweaver`) is at **version 3** — v3 added the `events` store for the call tracker. (e.g. `my-story::0`, `my-story::1`). The legacy single-story audio key (bare `storyId`) is still used by `audioGet/audioPut/audioDelete`; per-page callers use `audioGetPage/audioPutPage/audioDeleteStory`. `audioReady: true` on the story signals all pages' audio has settled.

**Out of scope (future milestones):**
- Per-page voice customisation — all pages use the same TTS voice; per-page overrides are not supported.

**Notes on Drive backup coverage:**
- All page images are included in `pushSync` because they are stored inline in `pages[].image` on the story object (part of the `items` IDB store).
- All per-page audio is included in `pushSync` via the `audio` IDB store (added in sync format v2).
- `coverDriveId` on story objects points to a separately uploaded cover file in `StoryWeaver/covers/` (legacy individual-file upload path); `pushSync`/`pullSync` is the preferred full-restore path.

**Legacy AI stories** (no `version` field, had `body: string[]`) are wiped on first load via a one-time migration (`sw_v2_migrated` localStorage flag). Seeds are unaffected.

**Link items** (manually added) have:

```js
{
  id, title,
  type:         'link',
  url:          'https://...',
  rating:       0,
  createdAt:    1234567890,
  coverImage:   'data:image/webp;base64,...',  // AI-generated cover (optional), or null/absent
  coverDriveId: 'abc123XYZ',                   // Google Drive file ID (optional)
}
```

Note: `scene` and `palette` are no longer written by the modal on new items. Existing items in IndexedDB may still have these fields but they are unused — there are no SVG Cover fallbacks in the UI.

## Persistence Layer (`window.SW`)

`store.js` exports the full API on `window.SW`:

| Method | Description |
|---|---|
| `itemsAll()` | Load all user-created items from IndexedDB, sorted newest-first |
| `itemPut(item)` | Upsert an item into IndexedDB |
| `itemDelete(id)` | Delete an item from IndexedDB |
| `audioGet(id)` | Load a WAV data URL from the `audio` IDB store by raw key (returns null if absent) |
| `audioPut(id, dataUrl)` | Upsert a WAV data URL into the `audio` IDB store by raw key |
| `audioDelete(id)` | Delete one audio entry by raw key |
| `audioGetPage(storyId, idx)` | Load per-page WAV — delegates to `audioGet('${storyId}::${idx}')` |
| `audioPutPage(storyId, idx, dataUrl)` | Store per-page WAV — key `${storyId}::${idx}` |
| `audioDeleteStory(storyId)` | Delete all `${storyId}::*` audio keys for a story (used on delete) |
| `mergeItems(persisted)` | Merge IndexedDB items with seeds (respects deleted seeds) |
| `getApiKey() / setApiKey(k) / hasApiKey() / validateApiKey(k)` | Gemini API key via localStorage |
| `getUseProxy() / setUseProxy(v)` | Whether to route calls through `/api/gemini` (proxy) or directly to Google (BYOK); defaults to proxy when no personal key is stored (`sw_use_proxy` in localStorage) |
| `isApiReady()` | Returns `true` when either proxy mode is active or a personal key is set — use instead of `hasApiKey()` to gate story generation |
| `getTextModel() / setTextModel(m)` | Text generation model (default `gemini-3.5-flash`) via localStorage `sw_text_model` |
| `getImageModel() / setImageModel(m)` | Image generation model (default `gemini-3.1-flash-image-preview`) via localStorage `sw_image_model` |
| `getAudioModel() / setAudioModel(m)` | TTS model (default `gemini-3.1-flash-tts-preview`) via localStorage `sw_audio_model` |
| `getAudioVoice() / setAudioVoice(v)` | TTS voice name (default `'Aoede'`) via localStorage `sw_audio_voice` |
| `getAudioConcurrency() / setAudioConcurrency(n)` | Max parallel audio calls for pages 1..N (default `2`, range 1–6) via localStorage `sw_audio_concurrency` |
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
| `weaveStory(form, existingIds, signal, onProgress)` | Images fan out in parallel; audio is serialized — page 0 first, then remaining pages with concurrency limited by `getAudioConcurrency()`. Returns `{ story, assetsPromise, firstAudioPromise }` — `story` has images inlined; `firstAudioPromise` resolves with page 0 WAV (or null) as soon as page 0 audio settles; `assetsPromise` resolves to `audioResults[]` when all page audio settles. Emits phases: `'text'`, `'assets'`, `'pageAsset'`, `'imageRetry'`, `'audio'`. |
| `generateAudioForPage(text, signal)` | Calls Gemini TTS for a single page's `audioPrompt` string; 120 s timeout; returns a WAV data URL or null. |
| `generateLinkCover(description, signal)` | Generate a cover image for a linked storybook; `description` is a free-text prompt about the book; returns a WebP data URL or throws |
| `regeneratePageImage(storyId, pageIdx, signal)` | Re-run `callImageApi` for one page's `imagePrompt`; updates `pages[pageIdx].image` (and `coverImage` if `pageIdx === 0`) in IDB; returns the new data URL or null on failure |
| `regeneratePageAudio(storyId, pageIdx, signal)` | Re-run `generateAudioForPage` for one page's `audioPrompt`; writes via `audioPutPage`; bumps `story.audioReady = true` in IDB if all pages now have audio; returns the WAV data URL or null |
| `getModelPricing()` | Returns the `MODEL_PRICING` constant (see below) |
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
| `drive.pushSync()` | Serializes all localStorage (excluding `sw_gemini_key`) + all IndexedDB items + all audio IDB entries → creates/overwrites `storyweaver-sync.json` (v2) in the `StoryWeaver/` Drive folder. Full state — stories, page images (inline in items), and per-page audio are all included. |
| `drive.pullSync()` | Downloads `storyweaver-sync.json` from Drive, restores localStorage keys, upserts IndexedDB items, restores all audio entries, then reloads the page. Handles both v1 (no audio) and v2 sync files. |

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

## Gemini Call Tracker (`window.SW_TRACKER`)

`apiTracker.js` (plain `<script>`, loads before `store.js`) exports `window.SW_TRACKER`. It maintains an in-memory ring buffer (max 200 events) and persists completed events to the `events` IndexedDB store (added in DB version 3). On page load it replays completed events from IDB so history survives refresh.

### `SW_TRACKER` API

| Method | Description |
|---|---|
| `start({kind, model, context})` | Create an `in_flight` event; returns numeric `id`. `context` is stored in full — do not truncate before passing. |
| `succeed(id, {durationMs})` | Mark event as `success`, persist to IDB, notify subscribers. |
| `fail(id, {durationMs, error})` | Mark event as `error`, persist to IDB, notify subscribers. |
| `getActive()` | Returns all `in_flight` events. |
| `getRecent(limit=20)` | Returns most recent completed events (newest first). |
| `getAll(limit=200)` | Returns all events (active + recent). |
| `subscribe(cb)` | Register a listener; returns an unsubscribe function. Used by `useApiCalls()` hook. |
| `clearLog()` | Removes all completed events from memory and clears the IDB `events` store. |

### `events` IDB store

Added in DB version 3 (shared `storyweaver` database, alongside `items` and `audio`). Key path is `id` (numeric, assigned by JS). Only settled events (status `success` or `error`) are written; `in_flight` events are memory-only.

### Instrumented Gemini calls

Every Gemini fetch in `store.js` must go through the tracker:

| Function | `kind` | Notes |
|---|---|---|
| `textCall` | `'text'` | Context = full `form.context` string |
| `callImageApi` (per attempt) | `'image'` | Each of the 3 retry attempts is a separate event; context = full prompt prefixed `[a1]`/`[a2]`/`[a3]` |
| `generateAudioForPage` | `'audio'` | Context = full `audioPrompt` text |
| `validateApiKey` | `'validate'` | Context = `'API key validation'` |

**Rule:** Any new Gemini fetch added to `store.js` must call `SW_TRACKER.start` / `succeed` / `fail`. Drive API calls are out of scope — do not instrument them.

### `CallIndicator` component

`callIndicator.jsx` exports `CallIndicator` (mounted in `app.jsx`) and `useApiCalls()` hook (also used by `Weaving` in `screens.jsx`).

- **Pill** — fixed top-right, z-index 250; hidden when no active calls and tray is closed; shows live call count with pulsing dot.
- **Tray** — drops down on tap; lists active calls (live duration counter) and up to 20 recent finished calls (✓/✗, duration, error); "View full log →" navigates to Settings → Event Log.

### Settings → Event Log section

Collapsible row in `Settings` (`screens.jsx`), below Google Drive and above Gemini AI. Shows up to 200 completed events grouped by calendar day. Each row: timestamp, model, kind, status (✓/✗), duration, error message. Two action buttons:

- **Copy log** — copies all events as JSON to clipboard.
- **Clear log** — calls `SW_TRACKER.clearLog()` and empties the IDB `events` store.

## Gemini AI Integration

### Models

Models are user-configurable via Settings → Gemini AI (stored in localStorage):

```js
// Defaults (overridden by sw_text_model / sw_image_model in localStorage)
const DEFAULT_TEXT_MODEL  = "gemini-3.5-flash";
const DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image";
```

### Image API helper (`callImageApi`)

`callImageApi(prompt, signal, onRetry)` in `store.js` handles all image generation. It:

- Resolves the reference image: Settings upload (`getSampleImage()`) takes priority; falls back to Sophie's hardcoded photo (`window.SOPHIE_IMAGE`); then none
- Applies a 45-second hard timeout via a nested `AbortController`
- POSTs to `getImageModel()` with `generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }`
- Returns a compressed WebP data URL via `compressToWebp`

Do not inline this logic into callers; add new image call sites by calling `callImageApi` instead.

### Story Generation Flow (`weaveStory`)

Images fan out in parallel; audio is serialized to avoid overwhelming the preview model's concurrency limits:

1. **`onProgress('text', null)`** — text call starting (spinner shown)
2. **`textCall` resolves** → `onProgress('assets', { story, total: N })` — N image calls + the audio pipeline all start
3. **Images** — all N pages fan out concurrently via `callImageApi`
4. **Audio** — page 0 always runs first (`generateAudioForPage`, 120 s timeout); after page 0 settles, remaining pages run with at most `getAudioConcurrency()` (default 2) in parallel
5. Each page emits `onProgress('pageAsset', { idx, kind: 'image'|'audio', ok })` when it settles
6. **`Promise.allSettled(imagePromises)` resolves** → `onProgress('audio', null)` → images inlined into `pages[].image`; `coverImage = pages[0].image`
7. **`weaveStory` returns** `{ story, assetsPromise, firstAudioPromise }` — story has images; `firstAudioPromise` resolves when page 0 audio is ready; `assetsPromise` resolves when all audio is done
8. **`onWeave` in `app.jsx`** saves the story, awaits `firstAudioPromise`, writes page 0 audio, then **navigates immediately**; remaining audio (pages 1..N) saves in the background and sets `audioReady: true` when complete

`onProgress` phase keys:
- `'text'` / null — text call starting
- `'assets'` / `{ story, total }` — text done, assets fanning out (`app.jsx` maps to `'imagePending'` UI state)
- `'pageAsset'` / `{ idx, kind, ok }` — one image or audio settled (rendered as progress pips in the Weaving screen)
- `'imageRetry'` / `{ idx, reason }` — per-page image retry fallback
- `'audio'` / null — all images settled, audio still in flight (`app.jsx` maps to `'audio'` UI phase)

### Image Safety & Retry Logic

`callImageApi` wraps `callImageApiOnce` with automatic fallbacks to handle Google's safety filters:
- **Attempt 1** (45 s): original prompt + reference image
- **Attempt 2** (30 s): `sanitizeImagePrompt(prompt)` + reference image — strips "featuring [name]", "Feature the child [name] prominently", replaces "child" with "illustrated character"
- **Attempt 3** (30 s): sanitized prompt, no reference image

Each fallback emits `onProgress('imageRetry', { idx, reason })` (`'adjusting_prompt'` or `'no_reference'`), which `app.jsx` maps to a human-readable sub-message shown in the Weaving screen.

**`PROHIBITED_CONTENT` handling:** If any attempt returns `finishReason: "PROHIBITED_CONTENT"`, `callImageApi` throws immediately with a user-visible message — no further retries. For `weaveStory`, the `imageCall(...).catch(() => null)` wrapper absorbs this and the story saves without a cover. For `generateLinkCover` (called from `AddLinkModal`), the error propagates to the UI, which displays it to the user. If all retries fail for other reasons, `callImageApi` returns `null` — callers must check for null and show an error.

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
| `[NARRATIVE ARC]` | Dynamic page count (`targetPages = clamp(form.pages || 6, MIN_PAGES, MAX_PAGES)`); named page beats: Discovery → Exploration (middle pages) → Comfort → Resolution |
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
| `context` | `''` | Today's context / seed for the story; placeholder "What did you do today?" |
| `vocab` | `[]` | Vocabulary words to weave in; user adds them as tags (optional — label says so) |
| `pages` | `6` | Target page count (range 4–10); slider labeled "How many pages?" |
| `tone` | `'Gentle'` | Tone string — free-text only; placeholder "e.g. calming, silly, adventurous, dreamy…" |
| `storyStyle` | `'prose'` | `'prose'` or `'rhyme'` (AABB couplets) |
| `character` | `''` | Optional character the child meets; plain text input |

`tone` is a **string** (not a number). `buildSystemPrompt`, `textCall`, and `imageCall` in `store.js` all accept a tone string directly; they fall back to `'Gentle'` if the string is empty. There are no tone preset chips — free-text input only.

`pages` is passed directly to `textCall` where `targetPages = clamp(form.pages || 6, MIN_PAGES, MAX_PAGES)`. `MIN_PAGES = 4`, `MAX_PAGES = 10`.

## Weaving Screen (Loading State)

`Weaving` component shows a phase progress list during generation. Phases reflect parallel execution:

- **phase `'text'`** — animated orb, "Writing your story" spinner
- **phase `'imagePending'`** — compact star, "Writing your story" shows ✓, per-page grid with img + aud pips per page, "🔊 Recording narration" spinner row
- **phase `'audio'`** — same as `'imagePending'` but audio row is highlighted (text colour instead of muted); emitted by `weaveStory` after `Promise.allSettled(imagePromises)` resolves
- **Cancel** button always visible
- Elapsed time counter (always visible, no delay gate)
- **"Read now (some pages may be missing audio)"** early-exit button — shown during `imagePending` or `audio` phase; clicking aborts in-flight calls, marks `readNowRef`, navigates if story already saved (audio phase), or lets `onWeave` navigate when it saves the partial story (imagePending phase)
- Error state auto-dismisses after 4s and navigates back to `/create`

**Navigation is blocked until ALL audio settles** (or user clicks "Read now"). `onWeave` in `app.jsx` awaits `assetsPromise` before calling `navigate('/story/' + id)`.

Race conditions are handled via:
- `ignoreWeaveRef` (`useRef`) — set to `true` on cancel or "Read now" (audio phase); prevents double-navigation
- `readNowRef` (`useRef`) — set to `true` on "Read now"; causes `onWeave` to navigate immediately after `itemPut` (imagePending path)
- `weavingStoryIdRef` (`useRef`) — holds the saved story's id once `itemPut` completes; used by "Read now" to navigate directly

## Toast Notifications

`Toast({ toasts, onDismiss })` in `screens.jsx` renders error/success banners above the bottom nav. `addToast(msg, type)` in `app.jsx` auto-dismisses after 7s. Used for background failures (audio narration) that can't surface through the Weaving screen.

## AddLinkModal (Link / Edit Cover)

Opened from Creator → "Gemini Storybook" card, or the **pencil button on any library card** (both link items and AI-generated stories).

The modal has two modes controlled by `isLink = !item || item.type === 'link'`:

| Mode | Title | Fields shown | Save payload |
|---|---|---|---|
| New link (`!item`) | "Link a Storybook" | URL (required), Title (required), Cover Image | `{ url, title, coverImage }` |
| Edit link (`item.type === 'link'`) | "Edit Storybook" | URL (required), Title (required), Cover Image | `{ url, title, coverImage }` |
| Edit story (`item.type === 'story'`) | "Edit Cover" | Cover Image only | `{ coverImage }` |

Scene and Palette fields have been removed — there are no SVG fallback options in the modal.

**Cover generation flow:**
1. User types a description in the textarea
2. "Generate cover" calls `window.SW.generateLinkCover(description, signal)`
3. The local `AbortController` is stored in `abortRef`; a `useEffect` cleanup aborts it on unmount
4. On success: `coverImage` state is set; the placeholder is replaced by an `<img>` with a × to clear it
5. On `PROHIBITED_CONTENT` or null result: `coverError` is set and shown to the user
6. `coverImage` is always included in the `onSave` payload; for story items `onSaveLink` spreads it onto the existing item

## Library Cards (`StoryCard`, `EditorialGrid`)

Both `StoryCard` (grid layouts) and the hero slot in `EditorialGrid` render `item.coverImage` as an `<img>` when the field is present and non-null. Otherwise they show a simple 📖 emoji placeholder — there is no SVG Cover fallback.

Every card shows a pencil button (not just link items). Clicking it opens `AddLinkModal` in the appropriate mode — "Edit Storybook" for links, "Edit Cover" for AI-generated stories.

**Library filters:** Three chips — All / Stories / Linked. "Stories" matches `item.type === 'story'` (includes seeds); "Linked" matches `item.type === 'link'`. The old category chips (Bedtime, Animals, etc.) have been removed.

## Reader Screen

`Reader` in `screens.jsx` is a router — it dispatches to one of two implementations based on story shape:

```js
const isPaged = story.version === 2 && Array.isArray(story.pages);
return isPaged ? <PagedReader .../> : <LegacyReader .../>;
```

### LegacyReader (seed stories + any non-v2 story)

Renders at `z-index: 100`. Scrollable layout: hero cover image or 📖 placeholder, title, body paragraphs (`story.body[]`), rating panel, delete button. Floating audio button at bottom when `story.audioReady` is true. Lightbox on cover-image tap.

### PagedReader (v2 AI stories — `story.version === 2 && story.pages[]`)

Renders at `z-index: 100`. Full-bleed layout split into two sections:

- **Image section** (top 68vh): current page image fills full width/height (`objectFit: cover`). 📖 placeholder if no image. Gradient overlay at bottom. Title + category shown only on page 0 (absolute-positioned). Page counter (top-left). Close button × (top-right, z-index 5). Eye icon to open lightbox (top-right below close, z-index 5). Three invisible tap-zone buttons at z-index 2 (left third = prev, centre third = toggle pause/play, right third = next).
- **Text panel** (remaining viewport): translucent dark background. Pause/Play pill button (top-right, only when current page has audio). Page text rendered via `renderLine()` with `{vocab}` highlighting. "Tap → to continue" hint appears after 6 s when a page has no audio. Rating panel + delete button shown only on the last page.

**State:** `currentPage`, `playing`, `audioByPage` (plain object `{[idx]: dataUrl|null}`), `audiosLoaded` (bool), `imageZoom`, `rating`, `tapHint`.

**Audio:** All per-page audios are loaded on mount via `audioGetPage(storyId, idx)` in a sequential async loop. When `currentPage` changes (or audios finish loading), the effect sets `audioRef.current.src` and calls `play()` if audio exists for that page. On `ended`, `goNext()` is called — auto-advancing to the next page. If no audio for a page, a 6 s timer fires `setTapHint(true)`.

**Z-index ladder:** Reader 100 → tap zones 2 → close/eye buttons 5 → lightbox 300.

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

`sophie.js` sets `window.SOPHIE_IMAGE = { mimeType: "image/jpeg", data: "<base64>" }`. This is loaded as a plain `<script>` (not Babel) before `store.js`. The image is Sophie's photo compressed to ~69 KB JPEG. It is used as the fallback reference image for AI cover generation.

**Priority:** `callImageApiOnce` checks `getSampleImage()` (user's upload from Settings → Illustration Reference) first. Only if no user image is stored does it fall back to `window.SOPHIE_IMAGE`. This means uploading a photo in Settings fully overrides `sophie.js` for all subsequent cover generation.

To update the default photo: convert the new image to base64 JPEG and replace the `data` value in `sophie.js`.

## Per-Page Regeneration (PagedReader)

When a v2 story page is missing its image or audio, `PagedReader` shows inline recovery buttons:

- **Missing image** — a "Regenerate image" button is overlaid on the 📖 placeholder in the image section. Clicking calls `window.SW.regeneratePageImage`. On success the new image is applied via a `localImages` state map (overrides `page.image` without mutating the prop or re-loading the full story). Button shows "Generating…" while in flight and "Try again" after an error.
- **Missing audio** — a "Regenerate audio" button appears in the text panel where Play/Pause would be. Clicking calls `window.SW.regeneratePageAudio`. On success `audioByPage` state is updated directly, which re-triggers the auto-play effect. Button shows "Recording…" while in flight.

Both regen paths flow through `SW_TRACKER` so calls appear in the call indicator and Event Log. Errors are surfaced via `addToast` (prop passed from `app.jsx`).

## Cost Estimate (PagedReader, last page)

On the last page of a v2 story, below the star rating, a faint "Cost ~ $X.XXX ▼" button appears when any pricing data is available. Tapping expands an inline breakdown showing text / image / audio costs separately.

Costs are computed from `MODEL_PRICING` in `store.js`:
```js
// Approximate Gemini pricing (USD) — https://ai.google.dev/pricing
const MODEL_PRICING = {
  'gemini-2.5-flash':             { inputPer1M: 0.15,  outputPer1M: 0.60  },
  'gemini-3.5-flash':             { inputPer1M: 0.15,  outputPer1M: 0.60  },
  'gemini-2.5-flash-image':       { perImage: 0.039 },
  'gemini-2.5-flash-preview-tts': { perSecond: 0.000040 },
  ...
};
```

- **Text**: 1 000 input tokens + `pages.length × 100` output tokens at model rates.
- **Images**: `nImages × pricing.perImage`
- **Audio**: `nAudio × 10 s × pricing.perSecond` (fixed 10-second/page estimate)

The breakdown also notes "Estimate only — see ai.google.dev/pricing."

`SW_TRACKER` events now store `inputTokens`, `outputTokens` (from `usageMetadata` in text responses) and `audioSeconds` (from WAV byte length in TTS responses) when available.

## Service Worker Cache

The cache is keyed `storyweaver-v5` in `sw.js`. Bump this string when you need to force-clear CDN caches on existing installs (app files are network-first and don't need a bump).

**Local dev note:** app files are network-first so they always load fresh when online. CDN resources are still cached aggressively. If you need a completely clean slate, unregister the SW and clear caches:
```js
(await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister());
(await caches.keys()).forEach(k => caches.delete(k));
location.reload(true);
```
The preview tool only serves **committed** files — commit before verifying in the browser.
