import { REST, Routes } from 'discord.js';
import { Logger } from '../utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFolders = fs.readdirSync(commandsPath);
    for (const folder of commandFolders) {
        const commandsPathInFolder = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(commandsPathInFolder).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts') && !file.endsWith('.map'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPathInFolder, file);
            const command = await import(filePath);
            if ('data' in command.default && 'execute' in command.default) {
                client.commands.set(command.default.data.name, command.default);
                Logger.info(`Loaded command: ${command.default.data.name}`);
            }
            else {
                Logger.warn(`Command at ${filePath} is missing required "data" or "execute" property.`);
            }
        }
    }
}
export async function deployCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    const commandFolders = fs.readdirSync(commandsPath);
    for (const folder of commandFolders) {
        const commandsPathInFolder = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(commandsPathInFolder).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts') && !file.endsWith('.map'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPathInFolder, file);
            const command = await import(filePath);
            if ('data' in command.default) {
                commands.push(command.default.data.toJSON());
            }
        }
    }
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    try {
        Logger.info(`Started refreshing ${commands.length} application (/) commands.`);
        const guildId = process.env.GUILD_ID;
        const clientId = process.env.CLIENT_ID;
        if (guildId) {
            // Guild commands for faster updates during development
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
            Logger.info(`Successfully reloaded ${commands.length} guild application (/) commands.`);
        }
        else {
            // Global commands
            await rest.put(Routes.applicationCommands(clientId), { body: commands });
            Logger.info(`Successfully reloaded ${commands.length} global application (/) commands.`);
        }
    }
    catch (error) {
        Logger.error('Error deploying commands:', error);
    }
}
//# sourceMappingURL=commandHandler.js.map