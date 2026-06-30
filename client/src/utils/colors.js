export const MODEL_COLORS = {
  'claude-opus': '#a78bfa',
  'claude-sonnet': '#4f8ef7',
  'claude-haiku': '#34d399',
  'default': '#6b7280',
};

export const TOKEN_COLORS = {
  input: '#4f8ef7',
  output: '#34d399',
  cacheRead: '#fbbf24',
  cacheWrite: '#a78bfa',
};

export function getModelColor(modelId) {
  if (!modelId) return MODEL_COLORS.default;
  if (modelId.includes('opus')) return MODEL_COLORS['claude-opus'];
  if (modelId.includes('sonnet')) return MODEL_COLORS['claude-sonnet'];
  if (modelId.includes('haiku')) return MODEL_COLORS['claude-haiku'];
  return MODEL_COLORS.default;
}

export function getModelShortName(modelId) {
  if (!modelId) return 'Unknown';
  if (modelId.includes('opus')) return 'Opus';
  if (modelId.includes('sonnet')) return 'Sonnet';
  if (modelId.includes('haiku')) return 'Haiku';
  return modelId.split('-').slice(0, 2).join('-');
}

// Ordered list for charts
export const CHART_COLORS = ['#4f8ef7', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#06b6d4'];
