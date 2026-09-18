import 'dotenv/config';
import { Collection } from 'discord.js';
import type { Command } from './utils/types.js';
declare module 'discord.js' {
    interface Client {
        commands: Collection<string, Command>;
        startedAt: Date;
    }
}
//# sourceMappingURL=index.d.ts.map