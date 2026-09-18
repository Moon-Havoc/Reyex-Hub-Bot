import {
  EmbedBuilder,
  ColorResolvable,
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { Logger } from './logger.js';

// ─── Brand Palette ────────────────────────────────────────────

export const BrandColors = {
  PRIMARY:  '#DC143C' as const,   // Crimson red
  SUCCESS:  '#2ECC71' as const,   // Emerald green
  ERROR:    '#E74C3C' as const,   // Soft red
  WARNING:  '#F39C12' as const,   // Amber
  INFO:     '#3498DB' as const,   // Sky blue
  DARK:     '#1a1a1a' as const,   // Dark background
  ACCENT:   '#8B0000' as const,   // Dark red accent
  MUTED:    '#95A5A6' as const,   // Gray for secondary text
  PURPLE:   '#9B59B6' as const,   // Purple (polls / events)
  GOLD:     '#F1C40F' as const,   // Gold (giveaways / winners)
};

export type BrandColorKey = keyof typeof BrandColors;

export const BrandConfig = {
  FOOTER_TEXT:  'Reyex Hub',
  FOOTER_ICON:  '',
  THUMBNAIL:    '',
  AUTHOR_NAME:  'Reyex Hub',
  AUTHOR_ICON:  '',
};

// ─── Asset initializer ───────────────────────────────────────

export async function initBrandAssets(client: Client): Promise<void> {
  try {
    const avatarURL = client.user?.avatarURL({ size: 256, extension: 'png' }) ?? '';
    BrandConfig.THUMBNAIL   = avatarURL;
    BrandConfig.AUTHOR_ICON = avatarURL;
    BrandConfig.FOOTER_ICON = avatarURL;
    Logger.info('Brand assets initialized');
  } catch {
    Logger.warn('Failed to fetch bot avatar for brand assets');
  }
}

// ─── Utility helpers ─────────────────────────────────────────

/** Render a filled progress bar: `████░░░░ 42%` */
export function progressBar(percent: number, length = 12): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled  = Math.round((clamped / 100) * length);
  const empty   = length - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}

/** Inline bold progress bar field value */
export function progressField(percent: number, length = 12): string {
  return `\`${progressBar(percent, length)}\` **${percent.toFixed(1)}%**`;
}

/** Pluralise: `1 vote` / `5 votes` */
export function plural(n: number, word: string, suffix = 's'): string {
  return `${n.toLocaleString()} ${word}${n === 1 ? '' : suffix}`;
}

/** Unix timestamp tag shorthand */
export const ts = {
  relative: (d: Date) => `<t:${Math.floor(d.getTime() / 1000)}:R>`,
  short:    (d: Date) => `<t:${Math.floor(d.getTime() / 1000)}:f>`,
  long:     (d: Date) => `<t:${Math.floor(d.getTime() / 1000)}:F>`,
  date:     (d: Date) => `<t:${Math.floor(d.getTime() / 1000)}:D>`,
};

// ─── Core branded embed builder ──────────────────────────────

export interface EmbedOptions {
  color?:       BrandColorKey | string;
  title?:       string;
  description?: string;
  url?:         string;
  fields?:      { name: string; value: string; inline?: boolean }[];
  thumbnail?:   string | null;   // null = suppress default avatar
  image?:       string;
  author?:      string | { name: string; iconURL?: string; url?: string };
  footer?:      string | { text: string; iconURL?: string };
  timestamp?:   boolean;
}

export function createBrandedEmbed(options: EmbedOptions): EmbedBuilder {
  const {
    color     = 'PRIMARY',
    title,
    description,
    url,
    fields,
    thumbnail,
    image,
    author,
    footer,
    timestamp = true,
  } = options;

  const embed = new EmbedBuilder();

  // Color
  const hex = (color in BrandColors)
    ? BrandColors[color as BrandColorKey]
    : color;
  embed.setColor(hex as ColorResolvable);

  if (title)       embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (url)         embed.setURL(url);
  if (fields?.length) embed.addFields(fields);
  if (image)       embed.setImage(image);

  // Thumbnail — skip when explicitly null
  if (thumbnail === null) {
    // suppressed intentionally
  } else if (thumbnail) {
    embed.setThumbnail(thumbnail);
  } else if (BrandConfig.THUMBNAIL) {
    embed.setThumbnail(BrandConfig.THUMBNAIL);
  }

  // Author
  if (author && typeof author === 'object') {
    embed.setAuthor(author);
  } else {
    embed.setAuthor({
      name:    typeof author === 'string' ? author : BrandConfig.AUTHOR_NAME,
      iconURL: BrandConfig.AUTHOR_ICON || undefined,
    });
  }

  // Footer
  if (footer && typeof footer === 'object') {
    embed.setFooter(footer);
  } else {
    embed.setFooter({
      text:    typeof footer === 'string' ? footer : BrandConfig.FOOTER_TEXT,
      iconURL: BrandConfig.FOOTER_ICON || undefined,
    });
  }

  if (timestamp) embed.setTimestamp();

  return embed;
}

