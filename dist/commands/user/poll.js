import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import Poll from '../../models/Poll.js';
import { createErrorEmbed, createSuccessEmbed, createPollEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create and manage polls')
        .addSubcommand(subcommand => subcommand
        .setName('create')
        .setDescription('Create a new poll')
        .addStringOption(option => option.setName('question').setDescription('The poll question').setRequired(true))
        .addStringOption(option => option.setName('option1').setDescription('Option 1').setRequired(true))
        .addStringOption(option => option.setName('option2').setDescription('Option 2').setRequired(true))
        .addStringOption(option => option.setName('option3').setDescription('Option 3').setRequired(false))
        .addStringOption(option => option.setName('option4').setDescription('Option 4').setRequired(false))
        .addStringOption(option => option.setName('option5').setDescription('Option 5').setRequired(false))
        .addIntegerOption(option => option
        .setName('duration_hours')
        .setDescription('Duration in hours (default: no timer)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(168)))
        .addSubcommand(subcommand => subcommand
        .setName('end')
        .setDescription('End a poll early')
        .addStringOption(option => option.setName('poll_id').setDescription('The poll ID').setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('list')
        .setDescription('List all active polls')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'create') {
            await createPoll(interaction);
        }
        else if (subcommand === 'end') {
            await endPoll(interaction);
        }
        else if (subcommand === 'list') {
            await listPolls(interaction);
        }
    },
};
const OPTION_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
async function createPoll(interaction) {
    await interaction.deferReply();
    try {
        const question = interaction.options.getString('question');
        const optionTexts = [
            interaction.options.getString('option1'),
            interaction.options.getString('option2'),
            interaction.options.getString('option3'),
            interaction.options.getString('option4'),
            interaction.options.getString('option5'),
        ].filter(Boolean);
        const durationHours = interaction.options.getInteger('duration_hours');
        const endTime = durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000) : undefined;
        const options = optionTexts.map(text => ({ text, voters: [] }));
        const poll = new Poll({
            question,
            options,
            createdBy: interaction.user.id,
            isActive: true,
            endTime,
            channelId: interaction.channelId,
        });
        await poll.save();
        const pollEmbed = createPollEmbed({
            question,
            options: poll.options,
            createdBy: interaction.user.tag,
            endTime,
            isActive: true,
        });
        const row = new ActionRowBuilder();
        optionTexts.forEach((text, i) => {
            row.addComponents(new ButtonBuilder()
                .setCustomId(`poll_vote_${poll._id}_${i}`)
                .setLabel(text)
                .setEmoji(OPTION_EMOJIS[i])
                .setStyle(ButtonStyle.Secondary));
        });
        const message = await interaction.channel.send({ embeds: [pollEmbed], components: [row] });
        poll.messageId = message.id;
        await poll.save();
        const successEmbed = createSuccessEmbed({
            title: 'Poll Created',
            description: `Poll **"${question}"** is now live!`,
            fields: [
                { name: 'Options', value: optionTexts.map((t, i) => `${OPTION_EMOJIS[i]} ${t}`).join('\n'), inline: false },
                { name: 'Poll ID', value: poll._id.toString(), inline: true },
                ...(durationHours ? [{ name: 'Ends In', value: `${durationHours} hour${durationHours !== 1 ? 's' : ''}`, inline: true }] : []),
            ],
        });
        await interaction.editReply({ embeds: [successEmbed] });
        Logger.info(`Poll "${question}" created by ${interaction.user.tag}`);
    }
    catch (error) {
        Logger.error('Error creating poll:', error);
        await interaction.editReply({ content: 'An error occurred while creating the poll. Please try again.' });
    }
}
async function endPoll(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const pollId = interaction.options.getString('poll_id');
        const poll = await Poll.findById(pollId);
        if (!poll) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Poll Not Found', description: 'No poll found with that ID.' })] });
            return;
        }
        if (!poll.isActive) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Poll Already Ended', description: 'This poll has already ended.' })] });
            return;
        }
        if (poll.createdBy !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Not Authorized', description: 'Only the poll creator or an admin can end this poll.' })] });
            return;
        }
        poll.isActive = false;
        poll.endedAt = new Date();
        await poll.save();
        const resultEmbed = createPollEmbed({
            question: poll.question,
            options: poll.options,
            createdBy: interaction.user.tag,
            isActive: false,
        });
        // Update the original poll message
        if (poll.messageId && poll.channelId) {
            try {
                const channel = await interaction.client.channels.fetch(poll.channelId);
                if (channel && 'messages' in channel) {
                    const message = await channel.messages.fetch(poll.messageId);
                    await message.edit({ embeds: [resultEmbed], components: [] });
                }
            }
            catch {
                // Message may have been deleted
            }
        }
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voters.length, 0);
        const winner = [...poll.options].sort((a, b) => b.voters.length - a.voters.length)[0];
        await interaction.editReply({
            embeds: [createSuccessEmbed({
                    title: 'Poll Ended',
                    description: `**"${poll.question}"** has been ended.`,
                    fields: [
                        { name: 'Winner', value: winner && winner.voters.length > 0 ? `${OPTION_EMOJIS[poll.options.indexOf(winner)]} ${winner.text} (${winner.voters.length} votes)` : 'No votes', inline: false },
                        { name: 'Total Votes', value: totalVotes.toString(), inline: true },
                    ],
                })],
        });
        Logger.info(`Poll "${poll.question}" ended by ${interaction.user.tag}`);
    }
    catch (error) {
        Logger.error('Error ending poll:', error);
        await interaction.editReply({ content: 'An error occurred while ending the poll. Please try again.' });
    }
}
async function listPolls(interaction) {
    await interaction.deferReply();
    try {
        const activePolls = await Poll.find({ isActive: true }).sort({ createdAt: -1 });
        if (activePolls.length === 0) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Active Polls', description: 'There are currently no active polls.' })] });
            return;
        }
        const fields = activePolls.map((poll, i) => {
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voters.length, 0);
            const optionsList = poll.options.map((opt, j) => `${OPTION_EMOJIS[j]} ${opt.text} — ${opt.voters.length} votes`).join('\n');
            return {
                name: `${i + 1}. ${poll.question}`,
                value: `${optionsList}\n⏰ ${poll.endTime ? `Ends ${poll.endTime.toLocaleString()}` : 'No timer'} • 🗳️ ${totalVotes} vote${totalVotes !== 1 ? 's' : ''}\nID: \`${poll._id}\``,
                inline: false,
            };
        });
        const listEmbed = createSuccessEmbed({
            title: 'Active Polls',
            description: `Found ${activePolls.length} active poll(s)`,
            fields,
        });
        await interaction.editReply({ embeds: [listEmbed] });
        Logger.info(`Poll list viewed by ${interaction.user.tag}`);
    }
    catch (error) {
        Logger.error('Error listing polls:', error);
        await interaction.editReply({ content: 'An error occurred while listing polls. Please try again.' });
    }
}
//# sourceMappingURL=poll.js.map