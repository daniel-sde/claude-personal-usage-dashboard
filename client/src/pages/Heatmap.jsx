import TopBar from '../components/layout/TopBar';
import HourHeatmap from '../components/charts/HourHeatmap';
import { useApi } from '../hooks/useApi';

const HOUR_LABELS = ['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a',
  '12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p'];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Heatmap() {
  const { data, loading, lastUpdated } = useApi('/api/hourly', { refreshInterval: 120_000 });

  const hourCounts = data?.hourCounts || {};
  const dayCounts = data?.dayCounts || {};
  const peakHour = data?.peakHour ?? null;
  const total = data?.totalMessagesTracked || 0;

  const sorted = Object.entries(hourCounts)
    .map(([h, c]) => ({ hour: parseInt(h, 10), count: parseInt(c, 10) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxDayCount = Math.max(...Object.values(dayCounts).map(Number), 1);
  const sortedDays = Object.entries(dayCounts)
    .map(([d, c]) => ({ day: parseInt(d, 10), count: parseInt(c, 10) }))
    .sort((a, b) => b.count - a.count);
  const peakDay = sortedDays[0];

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Activity Heatmap" lastUpdated={lastUpdated} />
      <div className="flex-1 p-6 space-y-6 overflow-auto">

        {/* Hour of day heatmap */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="mb-2">
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Hour of Day Activity</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              When you use Claude most — {total.toLocaleString()} messages tracked
            </div>
          </div>
          {loading ? (
            <div className="h-16 rounded-lg animate-pulse mt-4" style={{ background: 'var(--bg-secondary)' }} />
          ) : (
            <div className="mt-6">
              <HourHeatmap hourCounts={hourCounts} peakHour={peakHour} />
            </div>
          )}
        </div>

        {/* Day of week grid */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="mb-2">
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Day of Week Activity</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Which days you work most{peakDay ? ` — most active: ${DAY_LABELS[peakDay.day]}` : ''}
            </div>
          </div>
          {loading ? (
            <div className="h-24 rounded-lg animate-pulse mt-4" style={{ background: 'var(--bg-secondary)' }} />
          ) : (
            <div className="flex gap-2 mt-4">
              {DAY_LABELS.map((dayLabel, i) => {
                const count = parseInt(dayCounts[String(i)] || 0, 10);
                const intensity = count / maxDayCount;
                const isPeak = peakDay?.day === i;
                return (
                  <div key={dayLabel} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs font-medium" style={{ color: isPeak ? '#4f8ef7' : 'var(--text-muted)' }}>
                      {dayLabel}
                    </div>
                    <div className="w-full rounded-lg relative"
                      style={{
                        height: 56,
                        background: `rgba(79, 142, 247, ${Math.max(0.06, intensity * 0.85)})`,
                        border: `1px solid ${isPeak ? '#4f8ef7' : 'rgba(79,142,247,0.15)'}`,
                        transition: 'all 0.2s',
                      }}
                      title={`${dayLabel}: ${count} messages`} />
                    <div className="text-xs tabular-nums font-medium" style={{ color: isPeak ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {count.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!loading && sorted.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Peak Hours</div>
              <div className="space-y-3">
                {sorted.map(({ hour, count }, i) => {
                  const max = sorted[0].count;
                  return (
                    <div key={hour} className="flex items-center gap-3">
                      <div className="w-6 text-xs text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        #{i + 1}
                      </div>
                      <div className="w-8 text-xs" style={{ color: 'var(--text-primary)' }}>
                        {HOUR_LABELS[hour]}
                      </div>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${(count / max) * 100}%`, background: '#4f8ef7' }} />
                      </div>
                      <div className="w-10 text-xs tabular-nums text-right" style={{ color: 'var(--text-primary)' }}>
                        {count.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Time of Day Summary</div>
              {['Morning (5–11)', 'Afternoon (12–16)', 'Evening (17–20)', 'Night (21–4)'].map((label, idx) => {
                const ranges = [[5,12],[12,17],[17,21],[21,5]];
                const [start, end] = ranges[idx];
                const count = Object.entries(hourCounts).reduce((s, [h, c]) => {
                  const hr = parseInt(h, 10);
                  const inRange = start <= end ? hr >= start && hr < end : hr >= start || hr < end;
                  return inRange ? s + parseInt(c, 10) : s;
                }, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{count.toLocaleString()} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#4f8ef7' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
