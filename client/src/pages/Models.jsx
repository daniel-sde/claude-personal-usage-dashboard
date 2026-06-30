import { useNavigate } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import ModelCard from '../components/cards/ModelCard';
import CostByModelChart from '../components/charts/CostByModelChart';
import { useApi } from '../hooks/useApi';
import { formatUSD } from '../utils/formatters';
import { getModelColor } from '../utils/colors';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

function SparkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-2 text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatUSD(payload[0].value)}</div>
    </div>
  );
}

function getModelFamily(modelId) {
  if (!modelId) return '';
  if (modelId.includes('opus')) return 'opus';
  if (modelId.includes('sonnet')) return 'sonnet';
  if (modelId.includes('haiku')) return 'haiku';
  return modelId;
}

export default function Models() {
  const navigate = useNavigate();
  const { data, loading, lastUpdated } = useApi('/api/models', { refreshInterval: 60_000 });
  const models = data?.models || [];
  const favoriteModelId = models[0]?.modelId;

  function handleModelClick(modelId) {
    navigate(`/sessions?model=${encodeURIComponent(getModelFamily(modelId))}`);
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Models" lastUpdated={lastUpdated} />
      <div className="flex-1 p-6 space-y-6 overflow-auto">

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl h-56 animate-pulse"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : (
          <>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Click a model card to explore its sessions
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map((m) => (
                <ModelCard
                  key={m.modelId}
                  model={m}
                  isFavorite={m.modelId === favoriteModelId}
                  onClick={() => handleModelClick(m.modelId)}
                />
              ))}
            </div>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CostByModelChart models={models} />

          {models.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Daily Cost Trend</div>
              <div className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Last 30 days by model</div>

              {models.slice(0, 3).map((m) => (
                <div key={m.modelId} className="mb-4">
                  <div className="text-xs font-medium mb-1 flex items-center justify-between"
                    style={{ color: getModelColor(m.modelId) }}>
                    <span>{m.displayName}</span>
                    <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                      {m.dailyTrend?.length || 0} active days
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={50}>
                    <BarChart data={m.dailyTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Bar dataKey="costUSD" fill={getModelColor(m.modelId)} fillOpacity={0.7} radius={[1, 1, 0, 0]} />
                      <XAxis dataKey="date" hide />
                      <Tooltip content={<SparkTooltip />} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
