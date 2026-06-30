const express = require('express');
const router = express.Router();
const { scanAllProjects } = require('../parser/projectScanner');
const cache = require('../cache/memoryCache');

router.get('/', async (req, res) => {
  try {
    const cached = cache.get('hourly');
    if (cached) return res.json(cached);

    const sessions = await scanAllProjects();
    const hourCounts = {};
    const dayCounts = {};
    for (let i = 0; i < 24; i++) hourCounts[String(i)] = 0;
    for (let i = 0; i < 7; i++) dayCounts[String(i)] = 0;

    let totalMessagesTracked = 0;

    for (const s of sessions) {
      for (const r of s.records || []) {
        if (!r.timestamp) continue;
        const d = new Date(r.timestamp);
        const hour = d.getUTCHours();
        const day = d.getUTCDay();
        hourCounts[String(hour)] = (hourCounts[String(hour)] || 0) + 1;
        dayCounts[String(day)] = (dayCounts[String(day)] || 0) + 1;
        totalMessagesTracked++;
      }
    }

    const peakHour = parseInt(
      Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0],
      10
    );

    const result = { hourCounts, dayCounts, peakHour, totalMessagesTracked };
    cache.set('hourly', result, 120_000);
    res.json(result);
  } catch (err) {
    console.error('hourly error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
