import { useState, useEffect } from 'react';
import { formatRelativeTime } from '../../utils/formatters';

export default function TopBar({ title, lastUpdated }) {
  const [relTime, setRelTime] = useState('');

  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => setRelTime(formatRelativeTime(lastUpdated.toISOString()));
    update();
    const t = setInterval(update, 10_000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  return (
    <header className="h-16 flex items-center justify-between px-6"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
      <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h1>
      {lastUpdated && (
        <span className="text-xs px-2.5 py-1 rounded-full"
          style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          Updated {relTime}
        </span>
      )}
    </header>
  );
}
