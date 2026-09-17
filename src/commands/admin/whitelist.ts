import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Manually whitelist a user (bypass verification)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to whitelist')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('roblox_username')
        .setDescription('Roblox username (optional)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: any) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const targetUser = interaction.options.getUser('user');
      const robloxUsername = interaction.options.getString('roblox_username');
      const guild = interaction.guild;

      if (!targetUser) {
        await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Invalid User', description: 'Please provide a valid user.' })] });
        return;
      }

      // Get or create user
      let user = await User.findOne({ discordId: targetUser.id });
      
      const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
      if (!verifiedRoleId) {
        Logger.error('VERIFIED_ROLE_ID not set in environment variables');
        await interaction.editReply({ content: 'Server configuration error. Please contact staff.' });
        return;
      }

      const verifiedRole = guild.roles.cache.get(verifiedRoleId);
      if (!verifiedRole) {
        Logger.error(`Verified role not found: ${verifiedRoleId}`);
        await interaction.editReply({ content: 'Server configuration error. Please contact staff.' });
        return;
      }

      if (user) {
        // Update existing user
        user.isVerified = true;
        user.verifiedAt = new Date();
        user.lastSeen = new Date();
        if (robloxUsername) {
          user.robloxUsername = robloxUsername;
        }
        await user.save();
      } else {
        // Create new user
        const member = await guild.members.fetch(targetUser.id);
        user = new User({
          discordId: targetUser.id,
          username: targetUser.username,
          discriminator: targetUser.discriminator,
          avatar: targetUser.avatar,
          robloxUsername: robloxUsername,
          isVerified: true,
          verifiedAt: new Date(),
          lastSeen: new Date(),
          joinedAt: member.joinedAt,
          roles: [verifiedRoleId],
        });
        await user.save();
      }

      // Add verified role
      const member = await guild.members.fetch(targetUser.id);
      await member.roles.add(verifiedRole);

      const successEmbed = createSuccessEmbed({
        title: 'User Whitelisted Successfully',
        description: `${targetUser.tag} has been whitelisted and granted access to scripts.`,
        fields: [
          { name: 'User', value: targetUser.tag, inline: true },
          { name: 'Roblox Username', value: robloxUsername || 'Not set', inline: true },
          { name: 'Role Added', value: verifiedRole.name, inline: true },
        ],
      });

      await interaction.editReply({ embeds: [successEmbed] });
      Logger.info(`User ${targetUser.tag} whitelisted by ${interaction.user.tag}`);

    } catch (error) {
      Logger.error('Error in whitelist command:', error);
      await interaction.editReply({ content: 'An error occurred while whitelisting the user. Please try again.' });
    }
  },
};
