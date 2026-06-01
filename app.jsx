// Story Weaver — app shell
// Direction A (Starry Night). Hash-routed, mobile-first PWA.

const TH_STARRY = {
  key: 'starry',
  name: 'Starry Night',
  coverMode: 'glow',
  bg: 'linear-gradient(180deg, #020617 0%, #0f0b29 35%, #1e1b4b 100%)',
  text: '#fef3c7',
  textMuted: 'rgba(254, 243, 199, 0.55)',
  accent: '#fbbf24',
  accentSoft: 'rgba(251, 191, 36, 0.14)',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  fontHead: '"Nunito", system-ui',
  fontBody: '"Nunito", system-ui',
  headWeight: 800,
  headStyle: 'normal',
  navStyle: 'pill',
  titleSize: 36,
  layout: 'grid',
  libraryGreeting: "Tonight's\nstories",
};

// ─── Hash routing ────────────────────────────────────────────
function useHashRoute() {
  const get = () => window.location.hash.replace(/^#/, '') || '/';
  const [route, setRoute] = React.useState(get);
  React.useEffect(() => {
    const onHash = () => setRoute(get());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}
function navigate(path) { window.location.hash = '#' + path; }

// ─── Decorative starfield ────────────────────────────────────
function Starfield() {
  const stars = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      arr.push({ x: Math.random() * 100, y: Math.random() * 100, s: 0.5 + Math.random() * 1.6, o: 0.2 + Math.random() * 0.6 });
    }
    return arr;
  }, []);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s * 0.12} fill="#fef3c7" opacity={s.o} />
      ))}
    </svg>
  );
}

