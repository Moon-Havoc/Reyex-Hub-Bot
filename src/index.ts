import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { connectDatabase } from './utils/database.js';
import { Logger } from './utils/logger.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';

// Extend Client interface to include commands
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, any>;
  }
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Create command collection
client.commands = new Collection();

// Load commands and events
async function startBot() {
  try {
    // Connect to database
    await connectDatabase();

    // Load commands
    await loadCommands(client);

    // Load events
    await loadEvents(client);

    // Login to Discord
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('DISCORD_TOKEN is not set in environment variables');
    }

    await client.login(token);
  } catch (error) {
    Logger.error('Error starting bot:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  Logger.info('Received SIGINT, shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('Received SIGTERM, shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

// Start the bot
startBot();
