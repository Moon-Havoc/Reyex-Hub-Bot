import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import {
  createHelpEmbed,
  createHelpSelectMenu,
} from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Browse all Reyex Hub commands by category'),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed     = createHelpEmbed('user');
    const selectMenu: StringSelectMenuBuilder = createHelpSelectMenu();

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      embeds:     [embed],
      components: [row],
    });
  },
};
