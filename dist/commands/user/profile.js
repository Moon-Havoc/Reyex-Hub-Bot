import { SlashCommandBuilder } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import { createErrorEmbed, createProfileEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your profile and verification status')
        .addUserOption(option => option
        .setName('user')
        .setDescription('View another user\'s profile (optional)')
        .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const targetUserId = targetUser.id;
            // Get user from database
            const user = await User.findOne({ discordId: targetUserId });
            if (!user) {
                const notFoundEmbed = createErrorEmbed({
                    title: 'User Not Found',
                    description: 'This user is not in the database.',
                });
                await interaction.editReply({ embeds: [notFoundEmbed] });
                return;
            }
            // Create branded profile embed
            const avatarUrl = user.avatar
                ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
                : undefined;
            const profileEmbed = createProfileEmbed({
                username: user.username,
                discriminator: user.discriminator,
                isVerified: user.isVerified,
                robloxUsername: user.robloxUsername,
                scriptsUsed: user.statistics.scriptsUsed,
                joinedAt: user.joinedAt,
                lastSeen: user.lastSeen,
                verifiedAt: user.verifiedAt,
                lastScriptUsed: user.statistics.lastScriptUsed,
                avatar: avatarUrl,
            });
            await interaction.editReply({ embeds: [profileEmbed] });
            Logger.info(`User ${interaction.user.tag} viewed profile for ${targetUser.tag}`);
        }
        catch (error) {
            Logger.error('Error in profile command:', error);
            await interaction.editReply({ content: 'An error occurred while fetching the profile. Please try again.' });
        }
    },
};
//# sourceMappingURL=profile.js.map