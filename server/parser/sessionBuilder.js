const fs = require('fs');
const path = require('path');
const { parseJsonlFile } = require('./jsonlParser');

async function buildSession(jsonlPath, projectDirPath) {
  const { records, cwdFromFirstUser, sessionIdFromFile } = await parseJsonlFile(jsonlPath);

  const sessionId = sessionIdFromFile || path.basename(jsonlPath, '.jsonl');
  const isSubagent = jsonlPath.includes(path.sep + 'subagents' + path.sep) ||
                     jsonlPath.includes('/subagents/');

  // Merge subagent records if a companion UUID-subdirectory exists
  let allRecords = [...records];
  const uuidDir = path.join(projectDirPath, sessionId);
  const subagentsDir = path.join(uuidDir, 'subagents');
  if (!isSubagent && fs.existsSync(subagentsDir)) {
    const subFiles = fs.readdirSync(subagentsDir).filter((f) => f.endsWith('.jsonl'));
    for (const sf of subFiles) {
      const { records: subRecords } = await parseJsonlFile(path.join(subagentsDir, sf));
      allRecords = allRecords.concat(subRecords);
    }
  }

  if (allRecords.length === 0 && isSubagent) return null;

  const sorted = allRecords
    .filter((r) => r.timestamp)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const startedAt = sorted.length > 0 ? sorted[0].timestamp : null;
  const endedAt = sorted.length > 0 ? sorted[sorted.length - 1].timestamp : null;
  const durationMs =
    startedAt && endedAt ? new Date(endedAt) - new Date(startedAt) : 0;

  const totals = allRecords.reduce(
    (acc, r) => {
      acc.inputTokens += r.inputTokens;
      acc.outputTokens += r.outputTokens;
      acc.cacheReadInputTokens += r.cacheReadInputTokens;
      acc.cacheCreationInputTokens += r.cacheCreationInputTokens;
      acc.costUSD += r.costUSD;
      acc.toolCallCount += r.toolCallCount;
      return acc;
    },
    { inputTokens: 0, outputTokens: 0, cacheReadInputTokens: 0, cacheCreationInputTokens: 0, costUSD: 0, toolCallCount: 0 }
  );

  const models = [...new Set(allRecords.map((r) => r.model).filter(Boolean))];
  const projectPath = cwdFromFirstUser || null;
  const projectName = projectPath
    ? projectPath.split(/[/\\]/).filter(Boolean).pop() || projectPath
    : path.basename(projectDirPath);

  return {
    sessionId,
    projectPath,
    projectName,
    startedAt,
    endedAt,
    durationMs,
    messageCount: allRecords.length,
    toolCallCount: totals.toolCallCount,
    models,
    inputTokens: totals.inputTokens,
    outputTokens: totals.outputTokens,
    cacheReadInputTokens: totals.cacheReadInputTokens,
    cacheCreationInputTokens: totals.cacheCreationInputTokens,
    totalTokens: totals.inputTokens + totals.outputTokens + totals.cacheReadInputTokens + totals.cacheCreationInputTokens,
    costUSD: totals.costUSD,
    isSubagent,
    records: allRecords,
  };
}

module.exports = { buildSession };
