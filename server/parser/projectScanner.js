const fs = require('fs');
const path = require('path');
const { PROJECTS_DIR } = require('../config');
const { buildSession } = require('./sessionBuilder');

async function scanAllProjects() {
  const sessions = [];

  let projectDirs;
  try {
    projectDirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  } catch {
    return sessions;
  }

  const tasks = [];

  for (const dirent of projectDirs) {
    if (!dirent.isDirectory()) continue;
    const projectDirPath = path.join(PROJECTS_DIR, dirent.name);

    let entries;
    try {
      entries = fs.readdirSync(projectDirPath, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      // Only process top-level JSONL files (not subagents subdir)
      if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        const jsonlPath = path.join(projectDirPath, entry.name);
        tasks.push(buildSession(jsonlPath, projectDirPath));
      }
    }
  }

  const results = await Promise.all(tasks);
  for (const session of results) {
    if (session) sessions.push(session);
  }

  return sessions;
}

module.exports = { scanAllProjects };
