import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { connectDatabase, disconnectDatabase } from './utils/database.js';
import { Logger } from './utils/logger.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
// ─── Client setup ─────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
client.commands = new Collection();
client.startedAt = new Date();
// ─── Boot sequence ────────────────────────────────────────────
async function startBot() {
    Logger.banner('Reyex Hub BOT', {
        'Node.js': process.version,
        'Environment': process.env.NODE_ENV ?? 'production',
    });
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
        Logger.error('DISCORD_TOKEN is not set in environment variables');
        process.exit(1);
    }
    try {
        await connectDatabase();
        await loadCommands(client);
        await loadEvents(client);
        await client.login(token);
    }
    catch (error) {
        Logger.error('Fatal error during bot startup', error);
        process.exit(1);
    }
}
// ─── Graceful shutdown ────────────────────────────────────────
async function shutdown(signal) {
    Logger.info(`Received ${signal} — shutting down…`);
    try {
        client.destroy();
        await disconnectDatabase();
        Logger.info('Shutdown complete');
    }
    catch (error) {
        Logger.error('Error during shutdown', error);
    }
    process.exit(0);
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
    Logger.error('Unhandled promise rejection', reason);
});
process.on('uncaughtException', (error) => {
    Logger.error('Uncaught exception', error);
    process.exit(1);
});
// ─── Go ───────────────────────────────────────────────────────
startBot();
//# sourceMappingURL=index.js.map