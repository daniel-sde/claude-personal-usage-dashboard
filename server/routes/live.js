const express = require('express');
const router = express.Router();
const { addSubscriber, removeSubscriber, getRecentActivity } = require('../parser/liveWatcher');

router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  addSubscriber(res);

  const keepalive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepalive);
    }
  }, 15_000);

  req.on('close', () => {
    clearInterval(keepalive);
    removeSubscriber(res);
  });
});

router.get('/recent', (req, res) => {
  try {
    const minutes = Math.min(360, Math.max(1, parseInt(req.query.minutes || '60', 10)));
    res.json(getRecentActivity(minutes));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
