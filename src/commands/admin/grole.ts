import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/embeds.js';
import { isStaff } from '../../utils/permissions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('grole')
    .setDescription('Give or remove a role from a user')
    .addUserOption(option =>
      option.setName('user').setDescription('The user to modify').setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role').setDescription('The role to give or remove').setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Give or remove the role')
        .setRequired(true)
        .addChoices(
          { name: 'Give', value: 'give' },
          { name: 'Remove', value: 'remove' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

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
      const role = interaction.options.getRole('role');
      const action = interaction.options.getString('action');
      const guild = interaction.guild;

      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) {
        await interaction.editReply({
          embeds: [createErrorEmbed({ title: 'User Not Found', description: 'This user is not in the server.' })],
        });
        return;
      }

      if (role.position >= interaction.member.roles.highest.position) {
        await interaction.editReply({
          embeds: [createErrorEmbed({
            title: 'Role Hierarchy',
            description: 'You cannot assign a role equal to or higher than your highest role.',
          })],
        });
        return;
      }

      if (role.position >= guild.members.me.roles.highest.position) {
        await interaction.editReply({
          embeds: [createErrorEmbed({
            title: 'Role Hierarchy',
            description: 'The bot cannot assign a role equal to or higher than its highest role.',
          })],
        });
        return;
      }

      if (role.managed) {
        await interaction.editReply({
          embeds: [createErrorEmbed({
            title: 'Managed Role',
            description: 'This role is managed by an integration and cannot be manually assigned.',
          })],
        });
        return;
      }

      const hasRole = targetMember.roles.cache.has(role.id);

      if (action === 'give') {
        if (hasRole) {
          await interaction.editReply({
            embeds: [createErrorEmbed({
              title: 'Already Has Role',
              description: `**${targetUser.tag}** already has the **${role.name}** role.`,
            })],
          });
          return;
        }

        await targetMember.roles.add(role, `Role given by ${interaction.user.tag}`);
        await interaction.editReply({
          embeds: [createSuccessEmbed({
            title: 'Role Given',
            description: `**${role.name}** has been added to **${targetUser.tag}**.`,
          })],
        });
        Logger.info(`${interaction.user.tag} gave role "${role.name}" to ${targetUser.tag}`);
      } else {
        if (!hasRole) {
          await interaction.editReply({
            embeds: [createErrorEmbed({
              title: 'Does Not Have Role',
              description: `**${targetUser.tag}** does not have the **${role.name}** role.`,
            })],
          });
          return;
        }

        await targetMember.roles.remove(role, `Role removed by ${interaction.user.tag}`);
        await interaction.editReply({
          embeds: [createSuccessEmbed({
            title: 'Role Removed',
            description: `**${role.name}** has been removed from **${targetUser.tag}**.`,
          })],
        });
        Logger.info(`${interaction.user.tag} removed role "${role.name}" from ${targetUser.tag}`);
      }
    } catch (error) {
      Logger.error('Error in grole command:', error);
      await interaction.editReply({ content: 'An error occurred while modifying the role. Please try again.' });
    }
  },
};
