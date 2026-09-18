import mongoose from 'mongoose';
import Game from '../models/Game.js';
import { Logger } from './logger.js';
// ─── Default game seeds ───────────────────────────────────────
const DEFAULT_GAMES = [
    {
        name: 'BloxStrike',
        scriptUrl: 'https://raw.githubusercontent.com/artiommov12-beep/bloxstrikereyex/refs/heads/main/reyexbloxstrike.lua',
        description: 'Tactical 5v5 shooter. Full toolkit including aimbot, ragebot, wallbang, ESP, silent aim, and skin changer.',
        category: 'FPS / Shooter',
        free: true,
        keyRequired: false,
        mobileCompatible: false,
        addedBy: 'System',
    },
    {
        name: 'Rivals',
        scriptUrl: 'https://raw.githubusercontent.com/artiommov12-beep/reyex.hubrivals/refs/heads/main/reyexrivals.lua',
        description: 'Competitive FPS with hero abilities. Aim assist, player ESP, triggerbot, and recoil control.',
        category: 'FPS / Shooter',
        free: true,
        keyRequired: false,
        mobileCompatible: false,
        addedBy: 'System',
    },
    {
        name: 'Sniper Arena',
        scriptUrl: 'https://gist.githubusercontent.com/artiommov12-beep/2398a10a636d0b4897eb153464e79401/raw/6abb8bba6c0fa7546e857b7af38c8088bfcc7b24/reyex%2520hub.lua',
        description: 'Precision sniping script featuring silent aim, bullet drop compensation, and player tracking.',
        category: 'FPS / Shooter',
        free: true,
        keyRequired: false,
        mobileCompatible: false,
        addedBy: 'System',
    },
];
// ─── Seed ─────────────────────────────────────────────────────
export async function seedDefaultGames() {
    let seeded = 0;
    try {
        for (const gameData of DEFAULT_GAMES) {
            const exists = await Game.findOne({ name: gameData.name });
            if (!exists) {
                await Game.create(gameData);
                seeded++;
            }
        }
        if (seeded > 0)
            Logger.info(`Seeded ${seeded} default game script(s)`);
    }
    catch (error) {
        Logger.error('Failed to seed default games', error);
    }
}
// ─── Connect ──────────────────────────────────────────────────
export async function connectDatabase() {
    const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/reyex-hub';
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 8_000,
            socketTimeoutMS: 45_000,
        });
        Logger.info(`MongoDB connected  →  ${sanitizeUri(uri)}`);
        await seedDefaultGames();
        mongoose.connection.on('error', err => {
            Logger.error('MongoDB connection error', err);
        });
        mongoose.connection.on('disconnected', () => {
            Logger.warn('MongoDB disconnected — reconnecting…');
        });
        mongoose.connection.on('reconnected', () => {
            Logger.info('MongoDB reconnected');
        });
    }
    catch (error) {
        Logger.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
}
// ─── Disconnect ───────────────────────────────────────────────
export async function disconnectDatabase() {
    try {
        await mongoose.disconnect();
        Logger.info('MongoDB disconnected gracefully');
    }
    catch (error) {
        Logger.error('Error while disconnecting from MongoDB', error);
    }
}
// ─── Helpers ──────────────────────────────────────────────────
/** Strip credentials from URI before logging */
function sanitizeUri(uri) {
    try {
        const u = new URL(uri);
        u.password = u.password ? '****' : '';
        u.username = u.username ? u.username : '';
        return u.toString();
    }
    catch {
        return uri.replace(/:\/\/[^@]+@/, '://<credentials>@');
    }
}
//# sourceMappingURL=database.js.map