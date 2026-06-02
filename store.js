// StoryWeaver persistent store
// Exports window.SW — must load after data.js, before cover.jsx / screens.jsx / app.jsx

const DEFAULT_TEXT_MODEL  = "gemini-3.5-flash";
const DEFAULT_IMAGE_MODEL = "gemini-2.5-flash-image";
const DEFAULT_AUDIO_MODEL = "gemini-2.5-flash-preview-tts";

const MIN_PAGES = 4;
const MAX_PAGES = 10;

// Approximate Gemini API pricing (USD) — https://ai.google.dev/pricing
// inputPer1M / outputPer1M: cost per 1 million tokens. perImage: per generated image.
// perSecond: cost per second of generated audio (24 kHz 16-bit mono PCM).
const MODEL_PRICING = {
  'gemini-2.5-flash':             { inputPer1M: 0.15,  outputPer1M: 0.60  },
  'gemini-3.5-flash':             { inputPer1M: 0.15,  outputPer1M: 0.60  },
  'gemini-2.5-flash-image':       { perImage: 0.039 },
  'gemini-3.1-flash-image':       { perImage: 0.039 },
  'gemini-2.5-flash-preview-tts': { perSecond: 0.000040 },
  'gemini-3.1-flash-tts-preview': { perSecond: 0.000040 },
};

// Capture seeds once; stays static throughout the session
window.SW_SEEDS = window.SW_STORIES;

// ─── IndexedDB wrapper ────────────────────────────────────────
let _db = null;
function dbOpen() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('storyweaver', 3);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('items'))  db.createObjectStore('items',  { keyPath: 'id' });
      if (!db.objectStoreNames.contains('audio'))  db.createObjectStore('audio',  { keyPath: 'id' });
      if (!db.objectStoreNames.contains('events')) db.createObjectStore('events', { keyPath: 'id' });
    };
    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
      if (!localStorage.getItem('sw_v2_migrated')) _runLegacyWipe(_db).catch(() => {});
    };
    req.onerror  = ()  => reject(req.error);
  });
}

function itemsAll() {
  return dbOpen().then(db => new Promise((resolve, reject) => {
    const req = db.transaction('items', 'readonly').objectStore('items').getAll();
    req.onsuccess = () => {
      const arr = req.result || [];
      arr.sort((a, b) => b.createdAt - a.createdAt);
      resolve(arr);
    };
    req.onerror = () => reject(req.error);
  }));
}

function itemPut(item) {
  return dbOpen().then(db => new Promise((resolve, reject) => {
    const req = db.transaction('items', 'readwrite').objectStore('items').put(item);
    req.onsuccess = () => resolve();
    req.onerror  = ()  => reject(req.error);
  }));
}

function itemDelete(id) {
  return dbOpen().then(db => new Promise((resolve, reject) => {
    const req = db.transaction('items', 'readwrite').objectStore('items').delete(id);
    req.onsuccess = () => resolve();
    req.onerror  = ()  => reject(req.error);
  }));
}

function itemGet(id) {
  return dbOpen().then(db => new Promise((resolve, reject) => {
    const req = db.transaction('items', 'readonly').objectStore('items').get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = ()  => reject(req.error);
  }));
}

function audioGet(id) {
  return dbOpen().then(db => new Promise((resolve, reject) => {
    const req = db.transaction('audio', 'readonly').objectStore('audio').get(id);
    req.onsuccess = () => resolve(req.result?.data || null);
    req.onerror   = ()  => reject(req.error);
  }));
}

function audioPut(id, dataUrl) {
  return dbOpen().then(db => new Promise((resolve, reject) => {
    const req = db.transaction('audio', 'readwrite').objectStore('audio').put({ id, data: dataUrl });
    req.onsuccess = () => resolve();
    req.onerror   = ()  => reject(req.error);
  }));
}

function audioDelete(id) {
  return dbOpen().then(db => new Promise((resolve, reject) => {
    const req = db.transaction('audio', 'readwrite').objectStore('audio').delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = ()  => reject(req.error);
  }));
}

function audioGetPage(storyId, idx) {
  return audioGet(`${storyId}::${idx}`);
}
function audioPutPage(storyId, idx, dataUrl) {
  return audioPut(`${storyId}::${idx}`, dataUrl);
}
function audioDeleteStory(storyId) {
  return dbOpen().then(db => new Promise((resolve, reject) => {
    const prefix = storyId + '::';
    const req = db.transaction('audio', 'readonly').objectStore('audio').getAllKeys();
    req.onsuccess = () => {
      const keys = (req.result || []).filter(k => typeof k === 'string' && k.startsWith(prefix));
      if (!keys.length) { resolve(); return; }
      const tx = db.transaction('audio', 'readwrite');
      const store = tx.objectStore('audio');
      keys.forEach(k => store.delete(k));
      tx.oncomplete = () => resolve();
      tx.onerror    = ()  => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  }));
}

// One-time wipe of legacy AI stories (type='story', version!==2) and their audio.
// Runs async after dbOpen resolves — does not block callers.
async function _runLegacyWipe(db) {
  try {
    const allItems = await new Promise((resolve, reject) => {
      const r = db.transaction('items', 'readonly').objectStore('items').getAll();
      r.onsuccess = () => resolve(r.result || []);
      r.onerror   = () => reject(r.error);
    });
    const legacyIds = allItems
      .filter(i => i.type === 'story' && i.version !== 2)
      .map(i => i.id);
    if (!legacyIds.length) { localStorage.setItem('sw_v2_migrated', '1'); return; }
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['items', 'audio'], 'readwrite');
      const items = tx.objectStore('items');
      const audio = tx.objectStore('audio');
      legacyIds.forEach(id => { items.delete(id); audio.delete(id); });
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
    localStorage.setItem('sw_v2_migrated', '1');
  } catch (e) {
    console.warn('Legacy wipe failed:', e);
  }
}

