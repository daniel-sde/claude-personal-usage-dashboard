import { useNavigate } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import KpiCard from '../components/cards/KpiCard';
import DailyTokensChart from '../components/charts/DailyTokensChart';
import TokenBreakdownChart from '../components/charts/TokenBreakdownChart';
import { useApi } from '../hooks/useApi';
import { formatUSD, formatTokens, formatNumber } from '../utils/formatters';
import { getModelShortName, getModelColor } from '../utils/colors';

const DollarIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10 1a.75.75 0 01.75.75v1.5h.25a3.5 3.5 0 010 7h-2a2 2 0 000 4h2.25v-1.5a.75.75 0 011.5 0V15a.75.75 0 01-.75.75H10a3.5 3.5 0 010-7h2a2 2 0 000-4H9.75V6.25A.75.75 0 0110 5.5v-3A.75.75 0 0110 1z" />
  </svg>
);
const TokenIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0-6a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
  </svg>
);
const SessionIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 015 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914z" />
  </svg>
);
const CacheIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M13.2 2.24a.75.75 0 00.04 1.06l2.1 1.95H6.75a.75.75 0 000 1.5h8.59l-2.1 1.95a.75.75 0 101.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 00-1.06.04zm-6.4 8a.75.75 0 00-1.06-.04l-3.5 3.25a.75.75 0 000 1.1l3.5 3.25a.75.75 0 101.02-1.1l-2.1-1.95h8.59a.75.75 0 000-1.5H4.66l2.1-1.95a.75.75 0 00.04-1.06z" clipRule="evenodd" />
  </svg>
);
const MsgIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.202 41.202 0 01-5.183.501.75.75 0 00-.528.224l-3.579 3.58A.75.75 0 016 17.25v-3.443c-.43-.048-.858-.101-1.287-.158C3.153 13.37 2 12.148 2 10.926V5.426c0-1.412.993-2.67 2.43-2.902z" clipRule="evenodd" />
  </svg>
);

function SkeletonCard() {
  return (
    <div className="rounded-xl p-5 h-28 animate-pulse"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
  );
}

function getModelFamily(modelId) {
  if (!modelId) return '';
  if (modelId.includes('opus')) return 'opus';
  if (modelId.includes('sonnet')) return 'sonnet';
  if (modelId.includes('haiku')) return 'haiku';
  return modelId;
}

export default function Overview() {
  const navigate = useNavigate();
  const { data, loading, lastUpdated } = useApi('/api/summary', { refreshInterval: 60_000 });

  const favModel = data?.favoriteModel;

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Overview" lastUpdated={lastUpdated} />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* KPI Cards — 5 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }, (_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <KpiCard
                label="Total Cost"
                value={formatUSD(data?.totalCostUSD)}
                subtext={`across ${data?.totalSessions} sessions`}
                icon={<DollarIcon />}
                accentColor="var(--accent-amber)"
              />
              <KpiCard
                label="Total Tokens"
                value={formatTokens(data?.totalTokens)}
                subtext="All token types combined"
                icon={<TokenIcon />}
                accentColor="var(--accent-blue)"
              />
              <KpiCard
                label="Sessions"
                value={formatNumber(data?.totalSessions)}
                subtext={`${formatNumber(data?.totalMessages)} msgs · ${formatNumber(data?.totalToolCalls)} tools`}
                icon={<SessionIcon />}
                accentColor="var(--accent-green)"
              />
              <KpiCard
                label="Cache Savings"
                value={formatUSD(data?.cacheSavingsUSD)}
                subtext={`${(data?.cacheHitRate || 0).toFixed(0)}% cache hit rate`}
                icon={<CacheIcon />}
                accentColor="var(--accent-purple)"
              />
              <KpiCard
                label="Fav Model"
                value={getModelShortName(favModel?.modelId || '')}
                subtext={favModel ? `${formatUSD(favModel.costUSD)} spent` : '—'}
                icon={<MsgIcon />}
                accentColor={getModelColor(favModel?.modelId || '')}
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <DailyTokensChart />
          </div>
          <div>
            <TokenBreakdownChart />
          </div>
        </div>

        {/* Model breakdown — clickable rows */}
        {!loading && data?.byModel && (
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Model Breakdown</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Click a model to filter sessions</div>
            </div>
            <div className="space-y-2">
              {Object.entries(data.byModel)
                .sort((a, b) => b[1].costUSD - a[1].costUSD)
                .map(([modelId, m]) => {
                  const total = data.totalCostUSD || 1;
                  const pct = (m.costUSD / total) * 100;
                  const color = getModelColor(modelId);
                  const family = getModelFamily(modelId);
                  return (
                    <div key={modelId}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate(`/sessions?model=${encodeURIComponent(family)}`)}>
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                        style={{ background: `${color}20`, color }}>
                        {getModelShortName(modelId)[0]}
                      </div>
                      <div className="w-20 text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {getModelShortName(modelId)}
                      </div>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <div className="w-16 text-xs text-right tabular-nums font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatUSD(m.costUSD)}
                      </div>
                      <div className="w-8 text-xs text-right" style={{ color: 'var(--text-muted)' }}>
                        {pct.toFixed(0)}%
                      </div>
                      <div className="text-xs" style={{ color: `${color}80` }}>→</div>
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
