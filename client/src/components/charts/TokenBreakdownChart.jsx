import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useApi } from '../../hooks/useApi';
import { formatTokens } from '../../utils/formatters';

const SERIES = [
  { key: 'Input', color: '#4f8ef7' },
  { key: 'Output', color: '#34d399' },
  { key: 'CacheRead', color: '#fbbf24' },
  { key: 'CacheWrite', color: '#a78bfa' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm" style={{ background: p.fill }} />
          <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatTokens(p.value)}</span>
          <span style={{ color: 'var(--text-muted)' }}>({total > 0 ? ((p.value / total) * 100).toFixed(0) : 0}%)</span>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Total:</span>
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatTokens(total)}</span>
      </div>
    </div>
  );
};

export default function TokenBreakdownChart() {
  const { data, loading } = useApi('/api/daily?granularity=day', { refreshInterval: 60_000 });

  const chartData = (data?.data?.slice(-30) || []).map((d) => {
    const input = Object.values(d.byModel || {}).reduce((s, m) => s + m.inputTokens, 0);
    const output = Object.values(d.byModel || {}).reduce((s, m) => s + m.outputTokens, 0);
    const cacheRead = Object.values(d.byModel || {}).reduce((s, m) => s + m.cacheReadInputTokens, 0);
    const cacheWrite = Object.values(d.byModel || {}).reduce((s, m) => s + m.cacheCreationInputTokens, 0);
    return { date: d.date, Input: input, Output: output, CacheRead: cacheRead, CacheWrite: cacheWrite };
  });

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="mb-4">
        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Token Breakdown</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Input / Output / Cache by day (last 30 days)</div>
      </div>

      {loading ? (
        <div className="h-52 rounded-lg animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-3">
            {SERIES.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                <span>{s.key === 'CacheRead' ? 'Cache Read' : s.key === 'CacheWrite' ? 'Cache Write' : s.key}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
                interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
                tickFormatter={formatTokens} width={45} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2d314840' }} />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} animationDuration={400} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
