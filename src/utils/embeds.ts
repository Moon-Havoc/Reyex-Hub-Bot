import { EmbedBuilder, ColorResolvable, Client } from 'discord.js';
import { Logger } from './logger.js';

// Reyex Hub Brand Colors — polished palette
export const BrandColors = {
  PRIMARY: '#DC143C',      // Crimson red
  SUCCESS: '#2ECC71',      // Emerald green
  ERROR: '#E74C3C',        // Soft red
  WARNING: '#F39C12',      // Amber
  INFO: '#3498DB',         // Sky blue
  DARK: '#1a1a1a',         // Dark background
  ACCENT: '#8B0000',       // Dark red accent
  MUTED: '#95A5A6',        // Gray for secondary text
};

// Reyex Hub Brand Constants
export const BrandConfig = {
  FOOTER_TEXT: 'Reyex Hub',
  FOOTER_ICON: '',
  THUMBNAIL: '',
  AUTHOR_NAME: 'Reyex Hub',
  AUTHOR_ICON: '',
};

/**
 * Fetch the bot's avatar and set it as the brand icon/thumbnail.
 */
export async function initBrandAssets(client: Client): Promise<void> {
  try {
    const avatarURL = client.user?.avatarURL({ size: 128, extension: 'png' }) || '';
    BrandConfig.THUMBNAIL = avatarURL;
    BrandConfig.AUTHOR_ICON = avatarURL;
    BrandConfig.FOOTER_ICON = avatarURL;
    Logger.info(`Brand assets initialized with bot avatar`);
  } catch (error) {
    Logger.warn('Failed to fetch bot avatar for brand assets');
  }
}

/**
 * Core branded embed builder
 */
export function createBrandedEmbed(options: {
  color?: keyof typeof BrandColors | string;
  title?: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  thumbnail?: string;
  image?: string;
  author?: string;
  footer?: string;
  timestamp?: boolean;
}): EmbedBuilder {
  const {
    color = 'PRIMARY',
    title,
    description,
    fields,
    thumbnail,
    image,
    author,
    footer,
    timestamp = true,
  } = options;

  const embed = new EmbedBuilder();

  if (typeof color === 'string' && color in BrandColors) {
    embed.setColor(BrandColors[color as keyof typeof BrandColors] as ColorResolvable);
  } else {
    embed.setColor(color as ColorResolvable);
  }

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields && fields.length > 0) embed.addFields(fields);

  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  } else if (BrandConfig.THUMBNAIL && BrandConfig.THUMBNAIL.length > 0) {
    embed.setThumbnail(BrandConfig.THUMBNAIL);
  }

  if (image) embed.setImage(image);

  if (author) {
    embed.setAuthor({ name: author, iconURL: BrandConfig.AUTHOR_ICON });
  } else {
    embed.setAuthor({ name: BrandConfig.AUTHOR_NAME, iconURL: BrandConfig.AUTHOR_ICON });
  }

  if (footer) {
    embed.setFooter({ text: footer, iconURL: BrandConfig.FOOTER_ICON });
  } else {
    embed.setFooter({ text: BrandConfig.FOOTER_TEXT, iconURL: BrandConfig.FOOTER_ICON });
  }

  if (timestamp) embed.setTimestamp();

  return embed;
}

// ─── Status Embeds ─────────────────────────────────────────────

export function createSuccessEmbed(options: {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}): EmbedBuilder {
  return createBrandedEmbed({
    color: 'SUCCESS',
    title: `✅ ${options.title}`,
    description: options.description,
    fields: options.fields,
  });
}

export function createErrorEmbed(options: {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}): EmbedBuilder {
  return createBrandedEmbed({
    color: 'ERROR',
    title: `❌ ${options.title}`,
    description: options.description,
    fields: options.fields,
  });
}

export function createWarningEmbed(options: {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}): EmbedBuilder {
  return createBrandedEmbed({
    color: 'WARNING',
    title: `⚠️ ${options.title}`,
    description: options.description,
    fields: options.fields,
  });
}

export function createInfoEmbed(options: {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}): EmbedBuilder {
  return createBrandedEmbed({
    color: 'INFO',
    title: `ℹ️ ${options.title}`,
    description: options.description,
    fields: options.fields,
  });
}