// ─── API key helpers ──────────────────────────────────────────
function getApiKey()  { return localStorage.getItem('sw_gemini_key') || ''; }
function setApiKey(k) { localStorage.setItem('sw_gemini_key', k); }
function hasApiKey()  { return !!localStorage.getItem('sw_gemini_key'); }

// ─── Model helpers ────────────────────────────────────────────
function getTextModel()   { return localStorage.getItem('sw_text_model')  || DEFAULT_TEXT_MODEL; }
function setTextModel(m)  { localStorage.setItem('sw_text_model', m); }
function getImageModel()  { return localStorage.getItem('sw_image_model') || DEFAULT_IMAGE_MODEL; }
function setImageModel(m) { localStorage.setItem('sw_image_model', m); }
function getAudioModel()  { return localStorage.getItem('sw_audio_model') || DEFAULT_AUDIO_MODEL; }
function setAudioModel(m) { localStorage.setItem('sw_audio_model', m); }
function getAudioVoice()  { return localStorage.getItem('sw_audio_voice') || 'Zephyr'; }
function setAudioVoice(v) { localStorage.setItem('sw_audio_voice', v); }
function getAudioSystemPrompt()  { return localStorage.getItem('sw_audio_sys_prompt') || ''; }
function setAudioSystemPrompt(s) {
  if (s) localStorage.setItem('sw_audio_sys_prompt', s);
  else   localStorage.removeItem('sw_audio_sys_prompt');
}
function getDefaultAudioSystemPrompt() {
  return [
    `Read the following transcript based on the performance and scene context.`,
    ``,
    `### SCENE`,
    `A quiet children's bedroom, low light, with an attentive 4-year-old listening to every word.`,
    ``,
    `### PERFORMANCE`,
    `Role: A parent reading a bedtime story.`,
    `Style: Warm, understanding, and patient with gentle inflections. Speak unhurriedly with natural pauses to let the magic of the story settle.`,
    `Accent: British (RP) from a member of the Royal family, having lived in London all their life.`,
    ``,
    `#### TRANSCRIPT`
  ].join('\n');
}

// ─── Custom system prompt helpers ─────────────────────────────
function getCustomSystemPrompt()  { return localStorage.getItem('sw_system_prompt') || ''; }
function setCustomSystemPrompt(s) {
  if (s) localStorage.setItem('sw_system_prompt', s);
  else   localStorage.removeItem('sw_system_prompt');
}


async function validateApiKey(k) {
  const _t0  = Date.now();
  const _tid = window.SW_TRACKER?.start({ kind: 'validate', model: '-', context: 'API key validation' });
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': k },
    });
    if (r.ok) window.SW_TRACKER?.succeed(_tid, { durationMs: Date.now() - _t0 });
    else       window.SW_TRACKER?.fail(_tid,    { durationMs: Date.now() - _t0, error: `HTTP ${r.status}` });
    return r.ok;
  } catch (e) {
    window.SW_TRACKER?.fail(_tid, { durationMs: Date.now() - _t0, error: e.message });
    return false;
  }
}

// ─── Seed rating helpers ──────────────────────────────────────
function getSeedRatings() {
  try { return JSON.parse(localStorage.getItem('sw_seed_ratings') || '{}'); }
  catch { return {}; }
}
function saveSeedRating(id, n) {
  const r = getSeedRatings();
  r[id] = n;
  localStorage.setItem('sw_seed_ratings', JSON.stringify(r));
}

// ─── Seed deletion helpers ────────────────────────────────────
function getSeedDeletions() {
  try { return JSON.parse(localStorage.getItem('sw_deleted_seeds') || '[]'); }
  catch { return []; }
}
function deleteSeed(id) {
  const d = getSeedDeletions();
  if (!d.includes(id)) {
    d.push(id);
    localStorage.setItem('sw_deleted_seeds', JSON.stringify(d));
  }
}

// ─── Child profile helpers ────────────────────────────────────
function getChildName()      { return localStorage.getItem('sw_child_name') || 'Sophie'; }
function setChildName(n)     { localStorage.setItem('sw_child_name', n); }
function getChildBirthday()  { return localStorage.getItem('sw_child_birthday') || ''; }
function setChildBirthday(d) { localStorage.setItem('sw_child_birthday', d); }

// ─── Sample reference image helpers ──────────────────────────
function getSampleImage()        { return localStorage.getItem('sw_sample_image'); }
function setSampleImage(dataUrl) { localStorage.setItem('sw_sample_image', dataUrl); }
function clearSampleImage()      { localStorage.removeItem('sw_sample_image'); }

function compressImageForStorage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const MAX = 1024;
          let w = img.naturalWidth, h = img.naturalHeight;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else       { w = Math.round(w * MAX / h); h = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const result = canvas.toDataURL('image/webp', 0.5);
          resolve(result.startsWith('data:image/webp') ? result : canvas.toDataURL('image/jpeg', 0.6));
        } catch(err) { reject(err); }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Merge persisted items + seeds ───────────────────────────
