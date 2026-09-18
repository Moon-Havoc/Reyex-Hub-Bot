import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { Logger } from '../../utils/logger.js';
import Game from '../../models/Game.js';
import { createErrorEmbed, createGamesListEmbed } from '../../utils/embeds.js';

const PER_PAGE = 9; // 3 × 3 inline grid

export default {
  data: new SlashCommandBuilder()
    .setName('games')
    .setDescription('Browse all available game scripts')
    .addStringOption(opt =>
      opt
        .setName('category')
        .setDescription('Filter by category')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName('page')
        .setDescription('Page number (default: 1)')
        .setRequired(false)
        .setMinValue(1)
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    const focused     = interaction.options.getFocused().toLowerCase();
    const categories  = await Game.distinct('category', { isActive: true }) as string[];
    const filtered    = categories
      .filter(c => c.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(c => ({ name: c, value: c }));
    await interaction.respond(filtered);
  },

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const category = interaction.options.getString('category') ?? undefined;
    const page     = interaction.options.getInteger('page') ?? 1;

    try {
      const query: Record<string, unknown> = { isActive: true };
      if (category) query.category = category;

      const games = await Game.find(query).sort({ name: 1 }).lean();

      if (games.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed({
            title:       'No Games Found',
            description: category
              ? `No scripts available in **"${category}"**.`
              : 'No scripts are currently available.',
            fields: [{ name: '💡', value: 'Admins can add scripts with `/addgame`.' }],
          })],
        });
        return;
      }

      const totalPages = Math.ceil(games.length / PER_PAGE);
      const safePage   = Math.min(page, totalPages);

      const embed = createGamesListEmbed({
        games: games.map(g => ({
          name:             g.name,
          description:      g.description,
          category:         g.category,
          usageCount:       g.usageCount,
          free:             g.free,
          keyRequired:      g.keyRequired,
          mobileCompatible: g.mobileCompatible,
        })),
        category,
        page:    safePage,
        perPage: PER_PAGE,
      });

      const components: ActionRowBuilder<ButtonBuilder>[] = [];
      if (totalPages > 1) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`games_prev_${safePage}_${category ?? 'all'}`)
            .setLabel('◀  Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(safePage <= 1),
          new ButtonBuilder()
            .setCustomId(`games_next_${safePage}_${category ?? 'all'}`)
            .setLabel('Next  ▶')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(safePage >= totalPages),
        );
        components.push(row);
      }

      await interaction.editReply({ embeds: [embed], components });
      Logger.info(`Games list viewed by ${interaction.user.tag} — page ${safePage}/${totalPages}${category ? ` (${category})` : ''}`);
    } catch (error) {
      Logger.error('Error in /games', error);
      await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
    }
  },
};
