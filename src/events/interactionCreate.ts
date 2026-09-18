import {
  Events,
  Interaction,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';
import { Logger } from '../utils/logger.js';
import Poll from '../models/Poll.js';
import Giveaway from '../models/Giveaway.js';
import User from '../models/User.js';
import {
  createPollEmbed,
  createExecutorsEmbed,
  createExecutorButtons,
  createErrorEmbed,
  createGiveawayEmbed,
  createHelpEmbed,
  type HelpCategory,
} from '../utils/embeds.js';
import { fetchExecutors } from '../utils/executors.js';
import { formatExecutorForEmbed } from '../commands/user/executors.js';

// ─── Main handler ─────────────────────────────────────────────

export default {
  name: Events.InteractionCreate,

  async execute(interaction: Interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(interaction);
        return;
      }

      if (interaction.isAutocomplete()) {
        await handleAutocomplete(interaction);
        return;
      }

      if (interaction.isButton()) {
        await handleButton(interaction);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
        return;
      }
    } catch (error) {
      Logger.error('Unhandled error in interactionCreate', error);
    }
  },
};

// ─── Slash commands ───────────────────────────────────────────

async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    Logger.warn(`Unknown command: ${interaction.commandName}`);
    await interaction.reply({
      content: '❌  Unknown command.',
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    Logger.error(`Error executing /${interaction.commandName}`, error);
    const msg = { content: '❌  An error occurred while running that command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => null);
    } else {
      await interaction.reply(msg).catch(() => null);
    }
  }
}

// ─── Autocomplete ─────────────────────────────────────────────

async function handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command?.autocomplete) {
    // No autocomplete handler registered — return empty list
    await interaction.respond([]).catch(() => null);
    return;
  }

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    Logger.error(`Error in autocomplete for /${interaction.commandName}`, error);
    await interaction.respond([]).catch(() => null);
  }
}

// ─── Buttons ──────────────────────────────────────────────────

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  const { customId } = interaction;

  if (customId.startsWith('poll_vote_')) {
    await handlePollVote(interaction);
    return;
  }

  if (customId.startsWith('exec_filter_') || customId.startsWith('exec_refresh_')) {
    await handleExecutorButton(interaction);
    return;
  }

  if (customId.startsWith('giveaway_join_')) {
    await handleGiveawayJoin(interaction);
    return;
  }

  if (customId.startsWith('giveaway_leave_')) {
    await handleGiveawayLeave(interaction);
    return;
  }
}

// ─── Select menus ─────────────────────────────────────────────

async function handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  if (interaction.customId === 'help_category') {
    await handleHelpCategory(interaction);
    return;
  }
}

// ─── Poll voting ─────────────────────────────────────────────

async function handlePollVote(interaction: ButtonInteraction): Promise<void> {
  try {
    const parts       = interaction.customId.split('_');  // poll_vote_{id}_{index}
    const pollId      = parts[2];
    const optionIndex = parseInt(parts[3], 10);

    const poll = await Poll.findById(pollId);
    if (!poll?.isActive) {
      await interaction.reply({ content: '❌  This poll is no longer active.', ephemeral: true });
      return;
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      await interaction.reply({ content: '❌  Invalid option.', ephemeral: true });
      return;
    }

    const userId       = interaction.user.id;
    const targetOption = poll.options[optionIndex];

    // Toggle: remove from all options, then add to target (unless already voted there)
    const alreadyVoted = targetOption.voters.includes(userId);

    for (const opt of poll.options) {
      opt.voters = opt.voters.filter((v: string) => v !== userId);
    }

    if (!alreadyVoted) {
      targetOption.voters.push(userId);
    }

    poll.markModified('options');
    await poll.save();

    const creator = await interaction.client.users.fetch(poll.createdBy).catch(() => null);
    const updatedEmbed = createPollEmbed({
      question:  poll.question,
      options:   poll.options,
      createdBy: creator?.tag ?? 'Unknown',
      endTime:   poll.endTime,
      isActive:  true,
    });

    await interaction.update({ embeds: [updatedEmbed] });
  } catch (error) {
    Logger.error('Error handling poll vote', error);
    await interaction.reply({ content: '❌  An error occurred while recording your vote.', ephemeral: true }).catch(() => null);
  }
}

// ─── Executor buttons ─────────────────────────────────────────

