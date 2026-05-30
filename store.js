// StoryWeaver persistent store
// Exports window.SW — must load after data.js, before cover.jsx / screens.jsx / app.jsx

const DEFAULT_TEXT_MODEL  = "gemini-3.5-flash";
const DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image";

// Capture seeds once; stays static throughout the session
window.SW_SEEDS = window.SW_STORIES;

// ─── IndexedDB wrapper ────────────────────────────────────────
let _db = null;
function dbOpen() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('storyweaver', 1);
    req.onupgradeneeded = (e) => {
      if (!e.target.result.objectStoreNames.contains('items')) {
        e.target.result.createObjectStore('items', { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
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

// ─── API key helpers ──────────────────────────────────────────
function getApiKey()  { return localStorage.getItem('sw_gemini_key') || ''; }
function setApiKey(k) { localStorage.setItem('sw_gemini_key', k); }
function hasApiKey()  { return !!localStorage.getItem('sw_gemini_key'); }

// ─── Model helpers ────────────────────────────────────────────
function getTextModel()   { return localStorage.getItem('sw_text_model')  || DEFAULT_TEXT_MODEL; }
function setTextModel(m)  { localStorage.setItem('sw_text_model', m); }
function getImageModel()  { return localStorage.getItem('sw_image_model') || DEFAULT_IMAGE_MODEL; }
function setImageModel(m) { localStorage.setItem('sw_image_model', m); }

// ─── Custom system prompt helpers ─────────────────────────────
function getCustomSystemPrompt()  { return localStorage.getItem('sw_system_prompt') || ''; }
function setCustomSystemPrompt(s) {
  if (s) localStorage.setItem('sw_system_prompt', s);
  else   localStorage.removeItem('sw_system_prompt');
}

// ─── GitHub Gist sync helpers ─────────────────────────────────
function getGithubToken()   { return localStorage.getItem('sw_github_token') || ''; }
function setGithubToken(k)  { localStorage.setItem('sw_github_token', k); }
function getGistId()        { return localStorage.getItem('sw_gist_id') || ''; }
function setGistId(id)      { localStorage.setItem('sw_gist_id', id); }

const GIST_EXCLUDED = new Set(['sw_gemini_key', 'sw_github_token']);
const GIST_FILENAME = 'storyweaver-sync.json';

async function pushToGist() {
  const token = getGithubToken();
  if (!token) throw new Error('GitHub token not set.');

  const lsData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!GIST_EXCLUDED.has(key)) lsData[key] = localStorage.getItem(key);
  }

  const idbItems = await itemsAll();
  const payload  = JSON.stringify({ version: 1, localStorage: lsData, indexedDB: idbItems });

  const gistId = getGistId();
  const res = await fetch(
    gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists',
    {
      method: gistId ? 'PATCH' : 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        description: 'StoryWeaver cloud sync',
        public: false,
        files: { [GIST_FILENAME]: { content: payload } },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }

  const data = await res.json();
  setGistId(data.id);
  return data.id;
}

async function pullFromGist() {
  const token  = getGithubToken();
  const gistId = getGistId();
  if (!token)  throw new Error('GitHub token not set.');
  if (!gistId) throw new Error('Gist ID not set.');

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }

  const data    = await res.json();
  const content = data.files?.[GIST_FILENAME]?.content;
  if (!content) throw new Error('No StoryWeaver data found in this gist.');

  const parsed = JSON.parse(content);

  if (parsed.localStorage) {
    for (const [key, value] of Object.entries(parsed.localStorage)) {
      if (!GIST_EXCLUDED.has(key)) localStorage.setItem(key, value);
    }
  }

  if (Array.isArray(parsed.indexedDB)) {
    for (const item of parsed.indexedDB) await itemPut(item);
  }

  window.location.reload();
}

async function validateApiKey(k) {
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': k },
    });
    return r.ok;
  } catch { return false; }
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

