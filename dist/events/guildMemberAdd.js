import { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, } from 'discord.js';
import { Logger } from '../utils/logger.js';
import { createWelcomeEmbed } from '../utils/embeds.js';
import User from '../models/User.js';
export default {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            // ── Upsert user in DB ─────────────────────────────────────
            const existing = await User.findOne({ discordId: member.id });
            if (!existing) {
                await User.create({
                    discordId: member.id,
                    username: member.user.username,
                    discriminator: member.user.discriminator,
                    avatar: member.user.avatar ?? undefined,
                    joinedAt: member.joinedAt ?? new Date(),
                    lastSeen: new Date(),
                });
                Logger.info(`New member registered: ${member.user.tag} (${member.id})`);
            }
            else {
                await User.updateOne({ discordId: member.id }, {
                    $set: {
                        username: member.user.username,
                        discriminator: member.user.discriminator,
                        avatar: member.user.avatar ?? undefined,
                        lastSeen: new Date(),
                    },
                });
                Logger.info(`Returning member updated: ${member.user.tag} (${member.id})`);
            }
            // ── Welcome message ───────────────────────────────────────
            const welcomeChannel = resolveWelcomeChannel(member);
            if (!welcomeChannel)
                return;
            const avatarURL = member.user.displayAvatarURL({ size: 256, extension: 'png' });
            const embed = createWelcomeEmbed({
                username: member.user.username,
                userId: member.id,
                guildName: member.guild.name,
                memberCount: member.guild.memberCount,
                avatar: avatarURL,
            });
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
                .setLabel('Verify Roblox Account')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔐')
                .setCustomId('noop_verify_hint'), // no-op; just visual — /verify is a slash cmd
            new ButtonBuilder()
                .setLabel('Browse Scripts')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🎮')
                .setCustomId('noop_games_hint'));
            await welcomeChannel.send({ content: `${member}`, embeds: [embed], components: [row] });
        }
        catch (error) {
            Logger.error(`Error handling guildMemberAdd for ${member.user.tag}`, error);
        }
    },
};
// ─── Channel resolution ───────────────────────────────────────
// Prefer WELCOME_CHANNEL_ID env var, fall back to guild systemChannel.
function resolveWelcomeChannel(member) {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (channelId) {
        const ch = member.guild.channels.cache.get(channelId);
        if (ch?.isTextBased() && ch instanceof TextChannel)
            return ch;
    }
    const sys = member.guild.systemChannel;
    return sys instanceof TextChannel ? sys : null;
}
//# sourceMappingURL=guildMemberAdd.js.map