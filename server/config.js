const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');

const PRICING = {
  'claude-opus-4':   { input: 15,   output: 75,  cacheRead: 1.50, cacheWrite: 18.75 },
  'claude-sonnet-4': { input: 3,    output: 15,  cacheRead: 0.30, cacheWrite: 3.75  },
  'claude-haiku-4':  { input: 0.80, output: 4,   cacheRead: 0.08, cacheWrite: 1.00  },
};

function getPricing(modelId) {
  if (!modelId) return PRICING['claude-sonnet-4'];
  for (const [prefix, rates] of Object.entries(PRICING)) {
    if (modelId.toLowerCase().startsWith(prefix)) return rates;
  }
  return PRICING['claude-sonnet-4'];
}

function computeCost(usage, modelId) {
  const r = getPricing(modelId);
  return (
    ((usage.input_tokens || 0) * r.input +
     (usage.output_tokens || 0) * r.output +
     (usage.cache_read_input_tokens || 0) * r.cacheRead +
     (usage.cache_creation_input_tokens || 0) * r.cacheWrite) / 1_000_000
  );
}

function getModelDisplayName(modelId) {
  if (!modelId) return 'Unknown';
  if (modelId.includes('opus')) return 'Claude Opus';
  if (modelId.includes('sonnet')) return 'Claude Sonnet';
  if (modelId.includes('haiku')) return 'Claude Haiku';
  return modelId;
}

module.exports = { CLAUDE_DIR, PROJECTS_DIR, PRICING, getPricing, computeCost, getModelDisplayName };
