import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/embeds.js';
import { isStaff } from '../../utils/permissions.js';
export default {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option => option.setName('user_id').setDescription('The user ID to unban').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            if (!isStaff(interaction.member)) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Permission', description: 'You need the Staff role to use this command.' })] });
                return;
            }
            const userId = interaction.options.getString('user_id');
            const guild = interaction.guild;
            let targetUser;
            try {
                targetUser = await interaction.client.users.fetch(userId);
            }
            catch {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Invalid User ID', description: 'Could not find a user with that ID.' })] });
                return;
            }
            try {
                await guild.members.unban(userId);
            }
            catch {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Not Banned', description: 'This user is not banned or the ban was not found.' })] });
                return;
            }
            await interaction.editReply({
                embeds: [createSuccessEmbed({
                        title: 'User Unbanned',
                        description: `**${targetUser.tag}** has been unbanned.`,
                    })],
            });
            Logger.info(`${targetUser.tag} unbanned by ${interaction.user.tag}`);
        }
        catch (error) {
            Logger.error('Error in unban command:', error);
            await interaction.editReply({ content: 'An error occurred while unbanning. Please try again.' });
        }
    },
};
//# sourceMappingURL=unban.js.map