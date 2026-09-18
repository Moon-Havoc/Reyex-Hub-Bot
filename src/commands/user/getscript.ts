import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import Game from '../../models/Game.js';
import { createErrorEmbed, createGameEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('getscript')
    .setDescription('Retrieve a script for a specific game (verified members only)')
    .addStringOption(opt =>
      opt
        .setName('game')
        .setDescription('The game name')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const games   = await Game.find({ isActive: true }).select('name category').lean();
    const filtered = games
      .filter(g => g.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(g => ({ name: `${g.name} — ${g.category}`, value: g.name }));
    await interaction.respond(filtered);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    // Ephemeral — scripts are only for verified members, keep them private
    await interaction.deferReply({ ephemeral: true });

    const gameName = interaction.options.getString('game', true);
    const userId   = interaction.user.id;

    try {
      // Verification gate
      const user = await User.findOne({ discordId: userId });
      if (!user?.isVerified) {
        await interaction.editReply({
          embeds: [createErrorEmbed({
            title:       'Verification Required',
            description: 'You must verify your Roblox account before accessing scripts.',
            fields: [{ name: '💡  How to verify', value: 'Run `/verify start` with your Roblox username.' }],
          })],
        });
        return;
      }

      // Find the game
      const game = await Game.findOne({ name: gameName, isActive: true });
      if (!game) {
        await interaction.editReply({
          embeds: [createErrorEmbed({
            title:       'Game Not Found',
            description: `**"${gameName}"** doesn't exist or is currently unavailable.`,
            fields: [{ name: '📋  Browse scripts', value: 'Use `/games` to see everything available.' }],
          })],
        });
        return;
      }

      // Update stats
      await Promise.all([
        User.updateOne({ discordId: userId }, {
          $inc: { 'statistics.scriptsUsed': 1 },
          $set: { 'statistics.lastScriptUsed': new Date(), lastSeen: new Date() },
        }),
        Game.updateOne({ _id: game._id }, { $inc: { usageCount: 1 } }),
      ]);

      const scriptEmbed = createGameEmbed({
        gameName:        game.name,
        description:     game.description,
        scriptUrl:       game.scriptUrl,
        category:        game.category,
        usageCount:      game.usageCount + 1,
        free:            game.free,
        keyRequired:     game.keyRequired,
        mobileCompatible: game.mobileCompatible,
      });

      const components: ActionRowBuilder<ButtonBuilder>[] = [];

      if (game.scriptUrl.startsWith('http')) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('View Raw Script')
            .setStyle(ButtonStyle.Link)
            .setURL(game.scriptUrl)
            .setEmoji('📄'),
        );
        components.push(row);
      }

      await interaction.editReply({ embeds: [scriptEmbed], components });
      Logger.info(`Script retrieved: ${interaction.user.tag} → ${gameName}`);
    } catch (error) {
      Logger.error('Error in /getscript', error);
      await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
    }
  },
};
