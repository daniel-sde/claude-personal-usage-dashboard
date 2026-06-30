const express = require('express');
const router = express.Router();
const { scanAllProjects } = require('../parser/projectScanner');
const cache = require('../cache/memoryCache');

function bucketKey(isoTimestamp, granularity) {
  if (!isoTimestamp) return null;
  const d = isoTimestamp.slice(0, 10);
  if (granularity === 'month') return d.slice(0, 7);
  return d;
}

router.get('/', async (req, res) => {
  try {
    const granularity = req.query.granularity === 'month' ? 'month' : 'day';
    const cacheKey = `daily:${granularity}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const sessions = await scanAllProjects();
    const buckets = new Map();

    for (const s of sessions) {
      for (const r of s.records || []) {
        const key = bucketKey(r.timestamp, granularity);
        if (!key) continue;

        if (!buckets.has(key)) {
          buckets.set(key, {
            date: key,
            messageCount: 0,
            sessionCount: 0,
            toolCallCount: 0,
            totalTokens: 0,
            costUSD: 0,
            byModel: {},
          });
        }

        const b = buckets.get(key);
        b.messageCount += 1;
        b.toolCallCount += r.toolCallCount;
        const t = r.inputTokens + r.outputTokens + r.cacheReadInputTokens + r.cacheCreationInputTokens;
        b.totalTokens += t;
        b.costUSD += r.costUSD;

        if (r.model) {
          if (!b.byModel[r.model]) {
            b.byModel[r.model] = {
              inputTokens: 0, outputTokens: 0,
              cacheReadInputTokens: 0, cacheCreationInputTokens: 0,
              tokens: 0, costUSD: 0,
            };
          }
          const m = b.byModel[r.model];
          m.inputTokens += r.inputTokens;
          m.outputTokens += r.outputTokens;
          m.cacheReadInputTokens += r.cacheReadInputTokens;
          m.cacheCreationInputTokens += r.cacheCreationInputTokens;
          m.tokens += t;
          m.costUSD += r.costUSD;
        }
      }

      // Count unique sessions per day
      const sessionBucket = bucketKey(s.startedAt, granularity);
      if (sessionBucket && buckets.has(sessionBucket)) {
        buckets.get(sessionBucket).sessionCount += 1;
      }
    }

    const data = Array.from(buckets.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const result = { granularity, data };
    cache.set(cacheKey, result, 30_000);
    res.json(result);
  } catch (err) {
    console.error('daily error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
