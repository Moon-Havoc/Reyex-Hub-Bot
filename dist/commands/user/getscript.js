import { SlashCommandBuilder } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import Game from '../../models/Game.js';
import { createErrorEmbed, createGameEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('getscript')
        .setDescription('Get a script for a specific game')
        .addStringOption(option => option
        .setName('game')
        .setDescription('The game name')
        .setRequired(true)
        .setAutocomplete(true)),
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
        await interaction.deferReply();
        try {
            const gameName = interaction.options.getString('game');
            const userId = interaction.user.id;
            // Check if user is verified
            const user = await User.findOne({ discordId: userId });
            if (!user || !user.isVerified) {
                const notVerifiedEmbed = createErrorEmbed({
                    title: 'Not Verified',
                    description: 'You need to verify your Roblox account first!',
                    fields: [
                        { name: 'How to Verify', value: 'Use `/verify` with your Roblox username to get access.' }
                    ],
                });
                await interaction.editReply({ embeds: [notVerifiedEmbed] });
                return;
            }
            // Find the game
            const game = await Game.findOne({ name: gameName, isActive: true });
            if (!game) {
                const notFoundEmbed = createErrorEmbed({
                    title: 'Game Not Found',
                    description: `Game "${gameName}" not found or not available.`,
                    fields: [
                        { name: 'Available Games', value: 'Use `/games` to see all available games.' }
                    ],
                });
                await interaction.editReply({ embeds: [notFoundEmbed] });
                return;
            }
            // Update user statistics
            user.statistics.scriptsUsed++;
            user.statistics.lastScriptUsed = new Date();
            user.lastSeen = new Date();
            await user.save();
            // Update game usage count
            game.usageCount++;
            await game.save();
            // Send script URL with branded embed
            const scriptEmbed = createGameEmbed({
                gameName: game.name,
                description: game.description,
                scriptUrl: game.scriptUrl,
                category: game.category,
                free: game.free,
                keyRequired: game.keyRequired,
                mobileCompatible: game.mobileCompatible,
            });
            await interaction.editReply({ embeds: [scriptEmbed] });
            Logger.info(`User ${interaction.user.tag} retrieved script for ${gameName}`);
        }
        catch (error) {
            Logger.error('Error in getscript command:', error);
            await interaction.editReply({ content: 'An error occurred while retrieving the script. Please try again.' });
        }
    },
};
//# sourceMappingURL=getscript.js.map