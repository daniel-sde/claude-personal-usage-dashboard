# Claude Usage Dashboard

A personal analytics dashboard for your local [Claude Code](https://claude.ai/code) usage. Reads JSONL transcript files directly from `~/.claude/projects/` — no Anthropic API key required.

![Overview](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Express-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

| Page | What it shows |
|---|---|
| **Overview** | Total cost, tokens, sessions, cache savings KPI cards · token usage chart (7D/30D/90D/All) · model breakdown (click to filter) |
| **Sessions** | Sortable, filterable table with date range + min-cost filters · per-message token bar chart in modal · cache hit rate & cost/msg |
| **Models** | Per-model cost, cache hit %, cost/message · clickable cards navigate to filtered sessions |
| **Heatmap** | Hour-of-day and day-of-week activity grids |
| **Live** | Real-time SSE token burn chart · burn rate · per-model breakdown · session start/end toasts |

## Prerequisites

- **Node.js 18+** — [download](https://nodejs.org)
- **Claude Code** installed and actively used — this dashboard reads the local JSONL transcripts it generates

## Quick Start

```bash
# 1. Clone
git clone https://github.com/daniel-sde/claude-personal-usage-dashboard.git
cd claude-personal-usage-dashboard

# 2. Install all dependencies (root + server + client)
npm run install:all

# 3. Start development servers
npm run dev
```

Open **http://localhost:5173** in your browser.

> The Express API server runs on `:3001` and the Vite dev server proxies `/api` to it automatically.

## How It Works

Claude Code writes every session to:
```
~/.claude/projects/<encoded-path>/<session-id>.jsonl
```

The Express server scans all these files, parses token usage from `message.usage` fields, and computes costs from a local pricing table in [`server/config.js`](server/config.js). No data ever leaves your machine.

## Cost Accuracy

Costs are computed from raw token counts × the rates in `server/config.js`:

| Model | Input | Output | Cache Read | Cache Write |
|---|---|---|---|---|
| claude-opus-4 | $15/M | $75/M | $1.50/M | $18.75/M |
| claude-sonnet-4 | $3/M | $15/M | $0.30/M | $3.75/M |
| claude-haiku-4 | $0.80/M | $4/M | $0.08/M | $1.00/M |

Update `server/config.js` if Anthropic changes pricing.

## Tech Stack

- **Frontend**: React 19, Vite 8, TailwindCSS 3, Recharts, React Router 7
- **Backend**: Express 5, chokidar (file watcher), SSE for live updates
- **Data**: Local JSONL files only — no database, no external API

## Project Structure

```
├── server/
│   ├── config.js           # Pricing constants & cost helpers
│   ├── index.js            # Express app entry point (port 3001)
│   ├── parser/
│   │   ├── jsonlParser.js      # Streams JSONL → MessageRecord[]
│   │   ├── sessionBuilder.js   # Aggregates records into SessionRecord
│   │   ├── projectScanner.js   # Walks ~/.claude/projects/
│   │   └── liveWatcher.js      # chokidar + SSE broadcast
│   ├── routes/             # API endpoints
│   └── cache/
│       └── memoryCache.js  # 30s TTL in-memory cache
└── client/
    └── src/
        ├── pages/          # Overview, Sessions, Models, Heatmap, Live
        ├── components/     # Cards, charts, tables, layout
        ├── hooks/          # useApi, useSSE
        └── utils/          # formatters, colors
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/summary` | Lifetime totals, cache savings, favorite model |
| `GET /api/daily?granularity=day\|month` | Tokens + cost per day/month |
| `GET /api/sessions` | Paginated list with sort, filter, date range, min-cost |
| `GET /api/sessions/:id` | Per-message token records for a single session |
| `GET /api/models` | Per-model stats + 30-day daily trend |
| `GET /api/hourly` | Hour-of-day and day-of-week message distribution |
| `GET /api/live/stream` | SSE stream: `tick`, `session_start`, `session_end` |

## License

MIT
