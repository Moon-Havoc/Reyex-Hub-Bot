import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/embeds.js';
import { isStaff } from '../../utils/permissions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user (mute them temporarily)')
    .addUserOption(option =>
      option.setName('user').setDescription('The user to timeout').setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('Duration in minutes')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320) // 28 days
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for the timeout').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: any) {
    await interaction.deferReply({ ephemeral: true });

    try {
      if (!isStaff(interaction.member)) {
        await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Permission', description: 'You need the Staff role to use this command.' })] });
        return;
      }
      const targetUser = interaction.options.getUser('user');
      const duration = interaction.options.getInteger('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const guild = interaction.guild;

      if (targetUser.id === interaction.user.id) {
        await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Cannot Timeout Self', description: 'You cannot timeout yourself.' })] });
        return;
      }

      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) {
        await interaction.editReply({ embeds: [createErrorEmbed({ title: 'User Not Found', description: 'This user is not in the server.' })] });
        return;
      }

      if (!targetMember.moderatable) {
        await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Cannot Timeout User', description: 'This user cannot be timed out. They may have a higher role than the bot.' })] });
        return;
      }

      if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
        await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Role Hierarchy', description: 'You cannot timeout a user with an equal or higher role.' })] });
        return;
      }

      const durationMs = duration * 60 * 1000;
      await targetMember.timeout(durationMs, `${reason} | Timeout by ${interaction.user.tag}`);

      // Format duration nicely
      let durationStr = '';
      if (duration < 60) {
        durationStr = `${duration} minute${duration !== 1 ? 's' : ''}`;
      } else if (duration < 1440) {
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        durationStr = `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
      } else {
        const days = Math.floor(duration / 1440);
        const hours = Math.floor((duration % 1440) / 60);
        durationStr = `${days}d ${hours > 0 ? `${hours}h` : ''}`;
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed({
          title: 'User Timed Out',
          description: `**${targetUser.tag}** has been timed out.`,
          fields: [
            { name: 'Duration', value: durationStr, inline: true },
            { name: 'Reason', value: reason, inline: true },
          ],
        })],
      });

      Logger.info(`${targetUser.tag} timed out by ${interaction.user.tag} for ${durationStr}: ${reason}`);

    } catch (error) {
      Logger.error('Error in timeout command:', error);
      await interaction.editReply({ content: 'An error occurred while timing out. Please try again.' });
    }
  },
};
