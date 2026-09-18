# Reyex Hub BOT

A feature-rich Discord bot for the Reyex Hub Roblox script community — Roblox account verification, script distribution, live executor tracking, giveaways, polls, and moderation tools.

---

## Features

| Category | Commands |
|----------|----------|
| **Verification** | `/verify start` `/verify confirm` `/verify status` |
| **Scripts** | `/getscript` `/games` |
| **Community** | `/poll create/end/list` `/giveaway start/end/list/reroll` `/executors` |
| **Profile** | `/profile` `/help` |
| **Moderation** | `/ban` `/unban` `/kick` `/timeout` `/warn` `/warnings` `/purge` `/nick` `/grole` |
| **Admin** | `/addgame` `/removegame` `/updategame` `/whitelist` `/unwhitelist` `/stats` `/broadcast` `/lookup` |

### Highlights

- 🔐 **Roblox verification** — generates a random per-session code, user pastes it in their Roblox About section, bot confirms automatically
- 🎮 **Script hub** — verified members can retrieve loadstrings for any active game
- ⚙️ **Live executor tracker** — real-time status from [WhatExpsAre.Online](https://whatexpsare.online) with platform filters and auto-refresh
- 🎉 **Giveaways** — entry/leave buttons, auto-end timer, winner DM, reroll support
- 🗳️ **Polls** — proportional vote bars, optional auto-end timer, rehydrated on restart
- 📊 **Stats** — progress bar charts, uptime, active polls/giveaways
- 📢 **Broadcast** — DM all verified members with delivery/fail counts
- 👋 **Welcome/Leave** — rich embed on join with verify & browse buttons; configurable departure log channel
- ♻️ **Scheduler rehydration** — polls and giveaways resume their auto-end timers after a bot restart

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org) 18 or later
- A MongoDB instance (local or [Atlas](https://www.mongodb.com/atlas))
- A Discord bot application ([Discord Developer Portal](https://discord.com/developers/applications))

### 1 — Clone and install

```bash
git clone <your-repo-url>
cd reyex-hub-bot
npm install
```

### 2 — Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in all required values (see table below).

### 3 — Deploy slash commands

```bash
npm run deploy-commands
```

Set `GUILD_ID` in `.env` for instant guild-scoped updates during development. Remove it (or leave it empty) for global commands in production.

### 4 — Start the bot

```bash
# Development (ts-node, hot-ish restart)
npm run dev

# Production (compile first, then run)
npm run build
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ | Bot token from the Discord Developer Portal |
| `CLIENT_ID` | ✅ | Application (client) ID |
| `GUILD_ID` | Dev only | Guild ID for guild-scoped commands (faster updates) |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `VERIFIED_ROLE_ID` | ✅ | Role granted on successful Roblox verification |
| `STAFF_ROLE_ID` | ✅ | Role that grants access to moderation commands |
| `ADMIN_ROLE_ID` | ✅ | Role for admin-only commands (can match STAFF) |
| `OWNER_ROLE_ID` | | Highest-trust role; falls back to `STAFF_ROLE_ID` |
| `WELCOME_CHANNEL_ID` | | Channel for welcome messages; falls back to system channel |
| `LEAVE_CHANNEL_ID` | | Channel for departure logs; disabled if not set |
| `BOT_ACTIVITY` | | Fixed activity string; leave empty for rotating messages |
| `NODE_ENV` | | Set to `development` for debug logs and stack traces |

---

## Project Structure

```
src/
├── commands/
│   ├── admin/          # Administrator commands
│   └── user/           # Member-facing commands
├── events/             # Discord gateway events
├── handlers/           # Command & event auto-loaders
├── models/             # Mongoose schemas
└── utils/
    ├── database.ts     # MongoDB connect/disconnect
    ├── embeds.ts       # All embed factories + brand palette
    ├── executors.ts    # WhatExpsAre.Online API client
    ├── logger.ts       # Coloured structured logger
    ├── permissions.ts  # Role-based permission helpers
    ├── roblox.ts       # Roblox API client + verification codes
    ├── scheduler.ts    # Poll/giveaway auto-end timers
    └── types.ts        # Shared TypeScript interfaces
```

---

## Contributing

1. Fork the repo and create a feature branch
2. Run `npm run dev` and test your changes
3. Ensure `npm run build` succeeds with no TypeScript errors
4. Open a pull request with a clear description

---

## License

ISC