// ─── Status Embeds ────────────────────────────────────────────

export function createSuccessEmbed(options: {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}): EmbedBuilder {
  return createBrandedEmbed({
    color: 'SUCCESS',
    title: `✅  ${options.title}`,
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
    title: `❌  ${options.title}`,
    description: options.description,
    fields: options.fields,
    thumbnail: null,
  });
}

export function createWarningEmbed(options: {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}): EmbedBuilder {
  return createBrandedEmbed({
    color: 'WARNING',
    title: `⚠️  ${options.title}`,
    description: options.description,
    fields: options.fields,
    thumbnail: null,
  });
}

export function createInfoEmbed(options: {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}): EmbedBuilder {
  return createBrandedEmbed({
    color: 'INFO',
    title: `ℹ️  ${options.title}`,
    description: options.description,
    fields: options.fields,
    thumbnail: null,
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

// ─── Game Embeds ─────────────────────────────────────────────

export function createGameEmbed(options: {
  gameName:        string;
  description:     string;
  scriptUrl:       string;
  category:        string;
  usageCount?:     number;
  free?:           boolean;
  keyRequired?:    boolean;
  mobileCompatible?: boolean;
}): EmbedBuilder {
  const tags: string[] = [];
  if (options.free !== undefined) tags.push(options.free ? '🆓 Free' : '💰 Paid');
  if (options.keyRequired)        tags.push('🔑 Key Required');
  if (options.mobileCompatible)   tags.push('📱 Mobile');
  const tagLine = tags.length ? tags.join('  •  ') : '';

  const isHttp = options.scriptUrl.startsWith('http');
  const code   = isHttp
    ? `loadstring(game:HttpGet("${options.scriptUrl}"))()`
    : options.scriptUrl;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    {
      name:  '📜  Loadstring',
      value: `\`\`\`lua\n${code}\n\`\`\``,
    },
  ];

  if (isHttp) {
    fields.push({
      name:  '🔗  Raw URL',
      value: options.scriptUrl,
    });
  }

  if (options.usageCount !== undefined) {
    fields.push({
      name:   '📊  Uses',
      value:  `**${options.usageCount.toLocaleString()}**`,
      inline: true,
    });
  }

  return createBrandedEmbed({
    color:       'PRIMARY',
    title:       `🎮  ${options.gameName}`,
    description: [
      `> *${options.description}*`,
      tagLine ? `> ${tagLine}` : '',
      `> 📂  **${options.category}**`,
    ].filter(Boolean).join('\n'),
    fields,
    footer: 'Copy the loadstring above and paste it into your Roblox executor.',
  });
}

export function createGamesListEmbed(options: {
  games: Array<{
    name:            string;
    description:     string;
    category:        string;
    usageCount:      number;
    free:            boolean;
    keyRequired:     boolean;
    mobileCompatible: boolean;
  }>;
  category?: string;
  page?:     number;
  perPage?:  number;
}): EmbedBuilder {
  const { games, category, page = 1, perPage = 8 } = options;

  if (games.length === 0) {
    return createBrandedEmbed({
      color:       'WARNING',
      title:       '🎮  Game Library',
      description: 'No games are currently available.\n\nAdmins can add games with `/addgame`.',
      thumbnail:   null,
    });
  }

  // Group by category
  const grouped: Record<string, typeof games> = {};
  for (const g of games) {
    (grouped[g.category] ??= []).push(g);
  }
  const categories = Object.keys(grouped).sort();

  // Paginate all games
  const totalPages = Math.ceil(games.length / perPage);
  const start      = (page - 1) * perPage;
  const sliced     = games.slice(start, start + perPage);

  const fields = sliced.map(g => {
    const badges: string[] = [];
    if (g.free)             badges.push('🆓');
    else                    badges.push('💰');
    if (g.keyRequired)      badges.push('🔑');
    if (g.mobileCompatible) badges.push('📱');
    return {
      name:   `${g.name}  ${badges.join('')}`,
      value:  `*${g.description.slice(0, 80)}${g.description.length > 80 ? '…' : ''}*\n📂 ${g.category}`,
      inline: true,
    };
  });

  const catSummary = categories
    .map(c => `**${c}** (${grouped[c].length})`)
    .join('  •  ');

  return createBrandedEmbed({
    color:       'PRIMARY',
    title:       `🎮  Game Library${category ? `  —  ${category}` : ''}`,
    description: [
      `**${games.length}** script${games.length !== 1 ? 's' : ''} available`,
      catSummary,
      totalPages > 1 ? `Page **${page}** of **${totalPages}**` : '',
    ].filter(Boolean).join('\n'),
    fields,
  });
}

// ─── Profile Embed ────────────────────────────────────────────

export function createProfileEmbed(options: {
  username:       string;
  discriminator:  string;
  discordId:      string;
  isVerified:     boolean;
  robloxUsername?: string;
  robloxId?:      string;
  scriptsUsed:    number;
  joinedAt:       Date;
  lastSeen:       Date;
  verifiedAt?:    Date;
  lastScriptUsed?: Date;
  avatar?:        string;
}): EmbedBuilder {
  const verified = options.isVerified ? '✅  Verified' : '❌  Unverified';

  const robloxLine = options.robloxUsername
    ? `[\`${options.robloxUsername}\`](https://www.roblox.com/users/${options.robloxId ?? ''}/profile)`
    : '`Not linked`';

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: '🏷️  Status',       value: verified,                           inline: true  },
    { name: '🎮  Roblox',       value: robloxLine,                         inline: true  },
    { name: '📜  Scripts Used', value: `**${options.scriptsUsed.toLocaleString()}**`, inline: true },
    { name: '📅  Joined',       value: ts.relative(options.joinedAt),      inline: true  },
    { name: '👁️  Last Seen',    value: ts.relative(options.lastSeen),      inline: true  },
  ];

  if (options.isVerified && options.verifiedAt) {
    fields.push({ name: '🔗  Verified',  value: ts.relative(options.verifiedAt), inline: true });
  }
  if (options.lastScriptUsed) {
    fields.push({ name: '⏱️  Last Script', value: ts.relative(options.lastScriptUsed), inline: true });
  }

  return createBrandedEmbed({
    color:     options.isVerified ? 'SUCCESS' : 'MUTED',
    title:     options.username,
    thumbnail: options.avatar ?? undefined,
    fields,
  });
}

