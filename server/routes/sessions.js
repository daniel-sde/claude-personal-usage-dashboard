const express = require('express');
const router = express.Router();
const { scanAllProjects } = require('../parser/projectScanner');
const cache = require('../cache/memoryCache');

// GET /api/sessions - paginated, filtered, sorted list
router.get('/', async (req, res) => {
  try {
    const {
      sort = 'date',
      order = 'desc',
      project = '',
      model = '',
      page = '1',
      pageSize = '20',
      startDate = '',
      endDate = '',
      minCost = '',
    } = req.query;

    const baseCacheKey = `sessions:${sort}:${order}:${project}:${model}`;
    let sessions = cache.get(baseCacheKey);

    if (!sessions) {
      const all = await scanAllProjects();
      sessions = all.map((s) => ({
        sessionId: s.sessionId,
        projectPath: s.projectPath,
        projectName: s.projectName,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        durationMs: s.durationMs,
        messageCount: s.messageCount,
        toolCallCount: s.toolCallCount,
        models: s.models,
        inputTokens: s.inputTokens,
        outputTokens: s.outputTokens,
        cacheReadInputTokens: s.cacheReadInputTokens,
        cacheCreationInputTokens: s.cacheCreationInputTokens,
        totalTokens: s.totalTokens,
        costUSD: s.costUSD,
        isSubagent: s.isSubagent,
      }));

      if (project) {
        sessions = sessions.filter((s) =>
          (s.projectName || '').toLowerCase().includes(project.toLowerCase()) ||
          (s.projectPath || '').toLowerCase().includes(project.toLowerCase())
        );
      }
      if (model) {
        sessions = sessions.filter((s) =>
          s.models.some((m) => m.toLowerCase().includes(model.toLowerCase()))
        );
      }

      const sortFn = {
        cost: (a, b) => b.costUSD - a.costUSD,
        duration: (a, b) => b.durationMs - a.durationMs,
        messages: (a, b) => b.messageCount - a.messageCount,
        tokens: (a, b) => b.totalTokens - a.totalTokens,
        date: (a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0),
      };
      const fn = sortFn[sort] || sortFn.date;
      sessions.sort(order === 'asc' ? (a, b) => -fn(a, b) : fn);

      cache.set(baseCacheKey, sessions, 30_000);
    }

    let filtered = sessions;
    if (startDate) {
      filtered = filtered.filter((s) => s.startedAt && s.startedAt.slice(0, 10) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((s) => s.startedAt && s.startedAt.slice(0, 10) <= endDate);
    }
    if (minCost) {
      const min = parseFloat(minCost);
      if (!isNaN(min)) filtered = filtered.filter((s) => s.costUSD >= min);
    }

    const filteredStats = {
      costUSD: filtered.reduce((s, x) => s + x.costUSD, 0),
      totalTokens: filtered.reduce((s, x) => s + x.totalTokens, 0),
    };

    const p = Math.max(1, parseInt(page, 10));
    const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const total = filtered.length;
    const paginated = filtered.slice((p - 1) * ps, p * ps);

    res.json({ total, page: p, pageSize: ps, sessions: paginated, filteredStats });
  } catch (err) {
    console.error('sessions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id - full session with per-message records
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `session_detail:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const sessions = await scanAllProjects();
    const session = sessions.find((s) => s.sessionId === id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const records = (session.records || []).map((r) => ({
      timestamp: r.timestamp,
      model: r.model,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cacheReadInputTokens: r.cacheReadInputTokens,
      cacheCreationInputTokens: r.cacheCreationInputTokens,
      costUSD: r.costUSD,
      toolCallCount: r.toolCallCount || 0,
    }));

    const result = { sessionId: session.sessionId, projectName: session.projectName, records };
    cache.set(cacheKey, result, 60_000);
    res.json(result);
  } catch (err) {
    console.error('session detail error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