async function handleExecutorButton(interaction: ButtonInteraction): Promise<void> {
  try {
    let platform = 'all';
    if (interaction.customId.startsWith('exec_filter_')) {
      platform = interaction.customId.replace('exec_filter_', '');
    } else if (interaction.customId.startsWith('exec_refresh_')) {
      platform = interaction.customId.replace('exec_refresh_', '');
    }

    await interaction.deferUpdate();

    const executors = await fetchExecutors();
    if (executors.length === 0) {
      await interaction.followUp({
        content: '❌  Could not reach WhatExpsAre.Online right now. Try again shortly.',
        ephemeral: true,
      });
      return;
    }

    const embed      = createExecutorsEmbed({
      executors:      executors.map(formatExecutorForEmbed),
      platformFilter: platform,
      lastUpdated:    new Date(),
    });
    const components = createExecutorButtons(platform);

    await interaction.editReply({ embeds: [embed], components });
  } catch (error) {
    Logger.error('Error handling executor button', error);
  }
}

// ─── Giveaway join ────────────────────────────────────────────

async function handleGiveawayJoin(interaction: ButtonInteraction): Promise<void> {
  try {
    const giveawayId = interaction.customId.replace('giveaway_join_', '');
    const userId     = interaction.user.id;

    const giveaway = await Giveaway.findById(giveawayId);

    if (!giveaway || !giveaway.isActive) {
      await interaction.reply({ content: '❌  This giveaway is no longer active.', ephemeral: true });
      return;
    }

    if (giveaway.participants.includes(userId)) {
      await interaction.reply({
        content: '✅  You\'re already entered! Good luck 🍀',
        ephemeral: true,
      });
      return;
    }

    // Require verified account
    const dbUser = await User.findOne({ discordId: userId });
    if (!dbUser?.isVerified) {
      await interaction.reply({
        embeds: [createErrorEmbed({
          title:       'Verification Required',
          description: 'You must verify your Roblox account before entering giveaways.\nUse `/verify start` to get started.',
        })],
        ephemeral: true,
      });
      return;
    }

    giveaway.participants.push(userId);
    await giveaway.save();

    // Update the giveaway message embed with the new participant count
    try {
      const updatedEmbed = createGiveawayEmbed({
        name:         giveaway.name,
        description:  giveaway.description,
        prize:        giveaway.prize,
        endTime:      giveaway.endTime,
        participants: giveaway.participants.length,
        isActive:     true,
      });
      await interaction.update({ embeds: [updatedEmbed] });
    } catch {
      // Update failed — just ack
      await interaction.reply({
        content: `🎉  You've entered **${giveaway.name}**! Good luck!`,
        ephemeral: true,
      });
    }
  } catch (error) {
    Logger.error('Error handling giveaway join', error);
    await interaction.reply({ content: '❌  An error occurred. Please try again.', ephemeral: true }).catch(() => null);
  }
}

// ─── Giveaway leave ───────────────────────────────────────────

async function handleGiveawayLeave(interaction: ButtonInteraction): Promise<void> {
  try {
    const giveawayId = interaction.customId.replace('giveaway_leave_', '');
    const userId     = interaction.user.id;

    const giveaway = await Giveaway.findById(giveawayId);

    if (!giveaway || !giveaway.isActive) {
      await interaction.reply({ content: '❌  This giveaway is no longer active.', ephemeral: true });
      return;
    }

    if (!giveaway.participants.includes(userId)) {
      await interaction.reply({ content: '❌  You are not entered in this giveaway.', ephemeral: true });
      return;
    }

    giveaway.participants = giveaway.participants.filter((id: string) => id !== userId);
    await giveaway.save();

    const updatedEmbed = createGiveawayEmbed({
      name:         giveaway.name,
      description:  giveaway.description,
      prize:        giveaway.prize,
      endTime:      giveaway.endTime,
      participants: giveaway.participants.length,
      isActive:     true,
    });

    await interaction.update({ embeds: [updatedEmbed] });
  } catch (error) {
    Logger.error('Error handling giveaway leave', error);
    await interaction.reply({ content: '❌  An error occurred. Please try again.', ephemeral: true }).catch(() => null);
  }
}

// ─── Help category select ─────────────────────────────────────

async function handleHelpCategory(interaction: StringSelectMenuInteraction): Promise<void> {
  try {
    const category = interaction.values[0] as HelpCategory;
    const embed    = createHelpEmbed(category);
    await interaction.update({ embeds: [embed] });
  } catch (error) {
    Logger.error('Error handling help category select', error);
  }
}