// ─── Stats Embed ─────────────────────────────────────────────

export function createStatsEmbed(options: {
  totalUsers:       number;
  verifiedUsers:    number;
  activeUsers:      number;
  totalGames:       number;
  scriptsUsed:      number;
  verificationRate: number;
  activeRate:       number;
  uptime?:          number; // seconds
}): EmbedBuilder {
  const uptimeLine = options.uptime !== undefined
    ? formatUptime(options.uptime)
    : null;

  return createBrandedEmbed({
    color:       'PRIMARY',
    title:       '📊  Bot Statistics',
    description: 'Live performance and activity snapshot',
    fields: [
      {
        name:  '👥  Users',
        value: [
          `**Total**         ${options.totalUsers.toLocaleString()}`,
          `**Verified**      ${options.verifiedUsers.toLocaleString()}`,
          `**Active (7d)**   ${options.activeUsers.toLocaleString()}`,
        ].join('\n'),
        inline: true,
      },
      {
        name:  '🎮  Content',
        value: [
          `**Games**         ${options.totalGames.toLocaleString()}`,
          `**Scripts Used**  ${options.scriptsUsed.toLocaleString()}`,
          uptimeLine ? `**Uptime**        ${uptimeLine}` : '',
        ].filter(Boolean).join('\n'),
        inline: true,
      },
      {
        name:   '\u200b',
        value:  '\u200b',
        inline: true,
      },
      {
        name:  '📈  Verification Rate',
        value: progressField(options.verificationRate),
      },
      {
        name:  '⚡  7-Day Activity Rate',
        value: progressField(options.activeRate),
      },
    ],
    thumbnail: null,
  });
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

// ─── Giveaway Embed ──────────────────────────────────────────

export function createGiveawayEmbed(options: {
  name:         string;
  description:  string;
  prize:        string;
  endTime:      Date;
  participants: number;
  isActive:     boolean;
  winner?:      string;
  hostedBy?:    string;
}): EmbedBuilder {
  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: '🎁  Prize',    value: `**${options.prize}**`,                     inline: true },
    { name: '👥  Entries',  value: `**${options.participants.toLocaleString()}**`, inline: true },
    {
      name:   options.isActive ? '⏰  Ends' : '🏁  Ended',
      value:  options.isActive ? ts.relative(options.endTime) : ts.short(options.endTime),
      inline: true,
    },
  ];

  if (options.hostedBy) {
    fields.push({ name: '👑  Hosted by', value: options.hostedBy, inline: true });
  }

  if (!options.isActive && options.winner) {
    fields.push({ name: '🏆  Winner', value: `<@${options.winner}>`, inline: true });
  }

  return createBrandedEmbed({
    color:       options.isActive ? 'GOLD' : 'SUCCESS',
    title:       options.isActive ? `🎉  ${options.name}` : `🏆  ${options.name}`,
    description: options.description,
    fields,
    footer:      options.isActive ? 'Click the button below to enter!' : 'Giveaway ended.',
  });
}

