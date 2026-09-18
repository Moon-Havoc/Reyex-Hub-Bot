import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import {
  fetchExecutors,
  getStatusEmoji,
  getStatusText,
  getPlatformEmoji,
  Executor,
} from '../../utils/executors.js';
import { createExecutorsEmbed, createExecutorButtons, createErrorEmbed } from '../../utils/embeds.js';

// ─── Per-channel auto-monitor state ───────────────────────────
// channelId → interval handle
const activeMonitors = new Map<string, NodeJS.Timeout>();
// channelId → last state fingerprint (for change detection)
const lastState      = new Map<string, string>();

/** Fingerprint that captures every field that can change status */
function buildStateKey(execs: Executor[]): string {
  return execs
    .map(e =>
      `${e.title}:${e.detected}:${e.updateStatus}:${e.unknown}:${e.unknownDetection}:${e.version}:${e.hasIssues}:${e.possibleBanwave}`,
    )
    .join('|');
}

export function formatExecutorForEmbed(exp: Executor) {
  return {
    title:            exp.title,
    version:          exp.version,
    platform:         exp.platform,
    detected:         exp.detected,
    updated:          exp.updateStatus,
    unknown:          exp.unknown,
    unknownDetection: exp.unknownDetection,
    free:             exp.free,
    cost:             exp.cost,
    purchaselink:     exp.purchaselink,
    websitelink:      exp.websitelink,
    discordlink:      exp.discordlink,
    uncStatus:        exp.uncStatus,
    suncPercentage:   exp.suncPercentage,
    uncPercentage:    exp.uncPercentage,
    decompiler:       exp.decompiler,
    multiInject:      exp.multiInject,
    clientmods:       exp.clientmods,
    raknet:           exp.raknet,
    keysystem:        exp.keysystem,
    beta:             exp.beta,
    possibleBanwave:  exp.possibleBanwave,
    hasIssues:        exp.hasIssues,
    detectionReason:  exp.detectionReason,
    updatedDate:      exp.updatedDate,
    rbxversion:       exp.rbxversion,
    index:            exp.index,
    statusEmoji:      getStatusEmoji(exp),
    statusText:       getStatusText(exp),
    platformEmoji:    getPlatformEmoji(exp.platform),
  };
}

export default {
  data: new SlashCommandBuilder()
    .setName('executors')
    .setDescription('Live Roblox executor statuses from WhatExpsAre.Online')
    .addStringOption(opt =>
      opt
        .setName('platform')
        .setDescription('Filter by platform (default: all)')
        .setRequired(false)
        .addChoices(
          { name: '🌐  All',     value: 'all'     },
          { name: '🪟  Windows', value: 'Windows' },
          { name: '🤖  Android', value: 'Android' },
          { name: '🍎  Mac',     value: 'Mac'     },
          { name: '📱  iOS',     value: 'iOS'     },
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const platformFilter = interaction.options.getString('platform') ?? 'all';

    try {
      const executors = await fetchExecutors();

      if (executors.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed({
            title:       'API Unavailable',
            description: 'Could not fetch data from WhatExpsAre.Online. The API may be down — try again in a moment.',
          })],
        });
        return;
      }

      const embed      = createExecutorsEmbed({
        executors:      executors.map(formatExecutorForEmbed),
        platformFilter,
        lastUpdated:    new Date(),
      });
      const components = createExecutorButtons(platformFilter);

      await interaction.editReply({ embeds: [embed], components });

      // ── Auto-monitor: re-fetch every 30s, edit message on state change ──
      const channelId = interaction.channelId;

      // Clear any existing monitor for this channel
      const existing = activeMonitors.get(channelId);
      if (existing) clearInterval(existing);

      lastState.set(channelId, buildStateKey(executors));

      const interval = setInterval(async () => {
        try {
          const fresh = await fetchExecutors();
          if (fresh.length === 0) return;

          const key = buildStateKey(fresh);
          if (key === lastState.get(channelId)) return; // nothing changed
          lastState.set(channelId, key);

          const updatedEmbed = createExecutorsEmbed({
            executors:      fresh.map(formatExecutorForEmbed),
            platformFilter,
            lastUpdated:    new Date(),
          });

          // Fetch the original reply message and edit it
          try {
            const msg = await interaction.fetchReply();
            await msg.edit({ embeds: [updatedEmbed], components: createExecutorButtons(platformFilter) });
          } catch {
            // Message deleted — stop monitoring
            clearInterval(interval);
            activeMonitors.delete(channelId);
            lastState.delete(channelId);
          }
        } catch (err) {
          Logger.error('Executor monitor poll error', err);
        }
      }, 30_000);

      activeMonitors.set(channelId, interval);

      // Auto-cleanup after 15 minutes
      setTimeout(() => {
        if (activeMonitors.get(channelId) === interval) {
          clearInterval(interval);
          activeMonitors.delete(channelId);
          lastState.delete(channelId);
        }
      }, 15 * 60 * 1_000);

      Logger.info(`Executors viewed by ${interaction.user.tag} (platform: ${platformFilter})`);
    } catch (error) {
      Logger.error('Error in /executors', error);
      await interaction.editReply({
        embeds: [createErrorEmbed({
          title:       'Error',
          description: 'An error occurred while fetching executor statuses.',
        })],
      });
    }
  },
};
