import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatUSD, formatTokens } from '../../utils/formatters';
import { getModelColor, getModelShortName } from '../../utils/colors';

export default function CostByModelChart({ models }) {
  if (!models?.length) return null;

  const pieData = models.map((m) => ({
    name: getModelShortName(m.modelId),
    value: m.costUSD,
    color: getModelColor(m.modelId),
    modelId: m.modelId,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{d.name}</div>
        <div style={{ color: 'var(--text-muted)' }}>Cost: <span className="text-white">{formatUSD(d.value)}</span></div>
      </div>
    );
  };

  const RADIAN = Math.PI / 180;
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Cost by Model</div>
      <div className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Lifetime spend distribution</div>

      <div className="flex gap-4 items-center">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70}
              labelLine={false} label={renderCustomLabel} animationDuration={400}>
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="#1e2130" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-2.5">
          {pieData.map((d) => {
            const total = pieData.reduce((s, x) => s + x.value, 0);
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            return (
              <div key={d.modelId}>
                <div className="flex justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                    <span style={{ color: 'var(--text-primary)' }}>{d.name}</span>
                  </div>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatUSD(d.value)}</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