function mergeItems(persisted) {
  const ratings  = getSeedRatings();
  const deleted  = new Set(getSeedDeletions());
  const seedIds  = new Set((window.SW_SEEDS || []).map(s => s.id));
  const nonSeed  = persisted.filter(i => !seedIds.has(i.id));
  const seeds    = (window.SW_SEEDS || [])
    .filter(s => !deleted.has(s.id))
    .map(s => ({
      ...s,
      type: 'story',
      rating: ratings[s.id] !== undefined ? ratings[s.id] : s.rating,
      createdAt: 0,
    }));
  return [...nonSeed, ...seeds];
}

// ─── ID helpers ───────────────────────────────────────────────
function slugify(title) {
  return ((title || 'story'))
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'story';
}
function uniqueId(base, existingIds) {
  if (!existingIds.includes(base)) return base;
  let n = 2;
  while (existingIds.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// ─── Image compression ────────────────────────────────────────
function compressToWebp(base64Png) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const result = canvas.toDataURL('image/webp', 0.6);
        resolve(result.startsWith('data:image/webp') ? result : `data:image/png;base64,${base64Png}`);
      } catch { resolve(`data:image/png;base64,${base64Png}`); }
    };
    img.onerror = () => resolve(`data:image/png;base64,${base64Png}`);
    img.src = `data:image/png;base64,${base64Png}`;
  });
}

// ─── PCM → WAV conversion ─────────────────────────────────────
function pcmToWav(pcmBytes, sampleRate, numChannels, bitsPerSample) {
  const dataLen = pcmBytes.byteLength || pcmBytes.length;
  const buf  = new ArrayBuffer(44 + dataLen);
  const view = new DataView(buf);
  const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4,  36 + dataLen, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);  // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLen, true);
  new Uint8Array(buf, 44).set(pcmBytes);
  return buf;
}

function uint8ArrayToBase64(bytes) {
  let binary = '';
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
  }
  return btoa(binary);
}

// ─── Story schema ─────────────────────────────────────────────
const PAGE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    text:        { type: 'STRING' },
    imagePrompt: { type: 'STRING' },
    audioPrompt: { type: 'STRING' },
  },
  required: ['text', 'imagePrompt', 'audioPrompt'],
  propertyOrdering: ['text', 'imagePrompt', 'audioPrompt'],
};

const STORY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    id:       { type: 'STRING' },
    title:    { type: 'STRING' },
    category: { type: 'STRING', enum: ['Bedtime','Animals','Magic','Adventure','Friends'] },
    rating:   { type: 'INTEGER' },
    palette:  { type: 'ARRAY', items: { type: 'STRING' } },
    scene:    { type: 'STRING', enum: ['moon','fox','unicorn','whale','dragon','bear','cloud','turtle'] },
    vocab:    { type: 'ARRAY', items: { type: 'STRING' } },
    pages:    { type: 'ARRAY', items: PAGE_SCHEMA, minItems: MIN_PAGES, maxItems: MAX_PAGES },
  },
  required: ['id','title','category','rating','palette','scene','vocab','pages'],
  propertyOrdering: ['id','title','category','rating','palette','scene','vocab','pages'],
};

const VALID_SCENES     = ['moon','fox','unicorn','whale','dragon','bear','cloud','turtle'];
const VALID_CATEGORIES = ['Bedtime','Animals','Magic','Adventure','Friends'];
const TONE_WORDS       = ['Calming','Cozy','Gentle','Playful','Adventurous'];

function guessScene(context) {
  const lc = context.toLowerCase();
  for (const s of VALID_SCENES) { if (lc.includes(s)) return s; }
  return 'moon';
}

