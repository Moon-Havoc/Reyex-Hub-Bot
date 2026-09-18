import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import { createBroadcastEmbed, createSuccessEmbed, createErrorEmbed, createInfoEmbed } from '../../utils/embeds.js';

const DM_DELAY_MS = 800; // avoid Discord rate limits

export default {
  data: new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('DM all verified members with an announcement')
    .addStringOption(opt =>
      opt.setName('message').setDescription('The message to broadcast').setRequired(true).setMaxLength(1500)
    )
    .addStringOption(opt =>
      opt.setName('title').setDescription('Embed title (default: Announcement)').setRequired(false).setMaxLength(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const message = interaction.options.getString('message', true);
    const title   = interaction.options.getString('title') ?? 'Announcement';

    try {
      const verifiedUsers = await User.find({ isVerified: true }).select('discordId').lean();

      if (verifiedUsers.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed({ title: 'No Recipients', description: 'There are no verified members to broadcast to.' })],
        });
        return;
      }

      // Initial progress response
      await interaction.editReply({
        embeds: [createInfoEmbed({
          title:       'Broadcast in Progress',
          description: `Sending to **${verifiedUsers.length}** verified member${verifiedUsers.length !== 1 ? 's' : ''}…\nThis may take a moment.`,
        })],
      });

      const embed = createBroadcastEmbed({ title, message, author: interaction.user.tag });

      let sent   = 0;
      let failed = 0;

      for (const { discordId } of verifiedUsers) {
        try {
          const user = await interaction.client.users.fetch(discordId);
          await user.send({ embeds: [embed] });
          sent++;
        } catch {
          failed++;
        }
        await sleep(DM_DELAY_MS);
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed({
          title:       'Broadcast Complete',
          description: `Message delivered to **${sent}** member${sent !== 1 ? 's' : ''}${failed > 0 ? `, failed for **${failed}** (DMs disabled)` : ''}.`,
          fields: [
            { name: '✅  Delivered', value: String(sent),                        inline: true },
            { name: '❌  Failed',    value: `${failed} (DMs disabled or blocked)`, inline: true },
            { name: '📋  Message',   value: title,                               inline: true },
          ],
        })],
      });

      Logger.info(`Broadcast "${title}" by ${interaction.user.tag}: ${sent} sent, ${failed} failed`);
    } catch (error) {
      Logger.error('Error in /broadcast', error);
      await interaction.editReply({ content: '❌  An error occurred during the broadcast.' });
    }
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
