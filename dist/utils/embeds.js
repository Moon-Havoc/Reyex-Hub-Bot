import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Logger } from './logger.js';
// Reyex Hub Brand Colors — polished palette
export const BrandColors = {
    PRIMARY: '#DC143C', // Crimson red
    SUCCESS: '#2ECC71', // Emerald green
    ERROR: '#E74C3C', // Soft red
    WARNING: '#F39C12', // Amber
    INFO: '#3498DB', // Sky blue
    DARK: '#1a1a1a', // Dark background
    ACCENT: '#8B0000', // Dark red accent
    MUTED: '#95A5A6', // Gray for secondary text
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
export async function initBrandAssets(client) {
    try {
        const avatarURL = client.user?.avatarURL({ size: 128, extension: 'png' }) || '';
        BrandConfig.THUMBNAIL = avatarURL;
        BrandConfig.AUTHOR_ICON = avatarURL;
        BrandConfig.FOOTER_ICON = avatarURL;
        Logger.info(`Brand assets initialized with bot avatar`);
    }
    catch (error) {
        Logger.warn('Failed to fetch bot avatar for brand assets');
    }
}
/**
 * Core branded embed builder
 */
export function createBrandedEmbed(options) {
    const { color = 'PRIMARY', title, description, fields, thumbnail, image, author, footer, timestamp = true, } = options;
    const embed = new EmbedBuilder();
    if (typeof color === 'string' && color in BrandColors) {
        embed.setColor(BrandColors[color]);
    }
    else {
        embed.setColor(color);
    }
    if (title)
        embed.setTitle(title);
    if (description)
        embed.setDescription(description);
    if (fields && fields.length > 0)
        embed.addFields(fields);
    if (thumbnail) {
        embed.setThumbnail(thumbnail);
    }
    else if (BrandConfig.THUMBNAIL && BrandConfig.THUMBNAIL.length > 0) {
        embed.setThumbnail(BrandConfig.THUMBNAIL);
    }
    if (image)
        embed.setImage(image);
    if (author) {
        embed.setAuthor({ name: author, iconURL: BrandConfig.AUTHOR_ICON });
    }
    else {
        embed.setAuthor({ name: BrandConfig.AUTHOR_NAME, iconURL: BrandConfig.AUTHOR_ICON });
    }
    if (footer) {
        embed.setFooter({ text: footer, iconURL: BrandConfig.FOOTER_ICON });
    }
    else {
        embed.setFooter({ text: BrandConfig.FOOTER_TEXT, iconURL: BrandConfig.FOOTER_ICON });
    }
    if (timestamp)
        embed.setTimestamp();
    return embed;
}
// ─── Status Embeds ─────────────────────────────────────────────
export function createSuccessEmbed(options) {
    return createBrandedEmbed({
        color: 'SUCCESS',
        title: `✅ ${options.title}`,
        description: options.description,
        fields: options.fields,
    });
}
export function createErrorEmbed(options) {
    return createBrandedEmbed({
        color: 'ERROR',
        title: `❌ ${options.title}`,
        description: options.description,
        fields: options.fields,
    });
}
export function createWarningEmbed(options) {
    return createBrandedEmbed({
        color: 'WARNING',
        title: `⚠️ ${options.title}`,
        description: options.description,
        fields: options.fields,
    });
}
export function createInfoEmbed(options) {
    return createBrandedEmbed({
        color: 'INFO',
        title: `ℹ️ ${options.title}`,
        description: options.description,
        fields: options.fields,
    });
}
export function createBrandedInfoEmbed(options) {
    return createBrandedEmbed({
        color: 'PRIMARY',
        title: options.title,
        description: options.description,
        fields: options.fields,
    });
}
// ─── Game Embeds ───────────────────────────────────────────────
export function createGameEmbed(options) {
    const tags = [];
    if (options.free !== undefined)
        tags.push(options.free ? 'Free' : 'Paid');
    if (options.keyRequired)
        tags.push('Key Required');
    if (options.mobileCompatible)
        tags.push('Mobile Compatible');
    const tagStr = tags.length > 0 ? `\n> ${tags.join(' • ')}` : '';
    const isHttp = options.scriptUrl.startsWith('http://') || options.scriptUrl.startsWith('https://');
    const loadstringCode = isHttp
        ? `loadstring(game:HttpGet("${options.scriptUrl}"))()`
        : options.scriptUrl;
    const fields = [
        {
            name: '📜 Loadstring (Roblox Executor)',
            value: `\`\`\`lua\n${loadstringCode}\n\`\`\``,
            inline: false,
        },
    ];
    if (isHttp) {
        fields.push({
            name: '🔗 Raw Script URL',
            value: `[Click to view raw script](${options.scriptUrl})`,
            inline: false,
        });
    }
    return createBrandedEmbed({
        color: 'PRIMARY',
        title: `🎮 ${options.gameName}`,
        description: `> ${options.description}${tagStr}\n\n📂 **${options.category}**`,
        fields,
        footer: 'Copy the loadstring code above and execute it in your script executor.',
    });
}
export function createGamesListEmbed(options) {
    if (options.games.length === 0) {
        return createBrandedEmbed({
            color: 'WARNING',
            title: '🎮 Game Library',
            description: 'No games are currently available.\n\nAdmins can add games with `/addgame`.',
        });
    }
    const grouped = {};
    for (const game of options.games) {
        const cat = game.category || 'General';
        if (!grouped[cat])
            grouped[cat] = [];
        grouped[cat].push(game);
    }
    const categories = Object.keys(grouped).sort();
    const fields = [];
    for (const cat of categories) {
        const games = grouped[cat];
        const list = games
            .slice(0, 10)
            .map(g => {
            const tags = [];
            if (g.free)
                tags.push('Free');
            else
                tags.push('Paid');
            if (g.keyRequired)
                tags.push('Key');
            if (g.mobileCompatible)
                tags.push('Mobile');
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
        if (fields.length >= 24)
            break;
    }
    return createBrandedEmbed({
        color: 'PRIMARY',
        title: `🎮 Game Library${options.category ? ` — ${options.category}` : ''}`,
        description: `**${options.games.length}** game${options.games.length !== 1 ? 's' : ''}`,
        fields,
    });
}
// ─── Profile Embed ─────────────────────────────────────────────
export function createProfileEmbed(options) {
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
export function createStatsEmbed(options) {
    const bar = (pct, len = 10) => {
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
export function createGiveawayEmbed(options) {
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
export function createBroadcastEmbed(options) {
    return createBrandedEmbed({
        color: 'PRIMARY',
        title: `📢 ${options.title}`,
        description: options.message,
        footer: `Announcement by ${options.author}`,
    });
}
// ─── Poll Embed ────────────────────────────────────────────────
export function createPollEmbed(options) {
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
export function createExecutorsEmbed(options) {
    if (options.executors.length === 0) {
        return createBrandedEmbed({
            color: 'WARNING',
            title: '⚡ Roblox Executor Status Center',
            description: 'No executor data is available at this time.',
        });
    }
    const updated = options.executors.filter(e => e.updated).length;
    const detected = options.executors.filter(e => e.detected).length;
    const pending = options.executors.filter(e => !e.updated && !e.detected).length;
    const filter = options.platformFilter || 'all';
    const isAll = filter.toLowerCase() === 'all';
    const fields = [];
    if (isAll) {
        const platformOrder = ['Windows', 'Android', 'Mac', 'iOS'];
        const grouped = {};
        for (const exp of options.executors) {
            const plat = exp.platform || 'Other';
            if (!grouped[plat])
                grouped[plat] = [];
            grouped[plat].push(exp);
        }
        for (const platform of platformOrder) {
            const execs = grouped[platform];
            if (!execs || execs.length === 0)
                continue;
            const platEmoji = execs[0]?.platformEmoji || '💻';
            // Sort within platform: safe/updated first, then pending, then detected
            execs.sort((a, b) => {
                if (a.detected !== b.detected)
                    return a.detected ? 1 : -1;
                if (a.updated !== b.updated)
                    return a.updated ? -1 : 1;
                return a.title.localeCompare(b.title);
            });
            const lines = execs.map(e => {
                const costStr = e.free ? 'Free' : (e.cost ? e.cost.split(' ')[0] : 'Paid');
                const uncStr = e.suncPercentage ? ` ∙ \`${e.suncPercentage}% sUNC\`` : '';
                const links = [];
                if (e.websitelink)
                    links.push(`[Web](${e.websitelink})`);
                if (e.discordlink)
                    links.push(`[Discord](${e.discordlink})`);
                const linkStr = links.length > 0 ? ` ∙ ${links.join(' / ')}` : '';
                const warnTag = e.detected ? ' ⚠️ *(Detected)*' : '';
                return `${e.statusEmoji} **${e.title}** \`${e.version || 'Latest'}\` ∙ *${costStr}*${uncStr}${warnTag}${linkStr}`;
            });
            let currentChunk = [];
            let currentLen = 0;
            let part = 1;
            for (const line of lines) {
                if (currentLen + line.length + 1 > 950 && currentChunk.length > 0) {
                    fields.push({
                        name: `${platEmoji} ${platform} (${execs.length})${part > 1 ? ` — Part ${part}` : ''}`,
                        value: currentChunk.join('\n'),
                        inline: false,
                    });
                    currentChunk = [];
                    currentLen = 0;
                    part++;
                }
                currentChunk.push(line);
                currentLen += line.length + 1;
            }
            if (currentChunk.length > 0) {
                fields.push({
                    name: `${platEmoji} ${platform} (${execs.length})${part > 1 ? ` — Part ${part}` : ''}`,
                    value: currentChunk.join('\n'),
                    inline: false,
                });
            }
        }
        const known = new Set(platformOrder);
        const other = options.executors.filter(e => !known.has(e.platform));
        if (other.length > 0) {
            fields.push({
                name: `💻 Other (${other.length})`,
                value: other.map(e => `${e.statusEmoji} **${e.title}** \`${e.version}\``).join('\n'),
                inline: false,
            });
        }
        return createBrandedEmbed({
            color: detected > 0 ? 'WARNING' : 'SUCCESS',
            title: '⚡ Roblox Executor Status Center',
            description: [
                `Live exploit telemetry powered by [WhatExpsAre.Online](https://whatexpsare.online).`,
                '',
                `🟢 **Updated & Working:** \`${updated}\`  ∙  🟡 **Updating:** \`${pending}\`  ∙  🔴 **Detected:** \`${detected}\``,
                `*Click a platform button below to filter or refresh live data.*`,
            ].join('\n'),
            fields,
            footer: `WhatExpsAre.Online • Updated`,
            timestamp: true,
        });
    }
    else {
        // Focused single platform view
        const platExecs = options.executors.filter(e => e.platform.toLowerCase() === filter.toLowerCase());
        const platEmoji = platExecs[0]?.platformEmoji || '💻';
        const platTitle = platExecs[0]?.platform || filter;
        const platUpdated = platExecs.filter(e => e.updated).length;
        const platDetected = platExecs.filter(e => e.detected).length;
        const platPending = platExecs.filter(e => !e.updated && !e.detected).length;
        const formatCard = (e) => {
            const details = [];
            const costStr = e.free ? '🟢 Free' : `💎 ${e.cost || 'Paid'}`;
            details.push(`> 🏷️ **Type:** ${costStr}`);
            const uncParts = [];
            if (e.suncPercentage)
                uncParts.push(`sUNC: \`${e.suncPercentage}%\``);
            if (e.uncPercentage)
                uncParts.push(`UNC: \`${e.uncPercentage}%\``);
            if (e.decompiler)
                uncParts.push(`\`Decompiler\``);
            if (uncParts.length > 0)
                details.push(`> ⚙️ **Capabilities:** ${uncParts.join(' • ')}`);
            if (e.detected && e.detectionReason) {
                details.push(`> ⚠️ **Alert:** *${e.detectionReason}*`);
            }
            const links = [];
            if (e.websitelink)
                links.push(`[Website](${e.websitelink})`);
            if (e.discordlink)
                links.push(`[Discord Community](${e.discordlink})`);
            if (links.length > 0)
                details.push(`> 🔗 **Links:** ${links.join(' • ')}`);
            return `**${e.statusEmoji} ${e.title}** \`${e.version || 'Latest'}\` — **${e.statusText}**\n${details.join('\n')}`;
        };
        const detList = platExecs.filter(e => e.detected);
        if (detList.length > 0) {
            fields.push({
                name: `🔴 Detected / Risky (${detList.length})`,
                value: detList.map(formatCard).join('\n\n'),
                inline: false,
            });
        }
        const updList = platExecs.filter(e => e.updated && !e.detected);
        if (updList.length > 0) {
            const cards = updList.map(formatCard);
            let chunk = [];
            let len = 0;
            let part = 1;
            for (const card of cards) {
                if (len + card.length + 2 > 950 && chunk.length > 0) {
                    fields.push({
                        name: `🟢 Working & Safe (${updList.length})${part > 1 ? ` — Part ${part}` : ''}`,
                        value: chunk.join('\n\n'),
                        inline: false,
                    });
                    chunk = [];
                    len = 0;
                    part++;
                }
                chunk.push(card);
                len += card.length + 2;
            }
            if (chunk.length > 0) {
                fields.push({
                    name: `🟢 Working & Safe (${updList.length})${part > 1 ? ` — Part ${part}` : ''}`,
                    value: chunk.join('\n\n'),
                    inline: false,
                });
            }
        }
        const penList = platExecs.filter(e => !e.updated && !e.detected);
        if (penList.length > 0) {
            fields.push({
                name: `🟡 Pending Developer Update (${penList.length})`,
                value: penList.map(formatCard).join('\n\n'),
                inline: false,
            });
        }
        return createBrandedEmbed({
            color: platDetected > 0 ? 'WARNING' : 'SUCCESS',
            title: `${platEmoji} ${platTitle} Executor Status`,
            description: [
                `Live status and safety telemetry for **${platTitle}** executors.`,
                '',
                `🟢 **Working:** \`${platUpdated}\`  ∙  🟡 **Updating:** \`${platPending}\`  ∙  🔴 **Detected:** \`${platDetected}\``,
            ].join('\n'),
            fields,
            footer: `WhatExpsAre.Online • ${platExecs.length} ${platTitle} executors monitored`,
            timestamp: true,
        });
    }
}
export function createExecutorButtons(currentPlatform = 'all') {
    const norm = (currentPlatform || 'all').toLowerCase();
    const filterRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId('exec_filter_all')
        .setLabel('All')
        .setEmoji('🌐')
        .setStyle(norm === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId('exec_filter_Windows')
        .setLabel('Windows')
        .setEmoji('🪟')
        .setStyle(norm === 'windows' ? ButtonStyle.Primary : ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId('exec_filter_Android')
        .setLabel('Android')
        .setEmoji('🤖')
        .setStyle(norm === 'android' ? ButtonStyle.Primary : ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId('exec_filter_Mac')
        .setLabel('macOS')
        .setEmoji('🍎')
        .setStyle(norm === 'mac' ? ButtonStyle.Primary : ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId('exec_filter_iOS')
        .setLabel('iOS')
        .setEmoji('📱')
        .setStyle(norm === 'ios' ? ButtonStyle.Primary : ButtonStyle.Secondary));
    const actionRow = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(`exec_refresh_${currentPlatform || 'all'}`)
        .setLabel('Refresh Live Status')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Success), new ButtonBuilder()
        .setLabel('WhatExpsAre.Online')
        .setStyle(ButtonStyle.Link)
        .setURL('https://whatexpsare.online/')
        .setEmoji('🔗'));
    return [filterRow, actionRow];
}
//# sourceMappingURL=embeds.js.map