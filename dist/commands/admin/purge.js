import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/embeds.js';
import { isStaff } from '../../utils/permissions.js';
export default {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete messages from the channel')
        .addIntegerOption(option => option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
        .addUserOption(option => option.setName('user').setDescription('Only delete messages from this user').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            if (!isStaff(interaction.member)) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Permission', description: 'You need the Staff role to use this command.' })] });
                return;
            }
            const amount = interaction.options.getInteger('amount');
            const targetUser = interaction.options.getUser('user');
            const channel = interaction.channel;
            if (!channel || !('messages' in channel)) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Invalid Channel', description: 'This command can only be used in text channels.' })] });
                return;
            }
            // Fetch messages
            const fetched = await channel.messages.fetch({ limit: amount });
            // Filter by user if specified
            let messagesToDelete = targetUser
                ? fetched.filter((msg) => msg.author.id === targetUser.id)
                : fetched;
            // Filter out messages older than 14 days (Discord limitation)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            messagesToDelete = messagesToDelete.filter((msg) => msg.createdTimestamp > twoWeeksAgo);
            if (messagesToDelete.size === 0) {
                await interaction.editReply({
                    embeds: [createErrorEmbed({
                            title: 'No Messages Found',
                            description: targetUser
                                ? `No deletable messages from ${targetUser.tag} in the last ${amount} messages.`
                                : 'No deletable messages found. Messages older than 14 days cannot be deleted.',
                        })],
                });
                return;
            }
            const deleted = await channel.bulkDelete(messagesToDelete, true);
            await interaction.editReply({
                embeds: [createSuccessEmbed({
                        title: 'Messages Purged',
                        description: `Deleted **${deleted.size}** message(s)${targetUser ? ` from ${targetUser.tag}` : ''}.`,
                    })],
            });
            Logger.info(`${deleted.size} messages purged by ${interaction.user.tag}${targetUser ? ` from ${targetUser.tag}` : ''} in #${channel.name}`);
            // Auto-delete the confirmation after 5 seconds
            setTimeout(async () => {
                try {
                    const reply = await interaction.fetchReply();
                    await reply.delete();
                }
                catch {
                    // Already deleted
                }
            }, 5000);
        }
        catch (error) {
            Logger.error('Error in purge command:', error);
            await interaction.editReply({ content: 'An error occurred while purging messages. Please try again.' });
        }
    },
};
//# sourceMappingURL=purge.js.map