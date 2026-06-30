import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApi } from '../../hooks/useApi';
import { formatTokens, formatUSD } from '../../utils/formatters';

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'All', days: null },
];

const CustomTooltip = ({ active, payload, label, granularity }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-xs space-y-1.5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {p.name === 'Cost' ? formatUSD(p.value) : formatTokens(p.value)}
          </span>
        </div>
      ))}
      {granularity === 'day' && (
        <div className="mt-1 pt-1 text-center" style={{ borderTop: '1px solid var(--border)', color: 'var(--accent-blue)' }}>
          Click to explore sessions →
        </div>
      )}
    </div>
  );
};

export default function DailyTokensChart() {
  const [granularity, setGranularity] = useState('day');
  const [range, setRange] = useState('30D');
  const navigate = useNavigate();

  const { data, loading } = useApi(`/api/daily?granularity=${granularity}`, { refreshInterval: 60_000 });

  const rangeObj = RANGES.find((r) => r.label === range);
  const rawData = data?.data || [];
  const sliced = rangeObj?.days ? rawData.slice(-rangeObj.days) : rawData;

  const chartData = sliced.map((d) => ({
    date: d.date,
    Tokens: d.totalTokens,
    Cost: d.costUSD,
  }));

  const handleClick = (payload) => {
    if (granularity !== 'day' || !payload?.activePayload?.[0]?.payload?.date) return;
    const date = payload.activePayload[0].payload.date;
    navigate(`/sessions?startDate=${date}&endDate=${date}`);
  };

  const TabButton = ({ children, active, onClick }) => (
    <button onClick={onClick}
      className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
      style={{
        background: active ? 'var(--bg-card)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        border: active ? '1px solid var(--border)' : '1px solid transparent',
      }}>
      {children}
    </button>
  );

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Token Usage Over Time</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {granularity === 'day' ? 'Click a bar to explore that day\'s sessions' : 'Monthly cost + token overview'}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            {RANGES.map((r) => (
              <TabButton key={r.label} active={range === r.label} onClick={() => setRange(r.label)}>
                {r.label}
              </TabButton>
            ))}
          </div>
          <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            {['day', 'month'].map((g) => (
              <TabButton key={g} active={granularity === g} onClick={() => setGranularity(g)}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </TabButton>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-52 rounded-lg animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            onClick={handleClick}
            style={{ cursor: granularity === 'day' ? 'pointer' : 'default' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
              interval="preserveStartEnd" />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
              tickFormatter={formatTokens} width={45} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} width={45} />
            <Tooltip content={<CustomTooltip granularity={granularity} />} />
            <Bar yAxisId="left" dataKey="Tokens" fill="#4f8ef7" fillOpacity={0.35}
              radius={[2, 2, 0, 0]} animationDuration={400} />
            <Line yAxisId="right" type="monotone" dataKey="Cost" stroke="#fbbf24" strokeWidth={2}
              dot={false} animationDuration={400} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
