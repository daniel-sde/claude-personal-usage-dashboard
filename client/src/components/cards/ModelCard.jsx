import { formatUSD, formatTokens, formatNumber } from '../../utils/formatters';
import { getModelColor, getModelShortName } from '../../utils/colors';

export default function ModelCard({ model, isFavorite, onClick }) {
  const color = getModelColor(model.modelId);
  const total = model.inputTokens + model.outputTokens + model.cacheReadInputTokens + model.cacheCreationInputTokens;

  const totalInputEquiv = model.inputTokens + model.cacheReadInputTokens;
  const cacheHitRate = totalInputEquiv > 0
    ? ((model.cacheReadInputTokens / totalInputEquiv) * 100).toFixed(0)
    : 0;
  const costPerMsg = model.messageCount > 0 ? model.costUSD / model.messageCount : 0;

  const bars = [
    { label: 'Input', value: model.inputTokens, color: '#4f8ef7' },
    { label: 'Output', value: model.outputTokens, color: '#34d399' },
    { label: 'Cache R', value: model.cacheReadInputTokens, color: '#fbbf24' },
    { label: 'Cache W', value: model.cacheCreationInputTokens, color: '#a78bfa' },
  ];

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onClick={onClick}
      onMouseEnter={onClick ? (e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.background = `${color}08`;
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg-card)';
      } : undefined}>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${color}cc, ${color}66)`, border: `1px solid ${color}40` }}>
            {getModelShortName(model.modelId)[0]}
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {model.displayName}
            </div>
            <div className="text-xs truncate max-w-36" style={{ color: 'var(--text-muted)' }}>
              {model.modelId}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isFavorite && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
              Favorite
            </span>
          )}
          {onClick && (
            <span className="text-xs" style={{ color: `${color}80` }}>→ sessions</span>
          )}
        </div>
      </div>

      <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {formatUSD(model.costUSD)}
      </div>

      {/* Token breakdown bar */}
      <div>
        <div className="flex rounded-full overflow-hidden h-2 mb-2">
          {bars.map((b) => (
            <div
              key={b.label}
              style={{ width: `${total > 0 ? (b.value / total) * 100 : 0}%`, background: b.color }}
              title={`${b.label}: ${formatTokens(b.value)}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {bars.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: b.color }} />
              <span>{b.label}: <span className="text-white">{formatTokens(b.value)}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-center">
          <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{model.sessionCount}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>sessions</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-semibold" style={{ color: 'var(--accent-green)' }}>{cacheHitRate}%</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>cache hit</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{formatUSD(costPerMsg, 4)}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>per msg</div>
        </div>
      </div>
    </div>
  );
}