export function createBrandedInfoEmbed(options: {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}): EmbedBuilder {
  return createBrandedEmbed({
    color: 'PRIMARY',
    title: options.title,
    description: options.description,
    fields: options.fields,
  });
}

// ─── Game Embeds ───────────────────────────────────────────────

export function createGameEmbed(options: {
  gameName: string;
  description: string;
  scriptUrl: string;
  category: string;
  usageCount?: number;
  free?: boolean;
  keyRequired?: boolean;
  mobileCompatible?: boolean;
}): EmbedBuilder {
  const tags: string[] = [];
  if (options.free !== undefined) tags.push(options.free ? 'Free' : 'Paid');
  if (options.keyRequired) tags.push('Key Required');
  if (options.mobileCompatible) tags.push('Mobile Compatible');
  const tagStr = tags.length > 0 ? `\n> ${tags.join(' • ')}` : '';

  return createBrandedEmbed({
    color: 'PRIMARY',
    title: `🎮 ${options.gameName}`,
    description: `> ${options.description}${tagStr}\n\n📂 **${options.category}**`,
    fields: [
      {
        name: '📜 Script',
        value: `\`\`\`\n${options.scriptUrl}\n\`\`\``,
        inline: false,
      },
    ],
    footer: 'Copy the script URL and paste it into your executor.',
  });
}

export function createGamesListEmbed(options: {
  games: Array<{ name: string; description: string; category: string; usageCount: number; free: boolean; keyRequired: boolean; mobileCompatible: boolean }>;
  category?: string;
}): EmbedBuilder {
  if (options.games.length === 0) {
    return createBrandedEmbed({
      color: 'WARNING',
      title: '🎮 Game Library',
      description: 'No games are currently available.\n\nAdmins can add games with `/addgame`.',
    });
  }

  const grouped: Record<string, typeof options.games> = {};
  for (const game of options.games) {
    const cat = game.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(game);
  }

  const categories = Object.keys(grouped).sort();
  const fields: { name: string; value: string; inline: boolean }[] = [];

  for (const cat of categories) {
    const games = grouped[cat];
    const list = games
      .slice(0, 10)
      .map(g => {
        const tags: string[] = [];
        if (g.free) tags.push('Free');
        else tags.push('Paid');
        if (g.keyRequired) tags.push('Key');
        if (g.mobileCompatible) tags.push('Mobile');
        const tagStr = tags.length > 0 ? `\n> ${tags.join(' • ')}` : '';
        return `**${g.name}**${tagStr}`;
      })
      .join('\n');

    const remaining = games.length - 10;
    const suffix = remaining > 0 ? `\n\n*...and ${remaining} more*` : '';

    fields.push({
      name: `${cat} (${games.length})`,
      value: list + suffix,
      inline: false,
    });

    if (fields.length >= 24) break;
  }

  return createBrandedEmbed({
    color: 'PRIMARY',
    title: `🎮 Game Library${options.category ? ` — ${options.category}` : ''}`,
    description: `**${options.games.length}** game${options.games.length !== 1 ? 's' : ''}`,
    fields,
  });
}

// ─── Profile Embed ─────────────────────────────────────────────

export function createProfileEmbed(options: {
  username: string;
  discriminator: string;
  isVerified: boolean;
  robloxUsername?: string;
  scriptsUsed: number;
  joinedAt: Date;
  lastSeen: Date;
  verifiedAt?: Date;
  lastScriptUsed?: Date;
  avatar?: string;
}): EmbedBuilder {
  const status = options.isVerified ? '`Verified` ✅' : '`Not Verified` ❌';

  const fields = [
    { name: 'Account', value: `\`${options.username}#${options.discriminator}\``, inline: true },
    { name: 'Status', value: status, inline: true },
    { name: 'Roblox', value: options.robloxUsername ? `\`${options.robloxUsername}\`` : '`Not linked`', inline: true },
    { name: 'Scripts Used', value: `**${options.scriptsUsed.toLocaleString()}**`, inline: true },
    { name: 'Joined', value: `<t:${Math.floor(options.joinedAt.getTime() / 1000)}:R>`, inline: true },
    { name: 'Last Seen', value: `<t:${Math.floor(options.lastSeen.getTime() / 1000)}:R>`, inline: true },
  ];

  if (options.isVerified && options.verifiedAt) {
    fields.push({ name: 'Verified', value: `<t:${Math.floor(options.verifiedAt.getTime() / 1000)}:R>`, inline: true });
  }

  return createBrandedEmbed({
    color: options.isVerified ? 'SUCCESS' : 'MUTED',
    title: options.username,
    fields,
    thumbnail: options.avatar,
  });
}

