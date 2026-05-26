// Cover — procedural illustrated story cover.
// Three render modes match the three theme variations:
//   • 'glow' (Starry Night) — soft glow + radial vignette, dark base
//   • 'pop'  (Dreamland Pop) — flat pastel, chunky, friendly
//   • 'line' (Constellation) — line art on deep base, gold strokes

function Cover({ story, w = 160, h = 220, mode = 'glow', radius = 18, badge = false }) {
  const [c1, c2, c3] = story.palette;

  const bg = mode === 'pop'
    ? `linear-gradient(155deg, ${tint(c1, 0.15)} 0%, ${c2} 60%, ${tint(c3, 0.1)} 100%)`
    : mode === 'line'
    ? `radial-gradient(120% 80% at 50% 110%, ${tint(c2, -0.25)} 0%, #0a0a1e 70%)`
    : `linear-gradient(160deg, ${c1} 0%, ${c2} 70%, ${tint(c3, -0.1)} 100%)`;

  return (
    <div style={{
      width: w, height: h, borderRadius: radius, overflow: 'hidden',
      position: 'relative', background: bg, flexShrink: 0,
      boxShadow: mode === 'pop'
        ? '0 8px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.4)'
        : mode === 'line'
        ? '0 4px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(212,160,23,0.25)'
        : '0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
    }}>
      {story.coverImage ? (
        <img src={story.coverImage} alt="" style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
        }} />
      ) : (
        <>
          <Scene scene={story.scene} mode={mode} c1={c1} c2={c2} c3={c3} w={w} h={h} />
          {mode === 'glow' && (
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 60% at 50% 20%, rgba(255,255,255,0.12), transparent 60%)', pointerEvents: 'none' }} />
          )}
          {mode === 'pop' && (
            <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{story.category}</div>
          )}
        </>
      )}
      {badge && (
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          background: 'rgba(15, 12, 40, 0.78)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 999, padding: '3px 8px',
          display: 'flex', alignItems: 'center', gap: 4,
          color: '#fbbf24', fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
        }}>
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" /><path d="M10 14L21 3" />
          </svg>
          Gemini
        </div>
      )}
    </div>
  );
}

