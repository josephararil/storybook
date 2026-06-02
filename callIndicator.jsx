// callIndicator.jsx — floating Gemini call indicator + tray
// Exports: window.CallIndicator, window.useApiCalls
// Loads after screens.jsx; depends on window.SW_TRACKER (apiTracker.js).

// Hook: subscribes to SW_TRACKER, returns { active, recent }.
function useApiCalls() {
  const [state, setState] = React.useState(() => ({
    active: window.SW_TRACKER?.getActive() || [],
    recent: window.SW_TRACKER?.getRecent(20) || [],
  }));

  React.useEffect(() => {
    if (!window.SW_TRACKER) return;
    const unsub = window.SW_TRACKER.subscribe(() => {
      setState({
        active: window.SW_TRACKER.getActive(),
        recent: window.SW_TRACKER.getRecent(20),
      });
    });
    return unsub;
  }, []);

  return state;
}

// Live duration counter shown for in-flight calls.
function LiveDuration({ startTime }) {
  const [ms, setMs] = React.useState(Date.now() - startTime);
  React.useEffect(() => {
    const id = setInterval(() => setMs(Date.now() - startTime), 500);
    return () => clearInterval(id);
  }, [startTime]);
  return React.createElement(React.Fragment, null, `${(ms / 1000).toFixed(1)}s`);
}

// Floating pill (top-right) + drop-down tray listing active and recent calls.
// Hidden when no active calls and tray is closed.
function CallIndicator({ t }) {
  const { active, recent } = useApiCalls();
  const [trayOpen, setTrayOpen] = React.useState(false);

  // Close tray when active calls drain to zero and tray has no recent events either
  React.useEffect(() => {
    if (active.length === 0 && recent.length === 0 && trayOpen) setTrayOpen(false);
  }, [active.length, recent.length]);

  if (active.length === 0 && !trayOpen) return null;

  const FONT = '"Nunito", system-ui';
  const hasActive = active.length > 0;

  return (
    <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 250, fontFamily: FONT }}>
      {/* Pill button */}
      <button
        onClick={() => setTrayOpen(o => !o)}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            6,
          padding:        '6px 12px',
          borderRadius:   999,
          background:     hasActive ? 'rgba(251,191,36,0.13)' : 'rgba(255,255,255,0.07)',
          border:         `1px solid ${hasActive ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.13)'}`,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          color:          hasActive ? '#fbbf24' : 'rgba(254,243,199,0.55)',
          fontSize:       12,
          fontWeight:     700,
          cursor:         'pointer',
          boxShadow:      '0 4px 12px rgba(0,0,0,0.35)',
          transition:     'all .15s',
        }}
      >
        {hasActive && (
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#fbbf24',
            animation: 'sw-breathe 1.5s ease-in-out infinite',
            flexShrink: 0,
          }} />
        )}
        {hasActive
          ? `${active.length} call${active.length !== 1 ? 's' : ''}`
          : 'Activity'
        }
      </button>

      {/* Drop-down tray */}
      {trayOpen && (
        <div style={{
          position:       'absolute',
          top:            40,
          right:          0,
          width:          306,
          maxHeight:      440,
          overflowY:      'auto',
          background:     'rgba(10, 8, 35, 0.97)',
          border:         '1px solid rgba(255,255,255,0.11)',
          borderRadius:   16,
          padding:        '12px 10px 10px',
          boxShadow:      '0 20px 60px rgba(0,0,0,0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex:         251,
        }}>

          {/* Active calls */}
          {active.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(254,243,199,0.38)', marginBottom: 7, paddingLeft: 4 }}>
                Active
              </div>
              {active.map(ev => (
                <div key={ev.id} style={{
                  marginBottom:  6,
                  padding:       '8px 10px',
                  borderRadius:  10,
                  background:    'rgba(251,191,36,0.07)',
                  border:        '1px solid rgba(251,191,36,0.2)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      {ev.kind}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(254,243,199,0.4)', fontVariantNumeric: 'tabular-nums' }}>
                      <LiveDuration startTime={ev.startTime} />
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(254,243,199,0.5)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.model}
                  </div>
                  {ev.context && (
                    <div style={{ fontSize: 10, color: 'rgba(254,243,199,0.32)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.context}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Recent finished calls */}
          {recent.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(254,243,199,0.38)', marginTop: active.length > 0 ? 10 : 0, marginBottom: 7, paddingLeft: 4 }}>
                Recent
              </div>
              {recent.map(ev => (
                <div key={ev.id} style={{
                  marginBottom: 4,
                  padding:      '6px 10px',
                  borderRadius: 10,
                  background:   'rgba(255,255,255,0.04)',
                  border:       '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ev.status === 'success' ? '#4ade80' : '#f87171' }}>
                      {ev.status === 'success' ? '✓' : '✗'} {ev.kind}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(254,243,199,0.38)', fontVariantNumeric: 'tabular-nums' }}>
                      {ev.durationMs != null ? `${(ev.durationMs / 1000).toFixed(1)}s` : ''}
                    </span>
                  </div>
                  {ev.context && (
                    <div style={{ fontSize: 10, color: 'rgba(254,243,199,0.32)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.context}
                    </div>
                  )}
                  {ev.error && (
                    <div style={{ fontSize: 10, color: '#f87171', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.error}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {active.length === 0 && recent.length === 0 && (
            <div style={{ padding: '12px 8px', textAlign: 'center', color: 'rgba(254,243,199,0.3)', fontSize: 12 }}>
              No recent activity
            </div>
          )}

          {/* View full log link */}
          <button
            onClick={() => { setTrayOpen(false); window.location.hash = '#/me'; }}
            style={{
              marginTop:    8,
              width:        '100%',
              padding:      '8px 12px',
              borderRadius: 10,
              background:   'rgba(255,255,255,0.04)',
              border:       '1px solid rgba(255,255,255,0.09)',
              color:        'rgba(254,243,199,0.5)',
              fontSize:     12,
              fontWeight:   600,
              cursor:       'pointer',
              textAlign:    'center',
            }}
          >
            View full log →
          </button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { CallIndicator, useApiCalls });