// ─── Broadcast Embed ─────────────────────────────────────────

export function createBroadcastEmbed(options: {
  title:   string;
  message: string;
  author:  string;
}): EmbedBuilder {
  return createBrandedEmbed({
    color:       'PRIMARY',
    title:       `📢  ${options.title}`,
    description: options.message,
    footer:      `Broadcast by ${options.author}`,
    thumbnail:   null,
  });
}

// ─── Poll Embed ──────────────────────────────────────────────

const VOTE_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'] as const;

export function createPollEmbed(options: {
  question:  string;
  options:   Array<{ text: string; voters: string[] }>;
  createdBy: string;
  endTime?:  Date;
  isActive:  boolean;
}): EmbedBuilder {
  const totalVotes = options.options.reduce((s, o) => s + o.voters.length, 0);
  const maxVotes   = Math.max(...options.options.map(o => o.voters.length), 1);

  const fields = options.options.map((opt, i) => {
    const pct    = totalVotes > 0 ? (opt.voters.length / totalVotes) * 100 : 0;
    const barLen = 10;
    const filled = Math.round((opt.voters.length / maxVotes) * barLen);
    const bar    = `\`${'█'.repeat(filled)}${'░'.repeat(barLen - filled)}\``;
    return {
      name:   `${VOTE_EMOJIS[i]}  ${opt.text}`,
      value:  `${bar}  **${opt.voters.length}** vote${opt.voters.length !== 1 ? 's' : ''} (${pct.toFixed(1)}%)`,
      inline: false,
    };
  });

  const statusLine = options.isActive
    ? (options.endTime ? `⏰ Ends ${ts.relative(options.endTime)}` : '🟢 Active — no timer')
    : '🔴 Poll ended';

  fields.push({
    name:   '📊  Totals',
    value:  `**${plural(totalVotes, 'vote')}**  •  ${statusLine}`,
    inline: false,
  });

  return createBrandedEmbed({
    color:       options.isActive ? 'PURPLE' : 'MUTED',
    title:       `🗳️  ${options.question}`,
    description: `Created by **${options.createdBy}**`,
    fields,
    thumbnail:   null,
    footer:      options.isActive ? 'Click a button below to cast your vote.' : 'This poll has ended.',
  });
}

// ─── Welcome Embed ───────────────────────────────────────────

export function createWelcomeEmbed(options: {
  username:  string;
  userId:    string;
  guildName: string;
  memberCount: number;
  avatar?:   string;
}): EmbedBuilder {
  return createBrandedEmbed({
    color:       'PRIMARY',
    title:       `👋  Welcome, ${options.username}!`,
    description: [
      `You're member **#${options.memberCount.toLocaleString()}** of **${options.guildName}**.`,
      '',
      '**Getting started:**',
      '> 🔐  Use `/verify` to link your Roblox account',
      '> 🎮  Use `/games` to browse available scripts',
      '> 📜  Use `/getscript` to download a script',
      '> ❓  Use `/help` for a full command list',
    ].join('\n'),
    thumbnail: options.avatar ?? null,
    footer:    'Glad to have you here!',
    timestamp: true,
  });
}

// ─── Moderation Log Embed ────────────────────────────────────