// ─── Story schema ─────────────────────────────────────────────
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
    body:     { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['id','title','category','rating','palette','scene','vocab','body'],
  propertyOrdering: ['id','title','category','rating','palette','scene','vocab','body'],
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
function buildSystemPrompt(form, childName, targetParas) {
  const toneWord = TONE_WORDS[(form.tone || 3) - 1];

  const companionLine = form.character?.trim()
    ? `Companion: ${childName} meets ${form.character.trim()} in this story. The meeting is warm and joyful. No other characters.`
    : `Companion: Exactly one friendly animal or magical creature. No other characters.`;

  const sentenceRules = form.storyStyle === 'rhyme'
    ? [
        `RHYME SCHEME: AABB rhyming couplets throughout — no exceptions.`,
        `Meter: approximately 8–10 syllables per line; aim for natural speech, not sing-songy.`,
        `Quality: every rhyme must be a TRUE rhyme (not slant/near). Use common words a 4-year-old knows.`,
        `Test: read each couplet aloud — if it stumbles, rewrite it.`,
      ].join(' ')
    : `Sentence structure: Short, clear sentences (8–12 words max). Vary the rhythm so it sounds natural when read aloud. Use present tense.`;

  // Middle exploration paragraphs fill the space between the fixed opening (2) and closing (2) beats.
  const middleCount = Math.max(1, targetParas - 4);

  return [
    `You are an expert children's author writing warm, comforting bedtime stories for 4-year-olds. Return ONLY JSON matching the schema.`,
    ``,
    `[CHARACTER]`,
    `Main character: ${childName}. Imaginative, brave, and active — she drives the action (investigates, helps, guides). Never a passive observer.`,
    companionLine,
    ``,
    `[TONE & STYLE]`,
    `Tone: ${toneWord} — let this feeling permeate every sentence.`,
    sentenceRules,
    `Sensory details: weave in sounds (rustling leaves, soft hums), textures, and gentle glows. Focus on comfort, safety, and wonder.`,
    `Restricted words: NEVER use "suddenly", "unfortunately", "however", "scary", or "dark". Avoid narrative clichés.`,
    ``,
    `[NARRATIVE ARC (${targetParas} paragraphs)]`,
    `• Paragraph 1 — Discovery: ${childName} finds a magical element in a safe, familiar setting (e.g., her garden, her bedroom). Curiosity, not fear.`,
    `• Paragraph 2 — Meeting: ${childName} introduces herself to her companion. They share a warm first moment.`,
    `• Middle ${middleCount} paragraph(s) — Exploration & Interaction: ${childName} and companion actively explore, play, and collaborate using a gentle magical mechanic (e.g., floating on a cloud, tracing glowing paths). Deepen their connection across each paragraph.`,
    `• Second-to-last paragraph — Comfort: A gentle transition toward rest. A soft problem is solved (e.g., finding a lost blanket, helping a star find its spot) or a quiet realisation is shared.`,
    `• Last paragraph — Resolution: The companion settles down. ${childName} feels safe, loved, and sleepy. The magic remains safe for tomorrow. End on absolute warmth and peace.`,
    ``,
    `[VOCABULARY RULES]`,
    `Every word in the vocabulary list MUST appear in body[] wrapped in curly braces exactly as given (e.g., {gentle}). Do not inflect, change tense, or pluralize inside the braces. List each word unbraced in vocab[].`,
    ``,
    `[SCHEMA]`,
    `scene ∈ {moon,fox,unicorn,whale,dragon,bear,cloud,turtle}. category ∈ {Bedtime,Animals,Magic,Adventure,Friends}.`,
    `palette: exactly 3 #rrggbb colors (dark base, mid tone, light accent). id: kebab-case from title. rating: 0.`,
    `Each body[] element is one paragraph of 40–60 words. Do not let the word count constraint make the prose repetitive.`,
  ].filter(s => s !== null && s !== undefined).join('\n');
}

function getDefaultSystemPrompt() {
  return buildSystemPrompt(
    { character: '', storyStyle: 'prose', tone: 3, length: 4 },
    getChildName(),
    6
  );
}

async function textCall(form, existingIds, signal) {
  const toneWord    = TONE_WORDS[form.tone - 1];
  const childName   = getChildName();
  const targetParas = Math.max(4, Math.round(form.length / 0.65));
  const vocabStr    = (form.vocab || []).length ? `\nVocabulary: ${form.vocab.join(', ')}` : '';
  const sysPrompt   = getCustomSystemPrompt() || buildSystemPrompt(form, childName, targetParas);

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
          parts: [{ text: `Context: ${form.context}\nTone: ${toneWord}\nTarget length: ~${targetParas} paragraphs${vocabStr}` }],
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
    if (res.status === 400 || res.status === 403) {
      throw new Error('Gemini rejected the request (check your API key).');
    }
    throw new Error(body?.error?.message || 'Gemini returned an unexpected response. Please try again.');
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
  story.scene    = VALID_SCENES.includes(story.scene)       ? story.scene    : 'moon';
  story.category = VALID_CATEGORIES.includes(story.category) ? story.category : 'Bedtime';
  if (!Array.isArray(story.body))  story.body  = [];
  if (!Array.isArray(story.vocab)) story.vocab = [];
  story.id = uniqueId(slugify(story.title), existingIds);

  return story;
}

// Shared low-level image call — builds ref image, hits the API, returns a WebP data URL.
async function callImageApi(prompt, signal) {
  const refImage = (() => {
    if (window.SOPHIE_IMAGE?.data) return window.SOPHIE_IMAGE;
    const s = getSampleImage();
    if (!s) return null;
    const m = s.match(/^data:(image\/[^;]+);base64,(.+)$/);
    return m ? { mimeType: m[1], data: m[2] } : null;
  })();

  const parts = [{ text: prompt }];
  if (refImage) parts.push({ inline_data: { mime_type: refImage.mimeType, data: refImage.data } });

  const ctrl    = new AbortController();
  const timerId = setTimeout(() => ctrl.abort(), 45000);
  if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${getImageModel()}:generateContent`,
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
    if (!res.ok) throw new Error('Image generation failed.');
    const data     = await res.json();
    const resParts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart  = resParts.find(p => p.inlineData || p.inline_data);
    if (!imgPart) throw new Error('No image in response.');
    const inlineData = imgPart.inlineData || imgPart.inline_data;
    return compressToWebp(inlineData.data);
  } finally {
    clearTimeout(timerId);
  }
}

async function imageCall(form, signal) {
  const toneWord  = TONE_WORDS[form.tone - 1];
  const childName = getChildName();
  const prompt =
    `Create a soft, dreamy children's picture-book cover illustration featuring ${childName}. ` +
    `Scene: ${form.context}. Mood: ${toneWord}, calming night-time palette. ` +
    `Portrait orientation, no text or lettering in the image.`;
  return callImageApi(prompt, signal);
}

// Generate a cover image for a manually-linked storybook.
async function generateLinkCover(description, signal) {
  const childName = getChildName();
  const prompt =
    `Create a soft, dreamy children's picture-book cover illustration. ` +
    `This storybook is about: ${description}. ` +
    `Feature the child ${childName} prominently in a warm, magical scene. ` +
    `Calming colours, portrait orientation, no text or lettering in the image.`;
  return callImageApi(prompt, signal);
}

// ─── Main weave entry point ───────────────────────────────────
// onProgress(phase, storyData) — called with 'text' then 'image'.
// storyData is populated on the 'image' call so callers can act on the text story early.
async function weaveStory(form, existingIds, signal, onProgress) {
  onProgress?.('text', null);
  const story = await textCall(form, existingIds, signal);

  onProgress?.('image', story);
  const image = await imageCall(form, signal).catch(() => null);

  return { ...story, type: 'story', coverImage: image, createdAt: Date.now() };
}

// ─── Export ───────────────────────────────────────────────────
window.SW = {
  dbOpen, itemsAll, itemPut, itemDelete,
  getApiKey, setApiKey, hasApiKey, validateApiKey,
  getTextModel, setTextModel, getImageModel, setImageModel,
  getCustomSystemPrompt, setCustomSystemPrompt, getDefaultSystemPrompt,
  getSeedRatings, saveSeedRating,
  getSeedDeletions, deleteSeed,
  getChildName, setChildName, getChildBirthday, setChildBirthday,
  getSampleImage, setSampleImage, clearSampleImage, compressImageForStorage,
  mergeItems, uniqueId, slugify,
  weaveStory, generateLinkCover,
  getGithubToken, setGithubToken, getGistId, setGistId,
  pushToGist, pullFromGist,
};
