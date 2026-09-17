import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import Game from '../../models/Game.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('addgame')
    .setDescription('Add a new game/script to the database')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('The game name')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('script_url')
        .setDescription('The script URL')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Description of the script')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('category')
        .setDescription('Game category')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('free')
        .setDescription('Is the script free? (default: true)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('key_required')
        .setDescription('Does the script require a key? (default: false)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('mobile_compatible')
        .setDescription('Is the script mobile compatible? (default: false)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: any) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const name = interaction.options.getString('name');
      const scriptUrl = interaction.options.getString('script_url');
      const description = interaction.options.getString('description');
      const category = interaction.options.getString('category') || 'General';
      const free = interaction.options.getBoolean('free') ?? true;
      const keyRequired = interaction.options.getBoolean('key_required') ?? false;
      const mobileCompatible = interaction.options.getBoolean('mobile_compatible') ?? false;

      // Check if game already exists
      const existingGame = await Game.findOne({ name });
      
      if (existingGame) {
        const errorEmbed = createErrorEmbed({
          title: 'Game Already Exists',
          description: `A game with the name "${name}" already exists.`,
        });

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Validate URL
      try {
        new URL(scriptUrl);
      } catch {
        const errorEmbed = createErrorEmbed({
          title: 'Invalid URL',
          description: 'Please provide a valid URL for the script.',
        });

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Create new game
      const newGame = new Game({
        name,
        scriptUrl,
        description,
        category,
        free,
        keyRequired,
        mobileCompatible,
        addedBy: interaction.user.id,
        addedAt: new Date(),
        updatedAt: new Date(),
      });

      await newGame.save();

      const successEmbed = createSuccessEmbed({
        title: 'Game Added Successfully',
        description: `The game "${name}" has been added to the database.`,
        fields: [
          { name: 'Name', value: name, inline: true },
          { name: 'Category', value: category, inline: true },
          { name: 'Free', value: free ? 'Yes' : 'No', inline: true },
          { name: 'Key Required', value: keyRequired ? 'Yes' : 'No', inline: true },
          { name: 'Mobile Compatible', value: mobileCompatible ? 'Yes' : 'No', inline: true },
          { name: 'Script URL', value: scriptUrl, inline: false },
          { name: 'Description', value: description, inline: false }
        ],
      });

      await interaction.editReply({ embeds: [successEmbed] });
      Logger.info(`Game "${name}" added by ${interaction.user.tag}`);

    } catch (error) {
      Logger.error('Error in addgame command:', error);
      await interaction.editReply({ content: 'An error occurred while adding the game. Please try again.' });
    }
  },
};
