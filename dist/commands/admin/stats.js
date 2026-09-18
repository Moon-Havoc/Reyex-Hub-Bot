import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import Game from '../../models/Game.js';
import Poll from '../../models/Poll.js';
import Giveaway from '../../models/Giveaway.js';
import { createStatsEmbed, createErrorEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View live bot and server statistics')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
            const [totalUsers, verifiedUsers, activeUsers, totalGames, scriptsUsedAgg, activePolls, activeGiveaways,] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ isVerified: true }),
                User.countDocuments({ lastSeen: { $gte: sevenDaysAgo } }),
                Game.countDocuments({ isActive: true }),
                User.aggregate([
                    { $group: { _id: null, total: { $sum: '$statistics.scriptsUsed' } } },
                ]),
                Poll.countDocuments({ isActive: true }),
                Giveaway.countDocuments({ isActive: true }),
            ]);
            const scriptsUsed = scriptsUsedAgg[0]?.total ?? 0;
            const verificationRate = totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0;
            const activeRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
            // Uptime in seconds
            const uptime = interaction.client.startedAt
                ? Math.floor((Date.now() - interaction.client.startedAt.getTime()) / 1000)
                : undefined;
            const embed = createStatsEmbed({
                totalUsers,
                verifiedUsers,
                activeUsers,
                totalGames,
                scriptsUsed,
                verificationRate,
                activeRate,
                uptime,
            });
            // Append extra live fields
            embed.addFields({ name: '🗳️  Active Polls', value: String(activePolls), inline: true }, { name: '🎉  Active Giveaways', value: String(activeGiveaways), inline: true }, { name: '🤖  Guilds', value: String(interaction.client.guilds.cache.size), inline: true });
            await interaction.editReply({ embeds: [embed] });
            Logger.info(`Stats viewed by ${interaction.user.tag}`);
        }
        catch (error) {
            Logger.error('Error in /stats', error);
            await interaction.editReply({
                embeds: [createErrorEmbed({ title: 'Error', description: 'Failed to fetch statistics.' })],
            });
        }
    },
};
//# sourceMappingURL=stats.js.map