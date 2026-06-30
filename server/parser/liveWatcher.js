const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { PROJECTS_DIR } = require('../config');
const { parseJsonlFile } = require('./jsonlParser');
const cache = require('../cache/memoryCache');

const fileState = new Map();
const subscribers = new Set();
// ring buffer: Map<"YYYY-MM-DDTHH:MM" → { tokens, costUSD, model }>
const minuteBuffer = new Map();
let activeSession = null;

function pruneOldMinutes() {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [key, _] of minuteBuffer) {
    if (new Date(key + ':00Z').getTime() < cutoff) minuteBuffer.delete(key);
  }
}

function getMinuteKey(isoTimestamp) {
  return isoTimestamp ? isoTimestamp.slice(0, 16) : null;
}

function buildTickPayload() {
  pruneOldMinutes();
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const minuteActivity = Array.from(minuteBuffer.entries())
    .map(([minute, data]) => ({ minute, ...data }))
    .sort((a, b) => a.minute.localeCompare(b.minute));
  return {
    timestamp: new Date().toISOString(),
    minuteActivity,
    windowStart,
    activeSession,
  };
}

function broadcast(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of subscribers) {
    try {
      res.write(payload);
    } catch {
      subscribers.delete(res);
    }
  }
}

function addSubscriber(res) {
  subscribers.add(res);
  // Send current state immediately
  res.write(`event: tick\ndata: ${JSON.stringify(buildTickPayload())}\n\n`);
}

function removeSubscriber(res) {
  subscribers.delete(res);
}

async function processFileChange(filePath) {
  const state = fileState.get(filePath) || { lastOffset: 0 };
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return;
  }

  if (stat.size <= state.lastOffset) return;

  const { records, sessionIdFromFile } = await parseJsonlFile(filePath, state.lastOffset);
  fileState.set(filePath, { lastOffset: stat.size });

  if (records.length === 0) return;

  // Update minute ring buffer
  for (const r of records) {
    const key = getMinuteKey(r.timestamp);
    if (!key) continue;
    const existing = minuteBuffer.get(key) || { tokens: 0, costUSD: 0, model: r.model };
    existing.tokens += r.inputTokens + r.outputTokens + r.cacheReadInputTokens + r.cacheCreationInputTokens;
    existing.costUSD += r.costUSD;
    minuteBuffer.set(key, existing);
  }

  if (sessionIdFromFile) {
    const dirName = path.basename(path.dirname(filePath));
    activeSession = {
      sessionId: sessionIdFromFile,
      projectName: dirName,
    };
  }

  // Invalidate data caches so next REST call is fresh
  cache.invalidate('summary');
  cache.invalidate('daily');
  cache.invalidate('sessions');
  cache.invalidate('models');
  cache.invalidate('hourly');

  broadcast('tick', buildTickPayload());
}

function startWatcher() {
  const watcher = chokidar.watch(PROJECTS_DIR, {
    depth: 3,
    usePolling: false,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    ignoreInitial: true,
  });

  watcher.on('add', (filePath) => {
    if (!filePath.endsWith('.jsonl')) return;
    fileState.set(filePath, { lastOffset: 0 });
    broadcast('session_start', { filePath, startedAt: new Date().toISOString() });
  });

  watcher.on('change', (filePath) => {
    if (!filePath.endsWith('.jsonl')) return;
    processFileChange(filePath);
  });

  return watcher;
}

function getRecentActivity(minutes = 60) {
  pruneOldMinutes();
  const windowStart = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const minuteActivity = Array.from(minuteBuffer.entries())
    .map(([minute, data]) => ({ minute, ...data }))
    .sort((a, b) => a.minute.localeCompare(b.minute));
  return { minuteActivity, windowStart, activeSession };
}

module.exports = { startWatcher, addSubscriber, removeSubscriber, getRecentActivity };