export function createModLogEmbed(options: {
  action:    string;
  target:    string;
  targetId:  string;
  moderator: string;
  reason:    string;
  extra?:    { name: string; value: string; inline?: boolean }[];
}): EmbedBuilder {
  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: '🎯  Target',    value: `${options.target} (\`${options.targetId}\`)`, inline: true },
    { name: '🛡️  Moderator', value: options.moderator,                             inline: true },
    { name: '📋  Reason',    value: options.reason,                                inline: false },
    ...(options.extra ?? []),
  ];

  return createBrandedEmbed({
    color:     'WARNING',
    title:     `🔨  ${options.action}`,
    fields,
    thumbnail: null,
  });
}

// ─── Executor Status Embeds ───────────────────────────────────

export interface ExecutorDisplay {
  title:          string;
  version:        string;
  platform:       string;
  detected:       boolean;
  updated:        boolean;
  free:           boolean;
  cost?:          string;
  websitelink?:   string;
  discordlink?:   string;
  uncStatus:      boolean;
  suncPercentage?: number;
  uncPercentage?:  number;
  decompiler?:    boolean;
  multiInject?:   boolean;
  possibleBanwave?: boolean;
  hasIssues?:     boolean;
  detectionReason?: string;
  updatedDate:    string;
  statusEmoji:    string;
  statusText:     string;
  platformEmoji:  string;
}

export function createExecutorsEmbed(options: {
  executors:      ExecutorDisplay[];
  platformFilter: string;
  lastUpdated:    Date;
}): EmbedBuilder {
  const { executors, platformFilter, lastUpdated } = options;

  let filtered = platformFilter === 'all'
    ? executors
    : executors.filter(e => e.platform.toLowerCase() === platformFilter.toLowerCase());

  filtered = [...filtered].sort((a, b) => {
    // Detected first, then by name
    if (a.detected !== b.detected) return a.detected ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  const total    = filtered.length;
  const safe     = filtered.filter(e => !e.detected).length;
  const detected = filtered.filter(e => e.detected).length;

  if (total === 0) {
    return createBrandedEmbed({
      color:       'WARNING',
      title:       '⚙️  Executor Status',
      description: `No executors found for platform **${platformFilter}**.`,
      thumbnail:   null,
    });
  }

  const lines = filtered.map(e => {
    const parts: string[] = [
      `${e.statusEmoji} **${e.title}**`,
      `\`v${e.version}\``,
    ];
    if (e.free)  parts.push('🆓');
    else if (e.cost) parts.push(`💰 ${e.cost}`);
    if (e.possibleBanwave) parts.push('⚠️ Banwave');
    if (e.hasIssues)       parts.push('🐛 Issues');
    if (e.detectionReason) parts.push(`*(${e.detectionReason})*`);
    return parts.join('  ');
  });

  // Split into at most 2 columns of fields for readability
  const half  = Math.ceil(lines.length / 2);
  const col1  = lines.slice(0, half).join('\n');
  const col2  = lines.slice(half).join('\n');

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: `${platformFilter === 'all' ? 'All Platforms' : platformFilter} (1)`, value: col1 || '—', inline: true },
  ];
  if (col2) {
    fields.push({ name: `${platformFilter === 'all' ? 'All Platforms' : platformFilter} (2)`, value: col2, inline: true });
  }

  fields.push({
    name:   '📊  Summary',
    value:  `🟢 Safe: **${safe}**  •  🔴 Detected: **${detected}**  •  Total: **${total}**\nData: [WhatExpsAre.Online](https://whatexpsare.online)  •  Updated ${ts.relative(lastUpdated)}`,
    inline: false,
  });

  const title = platformFilter === 'all'
    ? '⚙️  Executor Status — All Platforms'
    : `⚙️  Executor Status — ${platformFilter}`;

  return createBrandedEmbed({
    color:     detected > 0 ? 'ERROR' : 'SUCCESS',
    title,
    fields,
    thumbnail: null,
    footer:    'Auto-refreshes every 30 seconds • Powered by WhatExpsAre.Online',
  });
}

// ─── Executor Platform Buttons ────────────────────────────────

const PLATFORM_CONFIG = [
  { label: 'All',     value: 'all',     emoji: '🌐' },
  { label: 'Windows', value: 'Windows', emoji: '🪟' },
  { label: 'Android', value: 'Android', emoji: '🤖' },
  { label: 'Mac',     value: 'Mac',     emoji: '🍎' },
  { label: 'iOS',     value: 'iOS',     emoji: '📱' },
] as const;

