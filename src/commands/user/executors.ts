import { SlashCommandBuilder } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { fetchExecutors, getStatusEmoji, getStatusText, getPlatformEmoji, Executor } from '../../utils/executors.js';
import { createExecutorsEmbed, createErrorEmbed } from '../../utils/embeds.js';

// Track active monitors: channelId → interval ID
const activeMonitors = new Map<string, NodeJS.Timeout>();
// Track last known state per channel for change detection
const lastState = new Map<string, string>();

function buildStateKey(execs: Executor[]): string {
  return execs.map(e => `${e.title}:${e.detected}:${e.updateStatus}:${e.version}`).join('|');
}

function formatExecutorForEmbed(exp: Executor) {
  return {
    title: exp.title,
    version: exp.version,
    platform: exp.platform,
    detected: exp.detected,
    updated: exp.updateStatus,
    free: exp.free,
    cost: exp.cost,
    uncStatus: exp.uncStatus,
    suncPercentage: exp.suncPercentage,
    statusEmoji: getStatusEmoji(exp),
    statusText: getStatusText(exp),
    platformEmoji: getPlatformEmoji(exp.platform),
  };
}

export default {
  data: new SlashCommandBuilder()
    .setName('executors')
    .setDescription('Show live Roblox executor statuses from WhatExpsAre.Online')
    .addStringOption(option =>
      option
        .setName('platform')
        .setDescription('Filter by platform')
        .setRequired(false)
        .addChoices(
          { name: 'All', value: 'all' },
          { name: 'Windows', value: 'Windows' },
          { name: 'Mac', value: 'Mac' },
          { name: 'Android', value: 'Android' },
        )
    ),

  async execute(interaction: any) {
    await interaction.deferReply();

    try {
      const platformFilter = interaction.options.getString('platform') || 'all';

      let executors = await fetchExecutors();

      if (executors.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed({
            title: 'API Error',
            description: 'Could not fetch executor data from WhatExpsAre.Online. The site may be down.',
          })],
        });
        return;
      }

      // Filter by platform if specified
      if (platformFilter !== 'all') {
        executors = executors.filter(e => e.platform === platformFilter);
      }

      // Sort: detected first, then by name
      executors.sort((a, b) => {
        if (a.detected !== b.detected) return a.detected ? -1 : 1;
        return a.title.localeCompare(b.title);
      });

      const embed = createExecutorsEmbed({
        executors: executors.map(formatExecutorForEmbed),
        lastUpdated: new Date(),
      });

      await interaction.editReply({ embeds: [embed] });

      // Set up auto-monitoring for this channel
      const channelId = interaction.channelId;

      // Clear existing monitor for this channel if any
      if (activeMonitors.has(channelId)) {
        clearInterval(activeMonitors.get(channelId)!);
      }

      // Store initial state
      lastState.set(channelId, buildStateKey(executors));

      // Set up interval to check for changes every 30 seconds
      const interval = setInterval(async () => {
        try {
          const freshExecutors = await fetchExecutors();
          if (freshExecutors.length === 0) return;

          const currentState = buildStateKey(freshExecutors);
          const prevState = lastState.get(channelId);

          if (currentState !== prevState) {
            lastState.set(channelId, currentState);

            let filtered = freshExecutors;
            if (platformFilter !== 'all') {
              filtered = freshExecutors.filter(e => e.platform === platformFilter);
            }

            filtered.sort((a, b) => {
              if (a.detected !== b.detected) return a.detected ? -1 : 1;
              return a.title.localeCompare(b.title);
            });

            const updatedEmbed = createExecutorsEmbed({
              executors: filtered.map(formatExecutorForEmbed),
              lastUpdated: new Date(),
            });

            try {
              const channel = await interaction.client.channels.fetch(channelId);
              if (channel && 'messages' in channel) {
                const message = await (channel as any).messages.fetch(interaction.id);
                if (message) {
                  await message.edit({ embeds: [updatedEmbed] });
                }
              }
            } catch {
              // Message may have been deleted, stop monitoring
              clearInterval(interval);
              activeMonitors.delete(channelId);
              lastState.delete(channelId);
            }
          }
        } catch (error) {
          Logger.error('Error checking executor statuses:', error);
        }
      }, 30000);

      activeMonitors.set(channelId, interval);

      // Auto-cleanup after 15 minutes
      setTimeout(() => {
        if (activeMonitors.get(channelId) === interval) {
          clearInterval(interval);
          activeMonitors.delete(channelId);
          lastState.delete(channelId);
        }
      }, 15 * 60 * 1000);

      Logger.info(`Executor status viewed by ${interaction.user.tag} (platform: ${platformFilter})`);

    } catch (error) {
      Logger.error('Error in executors command:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed({
          title: 'Error',
          description: 'An error occurred while fetching executor statuses.',
        })],
      });
    }
  },
};
