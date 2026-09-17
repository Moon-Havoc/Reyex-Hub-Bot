import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/embeds.js';
import { isStaff } from '../../utils/permissions.js';
export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option => option.setName('user').setDescription('The user to kick').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for the kick').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            if (!isStaff(interaction.member)) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Permission', description: 'You need the Staff role to use this command.' })] });
                return;
            }
            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const guild = interaction.guild;
            if (targetUser.id === interaction.user.id) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Cannot Kick Self', description: 'You cannot kick yourself.' })] });
                return;
            }
            const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
            if (!targetMember) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'User Not Found', description: 'This user is not in the server.' })] });
                return;
            }
            if (!targetMember.kickable) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Cannot Kick User', description: 'This user cannot be kicked. They may have a higher role than the bot.' })] });
                return;
            }
            if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Role Hierarchy', description: 'You cannot kick a user with an equal or higher role.' })] });
                return;
            }
            // Try to DM the user before kicking
            try {
                await targetUser.send({
                    embeds: [createErrorEmbed({
                            title: 'You Have Been Kicked',
                            description: `You have been kicked from **${guild.name}**.`,
                            fields: [
                                { name: 'Reason', value: reason },
                                { name: 'Kicked By', value: interaction.user.tag },
                            ],
                        })],
                });
            }
            catch {
                // DM may be disabled
            }
            await targetMember.kick(`${reason} | Kicked by ${interaction.user.tag}`);
            await interaction.editReply({
                embeds: [createSuccessEmbed({
                        title: 'User Kicked',
                        description: `**${targetUser.tag}** has been kicked.`,
                        fields: [
                            { name: 'Reason', value: reason, inline: true },
                        ],
                    })],
            });
            Logger.info(`${targetUser.tag} kicked by ${interaction.user.tag}: ${reason}`);
        }
        catch (error) {
            Logger.error('Error in kick command:', error);
            await interaction.editReply({ content: 'An error occurred while kicking. Please try again.' });
        }
    },
};
//# sourceMappingURL=kick.js.map