import { useState } from 'react';
import { formatUSD, formatTokens, formatDuration, formatDate } from '../../utils/formatters';
import { getModelColor, getModelShortName } from '../../utils/colors';

function SortIcon({ active, direction }) {
  return (
    <svg viewBox="0 0 12 16" className="w-3 h-3 ml-1 inline" fill="currentColor">
      <path d="M6 1l3 4H3l3-4z" opacity={active && direction === 'asc' ? 1 : 0.3} />
      <path d="M6 15l-3-4h6l-3 4z" opacity={active && direction === 'desc' ? 1 : 0.3} />
    </svg>
  );
}

export default function SessionTable({ sessions = [], total = 0, page = 1, pageSize = 20,
  sort, order, onSortChange, onPageChange, onRowClick }) {

  const cols = [
    { key: 'date', label: 'Date', sortKey: 'date' },
    { key: 'project', label: 'Project', sortKey: 'project' },
    { key: 'models', label: 'Models' },
    { key: 'messages', label: 'Messages', sortKey: 'messages' },
    { key: 'tokens', label: 'Tokens', sortKey: 'tokens' },
    { key: 'cost', label: 'Cost', sortKey: 'cost' },
    { key: 'duration', label: 'Duration', sortKey: 'duration' },
  ];

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              {cols.map((col) => (
                <th key={col.key}
                  className={`px-4 py-3 text-left font-medium text-xs tracking-wider ${col.sortKey ? 'cursor-pointer hover:text-white select-none' : ''}`}
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => col.sortKey && onSortChange && onSortChange(col.sortKey)}>
                  {col.label}
                  {col.sortKey && <SortIcon active={sort === col.sortKey} direction={order} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={s.sessionId}
                className="cursor-pointer transition-colors"
                style={{
                  borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'var(--bg-card)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onClick={() => onRowClick && onRowClick(s)}>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {formatDate(s.startedAt)}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <div className="font-medium text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                    {s.projectName || '—'}
                  </div>
                  {s.projectPath && (
                    <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)', maxWidth: 200 }}>
                      {s.projectPath}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.models.map((m) => (
                      <span key={m} className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: `${getModelColor(m)}20`, color: getModelColor(m) }}>
                        {getModelShortName(m)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-right tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {s.messageCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-right tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {formatTokens(s.totalTokens)}
                </td>
                <td className="px-4 py-3 text-xs text-right tabular-nums font-medium"
                  style={{ color: s.costUSD > 10 ? '#fbbf24' : 'var(--text-primary)' }}>
                  {formatUSD(s.costUSD)}
                </td>
                <td className="px-4 py-3 text-xs text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {formatDuration(s.durationMs)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{total} sessions</span>
          <div className="flex gap-1">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              ←
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const p = i + Math.max(1, page - 3);
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => onPageChange(p)}
                  className="px-3 py-1.5 rounded-lg transition-colors min-w-[36px]"
                  style={{
                    background: p === page ? 'var(--accent-blue)' : 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: p === page ? 'white' : 'var(--text-primary)',
                  }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
