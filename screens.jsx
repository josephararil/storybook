// Story Weaver — three theme-driven screens
// Library · Creator · Settings · Reader (overlay)
// Driven by the `t` theme object defined in app.jsx.

const { useState, useEffect, useRef } = React;

// ─── Icons (Lucide-style stroke icons, drawn inline) ─────────
function Icon({ name, size = 22, stroke = 2 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    library:  <><path d="M4 19V5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-2zM4 19a2 2 0 0 1 2-2h14" /></>,
    sparkles: <><path d="M9 3L10.5 7.5L15 9L10.5 10.5L9 15L7.5 10.5L3 9L7.5 7.5z" /><path d="M18 13l.9 2.7L21.5 16.5L18.9 17.4L18 20l-.9-2.6L14.5 16.5L17.1 15.7z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
    search:   <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    star:     <><path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-7.2L2 10l7.1-1.1z" /></>,
    close:    <><path d="M18 6L6 18M6 6l12 12" /></>,
    chevron:  <><path d="M15 18l-6-6 6-6" /></>,
    book:     <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
    plus:     <><path d="M12 5v14M5 12h14" /></>,
    moon:     <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></>,
    wand:     <><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M15 9h.01M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5" /></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
}

// ─── Star rating ─────────────────────────────────────────────
function StarRating({ value, max = 5, size = 12, color, mutedColor }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, color }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ color: i < value ? color : mutedColor, display: 'inline-flex' }}>
          <Icon name="star" size={size} stroke={1.5} />
        </span>
      ))}
    </div>
  );
}

