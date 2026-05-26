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

  // Parse route → tab + overlay
  const tab =
    route.startsWith('/create')   ? 'create'   :
    route.startsWith('/me')       ? 'settings' :
                                    'library';
  const storyMatch = route.match(/^\/story\/(.+)$/);
  const openStory = storyMatch ? window.SW_STORIES.find(s => s.id === storyMatch[1]) : null;
  const isWeaving = route === '/weaving';

  // Pin theme-color to the active background so the iOS status bar matches
  // when the app is installed as a PWA.
  React.useEffect(() => {
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', '#020617');
  }, []);

  const onWeave = () => {
    navigate('/weaving');
    // Mock: pretend Gemini call takes ~4s, then drop into the moon story.
    setTimeout(() => navigate('/story/moon'), 4200);
  };

  const onTabChange = (id) => {
    navigate(id === 'library' ? '/' : id === 'create' ? '/create' : '/me');
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: theme.bg, color: theme.text,
    }}>
      <Starfield />

      <div style={{ position: 'absolute', inset: 0 }}>
        {tab === 'library'  && <Library t={theme} onOpen={(s) => navigate('/story/' + s.id)} />}
        {tab === 'create'   && <Creator t={theme} onWeave={onWeave} />}
        {tab === 'settings' && <Settings t={theme} />}
      </div>

      <BottomNav t={theme} tab={tab} onChange={onTabChange} />

      {openStory && <Reader t={theme} story={openStory} onClose={() => history.back()} />}
      {isWeaving && <Weaving t={theme} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<StoryWeaverApp />);
