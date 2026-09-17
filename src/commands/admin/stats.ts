import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import Game from '../../models/Game.js';
import { createStatsEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View bot statistics')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: any) {
    await interaction.deferReply();

    try {
      // Get statistics
      const totalUsers = await User.countDocuments();
      const verifiedUsers = await User.countDocuments({ isVerified: true });
      const activeUsers = await User.countDocuments({ 
        lastSeen: { 
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        } 
      });
      const totalGames = await Game.countDocuments({ isActive: true });
      const totalScriptsUsed = await User.aggregate([
        { $group: { _id: null, total: { $sum: '$statistics.scriptsUsed' } } }
      ]);

      const scriptsUsedCount = totalScriptsUsed[0]?.total || 0;

      const statsEmbed = createStatsEmbed({
        totalUsers,
        verifiedUsers,
        activeUsers,
        totalGames,
        scriptsUsed: scriptsUsedCount,
        verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100) : 0,
        activeRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100) : 0,
      });

      await interaction.editReply({ embeds: [statsEmbed] });
      Logger.info(`Statistics viewed by ${interaction.user.tag}`);

    } catch (error) {
      Logger.error('Error in stats command:', error);
      await interaction.editReply({ content: 'An error occurred while fetching statistics. Please try again.' });
    }
  },
};