// ─── Bottom nav (renders by theme.navStyle) ─────────────────
function BottomNav({ t, tab, onChange }) {
  const items = [
    { id: 'library', icon: 'library', label: 'Library' },
    { id: 'create',  icon: 'sparkles', label: 'Create' },
    { id: 'settings',icon: 'settings', label: 'Me' },
  ];
  if (t.navStyle === 'pill') {
    return (
      <div style={{ position: 'absolute', bottom: 'max(26px, env(safe-area-inset-bottom))', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 30 }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', gap: 4, padding: 6, borderRadius: 999,
          background: 'rgba(20, 20, 50, 0.5)', backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid ${t.glassBorder}`,
          boxShadow: '0 12px 36px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
          {items.map((it) => {
            const active = tab === it.id;
            return (
              <button key={it.id} onClick={() => onChange(it.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px',
                borderRadius: 999, border: 'none', cursor: 'pointer',
                background: active ? t.accent : 'transparent',
                color: active ? '#1e1b4b' : t.textMuted,
                fontFamily: t.fontBody, fontWeight: 700, fontSize: 14,
                transition: 'all .2s',
              }}>
                <Icon name={it.icon} size={20} stroke={2.2} />
                {active && <span>{it.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (t.navStyle === 'dock') {
    return (
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 30, paddingTop: 12,
        background: 'linear-gradient(180deg, transparent, rgba(10,5,40,0.95))', zIndex: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 24px' }}>
          {items.map((it) => {
            const active = tab === it.id;
            return (
              <button key={it.id} onClick={() => onChange(it.id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                transition: 'transform .2s', transform: active ? 'translateY(-4px)' : 'none',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 18,
                  background: active ? `linear-gradient(140deg, ${t.accent}, ${tint(t.accent, -0.15)})` : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: active ? '#1a0a3e' : t.text,
                  boxShadow: active ? `0 8px 20px ${t.accent}66` : 'none',
                  border: active ? 'none' : '1.5px solid rgba(255,255,255,0.12)',
                  transition: 'all .2s',
                }}>
                  <Icon name={it.icon} size={26} stroke={2.4} />
                </div>
                <span style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 12, color: active ? t.text : t.textMuted }}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  // 'minimal' — Constellation
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 30, paddingTop: 8,
      background: 'linear-gradient(180deg, transparent, rgba(5,5,20,0.92))',
      borderTop: `1px solid ${t.glassBorder}`, zIndex: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 16px' }}>
        {items.map((it) => {
          const active = tab === it.id;
          return (
            <button key={it.id} onClick={() => onChange(it.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 16px',
              color: active ? t.accent : t.textMuted, transition: 'color .2s',
              borderTop: active ? `1px solid ${t.accent}` : '1px solid transparent', paddingTop: 10,
            }}>
              <Icon name={it.icon} size={20} stroke={1.8} />
              <span style={{ fontFamily: t.fontBody, fontWeight: 600, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Library ─────────────────────────────────────────────────
function Library({ t, onOpen }) {
  const [query, setQuery] = useState('');
  const stories = window.SW_STORIES.filter(s =>
    !query || s.title.toLowerCase().includes(query.toLowerCase()) || s.category.toLowerCase().includes(query.toLowerCase())
  );

  // Search bar
  const search = (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center',
      background: t.glass, border: `1px solid ${t.glassBorder}`,
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderRadius: t.navStyle === 'dock' ? 18 : 999, padding: '10px 14px', gap: 10,
      color: t.textMuted,
    }}>
      <Icon name="search" size={18} stroke={2} />
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a story…" style={{
        flex: 1, border: 'none', outline: 'none', background: 'transparent',
        color: t.text, fontFamily: t.fontBody, fontWeight: 500, fontSize: 15,
      }} />
    </div>
  );

  return (
    <div style={{ padding: '60px 20px 130px', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      {/* greeting */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>For Sophie</div>
        <h1 style={{
          margin: '4px 0 0', fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
          fontSize: t.titleSize, color: t.text, letterSpacing: t.headStyle === 'italic' ? -0.5 : -0.8, lineHeight: 1.05,
        }}>
          {t.libraryGreeting || 'Tonight\u2019s\nstories'}
        </h1>
      </div>

      {search}

      {/* category chips */}
      <div style={{ display: 'flex', gap: 8, margin: '18px 0 16px', overflowX: 'auto', paddingBottom: 4 }}>
        {['All', 'Bedtime', 'Animals', 'Magic', 'Adventure', 'Friends'].map((c, i) => (
          <div key={c} style={{
            padding: '7px 14px', borderRadius: 999, flexShrink: 0,
            background: i === 0 ? t.accent : t.glass,
            color: i === 0 ? '#1a0a3e' : t.textMuted,
            border: i === 0 ? 'none' : `1px solid ${t.glassBorder}`,
            fontFamily: t.fontBody, fontWeight: 700, fontSize: 12,
            letterSpacing: 0.3,
          }}>{c}</div>
        ))}
      </div>

      {/* Grid */}
      {t.layout === 'editorial' ? (
        <EditorialGrid t={t} stories={stories} onOpen={onOpen} />
      ) : t.layout === 'pinterest' ? (
        <PinterestGrid t={t} stories={stories} onOpen={onOpen} />
      ) : (
        <SimpleGrid t={t} stories={stories} onOpen={onOpen} />
      )}
    </div>
  );
}

function StoryMeta({ t, story, compact }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
        fontSize: compact ? 14 : 15, lineHeight: 1.2, color: t.text,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{story.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <StarRating value={story.rating} size={10} color={t.accent} mutedColor="rgba(255,255,255,0.15)" />
        <span style={{ color: t.textMuted, fontFamily: t.fontBody, fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>· {story.category}</span>
      </div>
    </div>
  );
}

function SimpleGrid({ t, stories, onOpen }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {stories.map(s => (
        <button key={s.id} onClick={() => onOpen(s)} style={{
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
        }}>
          <Cover story={s} mode={t.coverMode} w="100%" h={210} radius={20} />
          <StoryMeta t={t} story={s} />
        </button>
      ))}
    </div>
  );
}

function PinterestGrid({ t, stories, onOpen }) {
  // Alternating tall/short covers for masonry feel
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, gridAutoRows: '10px' }}>
      {stories.map((s, i) => {
        const tall = i % 3 !== 1;
        const h = tall ? 260 : 200;
        const rowSpan = Math.ceil((h + 80) / 12);
        return (
          <button key={s.id} onClick={() => onOpen(s)} style={{
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
            gridRow: `span ${rowSpan}`,
          }}>
            <Cover story={s} mode={t.coverMode} w="100%" h={h} radius={24} />
            <StoryMeta t={t} story={s} />
          </button>
        );
      })}
    </div>
  );
}

function EditorialGrid({ t, stories, onOpen }) {
  const [hero, ...rest] = stories;
  if (!hero) return null;
  return (
    <div>
      <button onClick={() => onOpen(hero)} style={{
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
        width: '100%', marginBottom: 18,
      }}>
        <Cover story={hero} mode={t.coverMode} w="100%" h={260} radius={2} />
        <div style={{ marginTop: 14, paddingBottom: 10, borderBottom: `1px solid ${t.glassBorder}` }}>
          <div style={{ color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Tonight's feature · {hero.category}</div>
          <div style={{
            fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
            fontSize: 24, lineHeight: 1.1, color: t.text, letterSpacing: -0.4,
          }}>{hero.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <StarRating value={hero.rating} size={12} color={t.accent} mutedColor="rgba(255,255,255,0.12)" />
            <span style={{ color: t.textMuted, fontFamily: t.fontBody, fontSize: 12 }}>· 4 min read</span>
          </div>
        </div>
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {rest.map(s => (
          <button key={s.id} onClick={() => onOpen(s)} style={{
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
          }}>
            <Cover story={s} mode={t.coverMode} w="100%" h={180} radius={2} />
            <StoryMeta t={t} story={s} compact />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Creator ─────────────────────────────────────────────────
function Creator({ t, onWeave }) {
  const [context, setContext] = useState("Sophie played in the garden today and found a lonely beetle.");
  const [vocabInput, setVocabInput] = useState('');
  const [vocab, setVocab] = useState(['curious', 'tiny', 'gentle']);
  const [length, setLength] = useState(4);
  const [tone, setTone] = useState(3);

  const addVocab = (e) => {
    if ((e.key === ',' || e.key === 'Enter' || e.key === ' ') && vocabInput.trim()) {
      e.preventDefault();
      const w = vocabInput.trim().replace(/,$/, '');
      if (w && !vocab.includes(w)) setVocab([...vocab, w]);
      setVocabInput('');
    }
  };

  const fieldBox = {
    background: t.glass, border: `1px solid ${t.glassBorder}`,
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    borderRadius: t.navStyle === 'dock' ? 22 : 18, padding: 16,
  };
  const labelStyle = {
    fontFamily: t.fontBody, fontWeight: 700, fontSize: 11, letterSpacing: 1.5,
    textTransform: 'uppercase', color: t.textMuted, marginBottom: 10, display: 'block',
  };
  const toneLabels = ['Calming', 'Cozy', 'Gentle', 'Playful', 'Adventurous'];

  return (
    <div style={{ padding: '60px 20px 130px', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>Create</div>
        <h1 style={{
          margin: '4px 0 0', fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
          fontSize: t.titleSize, color: t.text, letterSpacing: -0.6, lineHeight: 1.05,
        }}>Weave a story</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Context */}
        <div style={fieldBox}>
          <label style={labelStyle}>Today's context</label>
          <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3} style={{
            width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none',
            color: t.text, fontFamily: t.fontBody, fontSize: 15, lineHeight: 1.45, fontWeight: 500,
          }} />
        </div>

        {/* Vocab tags */}
        <div style={fieldBox}>
          <label style={labelStyle}>Target vocabulary</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {vocab.map(v => (
              <div key={v} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 999,
                background: t.accentSoft, color: t.accent,
                fontFamily: t.fontBody, fontWeight: 700, fontSize: 13,
                border: `1px solid ${t.accent}33`,
              }}>
                {v}
                <button onClick={() => setVocab(vocab.filter(x => x !== v))} style={{
                  background: 'transparent', border: 'none', color: t.accent, cursor: 'pointer',
                  padding: 0, display: 'flex', opacity: 0.7,
                }}><Icon name="close" size={12} stroke={2.5} /></button>
              </div>
            ))}
            <input value={vocabInput} onChange={(e) => setVocabInput(e.target.value)} onKeyDown={addVocab}
              placeholder={vocab.length ? '' : 'twinkle, brave, …'} style={{
                flex: 1, minWidth: 80, border: 'none', outline: 'none', background: 'transparent',
                color: t.text, fontFamily: t.fontBody, fontSize: 14, fontWeight: 500, padding: '4px 0',
              }} />
          </div>
        </div>

        {/* Length slider */}
        <div style={fieldBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Length</label>
            <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle, fontSize: 22, color: t.accent }}>{length} min</div>
          </div>
          <Slider t={t} value={length} min={2} max={8} onChange={setLength} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: t.fontBody, fontSize: 11, color: t.textMuted, fontWeight: 600, marginTop: 6 }}>
            <span>Short</span><span>Long</span>
          </div>
        </div>

        {/* Tone slider */}
        <div style={fieldBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Tone</label>
            <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle, fontSize: 20, color: t.accent }}>{toneLabels[tone - 1]}</div>
          </div>
          <Slider t={t} value={tone} min={1} max={5} onChange={setTone} />
        </div>

        {/* Weave button */}
        <button onClick={() => onWeave && onWeave({ context, vocab, length, tone })} style={{
          marginTop: 8, position: 'relative', border: 'none', cursor: 'pointer',
          padding: '20px 24px', borderRadius: t.navStyle === 'dock' ? 28 : 22,
          background: `linear-gradient(135deg, ${t.accent} 0%, ${tint(t.accent, -0.15)} 60%, #ec4899 130%)`,
          color: '#1a0a3e',
          fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 20,
          letterSpacing: -0.3,
          boxShadow: `0 12px 28px ${t.accent}66, 0 2px 0 ${tint(t.accent, -0.2)}, inset 0 1px 0 rgba(255,255,255,0.5)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <Icon name="sparkles" size={22} stroke={2.5} />
          Weave Story
          <Icon name="sparkles" size={22} stroke={2.5} />
        </button>
      </div>
    </div>
  );
}

function Slider({ t, value, min, max, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position: 'relative', height: 32, marginTop: 8 }}>
      <div style={{ position: 'absolute', top: 14, left: 0, right: 0, height: 4, borderRadius: 2,
        background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', top: 14, left: 0, width: `${pct}%`, height: 4, borderRadius: 2,
        background: `linear-gradient(90deg, ${t.accent}, ${tint(t.accent, 0.1)})` }} />
      <div style={{ position: 'absolute', top: 6, left: `calc(${pct}% - 10px)`, width: 20, height: 20, borderRadius: 999,
        background: '#fff', boxShadow: `0 2px 6px rgba(0,0,0,0.4), 0 0 0 3px ${t.accent}40` }} />
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer' }} />
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────
function Settings({ t }) {
  const rows = [
    { icon: 'moon', title: 'Reader theme', detail: 'Warm dark' },
    { icon: 'book', title: 'Reading font size', detail: 'Large' },
    { icon: 'sparkles', title: 'Magic level', detail: 'Cozy' },
    { icon: 'star', title: 'Favorites', detail: '8 stories' },
  ];
  return (
    <div style={{ padding: '60px 20px 130px', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>Profile</div>
        <h1 style={{
          margin: '4px 0 0', fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
          fontSize: t.titleSize, color: t.text, letterSpacing: -0.6, lineHeight: 1.05,
        }}>Sophie</h1>
      </div>
      {/* avatar card */}
      <div style={{
        background: t.glass, border: `1px solid ${t.glassBorder}`,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 22, padding: 20, marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 999,
          background: `linear-gradient(140deg, ${t.accent}, #ec4899)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          fontFamily: t.fontHead, fontWeight: t.headWeight, color: '#1a0a3e',
          boxShadow: `0 8px 20px ${t.accent}55` }}>S</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle, fontSize: 18, color: t.text }}>3 years old</div>
          <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontSize: 13, fontWeight: 600, marginTop: 2 }}>26 stories read · 12 favorites</div>
        </div>
      </div>
      {/* settings list */}
      <div style={{
        background: t.glass, border: `1px solid ${t.glassBorder}`,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 22, overflow: 'hidden',
      }}>
        {rows.map((r, i) => (
          <div key={r.title} style={{
            display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 14,
            borderBottom: i < rows.length - 1 ? `1px solid ${t.glassBorder}` : 'none',
            color: t.text,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.accentSoft, color: t.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={r.icon} size={18} stroke={2} />
            </div>
            <div style={{ flex: 1, fontFamily: t.fontBody, fontWeight: 600, fontSize: 15 }}>{r.title}</div>
            <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontSize: 13, fontWeight: 500 }}>{r.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reader (full-screen overlay) ────────────────────────────
function Reader({ t, story, onClose }) {
  const [rating, setRating] = useState(0);
  // Render body with {word} tokens highlighted
  const renderLine = (line, i) => {
    const parts = line.split(/(\{[^}]+\})/g);
    return (
      <p key={i} style={{
        margin: '0 0 1.1em', fontFamily: t.fontBody, fontWeight: 500,
        fontSize: 22, lineHeight: 1.55,
        color: '#fde68a', letterSpacing: -0.2,
      }}>
        {parts.map((p, j) => {
          const m = p.match(/^\{(.+)\}$/);
          if (!m) return <span key={j}>{p}</span>;
          return <span key={j} style={{ color: '#fbbf24', fontWeight: 800, textShadow: '0 0 24px rgba(251,191,36,0.4)' }}>{m[1]}</span>;
        })}
      </p>
    );
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'radial-gradient(110% 90% at 50% -10%, #1e1b4b 0%, #050514 70%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* close */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 64, right: 20, zIndex: 5,
        width: 40, height: 40, borderRadius: 999,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        color: '#fef3c7', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(12px)',
      }}><Icon name="close" size={18} stroke={2.5} /></button>

      <div style={{ flex: 1, overflowY: 'auto', padding: '60px 28px 40px' }}>
        {/* Hero cover (small banner) */}
        <div style={{ marginTop: 36, marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          <Cover story={story} mode={t.coverMode} w={200} h={260} radius={20} />
        </div>

        {/* meta */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ color: '#fbbf24', fontFamily: t.fontBody, fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{story.category}</div>
          <h1 style={{
            margin: 0, fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
            fontSize: 30, lineHeight: 1.1, color: '#fef9e7', letterSpacing: -0.6,
          }}>{story.title}</h1>
        </div>

        {/* body */}
        <div style={{ maxWidth: 360 }}>
          {story.body.map(renderLine)}
        </div>

        {/* rating */}
        <div style={{ marginTop: 40, padding: '20px 16px', textAlign: 'center',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
        }}>
          <div style={{ color: '#fde68a', fontFamily: t.fontBody, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>How was tonight's story?</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                color: n <= rating ? '#fbbf24' : 'rgba(254,243,199,0.25)',
                transform: n <= rating ? 'scale(1.05)' : 'scale(1)',
                transition: 'all .15s',
              }}><Icon name="star" size={32} stroke={2} /></button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Weaving (loading) screen ────────────────────────────────
function Weaving({ t, context, vocab = [] }) {
  // 3 orbiting glyphs + breathing center sigil. Pure CSS, no JS animation.
  const steps = [
    'Gathering moonlight',
    'Calling the characters',
    'Sprinkling vocabulary',
    'Stitching it together',
  ];
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 90,
      background: 'radial-gradient(90% 70% at 50% 30%, #1e1b4b 0%, #050514 80%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 32px 100px', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes sw-orbit { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes sw-orbit-r { from { transform: rotate(360deg) } to { transform: rotate(0deg) } }
        @keyframes sw-breathe { 0%,100% { transform: scale(1); opacity: 0.95 } 50% { transform: scale(1.08); opacity: 1 } }
        @keyframes sw-twinkle { 0%,100% { opacity: 0.2 } 50% { opacity: 1 } }
        @keyframes sw-step { 0%,25%{opacity:.3} 35%,100%{opacity:1} }
      `}</style>

      {/* orbit ring (decorative dashed circle) */}
      <div style={{ position: 'relative', width: 220, height: 220, marginBottom: 44 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px dashed ${t.accent}55`, animation: 'sw-orbit 24s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 28, borderRadius: '50%', border: `1px dashed ${t.accent}33`, animation: 'sw-orbit-r 16s linear infinite' }} />

        {/* orbiting sparks */}
        {[0, 120, 240].map((deg, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0, animation: `sw-orbit ${10 + i * 4}s linear infinite`,
          }}>
            <div style={{
              position: 'absolute', top: -6, left: '50%', marginLeft: -6, width: 12, height: 12,
              borderRadius: 999, background: t.accent,
              boxShadow: `0 0 18px ${t.accent}, 0 0 6px #fff`,
              transform: `rotate(${deg}deg)`, animation: 'sw-twinkle 1.6s ease-in-out infinite',
            }} />
          </div>
        ))}

        {/* center moon sigil */}
        <div style={{
          position: 'absolute', inset: 56, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, #fde68a, ${t.accent} 70%)`,
          boxShadow: `0 0 60px ${t.accent}80, 0 0 120px ${t.accent}55, inset -10px -16px 30px rgba(0,0,0,0.35)`,
          animation: 'sw-breathe 3.2s ease-in-out infinite',
        }} />
      </div>

      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase', marginBottom: 12 }}>Weaving</div>
        <h1 style={{
          margin: 0, fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
          fontSize: 30, lineHeight: 1.15, color: t.text, letterSpacing: -0.5,
        }}>A new story for Sophie…</h1>
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map((s, i) => (
            <div key={s} style={{
              color: t.textMuted, fontFamily: t.fontBody, fontWeight: 600, fontSize: 14,
              animation: `sw-step ${1.4 + i * 0.6}s ease-out forwards`, opacity: 0,
            }}>· {s}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Library, Creator, Settings, Reader, Weaving, BottomNav });
