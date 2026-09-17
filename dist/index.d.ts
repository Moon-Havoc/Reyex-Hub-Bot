import 'dotenv/config';
import { Collection } from 'discord.js';
declare module 'discord.js' {
    interface Client {
        commands: Collection<string, any>;
    }
}
//# sourceMappingURL=index.d.ts.map