// ─── Gemini API calls ─────────────────────────────────────────
function buildSystemPrompt(form, childName, childAppearance, targetPages) {
  const toneWord = typeof form.tone === 'string'
    ? (form.tone.trim() || 'Gentle')
    : (TONE_WORDS[(form.tone || 3) - 1] || 'Gentle');

  const companionLine = form.character?.trim()
    ? `Companion: ${childName} meets ${form.character.trim()}. The meeting is warm and joyful. No other characters.`
    : `Companion: Exactly one friendly animal or magical creature. No other characters.`;

  // Consolidated style rules to avoid Dr. Seuss vs. Julia Donaldson collisions
  const sentenceRules = form.storyStyle === 'rhyme'
    ? [
        `Structure: Write in rhythmic, rhyming verse (AABB couplets).`,
        `Style: Emulate Julia Donaldson — use a predictable, suspenseful pace with a rhythmic, rhyming verse that uses a repetitive, cumulative structure that is highly engaging for children.`,
        `Language: Use simple, comforting vocabulary suitable for a 4-year-old. Every rhyme must be a true rhyme.`
      ].join(' ')
    : `Structure: Use short, clear sentences. Vary the rhythm so it sounds natural and conversational when read aloud. Use present tense.`;

  let narrativeArc = [];
  if (targetPages <= 3) {
    narrativeArc = [
      `Page 1. Discovery & Meeting: ${childName} finds a magical element in a safe setting and warmly meets her companion.`,
      `Page 2. Exploration: They play and collaborate using a gentle magical mechanic.`,
      `Page 3. Resolution: A soft transition to rest. ${childName} feels safe and sleepy. End peacefully.`,
    ];
  } else {
    const middleCount = targetPages - 3;
    narrativeArc = [
      `Page 1. Discovery & Meeting: ${childName} finds a magical element in a safe setting and warmly introduces herself to her companion.`,
      `Pages 2 to ${1 + middleCount}. Exploration: Across these middle pages, they explore and play using a gentle magical mechanic. Deepen their connection.`,
      `Page ${2 + middleCount}. Comfort: A gentle transition toward rest. A soft problem is solved or a quiet realization is shared.`,
      `Page ${3 + middleCount}. Resolution: The companion settles down. ${childName} feels safe, loved, and sleepy. End on absolute warmth and peace.`,
    ];
  }

  return [
    `You are an expert children's author writing warm, comforting bedtime stories. Return ONLY valid JSON matching the exact schema requested.`,
    ``,
    `[CHARACTER & TONE]`,
    `Main character: ${childName}. Imaginative, brave, and active—she drives the action.`,
    companionLine,
    `Tone: ${toneWord} — permeate every sentence with this feeling.`,
    `Atmosphere: Weave in gentle sensory details (soft hums, textures, gentle glows). Focus on comfort and wonder.`,
    `Localization: Use strict British English spelling and terminology (e.g., pyjamas, garden, colour, mum).`,
    ``,
    `[STYLE & FORMATTING]`,
    sentenceRules,
    `Vocabulary Requirement: Every word in the provided vocabulary list MUST appear in at least one page's "text" field, wrapped in curly braces (e.g., {gentle}). Do not alter the word inside the braces.`,
    ``,
    `[NARRATIVE ARC (${targetPages} total pages)]`,
    ...narrativeArc,
    ``,
    `[PAGE FIELDS — required for every page object]`,
    `text: On-screen prose for this page. ≤ ~35 words. Designed to be heard out loud while a single illustration is shown. Vocab braces apply here only.`,
    `imagePrompt: Dense, concrete scene description for the image model. Include: setting, characters (describe ${childName} as "${childAppearance}"), their action, lighting, mood, and art style (soft watercolour children's book illustration). Ensure the companion's visual description remains identical on every page. No text or lettering in the image. ~40–60 words.`,
    `audioPrompt: Narration text for the TTS Model. The spoken words MUST be 100% identical to the "text" field so the audio perfectly matches the screen. 1) Remove all {vocab} braces. 2) Inject inline audio tag modifiers ([tag]) to control delivery. Be creative with tags to make it engaging, like a real parent reading to their child. Example: "[very happy] Sophie skips into her bedroom, [amazed] still wearing her shiny crown! [laughs]"`,
    ``,
    `[JSON SCHEMA OUTPUT]`,
    `scene ∈ {moon,fox,unicorn,whale,dragon,bear,cloud,turtle}`,
    `category ∈ {Bedtime,Animals,Magic,Adventure,Friends}`,
    `palette: Exactly 3 #rrggbb hex codes (dark base, mid tone, light accent). id: kebab-case from title. rating: 0.`,
    `pages: Array of exactly ${targetPages} page objects, one per narrative page. Each must have text, imagePrompt, and audioPrompt.`,
  ].filter(Boolean).join('\n');
}

function getDefaultSystemPrompt() {
  return buildSystemPrompt(
    { character: '', storyStyle: 'prose', tone: 3, pages: 6 },
    getChildName(),
    6
  );
}

async function textCall(form, existingIds, signal) {
  const _t0  = Date.now();
  const _tid = window.SW_TRACKER?.start({ kind: 'text', model: getTextModel(), context: (form.context || '').slice(0, 80) });
  try {
    const toneWord    = typeof form.tone === 'string' ? (form.tone.trim() || 'Gentle') : (TONE_WORDS[form.tone - 1] || 'Gentle');
    const childName   = getChildName();
    const targetPages = Math.min(MAX_PAGES, Math.max(MIN_PAGES, form.pages || 6));
    const vocabStr    = (form.vocab || []).length ? `\nVocabulary: ${form.vocab.join(', ')}` : '';
    const sysPrompt   = getCustomSystemPrompt() || buildSystemPrompt(form, childName, targetPages);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${getTextModel()}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': getApiKey() },
        signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sysPrompt }] },
          contents: [{
            role: 'user',
            parts: [{ text: `Context: ${form.context}\nTone: ${toneWord}\nTarget length: ~${targetPages} pages${vocabStr}` }],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: STORY_SCHEMA,
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`API response ${res.status}: ${body?.error?.message || 'Unknown error'}`);
    }

    const data = await res.json();
    if (data.promptFeedback?.blockReason) {
      throw new Error('The story was blocked — try gentler wording.');
    }

    let story;
    try { story = JSON.parse(data.candidates[0].content.parts[0].text); }
    catch { throw new Error('Gemini returned an unexpected response. Please try again.'); }

    story.rating   = 0;
    story.palette  = Array.isArray(story.palette) && story.palette.length >= 3
      ? story.palette.slice(0, 3)
      : ['#0f172a','#312e81','#fbbf24'];
    story.scene    = VALID_SCENES.includes(story.scene)        ? story.scene    : 'moon';
    story.category = VALID_CATEGORIES.includes(story.category) ? story.category : 'Bedtime';
    if (!Array.isArray(story.pages)) story.pages = [];
    if (!Array.isArray(story.vocab)) story.vocab = [];
    story.id = uniqueId(slugify(story.title), existingIds);

    const usage = data.usageMetadata || {};
    window.SW_TRACKER?.succeed(_tid, {
      durationMs:   Date.now() - _t0,
      inputTokens:  usage.promptTokenCount    || undefined,
      outputTokens: usage.candidatesTokenCount || undefined,
    });
    return story;
  } catch (e) {
    window.SW_TRACKER?.fail(_tid, { durationMs: Date.now() - _t0, error: e.message });
    throw e;
  }
}