// ─── Stats Embed ───────────────────────────────────────────────

export function createStatsEmbed(options: {
  totalUsers: number;
  verifiedUsers: number;
  activeUsers: number;
  totalGames: number;
  scriptsUsed: number;
  verificationRate: number;
  activeRate: number;
}): EmbedBuilder {
  const bar = (pct: number, len = 10) => {
    const filled = Math.round((pct / 100) * len);
    return '`' + '█'.repeat(filled) + '░'.repeat(len - filled) + '`';
  };

  return createBrandedEmbed({
    color: 'PRIMARY',
    title: '📊 Bot Statistics',
    description: 'Current performance and activity metrics',
    fields: [
      {
        name: 'Users',
        value: [
          `**Total:** ${options.totalUsers.toLocaleString()}`,
          `**Verified:** ${options.verifiedUsers.toLocaleString()}`,
          `**Active (7d):** ${options.activeUsers.toLocaleString()}`,
        ].join('\n'),
        inline: true,
      },
      {
        name: 'Content',
        value: [
          `**Games:** ${options.totalGames.toLocaleString()}`,
          `**Scripts Used:** ${options.scriptsUsed.toLocaleString()}`,
        ].join('\n'),
        inline: true,
      },
      {
        name: 'Verification',
        value: `${bar(options.verificationRate)} **${options.verificationRate.toFixed(1)}%**`,
        inline: false,
      },
      {
        name: 'Activity',
        value: `${bar(options.activeRate)} **${options.activeRate.toFixed(1)}%**`,
        inline: false,
      },
    ],
  });
}

// ─── Giveaway Embed ────────────────────────────────────────────

export function createGiveawayEmbed(options: {
  name: string;
  description: string;
  prize: string;
  endTime: Date;
  participants: number;
  isActive: boolean;
  winner?: string;
}): EmbedBuilder {
  const fields = [
    { name: 'Prize', value: `🎁 **${options.prize}**`, inline: true },
    { name: 'Ends', value: `<t:${Math.floor(options.endTime.getTime() / 1000)}:R>`, inline: true },
    { name: 'Entries', value: `👥 **${options.participants.toLocaleString()}**`, inline: true },
  ];

  if (!options.isActive && options.winner) {
    fields.push({ name: 'Winner', value: `🏆 ${options.winner}`, inline: true });
  }

  return createBrandedEmbed({
    color: options.isActive ? 'PRIMARY' : 'SUCCESS',
    title: options.isActive ? `🎉 ${options.name}` : `🏆 ${options.name}`,
    description: options.description,
    fields,
  });
}

// ─── Broadcast Embed ───────────────────────────────────────────

export function createBroadcastEmbed(options: {
  title: string;
  message: string;
  author: string;
}): EmbedBuilder {
  return createBrandedEmbed({
    color: 'PRIMARY',
    title: `📢 ${options.title}`,
    description: options.message,
    footer: `Announcement by ${options.author}`,
  });
}

// ─── Poll Embed ────────────────────────────────────────────────

export function createPollEmbed(options: {
  question: string;
  options: { text: string; voters: string[] }[];
  createdBy: string;
  endTime?: Date;
  isActive: boolean;
}): EmbedBuilder {
  const totalVotes = options.options.reduce((sum, opt) => sum + opt.voters.length, 0);
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

  const fields = options.options.map((opt, i) => {
    const count = opt.voters.length;
    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    const barLen = 12;
    const filled = Math.round((pct / 100) * barLen);
    const bar = '`' + '█'.repeat(filled) + '░'.repeat(barLen - filled) + '`';

    return {
      name: `${emojis[i]} ${opt.text}`,
      value: `${bar} **${pct}%** — ${count} vote${count !== 1 ? 's' : ''}`,
      inline: false,
    };
  });

  const description = options.options
    .map((opt, i) => `${emojis[i]} **${opt.text}**`)
    .join('\n');

  return createBrandedEmbed({
    color: options.isActive ? 'PRIMARY' : 'SUCCESS',
    title: options.isActive ? `📊 ${options.question}` : `📊 ${options.question} — Ended`,
    description,
    fields,
    footer: options.isActive
      ? `Vote by clicking below${options.endTime ? ` • Ends <t:${Math.floor(options.endTime.getTime() / 1000)}:R>` : ''}`
      : `Final results • ${totalVotes} total vote${totalVotes !== 1 ? 's' : ''}`,
  });
}

