import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import Giveaway from '../../models/Giveaway.js';
import { createErrorEmbed, createSuccessEmbed, createGiveawayEmbed, createBrandedEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways')
        .addSubcommand(subcommand => subcommand
        .setName('start')
        .setDescription('Start a new giveaway')
        .addStringOption(option => option
        .setName('name')
        .setDescription('Giveaway name')
        .setRequired(true))
        .addStringOption(option => option
        .setName('description')
        .setDescription('Giveaway description')
        .setRequired(true))
        .addStringOption(option => option
        .setName('prize')
        .setDescription('The prize')
        .setRequired(true))
        .addIntegerOption(option => option
        .setName('duration_hours')
        .setDescription('Duration in hours')
        .setRequired(true)
        .setMinValue(1)))
        .addSubcommand(subcommand => subcommand
        .setName('end')
        .setDescription('End a giveaway and pick a winner')
        .addStringOption(option => option
        .setName('giveaway_id')
        .setDescription('Giveaway ID or name')
        .setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('list')
        .setDescription('List all active giveaways'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'start') {
            await startGiveaway(interaction);
        }
        else if (subcommand === 'end') {
            await endGiveaway(interaction);
        }
        else if (subcommand === 'list') {
            await listGiveaways(interaction);
        }
    },
};
async function startGiveaway(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const name = interaction.options.getString('name');
        const description = interaction.options.getString('description');
        const prize = interaction.options.getString('prize');
        const durationHours = interaction.options.getInteger('duration_hours');
        const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000);
        // Create giveaway
        const giveaway = new Giveaway({
            name,
            description,
            prize,
            endTime,
            isActive: true,
            createdBy: interaction.user.id,
            createdAt: new Date(),
            participants: [],
        });
        await giveaway.save();
        // Create giveaway embed
        const giveawayEmbed = createGiveawayEmbed({
            name,
            description,
            prize,
            endTime,
            participants: 0,
            isActive: true,
        });
        // Create join button
        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
            .setCustomId(`giveaway_join_${giveaway._id}`)
            .setLabel('Join Giveaway')
            .setStyle(ButtonStyle.Primary));
        // Send giveaway message
        const channel = interaction.channel;
        const giveawayMessage = await channel.send({
            embeds: [giveawayEmbed],
            components: [row]
        });
        // Store message ID for updates
        giveaway.messageId = giveawayMessage.id;
        await giveaway.save();
        const successEmbed = createSuccessEmbed({
            title: 'Giveaway Started',
            description: `Giveaway "${name}" has been started and will end in ${durationHours} hours.`,
            fields: [
                { name: 'Giveaway ID', value: giveaway._id.toString(), inline: true },
                { name: 'Prize', value: prize, inline: true },
            ],
        });
        await interaction.editReply({ embeds: [successEmbed] });
        Logger.info(`Giveaway "${name}" started by ${interaction.user.tag}`);
    }
    catch (error) {
        Logger.error('Error in giveaway start command:', error);
        await interaction.editReply({ content: 'An error occurred while starting the giveaway. Please try again.' });
    }
}
async function endGiveaway(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const giveawayId = interaction.options.getString('giveaway_id');
        // Find giveaway
        const giveaway = await Giveaway.findById(giveawayId);
        if (!giveaway) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Giveaway Not Found', description: 'No giveaway found with that ID.' })] });
            return;
        }
        if (!giveaway.isActive) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Giveaway Already Ended', description: 'This giveaway has already ended.' })] });
            return;
        }
        if (giveaway.participants.length === 0) {
            // End giveaway with no winner
            giveaway.isActive = false;
            giveaway.endedAt = new Date();
            await giveaway.save();
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Giveaway Ended - No Participants', description: 'The giveaway ended with no participants.' })] });
            return;
        }
        // Pick random winner
        const randomIndex = Math.floor(Math.random() * giveaway.participants.length);
        const winnerId = giveaway.participants[randomIndex];
        // Update giveaway
        giveaway.isActive = false;
        giveaway.winner = winnerId;
        giveaway.endedAt = new Date();
        await giveaway.save();
        // Get winner user
        const winnerUser = await interaction.client.users.fetch(winnerId);
        const successEmbed = createSuccessEmbed({
            title: 'Giveaway Ended',
            description: `The giveaway "${giveaway.name}" has ended and a winner has been selected!`,
            fields: [
                { name: 'Winner', value: winnerUser.tag, inline: true },
                { name: 'Prize', value: giveaway.prize, inline: true },
                { name: 'Total Participants', value: giveaway.participants.length.toString(), inline: true },
            ],
        });
        await interaction.editReply({ embeds: [successEmbed] });
        Logger.info(`Giveaway "${giveaway.name}" ended by ${interaction.user.tag}. Winner: ${winnerUser.tag}`);
    }
    catch (error) {
        Logger.error('Error in giveaway end command:', error);
        await interaction.editReply({ content: 'An error occurred while ending the giveaway. Please try again.' });
    }
}
async function listGiveaways(interaction) {
    await interaction.deferReply();
    try {
        const activeGiveaways = await Giveaway.find({ isActive: true }).sort({ endTime: 1 });
        if (activeGiveaways.length === 0) {
            await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Active Giveaways', description: 'There are currently no active giveaways.' })] });
            return;
        }
        const listEmbed = createBrandedEmbed({
            color: 'PRIMARY',
            title: '🎉 Active Giveaways',
            description: `Found ${activeGiveaways.length} active giveaway(s)`,
            fields: activeGiveaways.map((giveaway, index) => ({
                name: `${index + 1}. ${giveaway.name}`,
                value: `Prize: ${giveaway.prize}\nEnds: ${giveaway.endTime.toLocaleString()}\nParticipants: ${giveaway.participants.length}\nID: ${giveaway._id}`,
                inline: false,
            })),
        });
        await interaction.editReply({ embeds: [listEmbed] });
        Logger.info(`Giveaway list viewed by ${interaction.user.tag}`);
    }
    catch (error) {
        Logger.error('Error in giveaway list command:', error);
        await interaction.editReply({ content: 'An error occurred while listing giveaways. Please try again.' });
    }
}
//# sourceMappingURL=giveaway.js.map