// Single image API attempt. useRefImage controls whether the reference photo is attached.
async function callImageApiOnce(prompt, signal, useRefImage, timeoutMs) {
  const refImage = useRefImage ? (() => {
    // User-uploaded image takes priority over the hardcoded Sophie photo
    const s = getSampleImage();
    if (s) {
      const m = s.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (m) return { mimeType: m[1], data: m[2] };
    }
    if (window.SOPHIE_IMAGE?.data) return window.SOPHIE_IMAGE;
    return null;
  })() : null;

  const parts = [{ text: prompt }];
  if (refImage) parts.push({ inline_data: { mime_type: refImage.mimeType, data: refImage.data } });

  const ctrl    = new AbortController();
  const timerId = setTimeout(() => ctrl.abort(), timeoutMs);
  if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${getImageModel()}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': getApiKey() },
        signal: ctrl.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      }
    );
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`API response ${res.status}: ${errBody?.error?.message || 'Unknown error'}`);
    }
    const data      = await res.json();
    const candidate = data?.candidates?.[0];
    if (candidate?.finishReason === 'PROHIBITED_CONTENT') throw new Error('PROHIBITED_CONTENT');
    const resParts  = candidate?.content?.parts || [];
    const imgPart   = resParts.find(p => p.inlineData || p.inline_data);
    if (!imgPart) throw new Error('No image in response.');
    const inlineData = imgPart.inlineData || imgPart.inline_data;
    return compressToWebp(inlineData.data);
  } finally {
    clearTimeout(timerId);
  }
}

// Strips phrases that commonly trip safety filters (named characters, "child" references).
function sanitizeImagePrompt(prompt) {
  return prompt
    .replace(/,?\s*featuring\s+\w+\.?\s*/gi, ' ')
    .replace(/\bfeature\s+the\s+(?:child|girl|boy)\s+\w+\s+prominently[,.]?\s*/gi, '')
    .replace(/\bchild\b/gi, 'illustrated character')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Tries up to 3 times with progressively safer params.
// onRetry(reason) is called before each fallback so the UI can show a status message.
// Throws immediately on PROHIBITED_CONTENT — caller must surface this to the user.
// Returns null if all non-prohibited attempts fail — story is still saved without a cover.
// Each attempt is logged separately in SW_TRACKER with the attempt number in context.
async function callImageApi(prompt, signal, onRetry) {
  if (signal?.aborted) return null;

  const prohibited = (e) => { if (e.message === 'PROHIBITED_CONTENT') throw new Error('Gemini rejected this prompt — please try different wording.'); };

  // Attempt 1: original prompt + reference image (45 s)
  {
    const _t0  = Date.now();
    const _tid = window.SW_TRACKER?.start({ kind: 'image', model: getImageModel(), context: `[a1] ${prompt.slice(0, 60)}` });
    try {
      const r = await callImageApiOnce(prompt, signal, true, 45000);
      window.SW_TRACKER?.succeed(_tid, { durationMs: Date.now() - _t0 });
      return r;
    } catch (e) {
      window.SW_TRACKER?.fail(_tid, { durationMs: Date.now() - _t0, error: e.message });
      prohibited(e);
    }
  }
  if (signal?.aborted) return null;

  // Attempt 2: sanitized prompt + reference image (30 s)
  const safePrompt = sanitizeImagePrompt(prompt);
  onRetry?.('adjusting_prompt');
  {
    const _t0  = Date.now();
    const _tid = window.SW_TRACKER?.start({ kind: 'image', model: getImageModel(), context: `[a2] ${safePrompt.slice(0, 60)}` });
    try {
      const r = await callImageApiOnce(safePrompt, signal, true, 30000);
      window.SW_TRACKER?.succeed(_tid, { durationMs: Date.now() - _t0 });
      return r;
    } catch (e) {
      window.SW_TRACKER?.fail(_tid, { durationMs: Date.now() - _t0, error: e.message });
      prohibited(e);
    }
  }
  if (signal?.aborted) return null;

  // Attempt 3: sanitized prompt, no reference image (30 s)
  onRetry?.('no_reference');
  {
    const _t0  = Date.now();
    const _tid = window.SW_TRACKER?.start({ kind: 'image', model: getImageModel(), context: `[a3] ${safePrompt.slice(0, 60)}` });
    try {
      const r = await callImageApiOnce(safePrompt, signal, false, 30000);
      window.SW_TRACKER?.succeed(_tid, { durationMs: Date.now() - _t0 });
      return r;
    } catch (e) {
      window.SW_TRACKER?.fail(_tid, { durationMs: Date.now() - _t0, error: e.message });
      prohibited(e);
    }
  }
  return null;
}

// Generate a cover image for a manually-linked storybook.
async function generateLinkCover(description, signal) {
  const prompt =
    `Create a soft, dreamy children's picture-book cover illustration. ` +
    `This storybook is about: ${description}. ` +
    `Warm, magical illustrated scene. Calming colours, portrait orientation, no text or lettering.`;
  return callImageApi(prompt, signal);
}

// ─── TTS audio generation (per page) ─────────────────────────
// Takes a plain narration string (audioPrompt from a page object).
// Returns a WAV data URL, or null if unavailable / aborted.
async function generateAudioForPage(text, signal) {
  if (signal?.aborted) return null;

  const _t0  = Date.now();
  const _tid = window.SW_TRACKER?.start({ kind: 'audio', model: getAudioModel(), context: text.slice(0, 80) });

  const ctrl    = new AbortController();
  const timerId = setTimeout(() => ctrl.abort(), 60000);
  if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true });

  const ttsPrompt = getAudioSystemPrompt() || getDefaultAudioSystemPrompt();

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${getAudioModel()}:streamGenerateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': getApiKey() },
        signal: ctrl.signal,
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `${ttsPrompt}\n\n${text}` }],
          }],
          generationConfig: {
            responseModalities: ['audio'],
            temperature: 0.5,
            speech_config: {
              voice_config: {
                prebuilt_voice_config: { voice_name: getAudioVoice() },
              },
            },
          },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`API response ${res.status}: ${errBody?.error?.message || 'Unknown error'}`);
    }

    const chunks   = await res.json();
    const pcmParts = [];

    for (const chunk of (Array.isArray(chunks) ? chunks : [chunks])) {
      const parts = chunk?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        const inlineData = part.inlineData || part.inline_data;
        if (inlineData?.data) pcmParts.push(inlineData.data);
      }
    }

    if (!pcmParts.length) {
      window.SW_TRACKER?.fail(_tid, { durationMs: Date.now() - _t0, error: 'No audio data returned' });
      return null;
    }

    const decoded = pcmParts.map(b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    const totalLen = decoded.reduce((n, a) => n + a.length, 0);
    const combined = new Uint8Array(totalLen);
    let off = 0;
    for (const arr of decoded) { combined.set(arr, off); off += arr.length; }

    const wavBuf      = pcmToWav(combined, 24000, 1, 16);
    const wavBase64   = uint8ArrayToBase64(new Uint8Array(wavBuf));
    const audioSeconds = combined.length / (24000 * 2); // 24 kHz, 16-bit mono
    window.SW_TRACKER?.succeed(_tid, { durationMs: Date.now() - _t0, audioSeconds });
    return `data:audio/wav;base64,${wavBase64}`;
  } catch (e) {
    const errMsg = e.name === 'AbortError' ? 'Cancelled' : e.message;
    if (e.name !== 'AbortError') console.warn('TTS generation failed:', e.message);
    window.SW_TRACKER?.fail(_tid, { durationMs: Date.now() - _t0, error: errMsg });
    return null;
  } finally {
    clearTimeout(timerId);
  }
}

