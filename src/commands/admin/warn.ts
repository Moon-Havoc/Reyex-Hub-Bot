import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import Warning from '../../models/Warning.js';
import { createErrorEmbed, createSuccessEmbed, createWarningEmbed } from '../../utils/embeds.js';
import { isStaff } from '../../utils/permissions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option =>
      option.setName('user').setDescription('The user to warn').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for the warning').setRequired(true)
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
      const reason = interaction.options.getString('reason');
      const guild = interaction.guild;

      if (targetUser.id === interaction.user.id) {
        await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Cannot Warn Self', description: 'You cannot warn yourself.' })] });
        return;
      }

      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) {
        await interaction.editReply({ embeds: [createErrorEmbed({ title: 'User Not Found', description: 'This user is not in the server.' })] });
        return;
      }

      // Save warning to database
      const warning = new Warning({
        discordId: targetUser.id,
        moderatorId: interaction.user.id,
        reason,
      });
      await warning.save();

      // Count active warnings
      const warningCount = await Warning.countDocuments({ discordId: targetUser.id, active: true });

      // Try to DM the user
      try {
        await targetUser.send({
          embeds: [createWarningEmbed({
            title: 'You Have Been Warned',
            description: `You have been warned in **${guild.name}**.`,
            fields: [
              { name: 'Reason', value: reason },
              { name: 'Total Warnings', value: warningCount.toString() },
            ],
          })],
        });
      } catch {
        // DM may be disabled
      }

      const fields = [
        { name: 'User', value: targetUser.tag, inline: true },
        { name: 'Reason', value: reason, inline: true },
        { name: 'Total Warnings', value: warningCount.toString(), inline: true },
      ];

      if (warningCount >= 3) {
        fields.push({ name: '⚠️ Note', value: `This user now has **${warningCount}** warnings.`, inline: false });
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed({
          title: 'User Warned',
          description: `**${targetUser.tag}** has been warned.`,
          fields,
        })],
      });

      Logger.info(`${targetUser.tag} warned by ${interaction.user.tag}: ${reason} (Warning #${warningCount})`);

    } catch (error) {
      Logger.error('Error in warn command:', error);
      await interaction.editReply({ content: 'An error occurred while warning. Please try again.' });
    }
  },
};