// ─── Executor Status Embed ─────────────────────────────────────

export function createExecutorsEmbed(options: {
  executors: {
    title: string;
    version: string;
    platform: string;
    detected: boolean;
    updated: boolean;
    free: boolean;
    cost?: string;
    uncStatus: boolean;
    suncPercentage?: number;
    statusEmoji: string;
    statusText: string;
    platformEmoji: string;
  }[];
  lastUpdated: Date;
}): EmbedBuilder {
  if (options.executors.length === 0) {
    return createBrandedEmbed({
      color: 'WARNING',
      title: '🔍 Executor Status',
      description: 'No executor data available at this time.',
    });
  }

  const updated = options.executors.filter(e => e.updated).length;
  const detected = options.executors.filter(e => e.detected).length;
  const pending = options.executors.filter(e => !e.updated && !e.detected).length;

  // Group by platform
  const platformOrder = ['Windows', 'Mac', 'Android'];
  const grouped: Record<string, typeof options.executors> = {};
  for (const exp of options.executors) {
    const plat = exp.platform || 'Unknown';
    if (!grouped[plat]) grouped[plat] = [];
    grouped[plat].push(exp);
  }

  const fields: { name: string; value: string; inline: boolean }[] = [];

  for (const platform of platformOrder) {
    const execs = grouped[platform];
    if (!execs || execs.length === 0) continue;

    const platEmoji = execs[0].platformEmoji;
    const det = execs.filter(e => e.detected);
    const upd = execs.filter(e => e.updated);
    const pen = execs.filter(e => !e.updated && !e.detected);

    const sections: string[] = [];

    if (det.length > 0) {
      sections.push(`**🔴 Detected** — ${det.length}`);
      for (const e of det) {
        sections.push(`> ${e.title} \`${e.version}\`${e.suncPercentage ? ` • sUNC ${e.suncPercentage}%` : ''}`);
      }
    }

    if (upd.length > 0) {
      sections.push(`**🟢 Updated** — ${upd.length}`);
      for (const e of upd) {
        sections.push(`> ${e.title} \`${e.version}\`${e.suncPercentage ? ` • sUNC ${e.suncPercentage}%` : ''}`);
      }
    }

    if (pen.length > 0) {
      sections.push(`**🟡 Pending** — ${pen.length}`);
      for (const e of pen) {
        sections.push(`> ${e.title} \`${e.version}\`${e.suncPercentage ? ` • sUNC ${e.suncPercentage}%` : ''}`);
      }
    }

    fields.push({
      name: `${platEmoji} ${platform} (${execs.length})`,
      value: sections.join('\n'),
      inline: false,
    });
  }

  // Unknown platforms
  const knownPlatforms = new Set(platformOrder);
  const unknown = options.executors.filter(e => !knownPlatforms.has(e.platform));
  if (unknown.length > 0) {
    const lines = unknown.map(e => `> ${e.title} \`${e.version}\`${e.suncPercentage ? ` • sUNC ${e.suncPercentage}%` : ''}`);
    fields.push({
      name: `💻 Other (${unknown.length})`,
      value: lines.join('\n'),
      inline: false,
    });
  }

  return createBrandedEmbed({
    color: detected > 0 ? 'WARNING' : 'SUCCESS',
    title: '🔍 Executor Status',
    description: [
      `Live status from [WhatExpsAre.Online](https://whatexpsare.online)`,
      '',
      `🟢 Updated **${updated}**  •  🔴 Detected **${detected}**  •  🟡 Pending **${pending}**`,
    ].join('\n'),
    fields,
    footer: `Auto-refreshes on change • ${options.executors.length} total executors`,
  });
}
