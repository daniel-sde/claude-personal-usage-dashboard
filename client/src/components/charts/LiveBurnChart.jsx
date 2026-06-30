import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatTokens, formatUSD } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-2.5 text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex gap-2">
          <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {p.name === 'Cost' ? formatUSD(p.value, 4) : formatTokens(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function LiveBurnChart({ minuteActivity = [] }) {
  // Build a 60-minute window with zeroes filled
  const now = new Date();
  const windowData = [];
  for (let i = 59; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60_000);
    const key = t.toISOString().slice(0, 16);
    const found = minuteActivity.find((m) => m.minute === key);
    windowData.push({
      time: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      Tokens: found?.tokens || 0,
      Cost: found?.costUSD || 0,
    });
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={windowData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
          interval={9} />
        <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
          tickFormatter={formatTokens} width={40} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="Tokens" stroke="#4f8ef7" fill="url(#tokenGrad)" strokeWidth={2}
          isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
