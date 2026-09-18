import { SlashCommandBuilder } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import { createErrorEmbed, createProfileEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription("View your profile or another member's profile")
        .addUserOption(opt => opt.setName('user').setDescription('Member to look up (default: yourself)').setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('user') ?? interaction.user;
        const targetId = target.id;
        try {
            const user = await User.findOne({ discordId: targetId });
            if (!user) {
                await interaction.editReply({
                    embeds: [createErrorEmbed({
                            title: 'User Not Found',
                            description: target.id === interaction.user.id
                                ? "You don't have a profile yet — run `/verify start` to get one."
                                : 'That member has no profile in the database.',
                        })],
                });
                return;
            }
            // Prefer Discord CDN avatar from the live user object (fresher than stored hash)
            const avatarUrl = target.displayAvatarURL({ size: 256, extension: 'png' });
            const embed = createProfileEmbed({
                username: user.username,
                discriminator: user.discriminator,
                discordId: user.discordId,
                isVerified: user.isVerified,
                robloxUsername: user.robloxUsername,
                robloxId: user.robloxId,
                scriptsUsed: user.statistics.scriptsUsed,
                joinedAt: user.joinedAt,
                lastSeen: user.lastSeen,
                verifiedAt: user.verifiedAt,
                lastScriptUsed: user.statistics.lastScriptUsed,
                avatar: avatarUrl,
            });
            // Silently update lastSeen for own-profile views
            if (target.id === interaction.user.id) {
                await User.updateOne({ discordId: targetId }, { $set: { lastSeen: new Date() } });
            }
            await interaction.editReply({ embeds: [embed] });
            Logger.info(`Profile viewed: ${interaction.user.tag} → ${target.tag}`);
        }
        catch (error) {
            Logger.error('Error in /profile', error);
            await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
        }
    },
};
//# sourceMappingURL=profile.js.map