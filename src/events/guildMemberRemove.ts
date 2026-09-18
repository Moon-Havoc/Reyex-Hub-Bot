import { Events, GuildMember, TextChannel } from 'discord.js';
import { Logger } from '../utils/logger.js';
import { createBrandedEmbed, ts } from '../utils/embeds.js';
import User from '../models/User.js';

export default {
  name: Events.GuildMemberRemove,

  async execute(member: GuildMember) {
    try {
      // ── Mark lastSeen so we know when they left ───────────────
      await User.updateOne(
        { discordId: member.id },
        { $set: { lastSeen: new Date() } }
      );

      Logger.info(`Member left: ${member.user.tag} (${member.id})`);

      // ── Log to departure channel if configured ────────────────
      const channelId = process.env.LEAVE_CHANNEL_ID;
      if (!channelId) return;

      const channel = member.guild.channels.cache.get(channelId);
      if (!channel?.isTextBased() || !(channel instanceof TextChannel)) return;

      const joinedAt = member.joinedAt;
      const duration = joinedAt
        ? formatDuration(Date.now() - joinedAt.getTime())
        : 'Unknown';

      const embed = createBrandedEmbed({
        color:       'MUTED',
        title:       `👋  ${member.user.username} left the server`,
        description: `**${member.user.tag}** \`(${member.id})\``,
        thumbnail:   member.user.displayAvatarURL({ size: 128, extension: 'png' }),
        fields: [
          {
            name:   '📅  Joined',
            value:  joinedAt ? ts.short(joinedAt) : 'Unknown',
            inline: true,
          },
          {
            name:   '⏱️  Was here for',
            value:  duration,
            inline: true,
          },
          {
            name:   '👥  Server now has',
            value:  `**${member.guild.memberCount.toLocaleString()}** members`,
            inline: true,
          },
        ],
        timestamp: true,
      });

      await channel.send({ embeds: [embed] });
    } catch (error) {
      Logger.error(`Error handling guildMemberRemove for ${member.user.tag}`, error);
    }
  },
};

// ─── Duration formatting ─────────────────────────────────────

function formatDuration(ms: number): string {
  const days    = Math.floor(ms / 86_400_000);
  const hours   = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);

  if (days > 365) {
    const years = Math.floor(days / 365);
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
