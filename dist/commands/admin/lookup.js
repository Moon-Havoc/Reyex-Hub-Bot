import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import { RobloxAPI } from '../../utils/roblox.js';
import { createErrorEmbed, createBrandedEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Run a background check on a Discord or Roblox account')
        .addStringOption(option => option
        .setName('target')
        .setDescription('Discord user ID or Roblox username')
        .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const target = interaction.options.getString('target');
            const guild = interaction.guild;
            // Check if target is a Discord ID (numeric)
            const isDiscordId = /^\d{17,20}$/.test(target);
            if (isDiscordId) {
                // ─── Discord Lookup ───────────────────────────────
                const member = await guild.members.fetch(target).catch(() => null);
                if (!member) {
                    await interaction.editReply({
                        embeds: [createErrorEmbed({
                                title: 'User Not Found',
                                description: `No member found with ID \`${target}\` in this server.`,
                            })],
                    });
                    return;
                }
                const user = await User.findOne({ discordId: target });
                const roles = member.roles.cache
                    .filter((r) => r.id !== guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map((r) => `<@&${r.id}>`)
                    .join(', ') || 'None';
                const fields = [
                    { name: 'Username', value: `\`${member.user.tag}\``, inline: true },
                    { name: 'ID', value: `\`${member.user.id}\``, inline: true },
                    { name: 'Nickname', value: member.nickname ? `\`${member.nickname}\`` : '`None`', inline: true },
                    { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Bot', value: member.user.bot ? '`Yes`' : '`No`', inline: true },
                    { name: 'Roles', value: roles.length > 1024 ? roles.slice(0, 1021) + '...' : roles, inline: false },
                ];
                // Verification & Roblox info
                if (user) {
                    fields.push({ name: '\u200b', value: '\u200b', inline: false }, { name: '📊 Database Info', value: '\u200b', inline: false }, { name: 'Verified', value: user.isVerified ? '`Yes`' : '`No`', inline: true }, { name: 'Roblox Username', value: user.robloxUsername ? `\`${user.robloxUsername}\`` : '`Not linked`', inline: true }, { name: 'Roblox ID', value: user.robloxId ? `\`${user.robloxId}\`` : '`Not linked`', inline: true }, { name: 'Scripts Used', value: `\`${user.statistics.scriptsUsed}\``, inline: true }, { name: 'Last Seen', value: `<t:${Math.floor(user.lastSeen.getTime() / 1000)}:R>`, inline: true });
                    if (user.isVerified && user.robloxId) {
                        const robloxUser = await RobloxAPI.getUserById(user.robloxId);
                        if (robloxUser) {
                            fields.push({ name: '\u200b', value: '\u200b', inline: false }, { name: '🎮 Roblox Profile', value: '\u200b', inline: false }, { name: 'Display Name', value: `\`${robloxUser.displayName}\``, inline: true }, { name: 'Username', value: `\`${robloxUser.name}\``, inline: true }, { name: 'Roblox Banned', value: robloxUser.isBanned ? '`Yes`' : '`No`', inline: true }, { name: 'Account Created', value: `<t:${Math.floor(new Date(robloxUser.created).getTime() / 1000)}:R>`, inline: true }, { name: 'Profile Description', value: robloxUser.description ? `\`\`\`${robloxUser.description.slice(0, 1000)}\`\`\`` : '`Empty`', inline: false });
                        }
                    }
                }
                else {
                    fields.push({ name: '\u200b', value: '\u200b', inline: false }, { name: '📊 Database Info', value: '`Not registered in the database`', inline: false });
                }
                const embed = createBrandedEmbed({
                    color: 'INFO',
                    title: `🔍 Discord Lookup — ${member.user.tag}`,
                    fields,
                    thumbnail: member.user.displayAvatarURL({ size: 128 }),
                });
                await interaction.editReply({ embeds: [embed] });
                Logger.info(`${interaction.user.tag} ran Discord lookup on ${member.user.tag}`);
            }
            else {
                // ─── Roblox Lookup ────────────────────────────────
                const robloxUser = await RobloxAPI.getUserByUsername(target);
                if (!robloxUser) {
                    await interaction.editReply({
                        embeds: [createErrorEmbed({
                                title: 'Roblox User Not Found',
                                description: `No Roblox user found with username "${target}".`,
                            })],
                    });
                    return;
                }
                // Try to find a linked Discord account
                const linkedUser = await User.findOne({ robloxId: robloxUser.id });
                let discordInfo = '`Not linked to any Discord account`';
                if (linkedUser) {
                    const member = await guild.members.fetch(linkedUser.discordId).catch(() => null);
                    if (member) {
                        discordInfo = `**${member.user.tag}** (<@${member.user.id}>)`;
                    }
                    else {
                        discordInfo = `\`${linkedUser.username}#${linkedUser.discriminator}\` (not in server)`;
                    }
                }
                const accountAge = Math.floor((Date.now() - new Date(robloxUser.created).getTime()) / (1000 * 60 * 60 * 24));
                const fields = [
                    { name: 'Username', value: `\`${robloxUser.name}\``, inline: true },
                    { name: 'Display Name', value: `\`${robloxUser.displayName}\``, inline: true },
                    { name: 'User ID', value: `\`${robloxUser.id}\``, inline: true },
                    { name: 'Account Created', value: `<t:${Math.floor(new Date(robloxUser.created).getTime() / 1000)}:R>\n\`${accountAge} days old\``, inline: true },
                    { name: 'Banned', value: robloxUser.isBanned ? '`Yes`' : '`No`', inline: true },
                    { name: 'Profile Description', value: robloxUser.description ? `\`\`\`${robloxUser.description.slice(0, 1000)}\`\`\`` : '`Empty`', inline: false },
                    { name: '\u200b', value: '\u200b', inline: false },
                    { name: '🔗 Linked Discord', value: discordInfo, inline: false },
                ];
                const embed = createBrandedEmbed({
                    color: 'INFO',
                    title: `🔍 Roblox Lookup — ${robloxUser.name}`,
                    fields,
                    thumbnail: `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUser.id}&size=150x150&format=Png`,
                });
                await interaction.editReply({ embeds: [embed] });
                Logger.info(`${interaction.user.tag} ran Roblox lookup on ${robloxUser.name}`);
            }
        }
        catch (error) {
            Logger.error('Error in lookup command:', error);
            await interaction.editReply({ content: 'An error occurred while running the lookup. Please try again.' });
        }
    },
};
//# sourceMappingURL=lookup.js.map