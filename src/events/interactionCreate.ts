import { Events, Interaction } from 'discord.js';
import { Logger } from '../utils/logger.js';
import Poll from '../models/Poll.js';
import { createPollEmbed } from '../utils/embeds.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        Logger.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        Logger.error(`Error executing ${interaction.commandName}:`, error);
        
        const errorMessage = 'There was an error while executing this command!';
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
      return;
    }

    // Handle button interactions (poll voting)
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('poll_vote_')) {
        await handlePollVote(interaction);
      }
      return;
    }
  },
};

async function handlePollVote(interaction: any) {
  try {
    const parts = interaction.customId.split('_');
    const pollId = parts[2];
    const optionIndex = parseInt(parts[3]);

    const poll = await Poll.findById(pollId);
    if (!poll || !poll.isActive) {
      await interaction.reply({ content: 'This poll is no longer active.', ephemeral: true });
      return;
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      await interaction.reply({ content: 'Invalid option.', ephemeral: true });
      return;
    }

    const userId = interaction.user.id;

    // Check if user already voted on this option (toggle off)
    const existingVote = poll.options[optionIndex].voters.indexOf(userId);
    if (existingVote > -1) {
      poll.options[optionIndex].voters.splice(existingVote, 1);
      await poll.save();

      const updatedEmbed = createPollEmbed({
        question: poll.question,
        options: poll.options,
        createdBy: interaction.user.tag,
        endTime: poll.endTime || undefined,
        isActive: poll.isActive,
      });

      await interaction.update({ embeds: [updatedEmbed] });
      return;
    }

    // Remove user's vote from all other options first
    for (const opt of poll.options) {
      const idx = opt.voters.indexOf(userId);
      if (idx > -1) {
        opt.voters.splice(idx, 1);
      }
    }

    // Add vote to selected option
    poll.options[optionIndex].voters.push(userId);
    await poll.save();

    const updatedEmbed = createPollEmbed({
      question: poll.question,
      options: poll.options,
      createdBy: interaction.user.tag,
      endTime: poll.endTime || undefined,
      isActive: poll.isActive,
    });

    await interaction.update({ embeds: [updatedEmbed] });

  } catch (error) {
    Logger.error('Error handling poll vote:', error);
    await interaction.reply({ content: 'An error occurred while voting. Please try again.', ephemeral: true });
  }
}
