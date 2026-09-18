/**
 * Scheduler — rehydrates active poll and giveaway timers on bot startup.
 *
 * Polls and giveaways store `endTime` in MongoDB.  When the bot restarts,
 * in-memory timers are lost.  This module re-schedules all pending endings
 * so they fire correctly even after a restart.
 */
import { Client, TextChannel } from 'discord.js';
import Poll    from '../models/Poll.js';
import Giveaway from '../models/Giveaway.js';
import {
  createPollEmbed,
  createGiveawayEmbed,
  createSuccessEmbed,
} from './embeds.js';
import { Logger } from './logger.js';

// Minimum future window — skip anything ending in less than 5 seconds
const MIN_MS = 5_000;
// Cap re-scheduled timers at 24 hours (Node.js max safe timer ~25 days, but
// restarting daily is safer for long-running giveaways).
const MAX_MS = 24 * 60 * 60 * 1_000;

// ─── Public API ───────────────────────────────────────────────

export async function rehydrateScheduler(client: Client): Promise<void> {
  const [pollCount, giveawayCount] = await Promise.all([
    rehydratePolls(client),
    rehydrateGiveaways(client),
  ]);
  Logger.info(`Scheduler rehydrated — ${pollCount} poll(s), ${giveawayCount} giveaway(s) re-scheduled`);
}

// ─── Polls ────────────────────────────────────────────────────

async function rehydratePolls(client: Client): Promise<number> {
  const polls = await Poll.find({
    isActive: true,
    endTime:  { $gt: new Date() },
  });

  let count = 0;
  for (const poll of polls) {
    if (!poll.endTime) continue;
    const delay = poll.endTime.getTime() - Date.now();
    if (delay < MIN_MS) {
      // Already overdue — end immediately
      await endPoll(client, poll._id.toString());
    } else {
      const capped = Math.min(delay, MAX_MS);
      setTimeout(() => void endPoll(client, poll._id.toString()), capped);
      count++;
    }
  }
  return count;
}

export async function schedulePollEnd(client: Client, pollId: string, endTime: Date): Promise<void> {
  const delay = endTime.getTime() - Date.now();
  if (delay < MIN_MS) {
    await endPoll(client, pollId);
    return;
  }
  const capped = Math.min(delay, MAX_MS);
  setTimeout(() => void endPoll(client, pollId), capped);
}

async function endPoll(client: Client, pollId: string): Promise<void> {
  try {
    const poll = await Poll.findById(pollId);
    if (!poll?.isActive) return; // already ended manually

    poll.isActive = false;
    poll.endedAt  = new Date();
    await poll.save();

    if (!poll.messageId || !poll.channelId) return;

    const channel = await client.channels.fetch(poll.channelId).catch(() => null);
    if (!channel?.isTextBased()) return;

    const creator = await client.users.fetch(poll.createdBy).catch(() => null);
    const embed   = createPollEmbed({
      question:  poll.question,
      options:   poll.options,
      createdBy: creator?.tag ?? 'Unknown',
      isActive:  false,
    });

    const msg = await (channel as TextChannel).messages.fetch(poll.messageId).catch(() => null);
    if (msg) await msg.edit({ embeds: [embed], components: [] });

    Logger.info(`Poll "${poll.question}" auto-ended (${pollId})`);
  } catch (error) {
    Logger.error(`Error auto-ending poll ${pollId}`, error);
  }
}

// ─── Giveaways ────────────────────────────────────────────────

async function rehydrateGiveaways(client: Client): Promise<number> {
  const giveaways = await Giveaway.find({
    isActive: true,
    endTime:  { $gt: new Date() },
  });

  let count = 0;
  for (const giveaway of giveaways) {
    const delay = giveaway.endTime.getTime() - Date.now();
    if (delay < MIN_MS) {
      await endGiveaway(client, giveaway._id.toString());
    } else {
      const capped = Math.min(delay, MAX_MS);
      setTimeout(() => void endGiveaway(client, giveaway._id.toString()), capped);
      count++;
    }
  }
  return count;
}

export async function scheduleGiveawayEnd(
  client: Client,
  giveawayId: string,
  endTime: Date,
): Promise<void> {
  const delay = endTime.getTime() - Date.now();
  if (delay < MIN_MS) {
    await endGiveaway(client, giveawayId);
    return;
  }
  const capped = Math.min(delay, MAX_MS);
  setTimeout(() => void endGiveaway(client, giveawayId), capped);
}

async function endGiveaway(client: Client, giveawayId: string): Promise<void> {
  try {
    const giveaway = await Giveaway.findById(giveawayId);
    if (!giveaway?.isActive) return;

    // Pick winner
    let winnerId: string | null = null;
    if (giveaway.participants.length > 0) {
      winnerId = giveaway.participants[
        Math.floor(Math.random() * giveaway.participants.length)
      ];
    }

    giveaway.isActive = false;
    giveaway.winner   = winnerId ?? undefined;
    giveaway.endedAt  = new Date();
    await giveaway.save();

    // Announce winner in the original channel
    if (giveaway.channelId) {
      const announceCh = await client.channels.fetch(giveaway.channelId).catch(() => null);

      if (announceCh?.isTextBased()) {
        const ch = announceCh as TextChannel;

        // Update original giveaway embed
        if (giveaway.messageId) {
          const msg = await ch.messages.fetch(giveaway.messageId).catch(() => null);
          if (msg) {
            const updatedEmbed = createGiveawayEmbed({
              name:         giveaway.name,
              description:  giveaway.description,
              prize:        giveaway.prize,
              endTime:      giveaway.endTime,
              participants: giveaway.participants.length,
              isActive:     false,
              winner:       winnerId ?? undefined,
            });
            await msg.edit({ embeds: [updatedEmbed], components: [] }).catch(() => null);
          }
        }

        // Announcement message
        const winnerTag = winnerId ? `<@${winnerId}>` : 'nobody (no entries)';
        const announcement = createSuccessEmbed({
          title:       `🏆  Giveaway Ended — ${giveaway.name}`,
          description: `Congratulations ${winnerTag}! You won **${giveaway.prize}**!`,
          fields: [
            { name: '👥  Entries',  value: String(giveaway.participants.length), inline: true },
            { name: '🏆  Winner',   value: winnerId ? `<@${winnerId}>` : 'No winner',    inline: true },
          ],
        });

        await ch.send({
          content: winnerId ? `🎉  Congratulations <@${winnerId}>!` : undefined,
          embeds:  [announcement],
        });

        // DM the winner
        if (winnerId) {
          const winner = await client.users.fetch(winnerId).catch(() => null);
          if (winner) {
            await winner.send({
              embeds: [createSuccessEmbed({
                title:       '🎉  You Won a Giveaway!',
                description: `You won the **${giveaway.name}** giveaway in **${giveaway.prize}**!`,
                fields: [
                  { name: 'Prize', value: giveaway.prize },
                ],
              })],
            }).catch(() => null); // DMs may be disabled
          }
        }
      }
    }

    Logger.info(`Giveaway "${giveaway.name}" auto-ended — winner: ${winnerId ?? 'none'} (${giveawayId})`);
  } catch (error) {
    Logger.error(`Error auto-ending giveaway ${giveawayId}`, error);
  }
}
