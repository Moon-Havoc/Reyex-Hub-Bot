import { Events, ActivityType } from 'discord.js';
import { Logger } from '../utils/logger.js';
import { initBrandAssets } from '../utils/embeds.js';
export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        Logger.info(`✅ Logged in as ${client.user.tag}`);
        Logger.info(`📊 Serving ${client.guilds.cache.size} guild(s)`);
        // Initialize brand assets with bot avatar
        await initBrandAssets(client);
        // Set bot activity
        const activity = process.env.BOT_ACTIVITY || 'Reyex Hub | /help';
        client.user.setActivity(activity, { type: ActivityType.Watching });
        Logger.info(`🎯 Activity: ${activity}`);
    },
};
//# sourceMappingURL=ready.js.map