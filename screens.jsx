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
    cake:     <><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" /><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" /><path d="M2 21h20" /><path d="M7 8v2" /><path d="M12 8v2" /><path d="M17 8v2" /><path d="M7 4h.01" /><path d="M12 4h.01" /><path d="M17 4h.01" /></>,
    image:      <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
    'cloud-up': <><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m8 17 4-5 4 5" /></>,
    'cloud-dn': <><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 17-4 5-4-5" /></>,
    eye:        <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
    'eye-off':  <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>,
    check:      <><path d="M20 6L9 17l-5-5" /></>,
    play:       <><polygon points="5 3 19 12 5 21 5 3" /></>,
    pause:      <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
}

// ─── Star rating ──────────────────────────────────────────────
function StarRating({ value, max = 5, size = 12, color, mutedColor, onRate }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, color }}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{ color: i < value ? color : mutedColor, display: 'inline-flex', cursor: onRate ? 'pointer' : 'default' }}
          onClick={onRate ? (e) => { e.stopPropagation(); onRate(i + 1); } : undefined}
        >
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
function Library({ t, items, onOpen, onDelete, onEditLink, onRate, childName }) {
  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState('All');

  const filtered = items.filter(s => {
    const matchQuery = !query ||
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(query.toLowerCase()));
    const matchCat = category === 'All' ||
      (category === 'Stories' && s.type === 'story') ||
      (category === 'Linked'  && s.type === 'link');
    return matchQuery && matchCat;
  });

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
        <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>For {childName}</div>
        <h1 style={{
          margin: '4px 0 0', fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
          fontSize: t.titleSize, color: t.text, letterSpacing: t.headStyle === 'italic' ? -0.5 : -0.8, lineHeight: 1.05,
        }}>
          {t.libraryGreeting || "Tonight's\nstories"}
        </h1>
      </div>

      {search}

      <div style={{ display: 'flex', gap: 8, margin: '18px 0 16px', overflowX: 'auto', paddingBottom: 4 }}>
        {['All', 'Stories', 'Linked'].map((c) => {
          const active = category === c;
          return (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '7px 14px', borderRadius: 999, flexShrink: 0,
              background: active ? t.accent : t.glass,
              color: active ? '#1a0a3e' : t.textMuted,
              border: active ? 'none' : `1px solid ${t.glassBorder}`,
              fontFamily: t.fontBody, fontWeight: 700, fontSize: 12, letterSpacing: 0.3,
              cursor: 'pointer',
            }}>{c}</button>
          );
        })}
      </div>

      {t.layout === 'editorial' ? (
        <EditorialGrid t={t} stories={filtered} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} onRate={onRate} />
      ) : t.layout === 'pinterest' ? (
        <PinterestGrid t={t} stories={filtered} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} onRate={onRate} />
      ) : (
        <SimpleGrid t={t} stories={filtered} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} onRate={onRate} />
      )}
    </div>
  );
}

// ─── Card meta ────────────────────────────────────────────────
function StoryMeta({ t, story, compact, onRate }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
        fontSize: compact ? 14 : 15, lineHeight: 1.2, color: t.text,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{story.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <StarRating
          value={story.rating || 0} size={10} color={t.accent} mutedColor="rgba(255,255,255,0.15)"
          onRate={onRate ? (n) => onRate(story.id, n) : undefined}
        />
        <span style={{ color: t.textMuted, fontFamily: t.fontBody, fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          {story.type === 'link' ? '· Gemini Storybook' : `· ${story.category}`}
        </span>
      </div>
    </div>
  );
}

// ─── Story card with overflow controls ───────────────────────
function StoryCard({ t, item, onOpen, onDelete, onEditLink, onRate, coverH = 210 }) {
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => onOpen(item)} style={{
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%',
      }}>
        {item.coverImage ? (
          <img src={item.coverImage} alt="" style={{ width: '100%', height: coverH, borderRadius: 20, objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: coverH, borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>📖</div>
        )}
        <StoryMeta t={t} story={item} onRate={onRate} />
      </button>
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 5 }}>
        {onEditLink && (
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
    </div>
  );
}

function SimpleGrid({ t, stories, onOpen, onDelete, onEditLink, onRate }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {stories.map(s => (
        <StoryCard key={s.id} t={t} item={s} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} onRate={onRate} />
      ))}
    </div>
  );
}

function PinterestGrid({ t, stories, onOpen, onDelete, onEditLink, onRate }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, gridAutoRows: '10px' }}>
      {stories.map((s, i) => {
        const tall    = i % 3 !== 1;
        const h       = tall ? 260 : 200;
        const rowSpan = Math.ceil((h + 80) / 12);
        return (
          <div key={s.id} style={{ gridRow: `span ${rowSpan}` }}>
            <StoryCard t={t} item={s} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} onRate={onRate} coverH={h} />
          </div>
        );
      })}
    </div>
  );
}