export function createExecutorButtons(activePlatform: string): ActionRowBuilder<ButtonBuilder>[] {
  const filterRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    PLATFORM_CONFIG.map(p =>
      new ButtonBuilder()
        .setCustomId(`exec_filter_${p.value}`)
        .setLabel(p.label)
        .setEmoji(p.emoji)
        .setStyle(p.value === activePlatform ? ButtonStyle.Primary : ButtonStyle.Secondary)
    )
  );

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`exec_refresh_${activePlatform}`)
      .setLabel('Refresh')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setLabel('WhatExpsAre.Online')
      .setStyle(ButtonStyle.Link)
      .setURL('https://whatexpsare.online')
      .setEmoji('🔗'),
  );

  return [filterRow, actionRow];
}

// ─── Help Select Menu ─────────────────────────────────────────

export type HelpCategory = 'user' | 'moderation' | 'admin' | 'info';

export const HELP_CATEGORIES: Record<HelpCategory, {
  label: string; emoji: string; description: string;
  commands: { name: string; desc: string }[];
}> = {
  user: {
    label: 'User Commands',
    emoji: '👤',
    description: 'Commands available to all verified members',
    commands: [
      { name: '/verify start',   desc: 'Begin Roblox account verification' },
      { name: '/verify confirm', desc: 'Confirm verification after adding code' },
      { name: '/verify status',  desc: 'Check your current verification status' },
      { name: '/getscript',      desc: 'Retrieve a script for a game (verified only)' },
      { name: '/games',          desc: 'Browse all available game scripts' },
      { name: '/profile',        desc: "View your or another member's profile" },
      { name: '/executors',      desc: 'Live Roblox executor status tracker' },
      { name: '/poll create',    desc: 'Create a community poll' },
      { name: '/poll end',       desc: 'End a poll early' },
      { name: '/poll list',      desc: 'List all active polls' },
    ],
  },
  moderation: {
    label: 'Moderation',
    emoji: '🛡️',
    description: 'Staff-only moderation tools',
    commands: [
      { name: '/ban',      desc: 'Ban a member from the server' },
      { name: '/unban',    desc: 'Unban a member by ID' },
      { name: '/kick',     desc: 'Kick a member from the server' },
      { name: '/timeout',  desc: 'Temporarily mute a member' },
      { name: '/warn',     desc: 'Issue a formal warning' },
      { name: '/warnings', desc: "View a member's warning history" },
      { name: '/purge',    desc: 'Bulk-delete messages' },
      { name: '/nick',     desc: "Change a member's nickname" },
      { name: '/grole',    desc: 'Give or remove a role from a member' },
    ],
  },
  admin: {
    label: 'Admin',
    emoji: '🔧',
    description: 'Administrator-only management commands',
    commands: [
      { name: '/addgame',     desc: 'Add a new game script' },
      { name: '/removegame',  desc: 'Remove a game script' },
      { name: '/updategame',  desc: 'Edit an existing game script' },
      { name: '/whitelist',   desc: 'Manually whitelist a member' },
      { name: '/unwhitelist', desc: 'Remove whitelist access' },
      { name: '/stats',       desc: 'View bot and server statistics' },
      { name: '/broadcast',   desc: 'DM all verified members' },
      { name: '/giveaway',    desc: 'Start, end, or list giveaways' },
      { name: '/lookup',      desc: 'Look up a Discord or Roblox user' },
    ],
  },
  info: {
    label: 'Information',
    emoji: '📖',
    description: 'General information and tips',
    commands: [
      { name: '/help',    desc: 'Show this help menu' },
      { name: '/profile', desc: 'View your profile' },
    ],
  },
};

export function createHelpEmbed(category: HelpCategory): EmbedBuilder {
  const cat = HELP_CATEGORIES[category];
  const fields = cat.commands.map(c => ({
    name:   c.name,
    value:  c.desc,
    inline: true,
  }));

  return createBrandedEmbed({
    color:       'PRIMARY',
    title:       `${cat.emoji}  ${cat.label}`,
    description: cat.description,
    fields,
  });
}

export function createHelpSelectMenu(): StringSelectMenuBuilder {
  return new StringSelectMenuBuilder()
    .setCustomId('help_category')
    .setPlaceholder('Select a category…')
    .addOptions(
      (Object.entries(HELP_CATEGORIES) as [HelpCategory, typeof HELP_CATEGORIES[HelpCategory]][]).map(
        ([value, cat]) =>
          new StringSelectMenuOptionBuilder()
            .setValue(value)
            .setLabel(cat.label)
            .setEmoji(cat.emoji)
            .setDescription(cat.description),
      )
    );
}
