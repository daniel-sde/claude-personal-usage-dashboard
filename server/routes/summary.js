const express = require('express');
const router = express.Router();
const { scanAllProjects } = require('../parser/projectScanner');
const { getPricing } = require('../config');
const cache = require('../cache/memoryCache');

router.get('/', async (req, res) => {
  try {
    const cached = cache.get('summary');
    if (cached) return res.json(cached);

    const sessions = await scanAllProjects();
    const byModel = {};
    let totalCostUSD = 0;
    let totalTokens = 0;
    let totalMessages = 0;
    let totalToolCalls = 0;
    let firstSessionDate = null;
    let lastActivityDate = null;

    for (const s of sessions) {
      totalCostUSD += s.costUSD;
      totalTokens += s.totalTokens;
      totalMessages += s.messageCount;
      totalToolCalls += s.toolCallCount;

      if (!firstSessionDate || new Date(s.startedAt) < new Date(firstSessionDate)) {
        firstSessionDate = s.startedAt;
      }
      if (!lastActivityDate || new Date(s.endedAt) > new Date(lastActivityDate)) {
        lastActivityDate = s.endedAt;
      }

      for (const modelId of s.models) {
        if (!byModel[modelId]) {
          byModel[modelId] = {
            inputTokens: 0, outputTokens: 0,
            cacheReadInputTokens: 0, cacheCreationInputTokens: 0,
            costUSD: 0, sessionCount: 0, messageCount: 0,
          };
        }
        const m = byModel[modelId];
        m.sessionCount += 1;
        m.messageCount += s.messageCount;
      }
    }

    // Accumulate per-model token/cost from individual records + cache savings
    let cacheSavingsUSD = 0;
    let totalCacheReadRaw = 0;
    let totalInputRaw = 0;

    for (const s of sessions) {
      for (const r of s.records || []) {
        if (!r.model) continue;
        if (!byModel[r.model]) byModel[r.model] = {
          inputTokens: 0, outputTokens: 0,
          cacheReadInputTokens: 0, cacheCreationInputTokens: 0,
          costUSD: 0, sessionCount: 0, messageCount: 0,
        };
        const m = byModel[r.model];
        m.inputTokens += r.inputTokens;
        m.outputTokens += r.outputTokens;
        m.cacheReadInputTokens += r.cacheReadInputTokens;
        m.cacheCreationInputTokens += r.cacheCreationInputTokens;
        m.costUSD += r.costUSD;
        m.messageCount += 1;

        const p = getPricing(r.model);
        cacheSavingsUSD += (r.cacheReadInputTokens || 0) * (p.input - p.cacheRead) / 1_000_000;
        totalCacheReadRaw += r.cacheReadInputTokens || 0;
        totalInputRaw += r.inputTokens || 0;
      }
    }

    const cacheHitRate = (totalInputRaw + totalCacheReadRaw) > 0
      ? (totalCacheReadRaw / (totalInputRaw + totalCacheReadRaw)) * 100
      : 0;

    // Remove synthetic/internal models
    for (const id of Object.keys(byModel)) {
      if (id.startsWith('<') || !id) delete byModel[id];
    }

    // Deduplicate session counts per model
    const modelSessionCounts = {};
    for (const s of sessions) {
      for (const m of s.models) {
        modelSessionCounts[m] = (modelSessionCounts[m] || 0) + 1;
      }
    }
    for (const [modelId, count] of Object.entries(modelSessionCounts)) {
      if (byModel[modelId]) byModel[modelId].sessionCount = count;
    }

    const favoriteModel = Object.entries(byModel).sort(
      (a, b) => b[1].costUSD - a[1].costUSD
    )[0];

    const result = {
      totalCostUSD,
      totalTokens,
      totalSessions: sessions.length,
      totalMessages,
      totalToolCalls,
      cacheSavingsUSD,
      cacheHitRate,
      firstSessionDate,
      lastActivityDate,
      favoriteModel: favoriteModel
        ? { modelId: favoriteModel[0], ...favoriteModel[1] }
        : null,
      byModel,
    };

    cache.set('summary', result, 30_000);
    res.json(result);
  } catch (err) {
    console.error('summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