function EditorialGrid({ t, stories, onOpen, onDelete, onEditLink, onRate }) {
  const [hero, ...rest] = stories;
  if (!hero) return null;
  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <button onClick={() => onOpen(hero)} style={{
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%',
        }}>
          {hero.coverImage ? (
            <img src={hero.coverImage} alt="" style={{ width: '100%', height: 260, borderRadius: 2, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: 260, borderRadius: 2, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📖</div>
          )}
          <div style={{ marginTop: 14, paddingBottom: 10, borderBottom: `1px solid ${t.glassBorder}` }}>
            <div style={{ color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
              Tonight's feature · {hero.type === 'link' ? 'Gemini Storybook' : hero.category}
            </div>
            <div style={{
              fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
              fontSize: 24, lineHeight: 1.1, color: t.text, letterSpacing: -0.4,
            }}>{hero.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <StarRating
                value={hero.rating || 0} size={12} color={t.accent} mutedColor="rgba(255,255,255,0.12)"
                onRate={onRate ? (n) => onRate(hero.id, n) : undefined}
              />
              {hero.type !== 'link' && (
                <span style={{ color: t.textMuted, fontFamily: t.fontBody, fontSize: 12 }}>· 4 min read</span>
              )}
            </div>
          </div>
        </button>
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 5 }}>
          {onEditLink && (
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
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {rest.map(s => (
          <StoryCard key={s.id} t={t} item={s} onOpen={onOpen} onDelete={onDelete} onEditLink={onEditLink} onRate={onRate} coverH={180} />
        ))}
      </div>
    </div>
  );
}

// ─── Creator ──────────────────────────────────────────────────

function Creator({ t, onWeave, onAddLink, context, setContext, vocab, setVocab, pages, setPages, tone, setTone, storyStyle, setStoryStyle, character, setCharacter, childName }) {
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
          <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3} placeholder="What did you do today?" style={{
            width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none',
            color: t.text, fontFamily: t.fontBody, fontSize: 15, lineHeight: 1.45, fontWeight: 500,
          }} />
        </div>

        {/* Who does the child meet? */}
        <div style={fieldBox}>
          <label style={labelStyle}>Who does {childName} meet? <span style={{ fontWeight: 500, opacity: 0.45 }}>optional</span></label>
          <input
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            placeholder="Enter character"
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              color: t.text, fontFamily: t.fontBody, fontSize: 14, fontWeight: 500,
            }}
          />
        </div>

        {/* Story style */}
        <div style={fieldBox}>
          <label style={labelStyle}>Story style</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'prose', label: 'Prose',    sub: 'flowing narrative' },
              { key: 'rhyme', label: 'Rhyming',  sub: 'AABB couplets'    },
            ].map(s => {
              const active = storyStyle === s.key;
              return (
                <button key={s.key} onClick={() => setStoryStyle(s.key)} style={{
                  flex: 1, padding: '12px 10px', borderRadius: 14, cursor: 'pointer',
                  background: active ? t.accentSoft : 'transparent',
                  border: active ? `1px solid ${t.accent}44` : `1px solid ${t.glassBorder}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}>
                  <span style={{ fontFamily: t.fontBody, fontWeight: 800, fontSize: 14, color: active ? t.accent : t.text }}>{s.label}</span>
                  <span style={{ fontFamily: t.fontBody, fontSize: 10, color: t.textMuted, fontWeight: 600 }}>{s.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vocab tags */}
        <div style={fieldBox}>
          <label style={labelStyle}>Target vocabulary <span style={{ fontWeight: 500, opacity: 0.45 }}>optional</span></label>
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

        {/* Pages slider */}
        <div style={fieldBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>How many pages?</label>
            <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle, fontSize: 22, color: t.accent }}>{pages} pages</div>
          </div>
          <Slider t={t} value={pages} min={4} max={10} onChange={setPages} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: t.fontBody, fontSize: 11, color: t.textMuted, fontWeight: 600, marginTop: 6 }}>
            <span>Shorter</span><span>Longer</span>
          </div>
        </div>

        {/* Tone */}
        <div style={fieldBox}>
          <label style={labelStyle}>Tone</label>
          <input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="e.g. calming, silly, adventurous, dreamy…"
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              color: t.text, fontFamily: t.fontBody, fontSize: 14, fontWeight: 500,
            }}
          />
        </div>

        {/* Weave button */}
        <button onClick={() => onWeave && onWeave({ context, vocab, pages, tone, storyStyle, character })} style={{
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
function Settings({ t, onOpenKeyModal, onNameChange, items, onDriveMigrate }) {
  const [childName,    setChildNameLocal] = useState(() => window.SW?.getChildName() || 'Sophie');
  const [birthday,     setBirthdayLocal]  = useState(() => window.SW?.getChildBirthday() || '');
  const [sampleSet,    setSampleSet]      = useState(() => !!window.SW?.getSampleImage());
  const photoInputRef = useRef(null);
  const apiConfigured = window.SW?.isApiReady();

  const [driveConnected,  setDriveConnected]  = useState(() => window.SW?.drive?.isConnected() || false);
  const [driveEmail,      setDriveEmail]      = useState(() => window.SW?.drive?.getEmail() || '');
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [driveError,      setDriveError]      = useState(null);
  const [migrating,       setMigrating]       = useState(false);
  const [migrateProgress, setMigrateProgress] = useState(null);
  const [driveSync,       setDriveSync]       = useState(null);
  const [driveSyncStatus, setDriveSyncStatus] = useState(null);

  const migrateCount = (items || []).filter(i => i.coverImage && !i.coverDriveId).length;

  const handleDriveConnect = async () => {
    setDriveConnecting(true);
    setDriveError(null);
    try {
      const email = await window.SW.drive.connect();
      setDriveEmail(email);
      setDriveConnected(true);
    } catch (e) {
      setDriveError(e.message || 'Failed to connect to Google Drive.');
    } finally {
      setDriveConnecting(false);
    }
  };

  const handleDriveDisconnect = () => {
    window.SW?.drive?.disconnect();
    setDriveConnected(false);
    setDriveEmail('');
    setMigrateProgress(null);
    setDriveError(null);
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateProgress({ total: migrateCount, done: 0 });
    try {
      await onDriveMigrate?.((p) => setMigrateProgress(p));
    } catch (e) {
      setDriveError(e.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleDrivePush = async () => {
    setDriveSync('push');
    setDriveSyncStatus(null);
    try {
      await window.SW.drive.pushSync();
      setDriveSyncStatus({ ok: true, msg: 'Saved to Google Drive.' });
    } catch (e) {
      setDriveSyncStatus({ err: true, msg: e.message });
    } finally {
      setDriveSync(null);
    }
  };

  const handleDrivePull = async () => {
    setDriveSync('pull');
    setDriveSyncStatus(null);
    try {
      await window.SW.drive.pullSync(); // reloads page on success
    } catch (e) {
      setDriveSyncStatus({ err: true, msg: e.message });
      setDriveSync(null);
    }
  };

  const computeAge = (bd) => {
    if (!bd) return null;
    const d = new Date(bd), now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age >= 0 ? age : null;
  };

  const age     = computeAge(birthday);
  const initial = (childName || 'S')[0].toUpperCase();

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await window.SW.compressImageForStorage(file);
      window.SW.setSampleImage(dataUrl);
      setSampleSet(true);
    } catch {}
  };

  const handleClearPhoto = () => {
    window.SW?.clearSampleImage();
    setSampleSet(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  // ── Event Log ──────────────────────────────────────
  const [logOpen,   setLogOpen]   = useState(false);
  const [logEvents, setLogEvents] = useState(() => window.SW_TRACKER?.getAll(200) || []);

  useEffect(() => {
    if (!window.SW_TRACKER) return;
    // Refresh on open; subscribe while open so new events appear live.
    setLogEvents(window.SW_TRACKER.getAll(200));
    if (!logOpen) return;
    const unsub = window.SW_TRACKER.subscribe(() => setLogEvents(window.SW_TRACKER.getAll(200)));
    return unsub;
  }, [logOpen]);

  const finishedEvents = logEvents.filter(e => e.status !== 'in_flight')
    .sort((a, b) => b.startTime - a.startTime);

  const dayGroups = (() => {
    const map = new Map();
    for (const ev of finishedEvents) {
      const key = new Date(ev.startTime).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return Array.from(map.entries());
  })();

  const handleCopyLog = () => {
    const payload = JSON.stringify(finishedEvents, null, 2);
    navigator.clipboard?.writeText(payload).catch(() => {});
  };

  const handleClearLog = () => {
    window.SW_TRACKER?.clearLog();
    setLogEvents([]);
  };

  const fmtDur = (ms) => ms == null ? '' : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const rows = [
    { icon: 'wand', title: 'Gemini AI', detail: !apiConfigured ? 'Not set' : window.SW?.getUseProxy() ? 'Shared key' : 'Configured', onClick: onOpenKeyModal },
  ];

  return (
    <div style={{ padding: '60px 20px 130px', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' }}>Profile</div>
        <input
          value={childName}
          onChange={(e) => setChildNameLocal(e.target.value)}
          onBlur={() => { window.SW?.setChildName(childName); onNameChange?.(childName); }}
          style={{
            display: 'block', width: '100%', border: 'none', outline: 'none', background: 'transparent',
            margin: '4px 0 0', fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle,
            fontSize: t.titleSize, color: t.text, letterSpacing: -0.6, lineHeight: 1.05, padding: 0,
          }}
        />
      </div>

      <div style={{
        background: t.glass, border: `1px solid ${t.glassBorder}`,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 22, padding: 20, marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 999,
          background: `linear-gradient(140deg, ${t.accent}, #ec4899)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          fontFamily: t.fontHead, fontWeight: t.headWeight, color: '#1a0a3e',
          boxShadow: `0 8px 20px ${t.accent}55`, flexShrink: 0,
        }}>{initial}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle, fontSize: 18, color: t.text }}>
            {age !== null ? `${age} year${age !== 1 ? 's' : ''} old` : 'Set birthday below'}
          </div>
          <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontSize: 13, fontWeight: 600, marginTop: 2 }}>26 stories read · 12 favorites</div>
        </div>
      </div>

      {/* Birthday field */}
      <div style={{
        background: t.glass, border: `1px solid ${t.glassBorder}`,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 22, padding: '14px 20px', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: t.accentSoft, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="cake" size={18} stroke={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: t.textMuted, marginBottom: 4 }}>Birthday</div>
          <input
            type="date"
            value={birthday}
            onChange={(e) => { setBirthdayLocal(e.target.value); window.SW?.setChildBirthday(e.target.value); }}
            style={{ border: 'none', outline: 'none', background: 'transparent', color: t.text, fontFamily: t.fontBody, fontSize: 15, fontWeight: 500, width: '100%', colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Sample reference photo for image generation */}
      <div style={{
        background: t.glass, border: `1px solid ${t.glassBorder}`,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 22, padding: '14px 20px', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: t.accentSoft, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="image" size={18} stroke={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: t.textMuted, marginBottom: 4 }}>Illustration reference</div>
          <div style={{ fontFamily: t.fontBody, fontSize: 14, color: t.text, fontWeight: 500 }}>
            {sampleSet ? 'Reference photo set' : 'No reference photo'}
          </div>
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
        {sampleSet ? (
          <button onClick={handleClearPhoto} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#f87171', fontFamily: t.fontBody, fontWeight: 600, fontSize: 13,
            padding: '4px 8px', borderRadius: 8, flexShrink: 0,
          }}>Clear</button>
        ) : (
          <button onClick={() => photoInputRef.current?.click()} style={{
            background: t.accentSoft, border: `1px solid ${t.accent}44`, cursor: 'pointer',
            color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 13,
            padding: '6px 12px', borderRadius: 10, flexShrink: 0,
          }}>Upload</button>
        )}
      </div>

      {/* Google Drive */}
      <div style={{
        background: t.glass, border: `1px solid ${t.glassBorder}`,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 22, padding: 20, marginBottom: 18,
      }}>
        <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: t.textMuted, marginBottom: 14 }}>Google Drive</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: driveConnected ? 'rgba(74,222,128,0.15)' : t.accentSoft,
            color: driveConnected ? '#4ade80' : t.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="cloud-up" size={18} stroke={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: t.fontBody, fontWeight: 600, fontSize: 14, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {driveConnected ? driveEmail : 'Not connected'}
            </div>
            {driveConnected && (
              <div style={{ fontFamily: t.fontBody, fontSize: 12, color: '#4ade80', fontWeight: 600, marginTop: 2 }}>Connected</div>
            )}
          </div>
          {!driveConnected ? (
            <button onClick={handleDriveConnect} disabled={driveConnecting} style={{
              background: t.accentSoft, border: `1px solid ${t.accent}44`,
              cursor: driveConnecting ? 'default' : 'pointer',
              color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 13,
              padding: '6px 14px', borderRadius: 10, flexShrink: 0,
              opacity: driveConnecting ? 0.6 : 1,
            }}>{driveConnecting ? 'Connecting…' : 'Connect'}</button>
          ) : (
            <button onClick={handleDriveDisconnect} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#f87171', fontFamily: t.fontBody, fontWeight: 600, fontSize: 13,
              padding: '4px 8px', borderRadius: 8, flexShrink: 0,
            }}>Disconnect</button>
          )}
        </div>

        {driveConnected && migrateCount > 0 && (
          <button onClick={handleMigrate} disabled={migrating} style={{
            marginTop: 14, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '11px 0', borderRadius: 12,
            background: t.accentSoft, border: `1px solid ${t.accent}55`,
            color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 13,
            cursor: migrating ? 'default' : 'pointer', opacity: migrating ? 0.7 : 1,
          }}>
            <Icon name="cloud-up" size={15} stroke={2} />
            {migrating && migrateProgress
              ? `Backing up ${migrateProgress.done + 1} of ${migrateProgress.total}…`
              : `Back up ${migrateCount} cover${migrateCount !== 1 ? 's' : ''} to Drive`}
          </button>
        )}

        {driveConnected && migrateCount === 0 && (items || []).some(i => i.coverDriveId) && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80', fontFamily: t.fontBody, fontSize: 13, fontWeight: 600 }}>
            <Icon name="check" size={14} stroke={2.5} /> All covers backed up to Drive
          </div>
        )}

        {driveError && (
          <div style={{
            marginTop: 10, padding: '9px 12px', borderRadius: 10,
            background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
            color: '#f87171', fontFamily: t.fontBody, fontSize: 13, fontWeight: 600,
          }}>{driveError}</div>
        )}

        {driveConnected && (
          <>
            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <button
                onClick={handleDrivePush}
                disabled={!!driveSync}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px 0', borderRadius: 12,
                  background: t.accentSoft, border: `1px solid ${t.accent}55`,
                  color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 13,
                  cursor: driveSync ? 'default' : 'pointer', opacity: driveSync && driveSync !== 'push' ? 0.45 : 1,
                }}
              >
                <Icon name="cloud-up" size={15} stroke={2} />
                {driveSync === 'push' ? 'Saving…' : 'Save to Drive'}
              </button>
              <button
                onClick={handleDrivePull}
                disabled={!!driveSync}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px 0', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${t.glassBorder}`,
                  color: t.text, fontFamily: t.fontBody, fontWeight: 700, fontSize: 13,
                  cursor: driveSync ? 'default' : 'pointer', opacity: driveSync && driveSync !== 'pull' ? 0.45 : 1,
                }}
              >
                <Icon name="cloud-dn" size={15} stroke={2} />
                {driveSync === 'pull' ? 'Restoring…' : 'Restore from Drive'}
              </button>
            </div>
            {driveSyncStatus && (
              <div style={{
                marginTop: 10, padding: '9px 12px', borderRadius: 10,
                background: driveSyncStatus.ok ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                border: `1px solid ${driveSyncStatus.ok ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                color: driveSyncStatus.ok ? '#4ade80' : '#f87171',
                fontFamily: t.fontBody, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                {driveSyncStatus.ok && <Icon name="check" size={14} stroke={2.5} />}
                {driveSyncStatus.msg}
              </div>
            )}
          </>
        )}
      </div>

      {/* Event Log */}
      <div style={{
        background: t.glass, border: `1px solid ${t.glassBorder}`,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 22, marginBottom: 18, overflow: 'hidden',
      }}>
        {/* Collapsible header */}
        <div
          onClick={() => setLogOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 14, cursor: 'pointer' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: t.accentSoft, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="eye" size={18} stroke={2} />
          </div>
          <div style={{ flex: 1, fontFamily: t.fontBody, fontWeight: 600, fontSize: 15 }}>Event Log</div>
          <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontSize: 13, fontWeight: 500, marginRight: 4 }}>
            {finishedEvents.length > 0 ? `${finishedEvents.length} event${finishedEvents.length !== 1 ? 's' : ''}` : 'Empty'}
          </div>
          <div style={{ color: t.textMuted, fontSize: 11, transform: logOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>▶</div>
        </div>

        {logOpen && (
          <div style={{ borderTop: `1px solid ${t.glassBorder}`, padding: '12px 14px 14px' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={handleCopyLog}
                disabled={finishedEvents.length === 0}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10,
                  background: t.accentSoft, border: `1px solid ${t.accent}44`,
                  color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 12,
                  cursor: finishedEvents.length === 0 ? 'default' : 'pointer',
                  opacity: finishedEvents.length === 0 ? 0.4 : 1,
                }}
              >
                Copy log
              </button>
              <button
                onClick={handleClearLog}
                disabled={finishedEvents.length === 0}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10,
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                  color: '#f87171', fontFamily: t.fontBody, fontWeight: 700, fontSize: 12,
                  cursor: finishedEvents.length === 0 ? 'default' : 'pointer',
                  opacity: finishedEvents.length === 0 ? 0.4 : 1,
                }}
              >
                Clear log
              </button>
            </div>

            {/* Day-grouped events */}
            {dayGroups.length === 0 ? (
              <div style={{ textAlign: 'center', color: t.textMuted, fontFamily: t.fontBody, fontSize: 13, padding: '16px 0' }}>
                No events recorded yet
              </div>
            ) : (
              dayGroups.map(([day, evs]) => (
                <div key={day} style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: t.textMuted, marginBottom: 6 }}>
                    {day}
                  </div>
                  {evs.map(ev => (
                    <div key={ev.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      padding: '6px 8px', borderRadius: 9, marginBottom: 3,
                      background: ev.status === 'error' ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${ev.status === 'error' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                      <span style={{ fontSize: 13, lineHeight: '18px', flexShrink: 0 }}>
                        {ev.status === 'success' ? '✓' : '✗'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{
                            fontFamily: t.fontBody, fontWeight: 700, fontSize: 11,
                            color: ev.status === 'success' ? '#4ade80' : '#f87171',
                            textTransform: 'uppercase', letterSpacing: 0.5,
                          }}>
                            {ev.kind}
                          </span>
                          <span style={{ fontFamily: t.fontBody, fontSize: 10, color: t.textMuted, flexShrink: 0 }}>
                            {fmtTime(ev.startTime)}{ev.durationMs != null ? ` · ${fmtDur(ev.durationMs)}` : ''}
                          </span>
                        </div>
                        <div style={{ fontFamily: t.fontBody, fontSize: 10, color: t.textMuted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.model}
                          {ev.context ? ` — ${ev.context}` : ''}
                        </div>
                        {ev.error && (
                          <div style={{ fontFamily: t.fontBody, fontSize: 10, color: '#f87171', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
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
              color: r.title === 'Gemini AI' && !apiConfigured ? '#f87171' : t.textMuted,
              fontFamily: t.fontBody, fontSize: 13, fontWeight: 500,
            }}>{r.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LegacyReader (seed stories + non-v2 AI stories) ─────────
function LegacyReader({ t, story, onClose, onRate, onDelete }) {
  const [rating,       setRating]       = useState(story.rating || 0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [playing,      setPlaying]      = useState(false);
  const [audioSrc,     setAudioSrc]     = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);

  const hasAudio = story.audioReady || !!story.audioDriveId;

  const handleRate = (n) => {
    setRating(n);
    if (onRate) onRate(story.id, n);
  };

  // Auto-play once the audio src is loaded into state
  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [audioSrc]);

  // Pause on unmount
  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play().catch(() => {});
  };

  const loadAndToggle = async () => {
    if (audioSrc) { toggleAudio(); return; }
    setAudioLoading(true);
    try {
      let src = await window.SW.audioGet(story.id);
      if (!src && story.audioDriveId) {
        src = await window.SW.drive.fetchAudio(story.audioDriveId);
        if (src) await window.SW.audioPut(story.id, src);
      }
      if (src) setAudioSrc(src);
    } catch (e) {
      console.warn('Failed to load audio:', e);
    } finally {
      setAudioLoading(false);
    }
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
      {/* Hidden audio element — rendered only once src is available */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}

      <button onClick={onClose} style={{
        position: 'absolute', top: 64, right: 20, zIndex: 5,
        width: 40, height: 40, borderRadius: 999,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        color: '#fef3c7', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(12px)',
      }}><Icon name="close" size={18} stroke={2.5} /></button>

      <div style={{ flex: 1, overflowY: 'auto', padding: `60px 28px ${hasAudio ? 140 : 40}px` }}>
        {/* Hero cover */}
        <div style={{ marginTop: 36, marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          {story.coverImage ? (
            <img
              src={story.coverImage} alt=""
              onClick={() => setLightboxOpen(true)}
              style={{
                width: 200, height: 260, borderRadius: 20, objectFit: 'cover',
                boxShadow: '0 12px 36px rgba(0,0,0,0.55)',
                cursor: 'zoom-in',
              }}
            />
          ) : (
            <div style={{ width: 200, height: 260, borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>📖</div>
          )}
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              background: 'rgba(2,6,23,0.92)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'zoom-out',
            }}
          >
            <img
              src={story.coverImage} alt=""
              style={{
                maxWidth: '92vw', maxHeight: '88vh',
                borderRadius: 24, objectFit: 'contain',
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              }}
            />
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                position: 'absolute', top: 20, right: 20,
                width: 40, height: 40, borderRadius: 999,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fef3c7', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            ><Icon name="close" size={18} stroke={2.5} /></button>
          </div>
        )}

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
          {(story.body || []).map(renderLine)}
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

        {onDelete && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button onClick={() => onDelete(story.id)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'rgba(248,113,113,0.55)', fontFamily: t.fontBody, fontWeight: 600, fontSize: 13,
              padding: '8px 16px',
            }}>Delete story</button>
          </div>
        )}
      </div>

      {/* Floating audio player — always visible while scrolling */}
      {hasAudio && (
        <div style={{
          position: 'absolute',
          bottom: 'max(32px, env(safe-area-inset-bottom))',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 10,
        }}>
          <button
            onClick={loadAndToggle}
            disabled={audioLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 26px', borderRadius: 999,
              background: playing
                ? `linear-gradient(135deg, ${t.accent}, ${tint(t.accent, -0.15)})`
                : 'rgba(15, 12, 45, 0.75)',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: `1px solid ${playing ? 'transparent' : t.glassBorder}`,
              color: playing ? '#1a0a3e' : t.text,
              fontFamily: t.fontBody, fontWeight: 700, fontSize: 15,
              cursor: audioLoading ? 'default' : 'pointer',
              opacity: audioLoading ? 0.7 : 1,
              boxShadow: playing
                ? `0 8px 28px ${t.accent}66`
                : '0 4px 20px rgba(0,0,0,0.55)',
              whiteSpace: 'nowrap',
            }}
          >
            {audioLoading ? (
              <>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: `2px solid ${t.accent}`, borderTopColor: 'transparent',
                  animation: 'sw-spin 0.75s linear infinite', flexShrink: 0,
                }} />
                Loading…
              </>
            ) : (
              <>
                <Icon name={playing ? 'pause' : 'play'} size={20} stroke={2} />
                {playing ? 'Pause narration' : 'Listen to story'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PagedReader (v2 AI stories with pages[]) ─────────────────
function PagedReader({ t, story, onClose, onRate, onDelete, addToast }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [playing,     setPlaying]     = useState(false);
  const [audioByPage, setAudioByPage] = useState({});
  const [audiosLoaded,setAudiosLoaded]= useState(false);
  const [imageZoom,   setImageZoom]   = useState(false);
  const [rating,      setRating]      = useState(story.rating || 0);
  const [tapHint,     setTapHint]     = useState(false);
  const [localImages, setLocalImages] = useState({});     // per-page image overrides after regen
  const [imageRegen,  setImageRegen]  = useState('idle'); // 'idle' | 'pending' | 'error'
  const [audioRegen,  setAudioRegen]  = useState('idle'); // 'idle' | 'pending' | 'error'
  const [costOpen,    setCostOpen]    = useState(false);  // cost breakdown expanded
  const audioRef    = useRef(null);
  const tapHintRef  = useRef(null);

  const pages      = story.pages || [];
  const page       = pages[currentPage] || null;
  const isLastPage = currentPage === pages.length - 1;
  // Use local override if present (post-regen), else fall back to story data
  const pageImage  = localImages[currentPage] !== undefined ? localImages[currentPage] : (page?.image || null);
  const audioSrc   = audioByPage[currentPage] || null;
  const pageHasAudio = !!audioSrc;

  // Reset regen state on page change
  useEffect(() => {
    setImageRegen('idle');
    setAudioRegen('idle');
  }, [currentPage]);

  // Load all per-page audios once on mount (or when audioReady flips)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map = {};
      for (let i = 0; i < pages.length; i++) {
        const src = await window.SW.audioGetPage(story.id, i);
        if (cancelled) return;
        map[i] = src || null;
      }
      if (!cancelled) { setAudioByPage(map); setAudiosLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [story.id, story.audioReady]);

  // Auto-play when page changes or audio becomes available
  useEffect(() => {
    if (tapHintRef.current) clearTimeout(tapHintRef.current);
    setTapHint(false);
    if (!audiosLoaded) return;
    const el = audioRef.current;
    if (!el) return;
    if (audioSrc) {
      el.src = audioSrc;
      el.currentTime = 0;
      el.play().catch(() => {});
    } else {
      tapHintRef.current = setTimeout(() => setTapHint(true), 6000);
    }
  }, [currentPage, audioSrc, audiosLoaded]);

  // Pause + clear hint on unmount
  useEffect(() => () => {
    if (audioRef.current) audioRef.current.pause();
    if (tapHintRef.current) clearTimeout(tapHintRef.current);
  }, []);

  const goNext = () => {
    if (currentPage < pages.length - 1) {
      if (audioRef.current) audioRef.current.pause();
      setCurrentPage(p => p + 1);
    }
  };
  const goPrev = () => {
    if (currentPage > 0) {
      if (audioRef.current) audioRef.current.pause();
      setCurrentPage(p => p - 1);
    }
  };
  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !audioSrc) return;
    if (playing) el.pause(); else el.play().catch(() => {});
  };
  const handleRate = (n) => { setRating(n); if (onRate) onRate(story.id, n); };

  const handleRegenImage = async () => {
    setImageRegen('pending');
    try {
      const img = await window.SW.regeneratePageImage(story.id, currentPage, null);
      if (img) {
        setLocalImages(prev => ({ ...prev, [currentPage]: img }));
        setImageRegen('idle');
      } else {
        setImageRegen('error');
        addToast?.('Image could not be regenerated — try again', 'error');
      }
    } catch (e) {
      setImageRegen('error');
      addToast?.(`Image regeneration failed: ${e.message}`, 'error');
    }
  };

  const handleRegenAudio = async () => {
    setAudioRegen('pending');
    try {
      const wav = await window.SW.regeneratePageAudio(story.id, currentPage, null);
      if (wav) {
        setAudioByPage(prev => ({ ...prev, [currentPage]: wav }));
        setAudioRegen('idle');
      } else {
        setAudioRegen('error');
        addToast?.('Audio could not be regenerated — try again', 'error');
      }
    } catch (e) {
      setAudioRegen('error');
      addToast?.(`Audio regeneration failed: ${e.message}`, 'error');
    }
  };

  const renderLine = (line, i) => {
    const parts = line.split(/(\{[^}]+\})/g);
    return (
      <p key={i} style={{ margin: '0 0 0.9em', fontFamily: t.fontBody, fontWeight: 500, fontSize: 20, lineHeight: 1.55, color: '#fde68a', letterSpacing: -0.2 }}>
        {parts.map((p, j) => {
          const m = p.match(/^\{(.+)\}$/);
          if (!m) return <span key={j}>{p}</span>;
          return <span key={j} style={{ color: '#fbbf24', fontWeight: 800, textShadow: '0 0 24px rgba(251,191,36,0.4)' }}>{m[1]}</span>;
        })}
      </p>
    );
  };

  // Cost estimate (Section E) — rough calculation using MODEL_PRICING
  const costInfo = (() => {
    const pricing   = (typeof window.SW?.getModelPricing === 'function') ? window.SW.getModelPricing() : {};
    const textModel = (typeof window.SW?.getTextModel  === 'function') ? window.SW.getTextModel()  : '';
    const imgModel  = (typeof window.SW?.getImageModel === 'function') ? window.SW.getImageModel() : '';
    const audModel  = (typeof window.SW?.getAudioModel === 'function') ? window.SW.getAudioModel() : '';

    const textP = pricing[textModel] || {};
    // Rough estimate: ~1000 input tokens + 100 output tokens per page for text call
    const textCost = (textP.inputPer1M && textP.outputPer1M)
      ? (1000 * textP.inputPer1M / 1e6 + pages.length * 100 * textP.outputPer1M / 1e6)
      : 0;

    const nImages = pages.filter((p, i) => localImages[i] !== undefined ? localImages[i] : p.image).length;
    const imgP    = pricing[imgModel] || {};
    const imgCost = imgP.perImage ? nImages * imgP.perImage : 0;

    const nAudio  = pages.filter((_, i) => audioByPage[i]).length;
    const audP    = pricing[audModel] || {};
    const audCost = audP.perSecond ? nAudio * 10 * audP.perSecond : 0; // estimate ~10 s/page

    const total = textCost + imgCost + audCost;
    return { textCost, imgCost, audCost, nImages, nAudio, total };
  })();

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: '#050514', display: 'flex', flexDirection: 'column' }}>
      {/* Hidden audio — src set imperatively */}
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); goNext(); }}
      />

      {/* ── Full-bleed image section ── */}
      <div style={{ flex: '0 0 68vh', position: 'relative', overflow: 'hidden', background: 'radial-gradient(110% 90% at 50% -10%, #1e1b4b 0%, #050514 70%)' }}>
        {pageImage && (
          <img src={pageImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        {!pageImage && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ fontSize: 64 }}>📖</div>
            <button
              onClick={handleRegenImage}
              disabled={imageRegen === 'pending'}
              style={{ padding: '8px 20px', borderRadius: 999, background: imageRegen === 'pending' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: imageRegen === 'pending' ? 'rgba(254,243,199,0.4)' : '#fef3c7', fontFamily: t.fontBody, fontWeight: 600, fontSize: 13, cursor: imageRegen === 'pending' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <Icon name="image" size={14} stroke={2} />
              {imageRegen === 'pending' ? 'Generating…' : imageRegen === 'error' ? 'Try again' : 'Regenerate image'}
            </button>
          </div>
        )}

        {/* Bottom gradient */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to bottom, transparent, rgba(5,5,20,0.85))' }} />

        {/* Title + category (page 0 only) */}
        {currentPage === 0 && (
          <div style={{ position: 'absolute', bottom: 16, left: 20, right: 64, zIndex: 3 }}>
            <div style={{ color: '#fbbf24', fontFamily: t.fontBody, fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>{story.category}</div>
            <h1 style={{ margin: 0, fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle, fontSize: 24, lineHeight: 1.15, color: '#fef9e7', letterSpacing: -0.5 }}>{story.title}</h1>
          </div>
        )}

        {/* Page counter */}
        <div style={{ position: 'absolute', top: 68, left: 20, zIndex: 5, color: 'rgba(254,243,199,0.55)', fontFamily: t.fontBody, fontSize: 12, fontWeight: 600 }}>
          {currentPage + 1} / {pages.length}
        </div>

        {/* Close button */}
        <button onClick={onClose} style={{ position: 'absolute', top: 64, right: 20, zIndex: 5, width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fef3c7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
          <Icon name="close" size={18} stroke={2.5} />
        </button>

        {/* Lightbox expand icon — only when current page has an image */}
        {pageImage && (
          <button onClick={() => setImageZoom(true)} style={{ position: 'absolute', top: 112, right: 20, zIndex: 5, width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fef3c7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
            <Icon name="eye" size={15} stroke={2} />
          </button>
        )}

        {/* Invisible tap zones: prev | pause/play | next */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex' }}>
          <button onClick={goPrev} style={{ flex: '0 0 33.33%', height: '100%', background: 'transparent', border: 'none', cursor: currentPage > 0 ? 'pointer' : 'default' }} />
          <button onClick={togglePlay} style={{ flex: '0 0 33.33%', height: '100%', background: 'transparent', border: 'none', cursor: audioSrc ? 'pointer' : 'default' }} />
          <button onClick={goNext} style={{ flex: '0 0 33.33%', height: '100%', background: 'transparent', border: 'none', cursor: isLastPage ? 'default' : 'pointer' }} />
        </div>
      </div>

      {/* ── Text panel ── */}
      <div style={{ flex: 1, background: 'rgba(5,5,20,0.96)', overflowY: 'auto', padding: '14px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        {/* Play/pause pill — shown when page HAS audio */}
        {pageHasAudio && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button onClick={togglePlay} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: playing ? `linear-gradient(135deg, ${t.accent}, ${tint(t.accent, -0.15)})` : 'rgba(255,255,255,0.08)', border: `1px solid ${playing ? 'transparent' : t.glassBorder}`, color: playing ? '#1a0a3e' : t.text, fontFamily: t.fontBody, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              <Icon name={playing ? 'pause' : 'play'} size={14} stroke={2} />
              {playing ? 'Pause' : 'Play'}
            </button>
          </div>
        )}

        {/* Regenerate audio — shown when page has NO audio */}
        {!pageHasAudio && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button
              onClick={handleRegenAudio}
              disabled={audioRegen === 'pending'}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.12)`, color: audioRegen === 'pending' ? 'rgba(254,243,199,0.35)' : 'rgba(254,243,199,0.55)', fontFamily: t.fontBody, fontWeight: 600, fontSize: 13, cursor: audioRegen === 'pending' ? 'default' : 'pointer' }}
            >
              <Icon name="wand" size={13} stroke={2} />
              {audioRegen === 'pending' ? 'Recording…' : audioRegen === 'error' ? 'Try again' : 'Regenerate audio'}
            </button>
          </div>
        )}

        {/* Page text */}
        <div style={{ flex: 1 }}>
          {page && page.text ? renderLine(page.text, 0) : null}
        </div>

        {/* Tap-to-continue hint when no audio */}
        {tapHint && !pageHasAudio && (
          <div style={{ color: 'rgba(254,243,199,0.45)', fontFamily: t.fontBody, fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingTop: 6 }}>
            Tap → to continue
          </div>
        )}

        {/* Rating + delete — last page only */}
        {isLastPage && (
          <div style={{ marginTop: 20 }}>
            <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 }}>
              <div style={{ color: '#fde68a', fontFamily: t.fontBody, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>How was tonight's story?</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => handleRate(n)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: n <= rating ? '#fbbf24' : 'rgba(254,243,199,0.25)', transform: n <= rating ? 'scale(1.05)' : 'scale(1)', transition: 'all .15s' }}>
                    <Icon name="star" size={30} stroke={2} />
                  </button>
                ))}
              </div>
              {/* Cost estimate */}
              {costInfo.total > 0 && (
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => setCostOpen(o => !o)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(254,243,199,0.35)', fontFamily: t.fontBody, fontSize: 12, padding: '2px 0' }}>
                    Cost ~ ${costInfo.total.toFixed(3)} {costOpen ? '▲' : '▼'}
                  </button>
                  {costOpen && (
                    <div style={{ marginTop: 6, color: 'rgba(254,243,199,0.45)', fontFamily: t.fontBody, fontSize: 11, lineHeight: 1.7, textAlign: 'left', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                      <div>Text: ${costInfo.textCost.toFixed(4)}</div>
                      <div>Images: {costInfo.nImages} × ${(costInfo.imgCost / (costInfo.nImages || 1)).toFixed(4)} = ${costInfo.imgCost.toFixed(4)}</div>
                      <div>Audio: {costInfo.nAudio} clips × ~10 s = ${costInfo.audCost.toFixed(4)}</div>
                      <div style={{ color: 'rgba(254,243,199,0.25)', marginTop: 4 }}>Estimate only — see ai.google.dev/pricing</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {onDelete && (
              <div style={{ marginTop: 14, textAlign: 'center' }}>
                <button onClick={() => onDelete(story.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(248,113,113,0.55)', fontFamily: t.fontBody, fontWeight: 600, fontSize: 13, padding: '8px 16px' }}>
                  Delete story
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {imageZoom && pageImage && (
        <div onClick={() => setImageZoom(false)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={pageImage} alt="" style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 24, objectFit: 'contain', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }} />
          <button onClick={(e) => { e.stopPropagation(); setImageZoom(false); }} style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fef3c7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={18} stroke={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Reader — routes to PagedReader (v2) or LegacyReader ──────
function Reader({ t, story, onClose, onRate, onDelete, addToast }) {
  const isPaged = story.version === 2 && Array.isArray(story.pages);
  return isPaged
    ? <PagedReader t={t} story={story} onClose={onClose} onRate={onRate} onDelete={onDelete} addToast={addToast} />
    : <LegacyReader t={t} story={story} onClose={onClose} onRate={onRate} onDelete={onDelete} />;
}

// ─── Toast notifications ──────────────────────────────────────
function Toast({ toasts, onDismiss }) {
  if (!toasts || !toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 110, left: 16, right: 16, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 14px', borderRadius: 14,
          background: t.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.12)',
          border: `1px solid ${t.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(74,222,128,0.35)'}`,
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          color: t.type === 'error' ? '#fca5a5' : '#4ade80',
          fontFamily: '"Nunito", system-ui', fontSize: 13, fontWeight: 600, lineHeight: 1.45,
          boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
          pointerEvents: 'auto',
          animation: 'sw-fadein 0.3s ease-out',
        }}>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => onDismiss(t.id)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'inherit', opacity: 0.65, padding: '0 2px', flexShrink: 0, fontSize: 16, lineHeight: 1,
          }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Weaving (loading / error) ────────────────────────────────
function Weaving({ t, error, phase, onCancel, onReadReady, weavingProgress }) {
  const childName = window.SW?.getChildName() || 'your child';
  const [elapsed, setElapsed] = useState(0);
  const [activeCallCount, setActiveCallCount] = useState(() => window.SW_TRACKER?.getActive().length || 0);

  useEffect(() => {
    if (!window.SW_TRACKER) return;
    const unsub = window.SW_TRACKER.subscribe(() => setActiveCallCount(window.SW_TRACKER.getActive().length));
    return unsub;
  }, []);

  useEffect(() => {
    if (error) return;
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(id);
  }, [error]);

  const fmtElapsed = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  const { total = 0, images = new Set(), audios = new Set(), retries = {} } = weavingProgress || {};
  const showGrid = total > 0;

  const bgBase = {
    position: 'absolute', inset: 0, zIndex: 90,
    background: 'radial-gradient(90% 70% at 50% 30%, #1e1b4b 0%, #050514 80%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  };

  const errorContainer = { ...bgBase, justifyContent: 'center', padding: '60px 32px 100px', overflow: 'hidden' };
  const container = showGrid
    ? { ...bgBase, justifyContent: 'flex-start', padding: '44px 24px 100px', overflowY: 'auto', overflowX: 'hidden' }
    : { ...bgBase, justifyContent: 'center', padding: '60px 32px 100px', overflow: 'hidden' };

  if (error) {
    return (
      <div style={errorContainer}>
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
        @keyframes sw-orbit   { from { transform: rotate(0deg)   } to { transform: rotate(360deg)  } }
        @keyframes sw-orbit-r { from { transform: rotate(360deg) } to { transform: rotate(0deg)    } }
        @keyframes sw-breathe { 0%,100% { transform: scale(1); opacity: .95 } 50% { transform: scale(1.08); opacity: 1 } }
        @keyframes sw-twinkle { 0%,100% { opacity: .2 } 50% { opacity: 1 } }
        @keyframes sw-spin    { from { transform: rotate(0deg)   } to { transform: rotate(360deg)  } }
        @keyframes sw-fadein  { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* Orb: full-size during text phase, compact star during assets phase */}
      {!showGrid ? (
        <div style={{ position: 'relative', width: 220, height: 220, marginBottom: 44, flexShrink: 0 }}>
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
      ) : (
        <div style={{ fontSize: 28, marginBottom: 16, animation: 'sw-breathe 3.2s ease-in-out infinite', flexShrink: 0 }}>✦</div>
      )}

      <div style={{ textAlign: 'center', width: '100%', maxWidth: 360 }}>

        {/* Title — full during text phase, compact during assets phase */}
        {!showGrid ? (
          <>
            <div style={{ color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase', marginBottom: 12 }}>Weaving</div>
            <h1 style={{ margin: 0, fontFamily: t.fontHead, fontWeight: t.headWeight, fontStyle: t.headStyle, fontSize: 30, lineHeight: 1.15, color: t.text, letterSpacing: -0.5 }}>
              A new story for {childName}…
            </h1>
          </>
        ) : (
          <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 18, color: t.text, marginBottom: 4 }}>
            A new story for {childName}
          </div>
        )}

        {/* Writing your story row */}
        <div style={{
          marginTop: showGrid ? 8 : 24,
          display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
          fontFamily: t.fontBody, fontWeight: 600, fontSize: 15,
          color: showGrid ? t.textMuted : t.text,
        }}>
          {showGrid
            ? <span style={{ color: '#4ade80', fontSize: 15, lineHeight: 1 }}>✓</span>
            : <div style={{ width: 13, height: 13, borderRadius: '50%', flexShrink: 0, border: `2px solid ${t.accent}`, borderTopColor: 'transparent', animation: 'sw-spin 0.75s linear infinite' }} />
          }
          Writing your story
        </div>

        {/* Page grid — shown once asset fan-out begins */}
        {showGrid && (
          <div style={{
            marginTop: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
            gap: 6,
            animation: 'sw-fadein 0.4s ease-out forwards',
          }}>
            {Array.from({ length: total }, (_, idx) => {
              const imgDone = images.has(idx);
              const audDone = audios.has(idx);
              const retry   = retries[idx];
              return (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '6px 4px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}>
                  <span style={{ fontSize: 9, color: t.textMuted, fontFamily: t.fontBody, fontWeight: 700 }}>
                    p{idx + 1}
                  </span>
                  <div style={{ display: 'flex', gap: 7 }}>
                    {/* image pip */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      {imgDone
                        ? <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#4ade80' }} />
                        : <div style={{ width: 9, height: 9, borderRadius: '50%', border: `1.5px solid ${t.accent}`, borderTopColor: 'transparent', animation: 'sw-spin 0.75s linear infinite' }} />
                      }
                      <span style={{ fontSize: 7, color: t.textMuted, fontFamily: t.fontBody }}>img</span>
                    </div>
                    {/* audio pip */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      {audDone
                        ? <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#4ade80' }} />
                        : <div style={{ width: 9, height: 9, borderRadius: '50%', border: `1.5px solid ${t.accent}`, borderTopColor: 'transparent', animation: 'sw-spin 0.75s linear infinite' }} />
                      }
                      <span style={{ fontSize: 7, color: t.textMuted, fontFamily: t.fontBody }}>aud</span>
                    </div>
                  </div>
                  {retry && (
                    <span style={{ fontSize: 8, color: t.accent, fontStyle: 'italic', fontFamily: t.fontBody }}>
                      {retry === 'adjusting_prompt' ? 'adj' : 'no ref'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Recording narration row — active while audio is in flight */}
        {showGrid && (
          <div style={{
            marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
            fontFamily: t.fontBody, fontWeight: 600, fontSize: 15,
            color: phase === 'audio' ? t.text : t.textMuted,
          }}>
            <div style={{ width: 13, height: 13, borderRadius: '50%', flexShrink: 0, border: `2px solid ${t.accent}`, borderTopColor: 'transparent', animation: 'sw-spin 0.75s linear infinite' }} />
            🔊 Recording narration
          </div>
        )}

        {/* Elapsed time + live call count */}
        <div style={{ marginTop: 8, color: t.textMuted, fontFamily: t.fontBody, fontSize: 12, fontWeight: 500, opacity: 0.6 }}>
          {fmtElapsed(elapsed)} elapsed
          {activeCallCount > 0 && (
            <span style={{ marginLeft: 10, opacity: 0.85 }}>
              · {activeCallCount} Gemini call{activeCallCount !== 1 ? 's' : ''} in flight
            </span>
          )}
        </div>

        {/* Read now early-exit — available once imagePending or audio phase */}
        {onReadReady && (
          <button onClick={onReadReady} style={{
            marginTop: 20, padding: '12px 26px', borderRadius: 14,
            background: t.accentSoft, border: `1px solid ${t.accent}55`,
            color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 14,
            cursor: 'pointer', animation: 'sw-fadein 0.5s ease-out forwards',
          }}>
            Read now (some pages may be missing audio)
          </button>
        )}

        {/* Cancel button */}
        {onCancel && (
          <button onClick={onCancel} style={{
            marginTop: onReadReady ? 10 : 28,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: t.textMuted, fontFamily: t.fontBody, fontSize: 13, fontWeight: 600,
            padding: '8px 16px', opacity: 0.65,
          }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ApiKeyModal (AI Configuration) ──────────────────────────
// ─── Welcome modal (first-time onboarding) ───────────────────
function WelcomeModal({ t, onClose, onSetupGemini, onConnectDrive }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 250,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 340,
        background: 'linear-gradient(160deg, rgba(30,27,75,0.98) 0%, rgba(15,11,41,0.98) 100%)',
        borderRadius: 24,
        border: `1px solid ${t.glassBorder}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        padding: '32px 28px 24px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12, lineHeight: 1 }}>✨</div>
          <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 22, color: t.text, marginBottom: 10 }}>
            Welcome to StoryWeaver
          </div>
          <div style={{ fontFamily: t.fontBody, fontSize: 14, color: t.textMuted, lineHeight: 1.65 }}>
            Turn any day into a personalised bedtime story — with AI illustrations and narration made just for your child.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onSetupGemini} style={{
            width: '100%', border: 'none', cursor: 'pointer',
            padding: '14px 20px', borderRadius: 14,
            background: `linear-gradient(135deg, ${t.accent}, ${tint(t.accent, -0.15)})`,
            color: '#1a0a3e',
            fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Icon name="wand" size={18} stroke={2.2} />
            Link Gemini API key
          </button>
          <button onClick={onConnectDrive} style={{
            width: '100%', cursor: 'pointer',
            padding: '14px 20px', borderRadius: 14,
            background: t.accentSoft,
            color: t.accent,
            fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 15,
            border: `1px solid ${t.accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Icon name="cloud-up" size={18} stroke={2.2} />
            Connect Google Drive
          </button>
        </div>

        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: t.textMuted, fontFamily: t.fontBody, fontSize: 13,
          padding: 0, textAlign: 'center',
        }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

function ApiKeyModal({ t, open, onClose }) {
  const [keyValue,    setKeyValue]    = useState(() => window.SW.getApiKey());
  const [checking,    setChecking]    = useState(false);
  const [keyError,    setKeyError]    = useState('');
  const [keySaved,    setKeySaved]    = useState(false);
  const [useProxy,    setUseProxyLocal] = useState(() => window.SW.getUseProxy());
  const [authToken,   setAuthTokenLocal] = useState(() => window.SW.getAuthToken());

  const [textModel,        setTextModelLocal]       = useState(() => window.SW.getTextModel());
  const [imageModel,       setImageModelLocal]      = useState(() => window.SW.getImageModel());
  const [audioModel,       setAudioModelLocal]      = useState(() => window.SW.getAudioModel());
  const [audioVoice,       setAudioVoiceLocal]      = useState(() => window.SW.getAudioVoice());
  const [audioConcurrency, setAudioConcurrencyLocal]= useState(() => window.SW.getAudioConcurrency());

  const [sysPrompt,      setSysPrompt]      = useState(() => window.SW.getCustomSystemPrompt());
  const [promptSaved,    setPromptSaved]    = useState(false);
  const [audioSysPrompt, setAudioSysPrompt] = useState(() => window.SW.getAudioSystemPrompt());
  const [audioPromptSaved, setAudioPromptSaved] = useState(false);

  if (!open) return null;

  const handleSaveKey = async () => {
    const k = keyValue.trim();
    if (!k) return;
    setChecking(true);
    setKeyError('');
    setKeySaved(false);
    try {
      const ok = await window.SW.validateApiKey(k);
      if (ok) {
        window.SW.setApiKey(k);
        window.SW.setUseProxy(false);
        setUseProxyLocal(false);
        setKeySaved(true);
      } else { setKeyError("That key didn't work — double-check it."); }
    } catch   { setKeyError("That key didn't work — double-check it."); }
    finally   { setChecking(false); }
  };

  const handleTextModelBlur = () => {
    const val = textModel.trim();
    if (val) window.SW.setTextModel(val);
    else     setTextModelLocal(window.SW.getTextModel());
  };

  const handleImageModelBlur = () => {
    const val = imageModel.trim();
    if (val) window.SW.setImageModel(val);
    else     setImageModelLocal(window.SW.getImageModel());
  };

  const handleAudioModelBlur = () => {
    const val = audioModel.trim();
    if (val) window.SW.setAudioModel(val);
    else     setAudioModelLocal(window.SW.getAudioModel());
  };

  const handleAudioVoiceBlur = () => {
    const val = audioVoice.trim();
    if (val) window.SW.setAudioVoice(val);
    else     setAudioVoiceLocal(window.SW.getAudioVoice());
  };

  const handleLoadDefault = () => {
    setSysPrompt(window.SW.getDefaultSystemPrompt());
    setPromptSaved(false);
  };

  const handleClearPrompt = () => {
    setSysPrompt('');
    window.SW.setCustomSystemPrompt('');
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2500);
  };

  const handleSavePrompt = () => {
    window.SW.setCustomSystemPrompt(sysPrompt.trim());
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2500);
  };

  const handleLoadDefaultAudio = () => {
    setAudioSysPrompt(window.SW.getDefaultAudioSystemPrompt());
    setAudioPromptSaved(false);
  };

  const handleClearAudioPrompt = () => {
    setAudioSysPrompt('');
    window.SW.setAudioSystemPrompt('');
    setAudioPromptSaved(true);
    setTimeout(() => setAudioPromptSaved(false), 2500);
  };

  const handleSaveAudioPrompt = () => {
    window.SW.setAudioSystemPrompt(audioSysPrompt.trim());
    setAudioPromptSaved(true);
    setTimeout(() => setAudioPromptSaved(false), 2500);
  };

  const sectionLabel = {
    fontFamily: t.fontBody, fontWeight: 700, fontSize: 11, letterSpacing: 1.5,
    textTransform: 'uppercase', color: t.textMuted, marginBottom: 12, display: 'block',
  };
  const fieldBox = {
    background: t.glass, border: `1px solid ${t.glassBorder}`,
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 18, padding: 18, marginBottom: 14,
  };
  const monoInput = {
    width: '100%', boxSizing: 'border-box',
    border: `1px solid ${t.glassBorder}`, outline: 'none',
    background: 'rgba(255,255,255,0.06)', borderRadius: 10,
    color: t.text, fontFamily: 'monospace', fontSize: 13,
    padding: '10px 12px', colorScheme: 'dark',
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: 'rgba(2, 6, 23, 0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '72px 20px 120px', maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ color: t.textMuted, fontFamily: t.fontBody, fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Settings</div>
            <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 24, color: t.text }}>AI Configuration</div>
          </div>
          <button onClick={onClose} style={{
            width: 40, height: 40, borderRadius: 999, flexShrink: 0,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: t.text, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="close" size={18} stroke={2.5} /></button>
        </div>

        {/* ── API Key ── */}
        <div style={fieldBox}>
          <label style={sectionLabel}>Gemini API Key</label>

          {/* Proxy / BYOK toggle */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[
              { label: 'Shared key', value: true },
              { label: 'My own key', value: false },
            ].map(({ label, value }) => {
              const active = useProxy === value;
              return (
                <button key={label} onClick={() => { window.SW.setUseProxy(value); setUseProxyLocal(value); }} style={{
                  flex: 1, padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                  background: active ? t.accentSoft : 'transparent',
                  color: active ? t.accent : t.textMuted,
                  border: active ? `1px solid ${t.accent}44` : `1px solid ${t.glassBorder}`,
                  fontFamily: t.fontBody, fontWeight: 700, fontSize: 13,
                }}>{label}</button>
              );
            })}
          </div>

          {useProxy ? (
            <>
              <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.textMuted,
                            lineHeight: 1.6, marginBottom: 14 }}>
                Using the app's built-in Gemini key — no personal key needed.
              </div>
              {/* Auth token field */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 600,
                              color: t.textMuted, marginBottom: 6 }}>API Token</div>
                <input
                  type="password"
                  value={authToken}
                  onChange={(e) => { setAuthTokenLocal(e.target.value);
                                     window.SW.setAuthToken(e.target.value); }}
                  placeholder="Enter token…"
                  style={{ ...monoInput, marginBottom: 6 }}
                />
                <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textMuted,
                              lineHeight: 1.5 }}>
                  Required to generate stories. You'll receive this from the app owner.
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.textMuted, lineHeight: 1.5, marginBottom: 12 }}>
                Paste your own Gemini API key. Get a free key at{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                   style={{ color: t.accent, fontWeight: 700, textDecoration: 'none' }}>aistudio.google.com/apikey</a>
              </div>
              <input
                type="password"
                value={keyValue}
                onChange={(e) => { setKeyValue(e.target.value); setKeyError(''); setKeySaved(false); }}
                placeholder="Paste your API key…"
                style={{ ...monoInput, marginBottom: 10 }}
              />
              {keyError && (
                <div style={{ marginBottom: 8, color: '#f87171', fontFamily: t.fontBody, fontSize: 13, fontWeight: 600 }}>{keyError}</div>
              )}
              {keySaved && (
                <div style={{ marginBottom: 8, color: '#4ade80', fontFamily: t.fontBody, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="check" size={14} stroke={2.5} /> Key saved
                </div>
              )}
              <button
                onClick={handleSaveKey}
                disabled={checking || !keyValue.trim()}
                style={{
                  width: '100%', border: 'none',
                  cursor: checking || !keyValue.trim() ? 'default' : 'pointer',
                  padding: '13px 24px', borderRadius: 12,
                  background: checking || !keyValue.trim()
                    ? 'rgba(251,191,36,0.2)'
                    : `linear-gradient(135deg, ${t.accent}, ${tint(t.accent, -0.15)})`,
                  color: checking || !keyValue.trim() ? t.textMuted : '#1a0a3e',
                  fontFamily: t.fontBody, fontWeight: 700, fontSize: 14,
                }}
              >{checking ? 'Checking…' : 'Save Key'}</button>
            </>
          )}
        </div>

        {/* ── Models ── */}
        <div style={fieldBox}>
          <label style={sectionLabel}>AI Models</label>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6 }}>Text generation</div>
            <input
              type="text"
              value={textModel}
              onChange={(e) => setTextModelLocal(e.target.value)}
              onBlur={handleTextModelBlur}
              style={monoInput}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6 }}>Image generation</div>
            <input
              type="text"
              value={imageModel}
              onChange={(e) => setImageModelLocal(e.target.value)}
              onBlur={handleImageModelBlur}
              style={monoInput}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6 }}>Audio narration</div>
            <input
              type="text"
              value={audioModel}
              onChange={(e) => setAudioModelLocal(e.target.value)}
              onBlur={handleAudioModelBlur}
              style={monoInput}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6 }}>
              Audio concurrency <span style={{ fontWeight: 500, opacity: 0.65 }}>— parallel narration calls</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min={1} max={4} step={1}
                value={audioConcurrency}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setAudioConcurrencyLocal(n);
                  window.SW.setAudioConcurrency(n);
                }}
                style={{ flex: 1, accentColor: t.accent, cursor: 'pointer' }}
              />
              <span style={{ fontFamily: t.fontBody, fontWeight: 700, fontSize: 15, color: t.accent, minWidth: 14, textAlign: 'right' }}>
                {audioConcurrency}
              </span>
            </div>
            <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textMuted, marginTop: 4, lineHeight: 1.5 }}>
              Lower = fewer 500 errors. Higher = faster but may overwhelm the preview model.
            </div>
          </div>

          <div>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 8 }}>TTS Voice</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck', 'Zephyr'].map(v => {
                const active = audioVoice === v;
                return (
                  <button key={v} onClick={() => { setAudioVoiceLocal(v); window.SW.setAudioVoice(v); }} style={{
                    padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                    background: active ? t.accentSoft : 'transparent',
                    color: active ? t.accent : t.textMuted,
                    border: active ? `1px solid ${t.accent}44` : `1px solid ${t.glassBorder}`,
                    fontFamily: t.fontBody, fontWeight: 700, fontSize: 12,
                  }}>{v}</button>
                );
              })}
            </div>
            <input
              type="text"
              value={audioVoice}
              onChange={(e) => setAudioVoiceLocal(e.target.value)}
              onBlur={handleAudioVoiceBlur}
              placeholder="Custom voice name…"
              style={monoInput}
            />
          </div>

          <div style={{ marginTop: 10, fontFamily: t.fontBody, fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>
            Changes take effect on the next story generation.
          </div>
        </div>

        {/* ── System Prompt ── */}
        <div style={fieldBox}>
          <label style={sectionLabel}>System Prompt</label>
          <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.textMuted, lineHeight: 1.5, marginBottom: 12 }}>
            Override the storytelling instructions sent to Gemini. Leave blank to use the built-in dynamic prompt.
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={handleLoadDefault} style={{
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              background: t.accentSoft, border: `1px solid ${t.accent}44`,
              color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 12,
            }}>Load default</button>
            {sysPrompt.trim() && (
              <button onClick={handleClearPrompt} style={{
                padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(248,113,113,0.35)',
                color: '#f87171', fontFamily: t.fontBody, fontWeight: 700, fontSize: 12,
              }}>Clear override</button>
            )}
          </div>

          <textarea
            value={sysPrompt}
            onChange={(e) => { setSysPrompt(e.target.value); setPromptSaved(false); }}
            placeholder={"Leave blank to use the built-in prompt.\nClick 'Load default' to view and edit the current default prompt."}
            rows={14}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1px solid ${t.glassBorder}`, outline: 'none',
              background: 'rgba(255,255,255,0.04)', borderRadius: 10,
              color: t.text, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.65,
              padding: 12, resize: 'vertical', colorScheme: 'dark',
            }}
          />

          {promptSaved && (
            <div style={{ marginTop: 8, color: '#4ade80', fontFamily: t.fontBody, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={14} stroke={2.5} /> {sysPrompt.trim() ? 'Prompt override saved' : 'Using built-in prompt'}
            </div>
          )}

          <button
            onClick={handleSavePrompt}
            style={{
              marginTop: 12, width: '100%',
              border: `1px solid ${t.accent}44`, cursor: 'pointer',
              padding: '13px 24px', borderRadius: 12,
              background: t.accentSoft,
              color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 14,
            }}
          >{sysPrompt.trim() ? 'Save Prompt Override' : 'Save (use built-in)'}</button>
        </div>

        {/* ── Audio Narration Prompt ── */}
        <div style={fieldBox}>
          <label style={sectionLabel}>Audio Narration Prompt</label>
          <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.textMuted, lineHeight: 1.5, marginBottom: 12 }}>
            Instructions sent to the TTS model. Controls narration style, pacing, and tone. Leave blank to use the built-in default.
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={handleLoadDefaultAudio} style={{
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              background: t.accentSoft, border: `1px solid ${t.accent}44`,
              color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 12,
            }}>Load default</button>
            {audioSysPrompt.trim() && (
              <button onClick={handleClearAudioPrompt} style={{
                padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(248,113,113,0.35)',
                color: '#f87171', fontFamily: t.fontBody, fontWeight: 700, fontSize: 12,
              }}>Clear override</button>
            )}
          </div>

          <textarea
            value={audioSysPrompt}
            onChange={(e) => { setAudioSysPrompt(e.target.value); setAudioPromptSaved(false); }}
            placeholder={"Leave blank to use the built-in narration instructions.\nClick 'Load default' to view and edit the current default."}
            rows={5}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1px solid ${t.glassBorder}`, outline: 'none',
              background: 'rgba(255,255,255,0.04)', borderRadius: 10,
              color: t.text, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.65,
              padding: 12, resize: 'vertical', colorScheme: 'dark',
            }}
          />

          {audioPromptSaved && (
            <div style={{ marginTop: 8, color: '#4ade80', fontFamily: t.fontBody, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={14} stroke={2.5} /> {audioSysPrompt.trim() ? 'Audio prompt saved' : 'Using built-in audio prompt'}
            </div>
          )}

          <button
            onClick={handleSaveAudioPrompt}
            style={{
              marginTop: 12, width: '100%',
              border: `1px solid ${t.accent}44`, cursor: 'pointer',
              padding: '13px 24px', borderRadius: 12,
              background: t.accentSoft,
              color: t.accent, fontFamily: t.fontBody, fontWeight: 700, fontSize: 14,
            }}
          >{audioSysPrompt.trim() ? 'Save Audio Prompt' : 'Save (use built-in)'}</button>
        </div>

      </div>
    </div>
  );
}

// ─── AddLinkModal ─────────────────────────────────────────────
function AddLinkModal({ t, open, onClose, onSave, item }) {
  const isLink = !item || item.type === 'link';

  const [url,          setUrl]          = useState(item?.url         || '');
  const [title,        setTitle]        = useState(item?.title       || '');
  const [coverImage,   setCoverImage]   = useState(item?.coverImage  || null);
  const [coverPrompt,  setCoverPrompt]  = useState('');
  const [generating,   setGenerating]   = useState(false);
  const [coverError,   setCoverError]   = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    setUrl        (item?.url        || '');
    setTitle      (item?.title      || '');
    setCoverImage (item?.coverImage || null);
    setCoverPrompt('');
    setCoverError ('');
  }, [item]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  if (!open) return null;

  const canSave   = isLink ? (url.trim() && title.trim()) : true;
  const isApiReady = window.SW?.isApiReady();

  const handleGenerateCover = async () => {
    if (!coverPrompt.trim() || !isApiReady) return;
    setGenerating(true);
    setCoverError('');
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const img = await window.SW.generateLinkCover(coverPrompt.trim(), ctrl.signal);
      if (img) {
        setCoverImage(img);
      } else {
        setCoverError('Cover generation failed — please try again.');
      }
    } catch (e) {
      if (e.name !== 'AbortError') setCoverError(e.message || 'Cover generation failed — please try again.');
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

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
      <style>{`@keyframes sw-spin-lm { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      <div style={{ padding: '72px 20px 120px', maxWidth: 440, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontFamily: t.fontHead, fontWeight: t.headWeight, fontSize: 22, color: t.text }}>
            {item?.type === 'story' ? 'Edit Cover' : item ? 'Edit Storybook' : 'Link a Storybook'}
          </div>
          <button onClick={onClose} style={{
            width: 40, height: 40, borderRadius: 999,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: t.text, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="close" size={18} stroke={2.5} /></button>
        </div>

        {/* URL — link items only */}
        {isLink && (
          <div style={fieldBox}>
            <label style={labelStyle}>Gemini URL</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="g.co/gemini/share/…"
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent',
                color: t.text, fontFamily: t.fontBody, fontSize: 15, fontWeight: 500 }} />
          </div>
        )}

        {/* Title — link items only */}
        {isLink && (
          <div style={fieldBox}>
            <label style={labelStyle}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Story title…"
              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent',
                color: t.text, fontFamily: t.fontBody, fontSize: 15, fontWeight: 500 }} />
          </div>
        )}

        {/* AI cover image generation */}
        <div style={fieldBox}>
          <label style={labelStyle}>Cover Image <span style={{ fontWeight: 500, opacity: 0.45 }}>optional · AI generated</span></label>
          <textarea
            value={coverPrompt}
            onChange={(e) => { setCoverPrompt(e.target.value); setCoverError(''); }}
            disabled={generating}
            placeholder="Describe the storybook — e.g. 'A little girl befriends a dragon who teaches her to bake starlight cookies'"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none',
              background: 'transparent', resize: 'none',
              color: t.text, fontFamily: t.fontBody, fontSize: 14, lineHeight: 1.5, fontWeight: 500,
              marginBottom: 10, opacity: generating ? 0.5 : 1,
            }}
          />
          {coverError && (
            <div style={{ color: '#f87171', fontFamily: t.fontBody, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              {coverError}
            </div>
          )}
          <button
            onClick={handleGenerateCover}
            disabled={generating || !coverPrompt.trim() || !isApiReady}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              width: '100%', padding: '11px 16px', borderRadius: 12, border: 'none',
              cursor: generating || !coverPrompt.trim() || !isApiReady ? 'default' : 'pointer',
              background: generating || !coverPrompt.trim() || !isApiReady
                ? 'rgba(251,191,36,0.12)'
                : t.accentSoft,
              color: generating || !coverPrompt.trim() || !isApiReady ? t.textMuted : t.accent,
              fontFamily: t.fontBody, fontWeight: 700, fontSize: 14,
              border: `1px solid ${t.accent}33`,
            }}
          >
            {generating ? (
              <>
                <div style={{
                  width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${t.accent}`, borderTopColor: 'transparent',
                  animation: 'sw-spin-lm 0.75s linear infinite',
                }} />
                Generating…
              </>
            ) : (
              <><Icon name="image" size={15} stroke={2} /> Generate cover</>
            )}
          </button>
          {!isApiReady && (
            <div style={{ marginTop: 8, color: t.textMuted, fontFamily: t.fontBody, fontSize: 12 }}>
              Configure a Gemini API key in Settings to generate covers.
            </div>
          )}
        </div>

        {/* Cover preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          {coverImage ? (
            <div style={{ position: 'relative' }}>
              <img
                src={coverImage} alt="Generated cover"
                style={{ width: 110, height: 148, borderRadius: 16, objectFit: 'cover', display: 'block', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
              />
              <button
                onClick={() => setCoverImage(null)}
                title="Remove generated cover"
                style={{
                  position: 'absolute', top: -8, right: -8, width: 22, height: 22,
                  borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: '#1e1b4b', color: t.textMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                <Icon name="close" size={11} stroke={2.5} />
              </button>
            </div>
          ) : (
            <div style={{ width: 110, height: 148, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📖</div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={() => {
            if (!canSave) return;
            const saveData = isLink
              ? { url: url.trim(), title: title.trim(), coverImage }
              : { coverImage };
            onSave(saveData, item?.id || null);
          }}
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
          {item?.type === 'story' ? 'Save Cover' : item ? 'Save Changes' : 'Add to Library'}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Library, Creator, Settings, Reader, Weaving, BottomNav, ApiKeyModal, AddLinkModal, Toast, WelcomeModal });