// ─── Per-page regeneration ────────────────────────────────────

// Regenerate a single page's image. Updates the story in IDB and returns the new data URL.
// Returns null if generation fails (caller should surface the failure via addToast).
async function regeneratePageImage(storyId, pageIdx, signal) {
  const story = await itemGet(storyId);
  if (!story?.pages?.[pageIdx]) return null;
  const img = await callImageApi(story.pages[pageIdx].imagePrompt, signal);
  if (!img) return null;
  const updatedPages = story.pages.map((p, i) => i === pageIdx ? { ...p, image: img } : p);
  const updated = { ...story, pages: updatedPages };
  if (pageIdx === 0) updated.coverImage = img;
  await itemPut(updated);
  return img;
}

// Regenerate a single page's audio. Writes via audioPutPage and bumps audioReady if all pages now have audio.
// Returns the WAV data URL, or null on failure.
async function regeneratePageAudio(storyId, pageIdx, signal) {
  const story = await itemGet(storyId);
  if (!story?.pages?.[pageIdx]) return null;
  const wav = await generateAudioForPage(story.pages[pageIdx].audioPrompt, signal);
  if (!wav) return null;
  await audioPutPage(storyId, pageIdx, wav);
  const allAudio = await Promise.all(story.pages.map((_, i) => audioGetPage(storyId, i)));
  if (allAudio.every(Boolean)) {
    await itemPut({ ...story, audioReady: true });
  }
  return wav;
}

// ─── Main weave entry point ───────────────────────────────────
// onProgress(phase, data):
//   'text'         / null                    — text call starting
//   'assets'       / { story, total }         — text done, page assets fanning out
//   'pageAsset'    / { idx, kind, ok }        — one image or audio settled
//   'imageRetry'   / { idx, reason }          — per-page image retry
// Returns { story, assetsPromise } where story has images inlined on pages[]
// and assetsPromise resolves to per-page audio array when all audio settles.
async function weaveStory(form, existingIds, signal, onProgress) {
  onProgress?.('text', null);

  const textStory = await textCall(form, existingIds, signal);
  const pages     = textStory.pages || [];
  onProgress?.('assets', { story: textStory, total: pages.length });

  // Fan out — one image + one audio per page, all start simultaneously
  const imagePromises = pages.map((p, idx) =>
    callImageApi(p.imagePrompt, signal, (reason) => onProgress?.('imageRetry', { idx, reason }))
      .catch(() => null)
      .then(img => { onProgress?.('pageAsset', { idx, kind: 'image', ok: !!img }); return img; })
  );

  const audioPromises = pages.map((p, idx) =>
    generateAudioForPage(p.audioPrompt, signal)
      .catch(() => null)
      .then(aud => { onProgress?.('pageAsset', { idx, kind: 'audio', ok: !!aud }); return aud; })
  );

  // Wait for all images to settle, then inline into pages
  const imageResults  = await Promise.allSettled(imagePromises);
  onProgress?.('audio', null);
  const pagesWithImgs = pages.map((p, idx) => ({
    ...p,
    image: imageResults[idx].status === 'fulfilled' ? imageResults[idx].value : null,
  }));

  const story = {
    ...textStory,
    type:       'story',
    version:    2,
    pages:      pagesWithImgs,
    coverImage: pagesWithImgs[0]?.image || null,
    createdAt:  Date.now(),
    audioReady: false,
  };

  // assetsPromise resolves once all per-page audio has settled — individual entries may be null if TTS failed
  const assetsPromise = Promise.all(audioPromises);

  return { story, assetsPromise };
}

