const HOUR_LABELS = ['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a',
  '12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p'];

export default function HourHeatmap({ hourCounts = {}, peakHour }) {
  const values = Object.values(hourCounts).map(Number);
  const maxCount = Math.max(...values, 1);

  return (
    <div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
        {Array.from({ length: 24 }, (_, i) => {
          const count = hourCounts[String(i)] || 0;
          const opacity = count / maxCount;
          const isPeak = i === peakHour;
          return (
            <div key={i} className="relative group">
              <div
                className="rounded-md h-10 transition-transform hover:scale-105"
                style={{
                  background: `rgba(79, 142, 247, ${0.08 + opacity * 0.88})`,
                  border: isPeak ? '1px solid #4f8ef7' : '1px solid transparent',
                }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                {HOUR_LABELS[i]}: {count}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid gap-1.5 mt-1.5" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
        {HOUR_LABELS.map((h, i) => (
          <div key={i} className="text-center"
            style={{ fontSize: '9px', color: i % 3 === 0 ? 'var(--text-muted)' : 'transparent' }}>
            {h}
          </div>
        ))}
      </div>
    </div>
  );
}
