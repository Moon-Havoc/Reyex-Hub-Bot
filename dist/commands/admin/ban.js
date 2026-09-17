import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/embeds.js';
import { isStaff } from '../../utils/permissions.js';
export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option => option.setName('user').setDescription('The user to ban').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for the ban').setRequired(false))
        .addIntegerOption(option => option
        .setName('days')
        .setDescription('Number of days of messages to delete (0-7)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            if (!isStaff(interaction.member)) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Permission', description: 'You need the Staff role to use this command.' })] });
                return;
            }
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const days = interaction.options.getInteger('days') || 0;
            const guild = interaction.guild;
            if (targetUser.id === interaction.user.id) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Cannot Ban Self', description: 'You cannot ban yourself.' })] });
                return;
            }
            const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
            if (!targetMember) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'User Not Found', description: 'This user is not in the server.' })] });
                return;
            }
            if (!targetMember.bannable) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Cannot Ban User', description: 'This user cannot be banned. They may have a higher role than the bot.' })] });
                return;
            }
            if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Role Hierarchy', description: 'You cannot ban a user with an equal or higher role.' })] });
                return;
            }
            // Try to DM the user before banning
            try {
                await targetUser.send({
                    embeds: [createErrorEmbed({
                            title: 'You Have Been Banned',
                            description: `You have been banned from **${guild.name}**.`,
                            fields: [
                                { name: 'Reason', value: reason },
                                { name: 'Banned By', value: interaction.user.tag },
                            ],
                        })],
                });
            }
            catch {
                // DM may be disabled
            }
            await targetMember.ban({ deleteMessageSeconds: days * 86400, reason: `${reason} | Banned by ${interaction.user.tag}` });
            await interaction.editReply({
                embeds: [createSuccessEmbed({
                        title: 'User Banned',
                        description: `**${targetUser.tag}** has been banned.`,
                        fields: [
                            { name: 'Reason', value: reason, inline: true },
                            { name: 'Messages Deleted', value: `${days} day(s)`, inline: true },
                        ],
                    })],
            });
            Logger.info(`${targetUser.tag} banned by ${interaction.user.tag}: ${reason}`);
        }
        catch (error) {
            Logger.error('Error in ban command:', error);
            await interaction.editReply({ content: 'An error occurred while banning. Please try again.' });
        }
    },
};
//# sourceMappingURL=ban.js.map