// ─── Google Drive integration ─────────────────────────────────
const DRIVE_CLIENT_ID   = '618607613623-aapp6ormsifld1c2oboi0gl2fb700b2p.apps.googleusercontent.com';
const DRIVE_SCOPE       = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_ROOT_FOLDER = 'StoryWeaver';
const DRIVE_SUB_COVERS  = 'covers';
const DRIVE_SUB_AUDIO   = 'audio';

let _driveTokClient = null;
let _driveToken     = null;
let _driveExpiry    = 0;

function _driveInitClient() {
  if (_driveTokClient) return _driveTokClient;
  if (!window.google?.accounts?.oauth2)
    throw new Error('Google Sign-In library not loaded yet — try again in a moment.');
  _driveTokClient = google.accounts.oauth2.initTokenClient({
    client_id: DRIVE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: () => {},
  });
  return _driveTokClient;
}

function _driveGetToken(forcePrompt) {
  if (!forcePrompt && _driveToken && Date.now() < _driveExpiry - 60000)
    return Promise.resolve(_driveToken);
  const client = _driveInitClient();
  return new Promise((resolve, reject) => {
    const tid = setTimeout(() => reject(new Error('Google auth timed out.')), 90000);
    client.callback = (r) => {
      clearTimeout(tid);
      if (r.error) return reject(new Error(r.error_description || r.error));
      _driveToken  = r.access_token;
      _driveExpiry = Date.now() + (r.expires_in || 3600) * 1000;
      resolve(_driveToken);
    };
    client.requestAccessToken(forcePrompt ? { prompt: 'select_account' } : {});
  });
}

async function _driveJsonFetch(path, opts) {
  const token = await _driveGetToken(false);
  const url   = path.startsWith('https://') ? path : 'https://www.googleapis.com/drive/v3' + path;
  const res   = await fetch(url, {
    ...opts,
    headers: { 'Authorization': 'Bearer ' + token, ...(opts && opts.headers || {}) },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error && e.error.message || ('Drive API error ' + res.status));
  }
  return res.json();
}

async function _driveFindFolder(name, parentId) {
  const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId || 'root'}' in parents and trashed=false`;
  const d = await _driveJsonFetch('/files?q=' + encodeURIComponent(q) + '&fields=files(id)');
  return (d.files && d.files[0] && d.files[0].id) || null;
}

async function _driveCreateFolder(name, parentId) {
  const body = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) body.parents = [parentId];
  const d = await _driveJsonFetch('/files', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return d.id;
}

async function _driveEnsureFolders() {
  if (localStorage.getItem('sw_drive_covers_id') && localStorage.getItem('sw_drive_audio_id')) return;

  let rootId = localStorage.getItem('sw_drive_root_id');
  if (!rootId) {
    rootId = (await _driveFindFolder(DRIVE_ROOT_FOLDER, null)) || (await _driveCreateFolder(DRIVE_ROOT_FOLDER, null));
    localStorage.setItem('sw_drive_root_id', rootId);
  }
  if (!localStorage.getItem('sw_drive_covers_id')) {
    const id = (await _driveFindFolder(DRIVE_SUB_COVERS, rootId)) || (await _driveCreateFolder(DRIVE_SUB_COVERS, rootId));
    localStorage.setItem('sw_drive_covers_id', id);
  }
  if (!localStorage.getItem('sw_drive_audio_id')) {
    const id = (await _driveFindFolder(DRIVE_SUB_AUDIO, rootId)) || (await _driveCreateFolder(DRIVE_SUB_AUDIO, rootId));
    localStorage.setItem('sw_drive_audio_id', id);
  }
}

function _dataUrlToBlob(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const mime  = dataUrl.slice(5, dataUrl.indexOf(';'));
  const bytes = Uint8Array.from(atob(dataUrl.slice(comma + 1)), c => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

async function _driveMultipartUpload(filename, blob, folderId) {
  const BOUND = 'sw' + Date.now();
  const enc   = new TextEncoder();
  const meta  = JSON.stringify({ name: filename, parents: [folderId] });
  const parts = [
    enc.encode('--' + BOUND + '\r\nContent-Type: application/json\r\n\r\n' + meta + '\r\n'),
    enc.encode('--' + BOUND + '\r\nContent-Type: ' + blob.type + '\r\n\r\n'),
    new Uint8Array(await blob.arrayBuffer()),
    enc.encode('\r\n--' + BOUND + '--'),
  ];
  const body = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let off = 0;
  for (const p of parts) { body.set(p, off); off += p.length; }

  const token = await _driveGetToken(false);
  const res   = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/related; boundary=' + BOUND },
    body,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error && e.error.message || ('Drive upload error ' + res.status));
  }
  return (await res.json()).id;
}

function driveIsConnected() { return !!localStorage.getItem('sw_drive_email'); }
function driveGetEmail()    { return localStorage.getItem('sw_drive_email') || ''; }

async function driveConnect() {
  await _driveGetToken(true);
  const d = await _driveJsonFetch('/about?fields=user');
  const email = (d.user && d.user.emailAddress) || 'Connected';
  localStorage.setItem('sw_drive_email', email);
  await _driveEnsureFolders();
  return email;
}

function driveDisconnect() {
  if (_driveToken) google.accounts.oauth2.revoke(_driveToken, () => {});
  _driveToken = null; _driveExpiry = 0;
  ['sw_drive_email', 'sw_drive_root_id', 'sw_drive_covers_id', 'sw_drive_audio_id']
    .forEach(k => localStorage.removeItem(k));
}

async function driveUploadCover(storyId, dataUrl) {
  await _driveEnsureFolders();
  const folderId = localStorage.getItem('sw_drive_covers_id');
  return _driveMultipartUpload(storyId + '-cover.webp', _dataUrlToBlob(dataUrl), folderId);
}

