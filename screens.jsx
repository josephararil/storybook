// Story Weaver — screens, overlays, and modals
// Library · Creator · Settings · Reader · Weaving · ApiKeyModal · AddLinkModal
// Driven by the `t` theme object defined in app.jsx.

const { useState, useEffect, useRef } = React;

// ─── Icons ────────────────────────────────────────────────────
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
    link:     <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
    trash:    <><path d="M3 6h18" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /></>,
    pencil:   <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
}

// ─── Star rating (display only) ───────────────────────────────
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

// ─── Bottom nav ───────────────────────────────────────────────
function BottomNav({ t, tab, onChange }) {
  const items = [
    { id: 'library',  icon: 'library',  label: 'Library' },
    { id: 'create',   icon: 'sparkles', label: 'Create'  },
    { id: 'settings', icon: 'settings', label: 'Me'      },
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

// ─── Library ──────────────────────────────────────────────────
function Library({ t, items, onOpen, onDelete, onEditLink }) {
  const [query, setQuery] = useState('');
  const filtered = items.filter(s =>
    !query ||
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    (s.category && s.category.toLowerCase().includes(query.toLowerCase()))
  );

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
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>For Sophie</div>
        <h1 style={{
          margin: '4px 0 0', fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
          fontSize: t.titleSize, color: t.text, letterSpacing: t.headStyle === 'italic' ? -0.5 : -0.8, lineHeight: 1.05,
        }}>
          {t.libraryGreeting || "Tonight’s\nstories"}
        </h1>
      </div>

      {search}

      <div style={{ display: 'flex', gap: 8, margin: '18px 0 16px', overflowX: 'auto', paddingBottom: 4 }}>
        {['All', 'Bedtime', 'Animals', 'Magic', 'Adventure', 'Friends'].map((c, i) => (
          <div key={c} style={{
            padding: '7px 14px', borderRadius: 999, flexShrink: 0,
            background: i === 0 ? t.accent : t.glass,
            color: i === 0 ? '#1a0a3e' : t.textMuted,
            border: i === 0 ? 'none' : `1px solid ${t.glassBorder}`,
            fontFamily: t.fontBody, fontWeight: 700, fontSize: 12, letterSpacing: 0.3,
          }}>{c}</div>
        ))}
      </div>

      {t.layout === 'editorial' ? (
        <EditorialGrid t={t} stories={filtered} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} />
      ) : t.layout === 'pinterest' ? (
        <PinterestGrid t={t} stories={filtered} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} />
      ) : (
        <SimpleGrid t={t} stories={filtered} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} />
      )}
    </div>
  );
}

// ─── Card meta ────────────────────────────────────────────────
function StoryMeta({ t, story, compact }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
        fontSize: compact ? 14 : 15, lineHeight: 1.2, color: t.text,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{story.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        {story.type !== 'link' && (
          <StarRating value={story.rating} size={10} color={t.accent} mutedColor="rgba(255,255,255,0.15)" />
        )}
        <span style={{ color: t.textMuted, fontFamily: t.fontBody, fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          {story.type === 'link' ? '· Gemini Storybook' : `· ${story.category}`}
        </span>
      </div>
    </div>
  );
}

// ─── Story card with overflow controls ───────────────────────
function StoryCard({ t, item, onOpen, onDelete, onEditLink, coverH = 210 }) {
  const isSeed = (window.SW_SEEDS || []).some(s => s.id === item.id);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => onOpen(item)} style={{
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%',
      }}>
        <Cover story={item} mode={t.coverMode} w="100%" h={coverH} radius={20} badge={item.type === 'link'} />
        <StoryMeta t={t} story={item} />
      </button>
      {!isSeed && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 5 }}>
          {item.type === 'link' && onEditLink && (
            <button onClick={(e) => { e.stopPropagation(); onEditLink(item); }} style={{
              width: 30, height: 30, borderRadius: 999,
              background: 'rgba(15, 12, 40, 0.78)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#fbbf24', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="pencil" size={13} stroke={2} />
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} style={{
              width: 30, height: 30, borderRadius: 999,
              background: 'rgba(15, 12, 40, 0.78)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'rgba(254,243,199,0.55)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="trash" size={13} stroke={2} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SimpleGrid({ t, stories, onOpen, onDelete, onEditLink }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {stories.map(s => (
        <StoryCard key={s.id} t={t} item={s} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} />
      ))}
    </div>
  );
}

function PinterestGrid({ t, stories, onOpen, onDelete, onEditLink }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, gridAutoRows: '10px' }}>
      {stories.map((s, i) => {
        const tall    = i % 3 !== 1;
        const h       = tall ? 260 : 200;
        const rowSpan = Math.ceil((h + 80) / 12);
        return (
          <div key={s.id} style={{ gridRow: `span ${rowSpan}` }}>
            <StoryCard t={t} item={s} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} coverH={h} />
          </div>
        );
      })}
    </div>
  );
}

