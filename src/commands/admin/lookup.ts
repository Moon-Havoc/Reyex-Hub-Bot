import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import { RobloxAPI } from '../../utils/roblox.js';
import { createErrorEmbed, createBrandedEmbed, ts } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lookup')
    .setDescription('Look up a Discord member (by ID) or a Roblox account (by username)')
    .addStringOption(opt =>
      opt
        .setName('target')
        .setDescription('Discord user ID  or  Roblox username')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const target       = interaction.options.getString('target', true).trim();
    const isDiscordId  = /^\d{17,20}$/.test(target);

    try {
      if (isDiscordId) {
        await discordLookup(interaction, target);
      } else {
        await robloxLookup(interaction, target);
      }
    } catch (error) {
      Logger.error('Error in /lookup', error);
      await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
    }
  },
};

// ─── Discord Lookup ───────────────────────────────────────────

async function discordLookup(interaction: ChatInputCommandInteraction, userId: string): Promise<void> {
  const guild  = interaction.guild!;
  const member = await guild.members.fetch(userId).catch(() => null);

  if (!member) {
    await interaction.editReply({
      embeds: [createErrorEmbed({
        title:       'Member Not Found',
        description: `No member with ID \`${userId}\` found in this server.`,
      })],
    });
    return;
  }

  const dbUser = await User.findOne({ discordId: userId });

  const roles = member.roles.cache
    .filter(r => r.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map(r => `<@&${r.id}>`)
    .join(', ') || '`None`';

  // Account flags
  const flags = member.user.flags?.toArray() ?? [];
  const flagStr = flags.length
    ? flags.map(f => `\`${f}\``).join(', ')
    : '`None`';

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: '🏷️  Tag',             value: `\`${member.user.tag}\``,                             inline: true  },
    { name: '🪪  User ID',          value: `\`${member.user.id}\``,                              inline: true  },
    { name: '🤖  Bot',              value: member.user.bot ? '`Yes`' : '`No`',                   inline: true  },
    { name: '📅  Account Created',  value: ts.relative(member.user.createdAt),                   inline: true  },
    { name: '📥  Joined Server',    value: member.joinedAt ? ts.relative(member.joinedAt) : '`Unknown`', inline: true },
    { name: '📛  Nickname',         value: member.nickname ? `\`${member.nickname}\`` : '`None`', inline: true  },
    { name: '🏳️  Public Flags',     value: flagStr,                                              inline: false },
    { name: '🎭  Roles',            value: roles.length > 800 ? roles.slice(0, 797) + '…' : roles, inline: false },
  ];

  // ── Database section ──
  if (dbUser) {
    fields.push(
      { name: '\u200b', value: '**── Database ──**', inline: false },
      { name: '✅  Verified',       value: dbUser.isVerified ? '`Yes`' : '`No`',                 inline: true  },
      { name: '🎮  Roblox',        value: dbUser.robloxUsername ? `[\`${dbUser.robloxUsername}\`](https://www.roblox.com/users/${dbUser.robloxId}/profile)` : '`Not linked`', inline: true },
      { name: '📜  Scripts Used',  value: `\`${dbUser.statistics.scriptsUsed}\``,                inline: true  },
      { name: '👁️  Last Seen',     value: ts.relative(dbUser.lastSeen),                          inline: true  },
    );

    if (dbUser.isVerified && dbUser.verifiedAt) {
      fields.push({ name: '🔗  Verified At', value: ts.relative(dbUser.verifiedAt), inline: true });
    }

    // ── Roblox section (if linked) ──
    if (dbUser.robloxId) {
      const roblox = await RobloxAPI.getUserById(dbUser.robloxId);
      if (roblox) {
        fields.push(
          { name: '\u200b', value: '**── Roblox ──**', inline: false },
          { name: '👤  Display Name',   value: `\`${roblox.displayName}\``,                   inline: true },
          { name: '📅  Account Created', value: ts.relative(new Date(roblox.created)),        inline: true },
          { name: '🔢  Account Age',    value: RobloxAPI.accountAge(roblox.created),          inline: true },
          { name: '🚫  Banned',         value: roblox.isBanned ? '`Yes` ⚠️' : '`No`',       inline: true },
        );
        if (roblox.description) {
          fields.push({
            name:  '📄  Profile Description',
            value: `\`\`\`${roblox.description.slice(0, 500)}${roblox.description.length > 500 ? '…' : ''}\`\`\``,
          });
        }
      }
    }
  } else {
    fields.push({ name: '\u200b', value: '**── Database ──**\n`Not registered`', inline: false });
  }

  const embed = createBrandedEmbed({
    color:     'INFO',
    title:     `🔍  Discord — ${member.user.tag}`,
    fields,
    thumbnail: member.user.displayAvatarURL({ size: 256, extension: 'png' }),
    footer:    `Lookup by ${interaction.user.tag}`,
  });

  await interaction.editReply({ embeds: [embed] });
  Logger.info(`Discord lookup: ${member.user.tag} by ${interaction.user.tag}`);
}

// ─── Roblox Lookup ────────────────────────────────────────────

async function robloxLookup(interaction: ChatInputCommandInteraction, username: string): Promise<void> {
  const roblox = await RobloxAPI.getUserByUsername(username);

  if (!roblox) {
    await interaction.editReply({
      embeds: [createErrorEmbed({
        title:       'Roblox User Not Found',
        description: `No Roblox user found for **"${username}"**.`,
      })],
    });
    return;
  }

  const linked = await User.findOne({ robloxId: roblox.id });
  let discordInfo = '`Not linked`';

  if (linked) {
    const guildMember = await interaction.guild!.members.fetch(linked.discordId).catch(() => null);
    discordInfo = guildMember
      ? `${guildMember.user.tag}  (<@${guildMember.user.id}>)`
      : `\`${linked.username}\` (left server)`;
  }

  const headshot = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${roblox.id}&size=180x180&format=Png&isCircular=false`;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: '👤  Username',         value: `\`${roblox.name}\``,                                inline: true },
    { name: '🎭  Display Name',     value: `\`${roblox.displayName}\``,                         inline: true },
    { name: '🪪  Roblox ID',        value: `\`${roblox.id}\``,                                  inline: true },
    { name: '📅  Account Created',  value: ts.relative(new Date(roblox.created)),                inline: true },
    { name: '🔢  Account Age',      value: RobloxAPI.accountAge(roblox.created),                 inline: true },
    { name: '🚫  Banned',           value: roblox.isBanned ? '`Yes` ⚠️' : '`No`',              inline: true },
    { name: '🔗  Linked Discord',   value: discordInfo,                                          inline: false },
  ];

  if (roblox.description) {
    fields.push({
      name:  '📄  Profile Description',
      value: `\`\`\`${roblox.description.slice(0, 600)}${roblox.description.length > 600 ? '…' : ''}\`\`\``,
    });
  }

  if (linked?.statistics) {
    fields.push({
      name:   '📜  Scripts Used',
      value:  `\`${linked.statistics.scriptsUsed}\``,
      inline: true,
    });
  }

  const embed = createBrandedEmbed({
    color:     roblox.isBanned ? 'ERROR' : 'INFO',
    title:     `🔍  Roblox — ${roblox.name}`,
    url:       `https://www.roblox.com/users/${roblox.id}/profile`,
    fields,
    thumbnail: headshot,
    footer:    `Lookup by ${interaction.user.tag}`,
  });

  await interaction.editReply({ embeds: [embed] });
  Logger.info(`Roblox lookup: ${roblox.name} by ${interaction.user.tag}`);
}
