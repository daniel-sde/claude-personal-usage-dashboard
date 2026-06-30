import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import TopBar from '../components/layout/TopBar';
import SessionTable from '../components/tables/SessionTable';
import { useApi } from '../hooks/useApi';
import { formatUSD, formatTokens, formatDuration, formatDate, formatNumber } from '../utils/formatters';
import { getModelColor, getModelShortName } from '../utils/colors';

function MsgTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-2 text-xs"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ color: 'var(--text-muted)' }}>Msg #{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5 mt-0.5">
          <div className="w-2 h-2 rounded-sm" style={{ background: p.fill }} />
          <span style={{ color: 'var(--text-primary)' }}>{formatTokens(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function SessionModal({ session, onClose }) {
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setDetail(null);
    setDetailLoading(true);
    fetch(`/api/sessions/${session.sessionId}`)
      .then((r) => r.json())
      .then((d) => { setDetail(d); setDetailLoading(false); })
      .catch(() => setDetailLoading(false));
  }, [session?.sessionId]);

  if (!session) return null;

  const tokenTypes = [
    { label: 'Input', value: session.inputTokens, color: '#4f8ef7' },
    { label: 'Output', value: session.outputTokens, color: '#34d399' },
    { label: 'Cache Read', value: session.cacheReadInputTokens, color: '#fbbf24' },
    { label: 'Cache Write', value: session.cacheCreationInputTokens, color: '#a78bfa' },
  ];
  const total = session.totalTokens || 1;

  const totalInputEquiv = session.inputTokens + session.cacheReadInputTokens;
  const cacheHitRate = totalInputEquiv > 0 ? (session.cacheReadInputTokens / totalInputEquiv) * 100 : 0;
  const costPerMsg = session.messageCount > 0 ? session.costUSD / session.messageCount : 0;

  const chartData = (detail?.records || []).map((r, i) => ({
    msg: i + 1,
    Input: r.inputTokens,
    Output: r.outputTokens,
    Cache: r.cacheReadInputTokens + r.cacheCreationInputTokens,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="rounded-xl w-full max-w-xl p-6 space-y-4 max-h-screen overflow-y-auto"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {session.projectName}
            </div>
            <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
              {session.sessionId}
            </div>
          </div>
          <button onClick={onClose} className="text-lg leading-none ml-4 flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Core stats */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          {[
            { label: 'Started', value: formatDate(session.startedAt) },
            { label: 'Duration', value: formatDuration(session.durationMs) },
            { label: 'Messages', value: formatNumber(session.messageCount) },
            { label: 'Tool Calls', value: formatNumber(session.toolCallCount) },
            { label: 'Total Cost', value: formatUSD(session.costUSD) },
            { label: 'Total Tokens', value: formatTokens(session.totalTokens) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg p-2.5" style={{ background: 'var(--bg-secondary)' }}>
              <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Efficiency row */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg p-2.5" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Cache Hit Rate</div>
            <div className="font-semibold" style={{ color: cacheHitRate > 50 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
              {cacheHitRate.toFixed(0)}%
              <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                ({formatTokens(session.cacheReadInputTokens)} cached)
              </span>
            </div>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Cost / Message</div>
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {formatUSD(costPerMsg, 4)}
              <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>avg</span>
            </div>
          </div>
        </div>

        {/* Token breakdown bar */}
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>TOKEN BREAKDOWN</div>
          <div className="flex rounded-full overflow-hidden h-3 mb-3">
            {tokenTypes.map((t) => (
              <div key={t.label}
                style={{ width: `${(t.value / total) * 100}%`, background: t.color }}
                title={`${t.label}: ${formatTokens(t.value)}`} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {tokenTypes.map((t) => (
              <div key={t.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm" style={{ background: t.color }} />
                  <span style={{ color: 'var(--text-muted)' }}>{t.label}</span>
                </div>
                <span className="font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {formatTokens(t.value)}
                  <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
                    ({((t.value / total) * 100).toFixed(0)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-message chart */}
        <div>
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            PER-MESSAGE USAGE
            {detail && ` · ${detail.records?.length} messages`}
          </div>
          {detailLoading ? (
            <div className="h-20 rounded-lg animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                barCategoryGap="10%">
                <Bar dataKey="Input" stackId="a" fill="#4f8ef7" fillOpacity={0.85} />
                <Bar dataKey="Output" stackId="a" fill="#34d399" fillOpacity={0.85} />
                <Bar dataKey="Cache" stackId="a" fill="#fbbf24" fillOpacity={0.85} radius={[1, 1, 0, 0]} />
                <XAxis dataKey="msg" hide />
                <Tooltip content={<MsgTooltip />} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs py-3 text-center" style={{ color: 'var(--text-muted)' }}>
              No message detail available
            </div>
          )}
          {!detailLoading && chartData.length > 0 && (
            <div className="flex gap-3 mt-2">
              {[['Input', '#4f8ef7'], ['Output', '#34d399'], ['Cache', '#fbbf24']].map(([label, color]) => (
                <div key={label} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Model badges */}
        <div className="flex flex-wrap gap-1.5">
          {session.models.map((m) => (
            <span key={m} className="text-xs px-2 py-1 rounded-full"
              style={{ background: `${getModelColor(m)}20`, color: getModelColor(m), border: `1px solid ${getModelColor(m)}40` }}>
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Sessions() {
  const [searchParams] = useSearchParams();

  const [sort, setSort] = useState('date');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState(searchParams.get('project') || '');
  const [modelFilter, setModelFilter] = useState(searchParams.get('model') || '');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [minCost, setMinCost] = useState(searchParams.get('minCost') || '');
  const [selectedSession, setSelectedSession] = useState(null);

  const hasFilters = projectFilter || modelFilter || startDate || endDate || minCost;

  const url = `/api/sessions?sort=${sort}&order=${order}&page=${page}&pageSize=20` +
    `&project=${encodeURIComponent(projectFilter)}&model=${encodeURIComponent(modelFilter)}` +
    `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}` +
    `&minCost=${encodeURIComponent(minCost)}`;

  const { data, loading, lastUpdated } = useApi(url, { refreshInterval: 60_000 });

  function handleSortChange(key) {
    if (sort === key) setOrder(order === 'desc' ? 'asc' : 'desc');
    else { setSort(key); setOrder('desc'); }
    setPage(1);
  }

  function clearFilters() {
    setProjectFilter(''); setModelFilter('');
    setStartDate(''); setEndDate(''); setMinCost('');
    setPage(1);
  }

  const inputStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Sessions" lastUpdated={lastUpdated} />
      <div className="flex-1 p-6 space-y-4 overflow-auto">

        {/* Filters */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex flex-wrap gap-3">
            <input
              className="px-3 py-2 rounded-lg text-sm flex-1 min-w-40"
              style={inputStyle}
              placeholder="Filter by project..."
              value={projectFilter}
              onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
            />
            <select
              className="px-3 py-2 rounded-lg text-sm"
              style={inputStyle}
              value={modelFilter}
              onChange={(e) => { setModelFilter(e.target.value); setPage(1); }}>
              <option value="">All models</option>
              <option value="opus">Opus</option>
              <option value="sonnet">Sonnet</option>
              <option value="haiku">Haiku</option>
            </select>
            <input
              type="number"
              className="px-3 py-2 rounded-lg text-sm w-32"
              style={inputStyle}
              placeholder="Min cost ($)"
              value={minCost}
              min="0"
              step="0.01"
              onChange={(e) => { setMinCost(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>From</span>
              <input
                type="date"
                className="px-3 py-1.5 rounded-lg text-sm"
                style={inputStyle}
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>To</span>
              <input
                type="date"
                className="px-3 py-1.5 rounded-lg text-sm"
                style={inputStyle}
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              />
            </div>
            {hasFilters && (
              <button
                className="px-3 py-1.5 rounded-lg text-sm ml-auto"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--accent-red)' }}
                onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        {data && (
          <div className="flex items-center gap-4 text-xs px-1" style={{ color: 'var(--text-muted)' }}>
            <span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{data.total}</span> sessions
            </span>
            <span>·</span>
            <span>
              <span className="font-semibold" style={{ color: 'var(--accent-amber)' }}>
                {formatUSD(data.filteredStats?.costUSD)}
              </span> total cost
            </span>
            <span>·</span>
            <span>
              <span className="font-semibold" style={{ color: 'var(--accent-blue)' }}>
                {formatTokens(data.filteredStats?.totalTokens)}
              </span> tokens
            </span>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl h-64 animate-pulse" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
        ) : (
          <SessionTable
            sessions={data?.sessions || []}
            total={data?.total || 0}
            page={page}
            pageSize={20}
            sort={sort}
            order={order}
            onSortChange={handleSortChange}
            onPageChange={setPage}
            onRowClick={setSelectedSession}
          />
        )}
      </div>

      {selectedSession && (
        <SessionModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
}