// Lighten (positive amt) or darken (negative). Crude but fine for gradients.
function tint(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + Math.round(amt * 255)));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + Math.round(amt * 255)));
  const b = Math.max(0, Math.min(255, (n & 0xff) + Math.round(amt * 255)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function Scene({ scene, mode, c1, c2, c3, w, h }) {
  // 'line' mode draws constellation-style strokes over a dark base.
  const stroke = mode === 'line' ? '#d4a017' : '#fff';
  const fillAccent = mode === 'pop' ? c3 : c3;
  const opacityBase = mode === 'line' ? 0.85 : 1;

  // Sprinkle stars (used by most scenes for the dark themes)
  const stars = (count) => (mode !== 'pop') && Array.from({ length: count }).map((_, i) => {
    const x = (i * 37 % 90) + 5, y = (i * 53 % 60) + 5;
    const s = 0.6 + (i * 0.31 % 1.4);
    return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={s} fill={mode === 'line' ? '#fbbf24' : '#fef3c7'} opacity={0.6 + (i % 3) * 0.15} />;
  });

  return (
    <svg viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id={`glow-${scene}-${mode}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {stars(12)}
      {scene === 'moon' && (
        <g>
          {mode === 'line' ? (
            <>
              <circle cx="50" cy="55" r="22" fill="none" stroke={stroke} strokeWidth="1.2" opacity={opacityBase} />
              <path d="M 60 40 L 65 50 M 68 38 L 75 45 M 35 70 L 30 78" stroke={stroke} strokeWidth="0.8" opacity="0.6" />
              <circle cx="65" cy="50" r="1.5" fill="#fbbf24" />
              <circle cx="75" cy="45" r="1" fill="#fbbf24" />
            </>
          ) : (
            <>
              <circle cx="50" cy="55" r="28" fill={`url(#glow-${scene}-${mode})`} />
              <path d="M 50 27 a 28 28 0 1 0 0 56 a 22 22 0 1 1 0 -56 Z" fill={mode === 'pop' ? '#fef3c7' : '#fde68a'} opacity="0.95" />
              <circle cx="62" cy="50" r="2.5" fill={c1} opacity="0.25" />
              <circle cx="55" cy="65" r="1.8" fill={c1} opacity="0.2" />
            </>
          )}
          {/* horizon hills */}
          <path d="M 0 120 Q 25 100 50 110 T 100 115 L 100 140 L 0 140 Z" fill={mode === 'pop' ? tint(c1, -0.1) : '#000'} opacity={mode === 'pop' ? 0.6 : 0.45} />
        </g>
      )}
      {scene === 'fox' && (
        <g>
          {/* hills */}
          <path d="M 0 110 Q 30 90 60 105 T 100 100 L 100 140 L 0 140 Z" fill="#1c1917" opacity="0.5" />
          {/* fox silhouette */}
          {mode === 'line' ? (
            <g stroke={stroke} strokeWidth="1.2" fill="none" opacity={opacityBase}>
              <path d="M 35 80 L 40 65 L 50 72 L 60 65 L 65 80 Q 60 95 50 95 Q 40 95 35 80 Z" />
              <circle cx="46" cy="80" r="1" fill={stroke} />
              <circle cx="54" cy="80" r="1" fill={stroke} />
              <path d="M 65 85 Q 80 80 78 70" />
            </g>
          ) : (
            <g>
              <path d="M 35 80 L 40 62 L 50 72 L 60 62 L 65 80 Q 60 98 50 98 Q 40 98 35 80 Z" fill={c2} />
              <path d="M 41 65 L 43 73 L 47 68 Z" fill={tint(c1, -0.1)} />
              <path d="M 59 65 L 57 73 L 53 68 Z" fill={tint(c1, -0.1)} />
              <ellipse cx="50" cy="88" rx="3" ry="2" fill={tint(c1, -0.15)} />
              <circle cx="45" cy="82" r="1.2" fill="#0c0a09" />
              <circle cx="55" cy="82" r="1.2" fill="#0c0a09" />
              <path d="M 65 90 Q 85 80 80 65" stroke={c2} strokeWidth="6" fill="none" strokeLinecap="round" />
              <path d="M 80 65 Q 82 60 78 58" stroke={c3} strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>
          )}
        </g>
      )}
      {scene === 'unicorn' && (
        <g>
          {mode === 'line' ? (
            <g stroke={stroke} strokeWidth="1.2" fill="none" opacity={opacityBase}>
              <path d="M 35 90 Q 30 80 35 70 L 42 50 L 50 70 Q 65 70 70 85 Q 70 100 60 100 L 40 100 Q 35 100 35 90 Z" />
              <path d="M 42 50 L 38 38" />
              <circle cx="62" cy="80" r="0.8" fill={stroke} />
            </g>
          ) : (
            <g>
              {/* body */}
              <path d="M 35 95 Q 30 80 38 72 Q 48 70 55 75 Q 70 73 75 88 Q 75 105 65 105 L 42 105 Q 35 105 35 95 Z" fill={c3} />
              <path d="M 38 72 L 42 60 Q 45 55 50 58 Q 53 65 50 72 Z" fill={c3} />
              {/* mane */}
              <path d="M 45 70 Q 42 65 47 60 Q 50 66 52 70 Z" fill={c2} />
              <path d="M 48 75 Q 52 65 58 70 Q 56 78 52 80 Z" fill={tint(c2, 0.05)} />
              {/* horn */}
              <path d="M 47 60 L 46 50 L 49 60 Z" fill="#fbbf24" />
              <circle cx="47" cy="50" r="1.5" fill="#fef3c7" opacity="0.9" />
              {/* eye */}
              <circle cx="44" cy="72" r="0.9" fill="#1c1917" />
            </g>
          )}
        </g>
      )}
      {scene === 'whale' && (
        <g>
          {/* ocean */}
          <path d="M 0 100 Q 25 95 50 100 T 100 100 L 100 140 L 0 140 Z" fill={mode === 'pop' ? tint(c2, 0.1) : '#0c4a6e'} opacity="0.7" />
          {mode === 'line' ? (
            <g stroke={stroke} strokeWidth="1.2" fill="none" opacity={opacityBase}>
              <path d="M 25 80 Q 20 70 30 65 Q 50 60 70 70 Q 80 75 75 85 Q 60 90 35 88 Q 25 88 25 80 Z" />
              <path d="M 75 70 L 80 60 L 82 70 Z" />
              <circle cx="35" cy="75" r="0.8" fill={stroke} />
            </g>
          ) : (
            <g>
              <ellipse cx="50" cy="80" rx="28" ry="14" fill={c2} />
              <path d="M 72 75 L 82 65 Q 84 70 80 78 Z" fill={c2} />
              <ellipse cx="40" cy="78" rx="10" ry="4" fill={tint(c3, -0.1)} opacity="0.5" />
              <circle cx="35" cy="76" r="1.5" fill="#0c0a09" />
              {/* spout */}
              <path d="M 50 65 Q 48 55 50 50 M 50 60 Q 53 53 55 48 M 50 60 Q 47 53 45 48" stroke={c3} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </g>
          )}
        </g>
      )}
      {scene === 'dragon' && (
        <g>
          {/* cave silhouette */}
          <path d="M 0 110 Q 20 95 35 100 Q 50 90 70 100 Q 85 95 100 110 L 100 140 L 0 140 Z" fill="#1c1917" opacity="0.6" />
          {mode === 'line' ? (
            <g stroke={stroke} strokeWidth="1.2" fill="none" opacity={opacityBase}>
              <path d="M 38 88 Q 35 75 45 70 Q 55 68 60 75 Q 70 75 68 88 Q 55 95 45 92 Q 38 92 38 88 Z" />
              <path d="M 45 70 L 42 60 M 50 68 L 50 58 M 55 70 L 58 60" />
              <circle cx="50" cy="80" r="0.8" fill={stroke} />
            </g>
          ) : (
            <g>
              <ellipse cx="50" cy="85" rx="18" ry="11" fill={c2} />
              <path d="M 42 75 L 39 65 L 45 70 Z M 50 73 L 50 62 L 54 70 Z M 58 75 L 62 66 L 60 73 Z" fill={tint(c2, -0.15)} />
              <circle cx="44" cy="83" r="1.3" fill="#0c0a09" />
              <circle cx="56" cy="83" r="1.3" fill="#0c0a09" />
              {/* sparkle puffs */}
              <circle cx="30" cy="72" r="2" fill="#fbbf24" opacity="0.85" />
              <circle cx="26" cy="68" r="1.2" fill="#fef3c7" opacity="0.7" />
              <circle cx="32" cy="64" r="0.8" fill="#fef3c7" opacity="0.6" />
            </g>
          )}
        </g>
      )}
      {scene === 'bear' && (
        <g>
          {/* meadow */}
          <path d="M 0 105 Q 50 95 100 105 L 100 140 L 0 140 Z" fill={mode === 'pop' ? tint(c3, -0.1) : '#365314'} opacity="0.7" />
          {mode === 'line' ? (
            <g stroke={stroke} strokeWidth="1.2" fill="none" opacity={opacityBase}>
              <circle cx="50" cy="85" r="13" />
              <circle cx="42" cy="73" r="4" />
              <circle cx="58" cy="73" r="4" />
              <circle cx="46" cy="83" r="0.8" fill={stroke} />
              <circle cx="54" cy="83" r="0.8" fill={stroke} />
            </g>
          ) : (
            <g>
              <circle cx="50" cy="86" r="14" fill={c1} />
              <circle cx="42" cy="74" r="5" fill={c1} />
              <circle cx="58" cy="74" r="5" fill={c1} />
              <circle cx="42" cy="74" r="2.5" fill={tint(c1, 0.2)} />
              <circle cx="58" cy="74" r="2.5" fill={tint(c1, 0.2)} />
              <ellipse cx="50" cy="89" rx="6" ry="4" fill={tint(c1, 0.15)} />
              <ellipse cx="50" cy="86" rx="2" ry="1.5" fill="#0c0a09" />
              <circle cx="45" cy="83" r="1.2" fill="#0c0a09" />
              <circle cx="55" cy="83" r="1.2" fill="#0c0a09" />
              {/* bee */}
              <circle cx="78" cy="55" r="2.5" fill="#fbbf24" />
              <path d="M 75 55 Q 78 50 81 55" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.7" />
            </g>
          )}
        </g>
      )}
      {scene === 'cloud' && (
        <g>
          {mode === 'line' ? (
            <g stroke={stroke} strokeWidth="1.2" fill="none" opacity={opacityBase}>
              <path d="M 25 70 Q 20 60 30 58 Q 35 50 48 53 Q 55 48 65 55 Q 78 55 78 65 Q 80 75 70 78 Q 35 80 28 75 Q 22 75 25 70 Z" />
              <path d="M 40 90 L 38 95 M 50 92 L 48 97 M 60 90 L 58 95" />
            </g>
          ) : (
            <g>
              <ellipse cx="32" cy="68" rx="12" ry="9" fill="#fff" opacity="0.95" />
              <ellipse cx="50" cy="62" rx="16" ry="11" fill="#fff" />
              <ellipse cx="68" cy="68" rx="13" ry="9" fill="#fff" opacity="0.95" />
              <ellipse cx="50" cy="72" rx="22" ry="8" fill="#fff" opacity="0.85" />
              <circle cx="44" cy="66" r="1.2" fill={c1} />
              <circle cx="56" cy="66" r="1.2" fill={c1} />
              <path d="M 46 71 Q 50 74 54 71" stroke={c1} strokeWidth="1" fill="none" strokeLinecap="round" />
              {/* falling drops */}
              <ellipse cx="40" cy="92" rx="1.2" ry="2.5" fill={c3} opacity="0.7" />
              <ellipse cx="55" cy="96" rx="1.2" ry="2.5" fill={c3} opacity="0.7" />
            </g>
          )}
        </g>
      )}
      {scene === 'turtle' && (
        <g>
          <path d="M 0 110 Q 50 102 100 110 L 100 140 L 0 140 Z" fill={mode === 'pop' ? tint(c2, -0.1) : '#064e3b'} opacity="0.7" />
          {mode === 'line' ? (
            <g stroke={stroke} strokeWidth="1.2" fill="none" opacity={opacityBase}>
              <ellipse cx="50" cy="88" rx="16" ry="10" />
              <path d="M 50 78 L 50 88 M 42 82 L 58 82 M 44 90 L 56 90" />
              <circle cx="68" cy="85" r="4" />
            </g>
          ) : (
            <g>
              <ellipse cx="50" cy="92" rx="6" ry="3" fill={tint(c1, -0.1)} />
              <ellipse cx="50" cy="86" rx="17" ry="11" fill={c2} />
              {/* shell pattern */}
              <path d="M 50 76 L 50 96 M 40 82 L 60 82 M 42 90 L 58 90" stroke={tint(c1, -0.1)} strokeWidth="1.2" fill="none" />
              <circle cx="68" cy="86" r="4" fill={c2} />
              <circle cx="69" cy="85" r="0.8" fill="#0c0a09" />
              {/* star above */}
              <path d="M 30 50 L 31 53 L 34 53 L 32 55 L 33 58 L 30 56 L 27 58 L 28 55 L 26 53 L 29 53 Z" fill="#fbbf24" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

Object.assign(window, { Cover, tint });
