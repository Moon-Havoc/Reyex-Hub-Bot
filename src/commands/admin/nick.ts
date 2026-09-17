import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/embeds.js';
import { isStaff } from '../../utils/permissions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Change a user\'s nickname')
    .addUserOption(option =>
      option.setName('user').setDescription('The user to change nickname for').setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('nickname')
        .setDescription('The new nickname (leave empty to reset)')
        .setRequired(false)
        .setMaxLength(32)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

  async execute(interaction: any) {
    await interaction.deferReply({ ephemeral: true });

    try {
      if (!isStaff(interaction.member)) {
        await interaction.editReply({
          embeds: [createErrorEmbed({ title: 'No Permission', description: 'You need the Staff role to use this command.' })],
        });
        return;
      }
      const targetUser = interaction.options.getUser('user');
      const nickname = interaction.options.getString('nickname');
      const guild = interaction.guild;

      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) {
        await interaction.editReply({
          embeds: [createErrorEmbed({ title: 'User Not Found', description: 'This user is not in the server.' })],
        });
        return;
      }

      if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== guild.ownerId) {
        await interaction.editReply({
          embeds: [createErrorEmbed({
            title: 'Role Hierarchy',
            description: 'You cannot change the nickname of a user with an equal or higher role.',
          })],
        });
        return;
      }

      if (!targetMember.manageable) {
        await interaction.editReply({
          embeds: [createErrorEmbed({
            title: 'Cannot Modify User',
            description: 'This user cannot be modified. They may have a higher role than the bot.',
          })],
        });
        return;
      }

      const oldNickname = targetMember.nickname || targetUser.username;
      await targetMember.setNickname(nickname, `Nickname changed by ${interaction.user.tag}`);

      const newNickname = nickname || targetUser.username;
      await interaction.editReply({
        embeds: [createSuccessEmbed({
          title: 'Nickname Changed',
          description: `**${targetUser.tag}**'s nickname has been updated.`,
          fields: [
            { name: 'Old', value: oldNickname, inline: true },
            { name: 'New', value: newNickname, inline: true },
          ],
        })],
      });

      Logger.info(`${interaction.user.tag} changed ${targetUser.tag}'s nickname from "${oldNickname}" to "${newNickname}"`);
    } catch (error) {
      Logger.error('Error in nick command:', error);
      await interaction.editReply({ content: 'An error occurred while changing the nickname. Please try again.' });
    }
  },
};