function EditorialGrid({ t, stories, onOpen, onDelete, onEditLink }) {
  const [hero, ...rest] = stories;
  if (!hero) return null;
  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <button onClick={() => onOpen(hero)} style={{
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%',
        }}>
          <Cover story={hero} mode={t.coverMode} w="100%" h={260} radius={2} badge={hero.type === 'link'} />
          <div style={{ marginTop: 14, paddingBottom: 10, borderBottom: `1px solid ${t.glassBorder}` }}>
            <div style={{ color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
              Tonight's feature · {hero.type === 'link' ? 'Gemini Storybook' : hero.category}
            </div>
            <div style={{
              fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
              fontSize: 24, lineHeight: 1.1, color: t.text, letterSpacing: -0.4,
            }}>{hero.title}</div>
            {hero.type !== 'link' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <StarRating value={hero.rating} size={12} color={t.accent} mutedColor="rgba(255,255,255,0.12)" />
                <span style={{ color: t.textMuted, fontFamily: t.fontBody, fontSize: 12 }}>· 4 min read</span>
              </div>
            )}
          </div>
        </button>
        {!(window.SW_SEEDS || []).some(s => s.id === hero.id) && (
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 5 }}>
            {hero.type === 'link' && onEditLink && (
              <button onClick={(e) => { e.stopPropagation(); onEditLink(hero); }} style={{
                width: 30, height: 30, borderRadius: 999,
                background: 'rgba(15,12,40,0.78)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fbbf24', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="pencil" size={13} stroke={2} /></button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(hero.id); }} style={{
                width: 30, height: 30, borderRadius: 999,
                background: 'rgba(15,12,40,0.78)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: 'rgba(254,243,199,0.55)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="trash" size={13} stroke={2} /></button>
            )}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {rest.map(s => (
          <StoryCard key={s.id} t={t} item={s} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} coverH={180} />
        ))}
      </div>
    </div>
  );
}

// ─── Creator ──────────────────────────────────────────────────
function Creator({ t, onWeave, onAddLink, context, setContext, vocab, setVocab, length, setLength, tone, setTone }) {
  const [vocabInput, setVocabInput] = useState('');

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
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>Create</div>
        <h1 style={{
          margin: '4px 0 0', fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
          fontSize: t.titleSize, color: t.text, letterSpacing: -0.6, lineHeight: 1.05,
        }}>Weave a story</h1>
      </div>

      {/* Chooser cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{
          flex: 1, background: t.accentSoft, border: `1px solid ${t.accent}44`,
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 18, padding: '14px 10px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
        }}>
          <Icon name="sparkles" size={18} stroke={2} />
          <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 12, color: t.accent }}>Bespoke tale</div>
          <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textMuted, lineHeight: 1.3 }}>AI-generated story</div>
        </div>
        <button onClick={onAddLink} style={{
          flex: 1, background: t.glass, border: `1px solid ${t.glassBorder}`,
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 18, padding: '14px 10px', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
        }}>
          <Icon name="link" size={18} stroke={2} />
          <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 12, color: t.text }}>Gemini Storybook</div>
          <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textMuted, lineHeight: 1.3 }}>Link an existing one</div>
        </button>
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
      <div style={{ position: 'absolute', top: 14, left: 0, right: 0, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', top: 14, left: 0, width: `${pct}%`, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${t.accent}, ${tint(t.accent, 0.1)})` }} />
      <div style={{ position: 'absolute', top: 6, left: `calc(${pct}% - 10px)`, width: 20, height: 20, borderRadius: 999, background: '#fff', boxShadow: `0 2px 6px rgba(0,0,0,0.4), 0 0 0 3px ${t.accent}40` }} />
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer' }} />
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────
function Settings({ t, onOpenKeyModal }) {
  const apiConfigured = window.SW?.hasApiKey();
  const rows = [
    { icon: 'wand',     title: 'Gemini API key',   detail: apiConfigured ? 'Configured' : 'Not set', onClick: onOpenKeyModal },
    { icon: 'moon',     title: 'Reader theme',      detail: 'Warm dark' },
    { icon: 'book',     title: 'Reading font size', detail: 'Large' },
    { icon: 'sparkles', title: 'Magic level',       detail: 'Cozy' },
    { icon: 'star',     title: 'Favorites',         detail: '8 stories' },
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
      <div style={{
        background: t.glass, border: `1px solid ${t.glassBorder}`,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 22, overflow: 'hidden',
      }}>
        {rows.map((r, i) => (
          <div key={r.title}
            onClick={r.onClick}
            style={{
              display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 14,
              borderBottom: i < rows.length - 1 ? `1px solid ${t.glassBorder}` : 'none',
              color: t.text,
              cursor: r.onClick ? 'pointer' : 'default',
            }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.accentSoft, color: t.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={r.icon} size={18} stroke={2} />
            </div>
            <div style={{ flex: 1, fontFamily: t.fontBody, fontWeight: 600, fontSize: 15 }}>{r.title}</div>
            <div style={{
              color: r.title === 'Gemini API key' && !apiConfigured ? '#f87171' : t.textMuted,
              fontFamily: t.fontBody, fontSize: 13, fontWeight: 500,
            }}>{r.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reader ───────────────────────────────────────────────────
function Reader({ t, story, onClose, onRate, onDelete }) {
  const [rating, setRating] = useState(story.rating || 0);
  const isSeed = (window.SW_SEEDS || []).some(s => s.id === story.id);

  const handleRate = (n) => {
    setRating(n);
    if (onRate) onRate(story.id, n);
  };

  const renderLine = (line, i) => {
    const parts = line.split(/(\{[^}]+\})/g);
    return (
      <p key={i} style={{
        margin: '0 0 1.1em', fontFamily: t.fontBody, fontWeight: 500,
        fontSize: 22, lineHeight: 1.55, color: '#fde68a', letterSpacing: -0.2,
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
      <button onClick={onClose} style={{
        position: 'absolute', top: 64, right: 20, zIndex: 5,
        width: 40, height: 40, borderRadius: 999,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        color: '#fef3c7', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(12px)',
      }}><Icon name="close" size={18} stroke={2.5} /></button>

      <div style={{ flex: 1, overflowY: 'auto', padding: '60px 28px 40px' }}>
        {/* Hero cover */}
        <div style={{ marginTop: 36, marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          {story.coverImage ? (
            <img src={story.coverImage} alt="" style={{
              width: 200, height: 260, borderRadius: 20, objectFit: 'cover',
              boxShadow: '0 12px 36px rgba(0,0,0,0.55)',
            }} />
          ) : (
            <Cover story={story} mode={t.coverMode} w={200} h={260} radius={20} />
          )}
        </div>

        {/* Meta */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ color: '#fbbf24', fontFamily: t.fontBody, fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{story.category}</div>
          <h1 style={{
            margin: 0, fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
            fontSize: 30, lineHeight: 1.1, color: '#fef9e7', letterSpacing: -0.6,
          }}>{story.title}</h1>
        </div>

        {/* Body */}
        <div style={{ maxWidth: 360 }}>
          {story.body.map(renderLine)}
        </div>

        {/* Rating */}
        <div style={{ marginTop: 40, padding: '20px 16px', textAlign: 'center',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
        }}>
          <div style={{ color: '#fde68a', fontFamily: t.fontBody, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>How was tonight's story?</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => handleRate(n)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                color: n <= rating ? '#fbbf24' : 'rgba(254,243,199,0.25)',
                transform: n <= rating ? 'scale(1.05)' : 'scale(1)',
                transition: 'all .15s',
              }}><Icon name="star" size={32} stroke={2} /></button>
            ))}
          </div>
        </div>

        {/* Delete (non-seeds only) */}
        {!isSeed && onDelete && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button onClick={() => onDelete(story.id)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'rgba(248,113,113,0.55)', fontFamily: t.fontBody, fontWeight: 600, fontSize: 13,
              padding: '8px 16px',
            }}>Delete story</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Weaving (loading / error) ────────────────────────────────
function Weaving({ t, error }) {
  const steps = [
    'Gathering moonlight',
    'Calling the characters',
    'Sprinkling vocabulary',
    'Stitching it together',
  ];

  const container = {
    position: 'absolute', inset: 0, zIndex: 90,
    background: 'radial-gradient(90% 70% at 50% 30%, #1e1b4b 0%, #050514 80%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '60px 32px 100px', overflow: 'hidden',
  };

  if (error) {
    return (
      <div style={container}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 24, padding: 32, textAlign: 'center', maxWidth: 320,
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 14, color: '#fca5a5' }}>✦</div>
          <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 20, color: '#fca5a5', marginBottom: 10 }}>
            Story couldn't be woven
          </div>
          <div style={{ fontFamily: t.fontBody, fontSize: 14, color: t.textMuted, lineHeight: 1.55 }}>{error}</div>
          <div style={{ marginTop: 14, color: t.textMuted, fontFamily: t.fontBody, fontSize: 12 }}>
            Returning to create…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <style>{`
        @keyframes sw-orbit { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes sw-orbit-r { from { transform: rotate(360deg) } to { transform: rotate(0deg) } }
        @keyframes sw-breathe { 0%,100% { transform: scale(1); opacity: 0.95 } 50% { transform: scale(1.08); opacity: 1 } }
        @keyframes sw-twinkle { 0%,100% { opacity: 0.2 } 50% { opacity: 1 } }
        @keyframes sw-step { 0%,25%{opacity:.3} 35%,100%{opacity:1} }
      `}</style>

      <div style={{ position: 'relative', width: 220, height: 220, marginBottom: 44 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px dashed ${t.accent}55`, animation: 'sw-orbit 24s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 28, borderRadius: '50%', border: `1px dashed ${t.accent}33`, animation: 'sw-orbit-r 16s linear infinite' }} />
        {[0, 120, 240].map((deg, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, animation: `sw-orbit ${10 + i * 4}s linear infinite` }}>
            <div style={{
              position: 'absolute', top: -6, left: '50%', marginLeft: -6, width: 12, height: 12,
              borderRadius: 999, background: t.accent,
              boxShadow: `0 0 18px ${t.accent}, 0 0 6px #fff`,
              transform: `rotate(${deg}deg)`, animation: 'sw-twinkle 1.6s ease-in-out infinite',
            }} />
          </div>
        ))}
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

