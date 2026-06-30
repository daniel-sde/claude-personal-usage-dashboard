const fs = require('fs');
const readline = require('readline');
const { computeCost } = require('../config');

async function parseJsonlFile(filePath, sinceOffset = 0) {
  const records = [];
  let cwdFromFirstUser = null;
  let sessionIdFromFile = null;

  return new Promise((resolve) => {
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      return resolve({ records, bytesRead: 0, cwdFromFirstUser, sessionIdFromFile });
    }

    if (stat.size <= sinceOffset) {
      return resolve({ records, bytesRead: 0, cwdFromFirstUser, sessionIdFromFile });
    }

    const stream = fs.createReadStream(filePath, {
      start: sinceOffset,
      encoding: 'utf8',
    });

    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    rl.on('line', (line) => {
      if (!line.trim()) return;
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        return;
      }

      if (obj.type === 'user' && !cwdFromFirstUser && obj.cwd) {
        cwdFromFirstUser = obj.cwd;
      }

      if (obj.type === 'assistant' && obj.message && obj.message.usage) {
        const msg = obj.message;
        const usage = msg.usage;
        const modelId = msg.model || '';
        if (!sessionIdFromFile && msg.sessionId) sessionIdFromFile = msg.sessionId;

        const toolCallCount = Array.isArray(msg.content)
          ? msg.content.filter((c) => c.type === 'tool_use').length
          : 0;

        records.push({
          sessionId: msg.sessionId || obj.sessionId || null,
          timestamp: msg.timestamp || obj.timestamp || null,
          model: modelId,
          inputTokens: usage.input_tokens || 0,
          outputTokens: usage.output_tokens || 0,
          cacheReadInputTokens: usage.cache_read_input_tokens || 0,
          cacheCreationInputTokens: usage.cache_creation_input_tokens || 0,
          costUSD: computeCost(usage, modelId),
          toolCallCount,
        });
      }
    });

    rl.on('close', () => {
      resolve({ records, bytesRead: stat.size - sinceOffset, cwdFromFirstUser, sessionIdFromFile });
    });

    rl.on('error', () => {
      resolve({ records, bytesRead: 0, cwdFromFirstUser, sessionIdFromFile });
    });
  });
}

module.exports = { parseJsonlFile };