async function driveFetchCover(fileId) {
  const token = await _driveGetToken(false);
  const res   = await fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  if (!res.ok) throw new Error('Drive fetch error ' + res.status);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function driveUploadAudio(storyId, dataUrl) {
  await _driveEnsureFolders();
  const folderId = localStorage.getItem('sw_drive_audio_id');
  return _driveMultipartUpload(storyId + '-audio.wav', _dataUrlToBlob(dataUrl), folderId);
}

async function driveFetchAudio(fileId) {
  const token = await _driveGetToken(false);
  const res   = await fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  if (!res.ok) throw new Error('Drive fetch error ' + res.status);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function driveMigrateCovers(items, onProgress) {
  const queue   = items.filter(i => i.coverImage && !i.coverDriveId);
  const updated = [];
  for (let idx = 0; idx < queue.length; idx++) {
    const item = queue[idx];
    onProgress && onProgress({ total: queue.length, done: idx, title: item.title });
    try {
      const fileId = await driveUploadCover(item.id, item.coverImage);
      const next   = Object.assign({}, item, { coverDriveId: fileId });
      await itemPut(next);
      updated.push(next);
    } catch (_) { /* skip failed item, continue */ }
  }
  onProgress && onProgress({ total: queue.length, done: queue.length, title: null });
  return updated;
}

async function driveGetStorageInfo() {
  const d = await _driveJsonFetch('/about?fields=storageQuota');
  return d.storageQuota;
}

const DRIVE_SYNC_EXCLUDED = new Set(['sw_gemini_key']);
const DRIVE_SYNC_FILENAME = 'storyweaver-sync.json';

async function drivePushSync() {
  if (!driveIsConnected()) throw new Error('Google Drive not connected.');
  await _driveEnsureFolders();

  const lsData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!DRIVE_SYNC_EXCLUDED.has(key)) lsData[key] = localStorage.getItem(key);
  }
  const idbItems = await itemsAll();
  const payload  = JSON.stringify({ version: 1, localStorage: lsData, indexedDB: idbItems });
  const token    = await _driveGetToken(false);
  const rootId   = localStorage.getItem('sw_drive_root_id');

  const q = 'name=\'' + DRIVE_SYNC_FILENAME + '\' and \'' + rootId + '\' in parents and trashed=false';
  const d = await _driveJsonFetch('/files?q=' + encodeURIComponent(q) + '&fields=files(id)');
  const fileId = d.files && d.files[0] && d.files[0].id;

  if (fileId) {
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: payload,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error && e.error.message || 'Drive push failed'); }
  } else {
    await _driveMultipartUpload(DRIVE_SYNC_FILENAME, new Blob([payload], { type: 'application/json' }), rootId);
  }
}

async function drivePullSync() {
  if (!driveIsConnected()) throw new Error('Google Drive not connected.');
  const rootId = localStorage.getItem('sw_drive_root_id');
  if (!rootId) throw new Error('Drive folders not set up — disconnect and reconnect Drive first.');

  const q = 'name=\'' + DRIVE_SYNC_FILENAME + '\' and \'' + rootId + '\' in parents and trashed=false';
  const d = await _driveJsonFetch('/files?q=' + encodeURIComponent(q) + '&fields=files(id)');
  const fileId = d.files && d.files[0] && d.files[0].id;
  if (!fileId) throw new Error('No sync data found in Google Drive. Save to Drive first.');

  const token = await _driveGetToken(false);
  const res   = await fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  if (!res.ok) throw new Error('Drive pull failed ' + res.status);
  const parsed = JSON.parse(await res.text());

  if (parsed.localStorage) {
    for (const [key, value] of Object.entries(parsed.localStorage)) {
      if (!DRIVE_SYNC_EXCLUDED.has(key)) localStorage.setItem(key, value);
    }
  }
  if (Array.isArray(parsed.indexedDB)) {
    for (const item of parsed.indexedDB) await itemPut(item);
  }
  window.location.reload();
}

// ─── Export ───────────────────────────────────────────────────
window.SW = {
  dbOpen, itemsAll, itemPut, itemDelete,
  audioGet, audioPut, audioDelete, audioGetPage, audioPutPage, audioDeleteStory,
  getApiKey, setApiKey, hasApiKey, validateApiKey,
  getTextModel, setTextModel, getImageModel, setImageModel, getAudioModel, setAudioModel,
  getAudioVoice, setAudioVoice, getAudioSystemPrompt, setAudioSystemPrompt, getDefaultAudioSystemPrompt,
  getCustomSystemPrompt, setCustomSystemPrompt, getDefaultSystemPrompt,
  getSeedRatings, saveSeedRating,
  getSeedDeletions, deleteSeed,
  getChildName, setChildName, getChildBirthday, setChildBirthday,
  getSampleImage, setSampleImage, clearSampleImage, compressImageForStorage,
  mergeItems, uniqueId, slugify,
  weaveStory, generateLinkCover, regeneratePageImage, regeneratePageAudio,
  getModelPricing: () => MODEL_PRICING,
  drive: {
    isConnected:   driveIsConnected,
    getEmail:      driveGetEmail,
    connect:       driveConnect,
    disconnect:    driveDisconnect,
    uploadCover:   driveUploadCover,
    fetchCover:    driveFetchCover,
    uploadAudio:   driveUploadAudio,
    fetchAudio:    driveFetchAudio,
    migrateCovers: driveMigrateCovers,
    getStorageInfo: driveGetStorageInfo,
    pushSync:      drivePushSync,
    pullSync:      drivePullSync,
  },
};
