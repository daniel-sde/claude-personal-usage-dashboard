import { useState, useEffect, useRef } from 'react';
import TopBar from '../components/layout/TopBar';
import LiveBurnChart from '../components/charts/LiveBurnChart';
import { useSSE } from '../hooks/useSSE';
import { formatUSD, formatTokens } from '../utils/formatters';
import { getModelColor, getModelShortName } from '../utils/colors';

function ActiveBadge({ session, runningCost }) {
  if (!session) return (
    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
      <div className="w-2 h-2 rounded-full" style={{ background: 'var(--text-muted)' }} />
      No active session
    </div>
  );

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center w-3 h-3">
        <div className="absolute w-3 h-3 rounded-full animate-ping" style={{ background: '#34d39940' }} />
        <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {session.projectName || session.sessionId?.slice(0, 8) || 'Active Session'}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Session active · {formatUSD(runningCost, 4)} this window
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const isStart = toast.type === 'start';
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isStart ? '#34d39960' : '#f8717160'}`,
        minWidth: 240,
      }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: isStart ? '#34d399' : '#f87171' }} />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {isStart ? 'Session started' : 'Session ended'}
        </div>
        {toast.projectName && (
          <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{toast.projectName}</div>
        )}
      </div>
      <button onClick={() => onDismiss(toast.id)} style={{ color: 'var(--text-muted)' }}>✕</button>
    </div>
  );
}

export default function Live() {
  const { events, connected } = useSSE('/api/live/stream');
  const [minuteActivity, setMinuteActivity] = useState([]);
  const [runningCost, setRunningCost] = useState(0);
  const [totalTokensWindow, setTotalTokensWindow] = useState(0);
  const [activeSession, setActiveSession] = useState(null);
  const [lastTick, setLastTick] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef({});

  useEffect(() => {
    const tick = events.tick;
    if (!tick) return;
    setMinuteActivity(tick.minuteActivity || []);
    setLastTick(new Date(tick.timestamp));
    if (tick.activeSession) setActiveSession(tick.activeSession);

    const cost = (tick.minuteActivity || []).reduce((s, m) => s + m.costUSD, 0);
    const tokens = (tick.minuteActivity || []).reduce((s, m) => s + m.tokens, 0);
    setRunningCost(cost);
    setTotalTokensWindow(tokens);
  }, [events.tick]);

  function addToast(type, data) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [{ id, type, ...data }, ...prev].slice(0, 5));
    toastTimers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete toastTimers.current[id];
    }, 6000);
  }

  function dismissToast(id) {
    clearTimeout(toastTimers.current[id]);
    delete toastTimers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    if (events.session_start) addToast('start', events.session_start);
  }, [events.session_start]);

  useEffect(() => {
    if (events.session_end) addToast('end', events.session_end);
  }, [events.session_end]);

  // Cleanup timers on unmount
  useEffect(() => () => Object.values(toastTimers.current).forEach(clearTimeout), []);

  const recentMinutes = minuteActivity.filter((m) => m.tokens > 0).length;

  // Burn rate: avg tokens/min from last 5 active minutes
  const lastActive = minuteActivity.filter((m) => m.tokens > 0).slice(-5);
  const burnRate = lastActive.length > 0
    ? Math.round(lastActive.reduce((s, m) => s + m.tokens, 0) / lastActive.length)
    : 0;

  // Per-model breakdown in window
  const modelBreakdown = {};
  for (const m of minuteActivity) {
    if (!m.model || !m.tokens) continue;
    if (!modelBreakdown[m.model]) modelBreakdown[m.model] = { tokens: 0, costUSD: 0 };
    modelBreakdown[m.model].tokens += m.tokens;
    modelBreakdown[m.model].costUSD += m.costUSD;
  }
  const modelEntries = Object.entries(modelBreakdown).sort((a, b) => b[1].tokens - a[1].tokens);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Live Activity" lastUpdated={lastTick} />
      <div className="flex-1 p-6 space-y-4 overflow-auto">

        {/* Status bar */}
        <div className="rounded-xl p-4 flex items-center justify-between"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <ActiveBadge session={activeSession} runningCost={runningCost} />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {connected ? 'Live' : 'Reconnecting…'}
            </span>
          </div>
        </div>

        {/* Window stats — 4 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Tokens (60 min)', value: formatTokens(totalTokensWindow) },
            { label: 'Cost (60 min)', value: formatUSD(runningCost, 4) },
            { label: 'Active minutes', value: `${recentMinutes} / 60` },
            { label: 'Burn rate', value: burnRate > 0 ? `${formatTokens(burnRate)}/min` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
              <div className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Live chart */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="mb-4">
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Token Burn (Last 60 Minutes)</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Live minute-by-minute usage</div>
          </div>
          <LiveBurnChart minuteActivity={minuteActivity} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Per-model breakdown */}
          {modelEntries.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                Model Activity (60 min)
              </div>
              <div className="space-y-3">
                {modelEntries.map(([modelId, stats]) => {
                  const color = getModelColor(modelId);
                  const maxTokens = modelEntries[0][1].tokens;
                  return (
                    <div key={modelId}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium" style={{ color }}>{getModelShortName(modelId)}</span>
                        <div className="flex gap-3" style={{ color: 'var(--text-muted)' }}>
                          <span>{formatTokens(stats.tokens)} tok</span>
                          <span style={{ color: 'var(--accent-amber)' }}>{formatUSD(stats.costUSD, 4)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(stats.tokens / maxTokens) * 100}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent activity list */}
          {minuteActivity.filter((m) => m.tokens > 0).length > 0 && (
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Recent Minutes</div>
              <div className="space-y-1 max-h-52 overflow-auto">
                {minuteActivity
                  .filter((m) => m.tokens > 0)
                  .slice(-20)
                  .reverse()
                  .map((m) => (
                    <div key={m.minute} className="flex items-center justify-between text-xs py-1.5 px-2 rounded"
                      style={{ background: 'var(--bg-secondary)' }}>
                      <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                        {m.minute.slice(11)}
                      </span>
                      {m.model && (
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: `${getModelColor(m.model)}20`, color: getModelColor(m.model) }}>
                          {getModelShortName(m.model)}
                        </span>
                      )}
                      <span style={{ color: 'var(--text-primary)' }}>{formatTokens(m.tokens)} tok</span>
                      <span style={{ color: 'var(--accent-amber)' }}>{formatUSD(m.costUSD, 4)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast notifications — fixed to page corner */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </div>
  );
}
