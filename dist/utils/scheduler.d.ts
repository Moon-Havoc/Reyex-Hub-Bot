/**
 * Scheduler — rehydrates active poll and giveaway timers on bot startup.
 *
 * Polls and giveaways store `endTime` in MongoDB.  When the bot restarts,
 * in-memory timers are lost.  This module re-schedules all pending endings
 * so they fire correctly even after a restart.
 */
import { Client } from 'discord.js';
export declare function rehydrateScheduler(client: Client): Promise<void>;
export declare function schedulePollEnd(client: Client, pollId: string, endTime: Date): Promise<void>;
export declare function scheduleGiveawayEnd(client: Client, giveawayId: string, endTime: Date): Promise<void>;
//# sourceMappingURL=scheduler.d.ts.map