// ─── ApiKeyModal ──────────────────────────────────────────────
function ApiKeyModal({ t, open, onClose }) {
  const [value,    setValue]    = useState(() => window.SW.getApiKey());
  const [checking, setChecking] = useState(false);
  const [error,    setError]    = useState('');

  if (!open) return null;

  const handleSave = async () => {
    const k = value.trim();
    if (!k) return;
    setChecking(true);
    setError('');
    try {
      const ok = await window.SW.validateApiKey(k);
      if (ok) { window.SW.setApiKey(k); onClose(); }
      else    { setError("That key didn't work — double-check it."); }
    } catch   { setError("That key didn't work — double-check it."); }
    finally   { setChecking(false); }
  };

  const fieldBox = {
    background: t.glass, border: `1px solid ${t.glassBorder}`,
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 18, padding: '14px 16px',
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: 'rgba(2, 6, 23, 0.88)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 64, right: 20,
        width: 40, height: 40, borderRadius: 999,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        color: t.text, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon name="close" size={18} stroke={2.5} /></button>

      <div style={{
        width: '100%', maxWidth: 380,
        background: 'rgba(12, 9, 36, 0.92)',
        border: `1px solid ${t.glassBorder}`,
        borderRadius: 24, padding: 24,
      }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 22, color: t.text, marginBottom: 10 }}>
            Gemini API Key
          </div>
          <div style={{ fontFamily: t.fontBody, fontSize: 14, color: t.textMuted, lineHeight: 1.55 }}>
            Needed to weave AI stories. Get a free key at{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
               style={{ color: t.accent, fontWeight: 700, textDecoration: 'none' }}>
              aistudio.google.com/apikey
            </a>
          </div>
        </div>

        <div style={fieldBox}>
          <input
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            placeholder="Paste your API key…"
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              color: t.text, fontFamily: t.fontBody, fontSize: 15, fontWeight: 500,
            }}
          />
        </div>

        {error && (
          <div style={{ marginTop: 10, color: '#f87171', fontFamily: t.fontBody, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={checking || !value.trim()}
          style={{
            marginTop: 16, width: '100%', border: 'none',
            cursor: checking || !value.trim() ? 'default' : 'pointer',
            padding: '16px 24px', borderRadius: 18,
            background: checking || !value.trim()
              ? 'rgba(251,191,36,0.25)'
              : `linear-gradient(135deg, ${t.accent}, ${tint(t.accent, -0.15)})`,
            color: checking || !value.trim() ? t.textMuted : '#1a0a3e',
            fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 17,
          }}
        >
          {checking ? 'Checking…' : 'Save Key'}
        </button>
      </div>
    </div>
  );
}

// ─── AddLinkModal ─────────────────────────────────────────────
const SCENES_LIST = ['moon','fox','unicorn','whale','dragon','bear','cloud','turtle'];
const PALETTE_PRESETS = [
  ['#0f172a','#312e81','#fbbf24'],
  ['#0c4a6e','#0ea5e9','#e0f2fe'],
  ['#831843','#ec4899','#fce7f3'],
  ['#064e3b','#10b981','#ecfdf5'],
  ['#7c2d12','#ea580c','#fef3c7'],
];

function AddLinkModal({ t, open, onClose, onSave, item }) {
  const [url,     setUrl]     = useState(item?.url     || '');
  const [title,   setTitle]   = useState(item?.title   || '');
  const [scene,   setScene]   = useState(item?.scene   || 'moon');
  const [palette, setPalette] = useState(item?.palette || PALETTE_PRESETS[0]);

  useEffect(() => {
    setUrl    (item?.url     || '');
    setTitle  (item?.title   || '');
    setScene  (item?.scene   || 'moon');
    setPalette(item?.palette || PALETTE_PRESETS[0]);
  }, [item]);

  if (!open) return null;

  const canSave = url.trim() && title.trim();

  const fieldBox = {
    background: t.glass, border: `1px solid ${t.glassBorder}`,
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 18, padding: '12px 16px', marginBottom: 12,
  };
  const labelStyle = {
    fontFamily: t.fontBody, fontWeight: 700, fontSize: 11, letterSpacing: 1.5,
    textTransform: 'uppercase', color: t.textMuted, marginBottom: 8, display: 'block',
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: 'rgba(2, 6, 23, 0.88)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '72px 20px 120px', maxWidth: 440, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 22, color: t.text }}>
            {item ? 'Edit Storybook' : 'Link a Storybook'}
          </div>
          <button onClick={onClose} style={{
            width: 40, height: 40, borderRadius: 999,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: t.text, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="close" size={18} stroke={2.5} /></button>
        </div>

        {/* URL */}
        <div style={fieldBox}>
          <label style={labelStyle}>Gemini URL</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="g.co/gemini/share/…"
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent',
              color: t.text, fontFamily: t.fontBody, fontSize: 15, fontWeight: 500 }} />
        </div>

        {/* Title */}
        <div style={fieldBox}>
          <label style={labelStyle}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Story title…"
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent',
              color: t.text, fontFamily: t.fontBody, fontSize: 15, fontWeight: 500 }} />
        </div>

        {/* Scene chips */}
        <div style={{ ...fieldBox, padding: '14px 16px' }}>
          <label style={labelStyle}>Scene</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SCENES_LIST.map(s => (
              <button key={s} onClick={() => setScene(s)} style={{
                padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                background: scene === s ? t.accent : t.glass,
                color: scene === s ? '#1a0a3e' : t.textMuted,
                border: scene === s ? 'none' : `1px solid ${t.glassBorder}`,
                fontFamily: t.fontBody, fontWeight: 700, fontSize: 12,
                textTransform: 'capitalize',
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Palette swatches */}
        <div style={{ ...fieldBox, padding: '14px 16px' }}>
          <label style={labelStyle}>Palette</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {PALETTE_PRESETS.map((p, i) => (
              <button key={i} onClick={() => setPalette(p)} style={{
                width: 36, height: 36, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${p[0]} 0%, ${p[1]} 60%, ${p[2]} 100%)`,
                outline: JSON.stringify(palette) === JSON.stringify(p) ? `3px solid ${t.accent}` : 'none',
                outlineOffset: 2,
              }} />
            ))}
          </div>
        </div>

        {/* Cover preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Cover
            story={{ scene, palette, type: 'link', title: title || 'Preview' }}
            mode="glow" w={110} h={148} radius={16} badge={true}
          />
        </div>

        {/* Save button */}
        <button onClick={() => canSave && onSave({ url: url.trim(), title: title.trim(), scene, palette }, item?.id || null)}
          disabled={!canSave}
          style={{
            width: '100%', border: 'none', cursor: canSave ? 'pointer' : 'default',
            padding: '18px 24px', borderRadius: 18,
            background: canSave
              ? `linear-gradient(135deg, ${t.accent}, ${tint(t.accent, -0.15)})`
              : 'rgba(251,191,36,0.25)',
            color: canSave ? '#1a0a3e' : t.textMuted,
            fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 18,
          }}>
          {item ? 'Save Changes' : 'Add to Library'}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Library, Creator, Settings, Reader, Weaving, BottomNav, ApiKeyModal, AddLinkModal });
