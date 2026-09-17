import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import { createErrorEmbed, createSuccessEmbed, createBroadcastEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('broadcast')
        .setDescription('Send an announcement to all verified users')
        .addStringOption(option => option
        .setName('message')
        .setDescription('The announcement message')
        .setRequired(true))
        .addStringOption(option => option
        .setName('title')
        .setDescription('Announcement title')
        .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const message = interaction.options.getString('message');
            const title = interaction.options.getString('title') || '📢 Announcement';
            if (!message) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Invalid Message', description: 'Please provide a valid message.' })] });
                return;
            }
            // Get all verified users
            const verifiedUsers = await User.find({ isVerified: true });
            if (verifiedUsers.length === 0) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Verified Users', description: 'There are no verified users to send the broadcast to.' })] });
                return;
            }
            // Create announcement embed
            const announcementEmbed = createBroadcastEmbed({
                title,
                message,
                author: interaction.user.tag,
            });
            // Send DMs to all verified users
            let successCount = 0;
            let failureCount = 0;
            for (const user of verifiedUsers) {
                try {
                    const discordUser = await interaction.client.users.fetch(user.discordId);
                    await discordUser.send({ embeds: [announcementEmbed] });
                    successCount++;
                    // Rate limiting to avoid Discord API limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (error) {
                    failureCount++;
                    Logger.warn(`Failed to send broadcast to user ${user.discordId}: ${error}`);
                }
            }
            const resultEmbed = createSuccessEmbed({
                title: 'Broadcast Sent',
                description: 'Announcement sent to verified users.',
                fields: [
                    { name: 'Total Verified Users', value: verifiedUsers.length.toString(), inline: true },
                    { name: 'Successfully Sent', value: successCount.toString(), inline: true },
                    { name: 'Failed', value: failureCount.toString(), inline: true },
                ],
            });
            await interaction.editReply({ embeds: [resultEmbed] });
            Logger.info(`Broadcast sent by ${interaction.user.tag}: ${successCount} successful, ${failureCount} failed`);
        }
        catch (error) {
            Logger.error('Error in broadcast command:', error);
            await interaction.editReply({ content: 'An error occurred while sending the broadcast. Please try again.' });
        }
    },
};
//# sourceMappingURL=broadcast.js.map