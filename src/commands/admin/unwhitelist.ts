import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unwhitelist')
    .setDescription('Remove a user\'s access (unwhitelist)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to unwhitelist')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: any) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const targetUser = interaction.options.getUser('user');
      const guild = interaction.guild;

      if (!targetUser) {
        await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Invalid User', description: 'Please provide a valid user.' })] });
        return;
      }

      // Get user from database
      const user = await User.findOne({ discordId: targetUser.id });
      
      if (!user) {
        await interaction.editReply({ embeds: [createErrorEmbed({ title: 'User Not Found', description: 'This user is not in the database.' })] });
        return;
      }

      if (!user.isVerified) {
        await interaction.editReply({ embeds: [createErrorEmbed({ title: 'User Not Verified', description: 'This user is not currently verified.' })] });
        return;
      }

      // Remove verified role
      const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
      if (verifiedRoleId) {
        const verifiedRole = guild.roles.cache.get(verifiedRoleId);
        if (verifiedRole) {
          const member = await guild.members.fetch(targetUser.id);
          await member.roles.remove(verifiedRole);
        }
      }

      // Update user
      user.isVerified = false;
      user.verifiedAt = undefined;
      user.lastSeen = new Date();
      await user.save();

      const successEmbed = createSuccessEmbed({
        title: 'User Unwhitelisted Successfully',
        description: `${targetUser.tag}'s access has been removed.`,
        fields: [
          { name: 'User', value: targetUser.tag, inline: true },
          { name: 'Role Removed', value: 'Verified Role', inline: true },
        ],
      });

      await interaction.editReply({ embeds: [successEmbed] });
      Logger.info(`User ${targetUser.tag} unwhitelisted by ${interaction.user.tag}`);

    } catch (error) {
      Logger.error('Error in unwhitelist command:', error);
      await interaction.editReply({ content: 'An error occurred while unwhitelisting the user. Please try again.' });
    }
  },
};
