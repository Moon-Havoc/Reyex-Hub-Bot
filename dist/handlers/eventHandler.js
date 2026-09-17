import { Logger } from '../utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function loadEvents(client) {
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts') && !file.endsWith('.map'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = await import(filePath);
        if (event.default.once) {
            client.once(event.default.name, (...args) => event.default.execute(...args));
        }
        else {
            client.on(event.default.name, (...args) => event.default.execute(...args));
        }
        Logger.info(`Loaded event: ${event.default.name}`);
    }
}
//# sourceMappingURL=eventHandler.js.map