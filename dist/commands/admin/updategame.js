import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import Game from '../../models/Game.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('updategame')
        .setDescription('Update an existing game/script')
        .addStringOption(option => option
        .setName('name')
        .setDescription('The game name to update')
        .setRequired(true)
        .setAutocomplete(true))
        .addStringOption(option => option
        .setName('script_url')
        .setDescription('New script URL')
        .setRequired(false))
        .addStringOption(option => option
        .setName('description')
        .setDescription('New description')
        .setRequired(false))
        .addStringOption(option => option
        .setName('category')
        .setDescription('New category')
        .setRequired(false))
        .addBooleanOption(option => option
        .setName('active')
        .setDescription('Set game as active/inactive')
        .setRequired(false))
        .addBooleanOption(option => option
        .setName('free')
        .setDescription('Is the script free?')
        .setRequired(false))
        .addBooleanOption(option => option
        .setName('key_required')
        .setDescription('Does the script require a key?')
        .setRequired(false))
        .addBooleanOption(option => option
        .setName('mobile_compatible')
        .setDescription('Is the script mobile compatible?')
        .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const games = await Game.find({}).select('name');
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
            const scriptUrl = interaction.options.getString('script_url');
            const description = interaction.options.getString('description');
            const category = interaction.options.getString('category');
            const active = interaction.options.getBoolean('active');
            const free = interaction.options.getBoolean('free');
            const keyRequired = interaction.options.getBoolean('key_required');
            const mobileCompatible = interaction.options.getBoolean('mobile_compatible');
            // Find the game
            const game = await Game.findOne({ name });
            if (!game) {
                const errorEmbed = createErrorEmbed({
                    title: 'Game Not Found',
                    description: `No game found with the name "${name}".`,
                });
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }
            // Validate URL if provided
            if (scriptUrl) {
                try {
                    new URL(scriptUrl);
                }
                catch {
                    const errorEmbed = createErrorEmbed({
                        title: 'Invalid URL',
                        description: 'Please provide a valid URL for the script.',
                    });
                    await interaction.editReply({ embeds: [errorEmbed] });
                    return;
                }
            }
            // Update fields
            const updates = { updatedAt: new Date() };
            if (scriptUrl)
                updates.scriptUrl = scriptUrl;
            if (description)
                updates.description = description;
            if (category)
                updates.category = category;
            if (active !== null)
                updates.isActive = active;
            if (free !== null)
                updates.free = free;
            if (keyRequired !== null)
                updates.keyRequired = keyRequired;
            if (mobileCompatible !== null)
                updates.mobileCompatible = mobileCompatible;
            // Apply updates
            await Game.updateOne({ name }, updates);
            const successEmbed = createSuccessEmbed({
                title: 'Game Updated Successfully',
                description: `The game "${name}" has been updated.`,
                fields: [
                    { name: 'Name', value: game.name, inline: true },
                    { name: 'Category', value: category || game.category, inline: true },
                    { name: 'Active', value: (active !== null ? active : game.isActive) ? 'Yes' : 'No', inline: true },
                    { name: 'Free', value: (free !== null ? free : game.free) ? 'Yes' : 'No', inline: true },
                    { name: 'Key Required', value: (keyRequired !== null ? keyRequired : game.keyRequired) ? 'Yes' : 'No', inline: true },
                    { name: 'Mobile Compatible', value: (mobileCompatible !== null ? mobileCompatible : game.mobileCompatible) ? 'Yes' : 'No', inline: true }
                ],
            });
            await interaction.editReply({ embeds: [successEmbed] });
            Logger.info(`Game "${name}" updated by ${interaction.user.tag}`);
        }
        catch (error) {
            Logger.error('Error in updategame command:', error);
            await interaction.editReply({ content: 'An error occurred while updating the game. Please try again.' });
        }
    },
};
//# sourceMappingURL=updategame.js.map