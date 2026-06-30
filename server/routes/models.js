const express = require('express');
const router = express.Router();
const { scanAllProjects } = require('../parser/projectScanner');
const { getModelDisplayName } = require('../config');
const cache = require('../cache/memoryCache');

router.get('/', async (req, res) => {
  try {
    const cached = cache.get('models');
    if (cached) return res.json(cached);

    const sessions = await scanAllProjects();
    const modelMap = new Map();

    // 30-day daily trend
    const dailyByModel = new Map();
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const s of sessions) {
      for (const r of s.records || []) {
        const modelId = r.model;
        if (!modelId) continue;

        if (!modelMap.has(modelId)) {
          modelMap.set(modelId, {
            modelId,
            displayName: getModelDisplayName(modelId),
            inputTokens: 0, outputTokens: 0,
            cacheReadInputTokens: 0, cacheCreationInputTokens: 0,
            totalTokens: 0, costUSD: 0,
            sessionCount: 0, messageCount: 0,
          });
        }

        const m = modelMap.get(modelId);
        m.inputTokens += r.inputTokens;
        m.outputTokens += r.outputTokens;
        m.cacheReadInputTokens += r.cacheReadInputTokens;
        m.cacheCreationInputTokens += r.cacheCreationInputTokens;
        m.totalTokens += r.inputTokens + r.outputTokens + r.cacheReadInputTokens + r.cacheCreationInputTokens;
        m.costUSD += r.costUSD;
        m.messageCount += 1;

        // Daily trend
        if (r.timestamp && new Date(r.timestamp) >= cutoff) {
          const day = r.timestamp.slice(0, 10);
          const key = `${modelId}::${day}`;
          if (!dailyByModel.has(key)) dailyByModel.set(key, { date: day, costUSD: 0, tokens: 0 });
          const d = dailyByModel.get(key);
          d.costUSD += r.costUSD;
          d.tokens += r.inputTokens + r.outputTokens + r.cacheReadInputTokens + r.cacheCreationInputTokens;
        }
      }
    }

    // Count sessions per model
    for (const s of sessions) {
      for (const m of s.models) {
        if (modelMap.has(m)) modelMap.get(m).sessionCount += 1;
      }
    }

    // Filter out synthetic/internal models
    for (const [id] of modelMap) {
      if (id.startsWith('<') || id.startsWith('unknown') || !id) modelMap.delete(id);
    }

    const models = Array.from(modelMap.values()).map((m) => {
      const trend = Array.from(dailyByModel.entries())
        .filter(([k]) => k.startsWith(m.modelId + '::'))
        .map(([, v]) => v)
        .sort((a, b) => a.date.localeCompare(b.date));
      return { ...m, dailyTrend: trend };
    }).sort((a, b) => b.costUSD - a.costUSD);

    const result = { models };
    cache.set('models', result, 30_000);
    res.json(result);
  } catch (err) {
    console.error('models error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
