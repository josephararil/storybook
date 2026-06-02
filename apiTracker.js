// apiTracker.js — plain <script>, loads before store.js
// Exposes window.SW_TRACKER; persists to the shared 'storyweaver' IndexedDB (version 3).
// All new Gemini fetches in store.js must call start/succeed/fail on this tracker.

(() => {
  const RING_MAX = 200;

  let _events = [];   // { id, kind, model, context, status, startTime, endTime, durationMs, error }
  let _nextId = 1;
  const _subs = [];
  let _tdb = null;
  let _tdbP = null;

  const _notify = () => {
    for (let i = 0; i < _subs.length; i++) {
      try { _subs[i](); } catch (_) {}
    }
  };

  // Opens the shared 'storyweaver' DB at version 3.
  // onupgradeneeded creates all three stores so fresh installs and 2→3 upgrades both work.
  const _dbOpen = () => {
    if (_tdb)  return Promise.resolve(_tdb);
    if (_tdbP) return _tdbP;
    _tdbP = new Promise((resolve, reject) => {
      const req = indexedDB.open('storyweaver', 3);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('items'))  db.createObjectStore('items',  { keyPath: 'id' });
        if (!db.objectStoreNames.contains('audio'))  db.createObjectStore('audio',  { keyPath: 'id' });
        if (!db.objectStoreNames.contains('events')) db.createObjectStore('events', { keyPath: 'id' });
      };
      req.onsuccess = (e) => { _tdb = e.target.result; resolve(_tdb); };
      req.onerror   = () => reject(req.error);
    });
    return _tdbP;
  };

  const _persist = (ev) => {
    _dbOpen()
      .then(db => db.transaction('events', 'readwrite').objectStore('events').put(ev))
      .catch(() => {});
  };

  // Keep active events + most recent RING_MAX finished events.
  const _trim = () => {
    const active   = _events.filter(e => e.status === 'in_flight');
    const finished = _events.filter(e => e.status !== 'in_flight');
    _events = [...active, ...finished.slice(0, RING_MAX)];
  };

  // ── Public API ─────────────────────────────────────────────────

  const start = ({ kind, model, context } = {}) => {
    const ev = {
      id:        _nextId++,
      kind:      kind    || 'unknown',
      model:     model   || '',
      context:   context || '',
      status:    'in_flight',
      startTime: Date.now(),
    };
    _events.unshift(ev);
    _notify();
    return ev.id;
  };

  const succeed = (id, meta = {}) => {
    const ev = _events.find(e => e.id === id);
    if (!ev) return;
    ev.status     = 'success';
    ev.endTime    = Date.now();
    ev.durationMs = meta.durationMs != null ? meta.durationMs : (ev.endTime - ev.startTime);
    if (meta.inputTokens  != null) ev.inputTokens  = meta.inputTokens;
    if (meta.outputTokens != null) ev.outputTokens = meta.outputTokens;
    if (meta.audioSeconds != null) ev.audioSeconds = meta.audioSeconds;
    _trim();
    _persist(ev);
    _notify();
  };

  const fail = (id, meta = {}) => {
    const ev = _events.find(e => e.id === id);
    if (!ev) return;
    ev.status     = 'error';
    ev.endTime    = Date.now();
    ev.durationMs = meta.durationMs != null ? meta.durationMs : (ev.endTime - ev.startTime);
    ev.error      = meta.error || 'Unknown error';
    _trim();
    _persist(ev);
    _notify();
  };

  const getActive = () => _events.filter(e => e.status === 'in_flight');
  const getRecent = (limit = 20) => _events.filter(e => e.status !== 'in_flight').slice(0, limit);
  const getAll    = (limit = RING_MAX) => _events.slice(0, limit);

  const subscribe = (cb) => {
    _subs.push(cb);
    return () => { const i = _subs.indexOf(cb); if (i !== -1) _subs.splice(i, 1); };
  };

  const clearLog = () => {
    _events = _events.filter(e => e.status === 'in_flight');
    _dbOpen()
      .then(db => db.transaction('events', 'readwrite').objectStore('events').clear())
      .catch(() => {});
    _notify();
  };

  // Load persisted (completed) events on startup so history survives page refresh.
  _dbOpen().then(db => {
    const req = db.transaction('events', 'readonly').objectStore('events').getAll();
    req.onsuccess = () => {
      const rows = (req.result || []).filter(e => e.status !== 'in_flight');
      if (!rows.length) return;
      const existingIds = new Set(_events.map(e => e.id));
      for (const row of rows) {
        if (!existingIds.has(row.id)) _events.push(row);
        if (typeof row.id === 'number' && row.id >= _nextId) _nextId = row.id + 1;
      }
      _events.sort((a, b) => b.startTime - a.startTime);
      _trim();
      _notify();
    };
  }).catch(() => {});

  window.SW_TRACKER = { start, succeed, fail, getActive, getRecent, getAll, subscribe, clearLog };
})();
