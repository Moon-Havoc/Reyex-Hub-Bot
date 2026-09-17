import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import Game from '../../models/Game.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('removegame')
        .setDescription('Remove a game/script from the database')
        .addStringOption(option => option
        .setName('name')
        .setDescription('The game name to remove')
        .setRequired(true)
        .setAutocomplete(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const games = await Game.find({ isActive: true }).select('name');
        const filtered = games
            .filter(game => game.name.toLowerCase().includes(focusedValue.toLowerCase()))
            .slice(0, 25)
            .map(game => ({ name: game.name, value: game.name }));
        await interaction.respond(filtered);
    },
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const name = interaction.options.getString('name');
            // Find and remove the game
            const game = await Game.findOneAndDelete({ name });
            if (!game) {
                const errorEmbed = createErrorEmbed({
                    title: 'Game Not Found',
                    description: `No game found with the name "${name}".`,
                });
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }
            const successEmbed = createSuccessEmbed({
                title: 'Game Removed Successfully',
                description: `The game "${name}" has been removed from the database.`,
                fields: [
                    { name: 'Name', value: game.name, inline: true },
                    { name: 'Category', value: game.category, inline: true },
                    { name: 'Usage Count', value: game.usageCount.toString(), inline: true }
                ],
            });
            await interaction.editReply({ embeds: [successEmbed] });
            Logger.info(`Game "${name}" removed by ${interaction.user.tag}`);
        }
        catch (error) {
            Logger.error('Error in removegame command:', error);
            await interaction.editReply({ content: 'An error occurred while removing the game. Please try again.' });
        }
    },
};
//# sourceMappingURL=removegame.js.map