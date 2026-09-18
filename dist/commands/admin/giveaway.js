import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import Giveaway from '../../models/Giveaway.js';
import { createErrorEmbed, createSuccessEmbed, createGiveawayEmbed, createBrandedEmbed, ts, } from '../../utils/embeds.js';
import { scheduleGiveawayEnd } from '../../utils/scheduler.js';
export default {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Start, end, or list giveaways')
        .addSubcommand(sub => sub
        .setName('start')
        .setDescription('Start a new giveaway')
        .addStringOption(opt => opt.setName('name').setDescription('Giveaway name').setRequired(true).setMaxLength(80))
        .addStringOption(opt => opt.setName('description').setDescription('Description').setRequired(true).setMaxLength(300))
        .addStringOption(opt => opt.setName('prize').setDescription('Prize').setRequired(true).setMaxLength(100))
        .addIntegerOption(opt => opt
        .setName('duration_hours')
        .setDescription('Duration in hours (1–720)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(720)))
        .addSubcommand(sub => sub
        .setName('end')
        .setDescription('End a giveaway and pick a winner')
        .addStringOption(opt => opt.setName('giveaway_id').setDescription('Giveaway ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all active giveaways'))
        .addSubcommand(sub => sub
        .setName('reroll')
        .setDescription('Pick a new winner for an ended giveaway')
        .addStringOption(opt => opt.setName('giveaway_id').setDescription('Giveaway ID').setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'start')
            return startGiveaway(interaction);
        if (sub === 'end')
            return endGiveaway(interaction);
        if (sub === 'list')
            return listGiveaways(interaction);
        if (sub === 'reroll')
            return rerollGiveaway(interaction);
    },
};
// ─── Start ────────────────────────────────────────────────────
async function startGiveaway(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const name = interaction.options.getString('name', true);
    const description = interaction.options.getString('description', true);
    const prize = interaction.options.getString('prize', true);
    const durationHours = interaction.options.getInteger('duration_hours', true);
    const endTime = new Date(Date.now() + durationHours * 3_600_000);
    try {
        const giveaway = new Giveaway({
            name,
            description,
            prize,
            endTime,
            isActive: true,
            createdBy: interaction.user.id,
            channelId: interaction.channelId,
            participants: [],
        });
        await giveaway.save();
        const embed = createGiveawayEmbed({
            name,
            description,
            prize,
            endTime,
            participants: 0,
            isActive: true,
            hostedBy: interaction.user.tag,
        });
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
            .setCustomId(`giveaway_join_${giveaway._id}`)
            .setLabel('Enter Giveaway')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎉'), new ButtonBuilder()
            .setCustomId(`giveaway_leave_${giveaway._id}`)
            .setLabel('Leave')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🚪'));
        const msg = await interaction.channel.send({ embeds: [embed], components: [row] });
        giveaway.messageId = msg.id;
        await giveaway.save();
        // Schedule auto-end
        await scheduleGiveawayEnd(interaction.client, giveaway._id.toString(), endTime);
        await interaction.editReply({
            embeds: [createSuccessEmbed({
                    title: 'Giveaway Started',
                    description: `**${name}** is now live!`,
                    fields: [
                        { name: '🎁  Prize', value: prize, inline: true },
                        { name: '⏰  Ends', value: ts.relative(endTime), inline: true },
                        { name: '🆔  ID', value: `\`${giveaway._id}\``, inline: true },
                    ],
                })],
        });
        Logger.info(`Giveaway started: "${name}" by ${interaction.user.tag}`);
    }
    catch (error) {
        Logger.error('Error in /giveaway start', error);
        await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
    }
}
// ─── End ──────────────────────────────────────────────────────
async function endGiveaway(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const giveawayId = interaction.options.getString('giveaway_id', true);
    try {
        const giveaway = await Giveaway.findById(giveawayId);
        if (!giveaway) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Not Found', description: 'No giveaway found with that ID.' })] });
            return;
        }
        if (!giveaway.isActive) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Already Ended', description: 'This giveaway has already ended.' })] });
            return;
        }
        const winnerId = giveaway.participants.length > 0
            ? giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)]
            : null;
        giveaway.isActive = false;
        giveaway.winner = winnerId ?? undefined;
        giveaway.endedAt = new Date();
        await giveaway.save();
        // Update original embed
        if (giveaway.messageId && giveaway.channelId) {
            try {
                const ch = await interaction.client.channels.fetch(giveaway.channelId);
                const msg = ch && 'messages' in ch ? await ch.messages.fetch(giveaway.messageId) : null;
                if (msg) {
                    const updatedEmbed = createGiveawayEmbed({
                        name: giveaway.name,
                        description: giveaway.description,
                        prize: giveaway.prize,
                        endTime: giveaway.endTime,
                        participants: giveaway.participants.length,
                        isActive: false,
                        winner: winnerId ?? undefined,
                    });
                    await msg.edit({ embeds: [updatedEmbed], components: [] });
                }
            }
            catch { /* message deleted */ }
        }
        const winnerUser = winnerId
            ? await interaction.client.users.fetch(winnerId).catch(() => null)
            : null;
        // Public announcement
        if (giveaway.channelId) {
            const ch = await interaction.client.channels.fetch(giveaway.channelId).catch(() => null);
            if (ch?.isTextBased()) {
                await ch.send({
                    content: winnerId ? `🎉  Congratulations <@${winnerId}>!` : undefined,
                    embeds: [createSuccessEmbed({
                            title: `🏆  ${giveaway.name} — Giveaway Ended`,
                            description: winnerId
                                ? `<@${winnerId}> won **${giveaway.prize}**! 🎊`
                                : 'The giveaway ended with no entries.',
                            fields: [
                                { name: '👥  Entries', value: String(giveaway.participants.length), inline: true },
                                { name: '🏆  Winner', value: winnerId ? `<@${winnerId}>` : 'No winner', inline: true },
                            ],
                        })],
                });
            }
        }
        await interaction.editReply({
            embeds: [createSuccessEmbed({
                    title: 'Giveaway Ended',
                    description: `**${giveaway.name}** has ended.`,
                    fields: [
                        { name: '🏆  Winner', value: winnerUser?.tag ?? 'No entries', inline: true },
                        { name: '👥  Entries', value: String(giveaway.participants.length), inline: true },
                    ],
                })],
        });
        Logger.info(`Giveaway ended: "${giveaway.name}" — winner: ${winnerUser?.tag ?? 'none'}`);
    }
    catch (error) {
        Logger.error('Error in /giveaway end', error);
        await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
    }
}
// ─── List ─────────────────────────────────────────────────────
async function listGiveaways(interaction) {
    await interaction.deferReply();
    try {
        const active = await Giveaway.find({ isActive: true }).sort({ endTime: 1 });
        if (active.length === 0) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Active Giveaways', description: 'There are no active giveaways right now.' })] });
            return;
        }
        const fields = active.map((g, i) => ({
            name: `${i + 1}.  ${g.name}`,
            value: `🎁 ${g.prize}\n⏰ ${ts.relative(g.endTime)}  •  👥 ${g.participants.length} entries\n\`ID: ${g._id}\``,
            inline: false,
        }));
        await interaction.editReply({
            embeds: [createBrandedEmbed({
                    color: 'GOLD',
                    title: `🎉  Active Giveaways (${active.length})`,
                    description: 'Use `/giveaway end <id>` to end one early.',
                    fields,
                    thumbnail: null,
                })],
        });
    }
    catch (error) {
        Logger.error('Error in /giveaway list', error);
        await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
    }
}
// ─── Reroll ───────────────────────────────────────────────────
async function rerollGiveaway(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const giveawayId = interaction.options.getString('giveaway_id', true);
    try {
        const giveaway = await Giveaway.findById(giveawayId);
        if (!giveaway) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Not Found', description: 'No giveaway found with that ID.' })] });
            return;
        }
        if (giveaway.isActive) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Still Active', description: 'End the giveaway first before rerolling.' })] });
            return;
        }
        if (giveaway.participants.length === 0) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Entries', description: 'This giveaway had no participants.' })] });
            return;
        }
        const newWinnerId = giveaway.participants[Math.floor(Math.random() * giveaway.participants.length)];
        giveaway.winner = newWinnerId;
        await giveaway.save();
        const winner = await interaction.client.users.fetch(newWinnerId).catch(() => null);
        await interaction.editReply({
            embeds: [createSuccessEmbed({
                    title: 'Giveaway Rerolled',
                    description: `New winner selected for **${giveaway.name}**!`,
                    fields: [
                        { name: '🏆  New Winner', value: winner?.tag ?? `<@${newWinnerId}>`, inline: true },
                        { name: '🎁  Prize', value: giveaway.prize, inline: true },
                    ],
                })],
        });
        Logger.info(`Giveaway rerolled: "${giveaway.name}" — new winner: ${winner?.tag ?? newWinnerId}`);
    }
    catch (error) {
        Logger.error('Error in /giveaway reroll', error);
        await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
    }
}
//# sourceMappingURL=giveaway.js.map