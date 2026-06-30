export default function KpiCard({ label, value, subtext, icon, accentColor = 'var(--accent-blue)' }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}20` }}>
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
        {subtext && (
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtext}</div>
        )}
      </div>
    </div>
  );
}
