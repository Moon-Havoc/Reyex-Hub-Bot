import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { Logger } from '../../utils/logger.js';
import Poll from '../../models/Poll.js';
import { createErrorEmbed, createSuccessEmbed, createPollEmbed, ts } from '../../utils/embeds.js';
import { schedulePollEnd } from '../../utils/scheduler.js';

const OPTION_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'] as const;

export default {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create and manage community polls')
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a new poll')
        .addStringOption(opt =>
          opt.setName('question').setDescription('The poll question').setRequired(true).setMaxLength(200)
        )
        .addStringOption(opt =>
          opt.setName('option1').setDescription('Option 1').setRequired(true).setMaxLength(80)
        )
        .addStringOption(opt =>
          opt.setName('option2').setDescription('Option 2').setRequired(true).setMaxLength(80)
        )
        .addStringOption(opt =>
          opt.setName('option3').setDescription('Option 3').setRequired(false).setMaxLength(80)
        )
        .addStringOption(opt =>
          opt.setName('option4').setDescription('Option 4').setRequired(false).setMaxLength(80)
        )
        .addStringOption(opt =>
          opt.setName('option5').setDescription('Option 5').setRequired(false).setMaxLength(80)
        )
        .addIntegerOption(opt =>
          opt
            .setName('duration_hours')
            .setDescription('Auto-end after N hours (1–168, optional)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(168)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('end')
        .setDescription('End a poll early')
        .addStringOption(opt =>
          opt.setName('poll_id').setDescription('The poll ID').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('List all active polls')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'create') return createPoll(interaction);
    if (sub === 'end')    return endPoll(interaction);
    if (sub === 'list')   return listPolls(interaction);
  },
};

// ─── Create ───────────────────────────────────────────────────

async function createPoll(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const question    = interaction.options.getString('question', true);
  const optionTexts = [
    interaction.options.getString('option1'),
    interaction.options.getString('option2'),
    interaction.options.getString('option3'),
    interaction.options.getString('option4'),
    interaction.options.getString('option5'),
  ].filter((o): o is string => Boolean(o));

  const durationHours = interaction.options.getInteger('duration_hours') ?? null;
  const endTime       = durationHours ? new Date(Date.now() + durationHours * 3_600_000) : undefined;

  try {
    const poll = await Poll.create({
      question,
      options:   optionTexts.map(text => ({ text, voters: [] })),
      createdBy: interaction.user.id,
      isActive:  true,
      endTime,
      channelId: interaction.channelId,
    });

    const embed = createPollEmbed({
      question,
      options:   poll.options,
      createdBy: interaction.user.tag,
      endTime,
      isActive:  true,
    });

    // One button per option (max 5)
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      optionTexts.map((text, i) =>
        new ButtonBuilder()
          .setCustomId(`poll_vote_${poll._id}_${i}`)
          .setLabel(text.length > 20 ? text.slice(0, 18) + '…' : text)
          .setEmoji(OPTION_EMOJIS[i])
          .setStyle(ButtonStyle.Secondary)
      )
    );

    const message = await (interaction.channel as import('discord.js').TextChannel).send({ embeds: [embed], components: [row] });

    poll.messageId = message.id;
    await poll.save();

    // Schedule auto-end
    if (endTime) {
      await schedulePollEnd(interaction.client, poll._id.toString(), endTime);
    }

    const confirmEmbed = createSuccessEmbed({
      title:       'Poll Created',
      description: `**"${question}"** is now live!`,
      fields: [
        { name: 'Options',  value: optionTexts.map((t, i) => `${OPTION_EMOJIS[i]} ${t}`).join('\n') },
        { name: 'Poll ID',  value: `\`${poll._id}\``, inline: true },
        ...(endTime ? [{ name: 'Auto-ends', value: ts.relative(endTime), inline: true }] : []),
      ],
    });

    await interaction.editReply({ embeds: [confirmEmbed] });
    Logger.info(`Poll created: "${question}" by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error('Error in /poll create', error);
    await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
  }
}

// ─── End ─────────────────────────────────────────────────────

async function endPoll(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const pollId = interaction.options.getString('poll_id', true);

  try {
    const poll = await Poll.findById(pollId);
    if (!poll) {
      await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Poll Not Found', description: 'No poll found with that ID.' })] });
      return;
    }
    if (!poll.isActive) {
      await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Already Ended', description: 'This poll has already ended.' })] });
      return;
    }

    const isCreator = poll.createdBy === interaction.user.id;
    const isAdmin   = (interaction.member as any)?.permissions?.has(PermissionFlagsBits.Administrator);
    if (!isCreator && !isAdmin) {
      await interaction.editReply({ embeds: [createErrorEmbed({ title: 'Not Authorized', description: 'Only the poll creator or an admin can end this poll.' })] });
      return;
    }

    poll.isActive = false;
    poll.endedAt  = new Date();
    await poll.save();

    const creator = await interaction.client.users.fetch(poll.createdBy).catch(() => null);
    const resultEmbed = createPollEmbed({
      question:  poll.question,
      options:   poll.options,
      createdBy: creator?.tag ?? 'Unknown',
      isActive:  false,
    });

    // Edit the original poll message
    if (poll.messageId && poll.channelId) {
      try {
        const ch  = await interaction.client.channels.fetch(poll.channelId);
        const msg = ch && 'messages' in ch
          ? await (ch as any).messages.fetch(poll.messageId)
          : null;
        if (msg) await msg.edit({ embeds: [resultEmbed], components: [] });
      } catch { /* message may have been deleted */ }
    }

    const totalVotes = poll.options.reduce((s, o) => s + o.voters.length, 0);
    const winner     = [...poll.options].sort((a, b) => b.voters.length - a.voters.length)[0];

    await interaction.editReply({
      embeds: [createSuccessEmbed({
        title:       'Poll Ended',
        description: `**"${poll.question}"** is now closed.`,
        fields: [
          {
            name:  '🏆  Winner',
            value: winner?.voters.length > 0
              ? `${OPTION_EMOJIS[poll.options.indexOf(winner)]} **${winner.text}** — ${winner.voters.length} vote${winner.voters.length !== 1 ? 's' : ''}`
              : 'No votes cast',
          },
          { name: '🗳️  Total Votes', value: String(totalVotes), inline: true },
        ],
      })],
    });
    Logger.info(`Poll ended: "${poll.question}" by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error('Error in /poll end', error);
    await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
  }
}

// ─── List ─────────────────────────────────────────────────────

async function listPolls(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  try {
    const activePolls = await Poll.find({ isActive: true }).sort({ createdAt: -1 });

    if (activePolls.length === 0) {
      await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Active Polls', description: 'There are no active polls right now.' })] });
      return;
    }

    const fields = activePolls.map((poll, i) => {
      const totalVotes = poll.options.reduce((s, o) => s + o.voters.length, 0);
      const opts       = poll.options
        .map((o, j) => `${OPTION_EMOJIS[j]} ${o.text} — **${o.voters.length}**`)
        .join('\n');
      return {
        name:   `${i + 1}.  ${poll.question}`,
        value:  `${opts}\n🗳️ ${totalVotes} vote${totalVotes !== 1 ? 's' : ''}  •  ${poll.endTime ? ts.relative(poll.endTime) : 'No timer'}\n\`ID: ${poll._id}\``,
        inline: false,
      };
    });

    await interaction.editReply({
      embeds: [createSuccessEmbed({
        title:       `🗳️  Active Polls (${activePolls.length})`,
        description: 'Vote on any poll using the buttons on the poll message.',
        fields,
      })],
    });
  } catch (error) {
    Logger.error('Error in /poll list', error);
    await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
  }
}