// ─── App shell ───────────────────────────────────────────────
function StoryWeaverApp() {
  const route = useHashRoute();
  const theme = TH_STARRY;

  // ─── Items state (persisted + seeds merged) ───────────────
  const [items, setItems] = React.useState(() => window.SW.mergeItems([]));
  React.useEffect(() => {
    window.SW.itemsAll()
      .then(p => setItems(window.SW.mergeItems(p)))
      .catch(() => {/* keep seeds */});
  }, []);

  // ─── Child name (lifted so all screens stay in sync) ─────
  const [childName, setChildName] = React.useState(() => window.SW.getChildName());

  const onNameChange = (name) => {
    window.SW.setChildName(name);
    setChildName(name);
  };

  // ─── Lifted Creator form state ────────────────────────────
  const [context,    setContext]    = React.useState('');
  const [vocab,      setVocab]      = React.useState([]);
  const [length,     setLength]     = React.useState(4);
  const [tone,       setTone]       = React.useState('Gentle');
  const [storyStyle, setStoryStyle] = React.useState('prose');
  const [character,  setCharacter]  = React.useState('');

  // ─── Overlay / modal state ────────────────────────────────
  const [keyModalOpen,  setKeyModalOpen]  = React.useState(false);
  const [addLinkOpen,   setAddLinkOpen]   = React.useState(false);
  const [editingLink,   setEditingLink]   = React.useState(null);
  const [weaveError,    setWeaveError]    = React.useState(null);
  const [weavePhase,    setWeavePhase]    = React.useState(null);
  const [weavingStory,  setWeavingStory]  = React.useState(null);
  const [weavingSubMsg, setWeavingSubMsg] = React.useState(null);
  const [toasts,        setToasts]        = React.useState([]);
  const abortRef         = React.useRef(null);
  const ignoreWeaveRef   = React.useRef(false);

  const addToast = (msg, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 7000);
  };
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── Route parsing ────────────────────────────────────────
  const tab =
    route.startsWith('/create')   ? 'create'   :
    route.startsWith('/me')       ? 'settings' :
                                    'library';
  const storyMatch = route.match(/^\/story\/(.+)$/);
  const openStory  = storyMatch
    ? items.find(s => s.type !== 'link' && s.id === storyMatch[1])
    : null;
  const isWeaving = route === '/weaving';

  React.useEffect(() => {
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', '#020617');
  }, []);

  // ─── Handlers ────────────────────────────────────────────
  const onOpen = (item) => {
    if (item.type === 'link') {
      window.open(item.url, '_blank', 'noopener');
    } else {
      navigate('/story/' + item.id);
    }
  };

  const onWeave = async (form) => {
    if (!window.SW.hasApiKey()) { setKeyModalOpen(true); return; }
    ignoreWeaveRef.current = false;
    setWeaveError(null);
    setWeavePhase(null);
    setWeavingStory(null);
    navigate('/weaving');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await window.SW.weaveStory(
        form, items.map(i => i.id), controller.signal,
        (phase, data) => {
          if (ignoreWeaveRef.current) return;
          if (phase === 'pageAsset') return; // M4 will render per-page progress
          if (phase === 'imageRetry') {
            const msgs = { adjusting_prompt: 'Adjusting prompt…', no_reference: 'Trying without reference photo…' };
            setWeavingSubMsg(msgs[data?.reason] || 'Retrying…');
            return;
          }
          if (phase === 'assets') {
            // text done, images + audio fanning out — map to existing 'imagePending' UI state
            setWeavePhase('imagePending');
            setWeavingSubMsg(null);
            if (data?.story) setWeavingStory(data.story);
            return;
          }
          setWeavePhase(phase);
          setWeavingSubMsg(null);
        }
      );
      if (ignoreWeaveRef.current) return;

      const { story, assetsPromise } = result;
      await window.SW.itemPut(story);
      setItems(prev => [story, ...prev]);

      navigate('/story/' + story.id);
      abortRef.current = null;

      // Non-blocking cover backup to Drive (page-1 image used as cover)
      if (window.SW.drive.isConnected() && story.coverImage) {
        window.SW.drive.uploadCover(story.id, story.coverImage)
          .then(coverDriveId => {
            setItems(prev => {
              const cur = prev.find(i => i.id === story.id);
              if (!cur) return prev;
              const upd = Object.assign({}, cur, { coverDriveId });
              window.SW.itemPut(upd);
              return prev.map(i => i.id === story.id ? upd : i);
            });
          })
          .catch(() => {});
      }

      // Write per-page audio as it settles, then flip audioReady
      if (assetsPromise) {
        assetsPromise.then(async (audioResults) => {
          for (let idx = 0; idx < audioResults.length; idx++) {
            if (audioResults[idx]) {
              await window.SW.audioPutPage(story.id, idx, audioResults[idx]);
            }
          }
          const withAudio = Object.assign({}, story, { audioReady: true });
          await window.SW.itemPut(withAudio);
          setItems(prev => prev.map(i => i.id === story.id ? withAudio : i));
        }).catch((err) => {
          if (err && err.name !== 'AbortError') {
            addToast(`Audio narration failed: ${err.message || 'Unknown error'}`);
          }
        });
      }
    } catch (err) {
      if (ignoreWeaveRef.current) return;
      if (err.name === 'AbortError') { navigate('/create'); return; }
      setWeaveError(err.message || 'Something went wrong weaving the story.');
      setTimeout(() => { setWeaveError(null); navigate('/create'); }, 4000);
    } finally {
      abortRef.current = null;
    }
  };

  const onCancelWeave = () => {
    ignoreWeaveRef.current = true;
    if (abortRef.current) abortRef.current.abort();
    setWeavePhase(null);
    setWeavingStory(null);
    setWeaveError(null);
    navigate('/create');
  };

  const onSkipImage = async () => {
    const partial = weavingStory;
    if (!partial) return;
    ignoreWeaveRef.current = true;
    if (abortRef.current) abortRef.current.abort();
    const story = {
      ...partial,
      type:       'story',
      version:    2,
      createdAt:  Date.now(),
      pages:      (partial.pages || []).map(p => ({ ...p, image: null })),
      coverImage: null,
      audioReady: false,
    };
    await window.SW.itemPut(story);
    setItems(prev => [story, ...prev]);
    setWeavingStory(null);
    setWeavePhase(null);
    navigate('/story/' + story.id);
  };

  const onSaveLink = async (data, editingId) => {
    if (editingId) {
      const existing = items.find(i => i.id === editingId);
      const updated  = { ...existing, ...data };
      await window.SW.itemPut(updated);
      setItems(prev => prev.map(i => i.id === editingId ? updated : i));
      // Upload new cover to Drive if it changed
      if (window.SW.drive.isConnected() && data.coverImage && data.coverImage !== existing?.coverImage) {
        window.SW.drive.uploadCover(updated.id, data.coverImage)
          .then(coverDriveId => {
            const upd = Object.assign({}, updated, { coverDriveId });
            window.SW.itemPut(upd);
            setItems(prev => prev.map(i => i.id === editingId ? upd : i));
          })
          .catch(() => {});
      }
    } else {
      const newLink = {
        id: window.SW.uniqueId(window.SW.slugify(data.title), items.map(i => i.id)),
        type: 'link',
        ...data,
        rating: 0,
        createdAt: Date.now(),
      };
      await window.SW.itemPut(newLink);
      setItems(prev => [newLink, ...prev]);
      // Upload cover to Drive if present
      if (window.SW.drive.isConnected() && newLink.coverImage) {
        window.SW.drive.uploadCover(newLink.id, newLink.coverImage)
          .then(coverDriveId => {
            const upd = Object.assign({}, newLink, { coverDriveId });
            window.SW.itemPut(upd);
            setItems(prev => prev.map(i => i.id === newLink.id ? upd : i));
          })
          .catch(() => {});
      }
    }
    setAddLinkOpen(false);
    setEditingLink(null);
    navigate('/');
  };

  const onRate = async (id, n) => {
    const seedIds = (window.SW_SEEDS || []).map(s => s.id);
    if (seedIds.includes(id)) {
      window.SW.saveSeedRating(id, n);
    } else {
      const item = items.find(i => i.id === id);
      if (item) await window.SW.itemPut({ ...item, rating: n });
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, rating: n } : i));
  };

  const onDelete = async (id) => {
    const seedIds = new Set((window.SW_SEEDS || []).map(s => s.id));
    if (seedIds.has(id)) {
      window.SW.deleteSeed(id);
    } else {
      await window.SW.itemDelete(id);
      window.SW.audioDeleteStory(id).catch(() => {});
    }
    setItems(prev => prev.filter(i => i.id !== id));
    if (route.startsWith('/story/')) navigate('/');
  };

  const onTabChange = (id) => {
    navigate(id === 'library' ? '/' : id === 'create' ? '/create' : '/me');
  };

  const onEditLink = (item) => {
    setEditingLink(item);
    setAddLinkOpen(true);
  };

  const onOpenAddLink = () => {
    setEditingLink(null);
    setAddLinkOpen(true);
  };

  const onDriveMigrate = async (onProgress) => {
    const updated = await window.SW.drive.migrateCovers(items, onProgress);
    if (updated.length > 0) {
      setItems(prev => {
        const byId = {};
        updated.forEach(u => { byId[u.id] = u; });
        return prev.map(i => byId[i.id] || i);
      });
    }
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: theme.bg, color: theme.text,
    }}>
      <Starfield />

      <div style={{ position: 'absolute', inset: 0 }}>
        {tab === 'library'  && (
          <Library t={theme} items={items} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} onRate={onRate} childName={childName} />
        )}
        {tab === 'create'   && (
          <Creator t={theme} onWeave={onWeave} onAddLink={onOpenAddLink}
            context={context} setContext={setContext}
            vocab={vocab} setVocab={setVocab}
            length={length} setLength={setLength}
            tone={tone} setTone={setTone}
            storyStyle={storyStyle} setStoryStyle={setStoryStyle}
            character={character} setCharacter={setCharacter}
            childName={childName} />
        )}
        {tab === 'settings' && (
          <Settings t={theme} onOpenKeyModal={() => setKeyModalOpen(true)} onNameChange={onNameChange} items={items} onDriveMigrate={onDriveMigrate} />
        )}
      </div>

      <BottomNav t={theme} tab={tab} onChange={onTabChange} />

      {openStory && (
        <Reader t={theme} story={openStory} onClose={() => navigate('/')} onRate={onRate} onDelete={onDelete} />
      )}
      {isWeaving && <Weaving t={theme} error={weaveError} phase={weavePhase} onCancel={onCancelWeave} onSkipImage={weavingStory ? onSkipImage : null} subMessage={weavingSubMsg} />}

      {keyModalOpen && (
        <ApiKeyModal t={theme} open={keyModalOpen} onClose={() => setKeyModalOpen(false)} />
      )}
      {addLinkOpen && (
        <AddLinkModal
          t={theme} open={addLinkOpen}
          onClose={() => { setAddLinkOpen(false); setEditingLink(null); }}
          onSave={onSaveLink}
          item={editingLink}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<StoryWeaverApp />);
