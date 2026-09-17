import { SlashCommandBuilder } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import Game from '../../models/Game.js';
import { createErrorEmbed, createGamesListEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('games')
        .setDescription('List all available games and scripts')
        .addStringOption(option => option
        .setName('category')
        .setDescription('Filter by category')
        .setRequired(false)
        .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const categories = await Game.distinct('category', { isActive: true });
        const filtered = categories
            .filter(cat => cat.toLowerCase().includes(focusedValue.toLowerCase()))
            .slice(0, 25)
            .map(cat => ({ name: cat, value: cat }));
        await interaction.respond(filtered);
    },
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const category = interaction.options.getString('category');
            // Build query
            const query = { isActive: true };
            if (category) {
                query.category = category;
            }
            // Get games
            const games = await Game.find(query).sort({ name: 1 });
            if (games.length === 0) {
                const noGamesEmbed = createErrorEmbed({
                    title: 'No Games Found',
                    description: category
                        ? `No games found in category "${category}".`
                        : 'No games are currently available.',
                    fields: [
                        { name: '💡 Tip', value: 'Admins can add games with `/addgame`.' },
                    ],
                });
                await interaction.editReply({ embeds: [noGamesEmbed] });
                return;
            }
            // Create branded games list embed
            const gamesData = games.map(game => ({
                name: game.name,
                description: game.description,
                category: game.category,
                usageCount: game.usageCount,
                free: game.free,
                keyRequired: game.keyRequired,
                mobileCompatible: game.mobileCompatible,
            }));
            const gamesEmbed = createGamesListEmbed({
                games: gamesData,
                category: category || undefined,
            });
            await interaction.editReply({ embeds: [gamesEmbed] });
            Logger.info(`User ${interaction.user.tag} viewed games list${category ? ` for category: ${category}` : ''}`);
        }
        catch (error) {
            Logger.error('Error in games command:', error);
            await interaction.editReply({ content: 'An error occurred while fetching games. Please try again.' });
        }
    },
};
//# sourceMappingURL=games.js.map