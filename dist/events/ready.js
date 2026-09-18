import { Events, ActivityType } from 'discord.js';
import { Logger } from '../utils/logger.js';
import { initBrandAssets } from '../utils/embeds.js';
import { rehydrateScheduler } from '../utils/scheduler.js';
// ─── Rotating status messages ─────────────────────────────────
const STATUSES = [
    { text: 'Reyex Hub | /help', type: ActivityType.Watching },
    { text: '/verify to get scripts', type: ActivityType.Listening },
    { text: 'Roblox scripts 🎮', type: ActivityType.Playing },
    { text: '/games for scripts', type: ActivityType.Watching },
    { text: 'executor statuses 👀', type: ActivityType.Watching },
];
let statusIndex = 0;
function rotateStatus(client) {
    const s = STATUSES[statusIndex % STATUSES.length];
    client.user?.setActivity(s.text, { type: s.type });
    statusIndex++;
}
// ─── Ready event ─────────────────────────────────────────────
export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // ── Brand assets (bot avatar for embeds) ──
        await initBrandAssets(client);
        // ── Status ──
        const customActivity = process.env.BOT_ACTIVITY;
        if (customActivity) {
            client.user?.setActivity(customActivity, { type: ActivityType.Watching });
        }
        else {
            rotateStatus(client);
            setInterval(() => rotateStatus(client), 3 * 60 * 1_000).unref();
        }
        // ── Rehydrate scheduled timers (polls / giveaways) ──
        await rehydrateScheduler(client);
        // ── Startup banner ──
        const guildCount = client.guilds.cache.size;
        const memberCount = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
        Logger.banner(`${client.user?.tag ?? 'Reyex Hub BOT'} is online`, {
            'Guilds': guildCount,
            'Members': memberCount,
            'Commands': client.commands?.size ?? 0,
            'Online since': (client.startedAt ?? new Date()).toISOString(),
        });
    },
};
//# sourceMappingURL=ready.js.map