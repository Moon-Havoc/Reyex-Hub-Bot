import { SlashCommandBuilder } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import { RobloxAPI } from '../../utils/roblox.js';
import { createSuccessEmbed, createErrorEmbed, createWarningEmbed, createBrandedEmbed, ts, } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Link your Roblox account to access scripts')
        .addSubcommand(sub => sub
        .setName('start')
        .setDescription('Begin verification with your Roblox username')
        .addStringOption(opt => opt.setName('roblox_username').setDescription('Your Roblox username').setRequired(true)))
        .addSubcommand(sub => sub.setName('confirm').setDescription('Confirm after adding the code to your Roblox profile'))
        .addSubcommand(sub => sub.setName('status').setDescription('Check your verification status')),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'start')
            return startVerification(interaction);
        if (sub === 'confirm')
            return confirmVerification(interaction);
        if (sub === 'status')
            return checkStatus(interaction);
    },
};
// ─── /verify start ────────────────────────────────────────────
async function startVerification(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const robloxUsername = interaction.options.getString('roblox_username', true);
    const userId = interaction.user.id;
    try {
        // Already verified?
        const existing = await User.findOne({ discordId: userId });
        if (existing?.isVerified) {
            await interaction.editReply({
                embeds: [createWarningEmbed({
                        title: 'Already Verified',
                        description: 'Your Roblox account is already linked.',
                        fields: [
                            { name: '🎮  Roblox', value: `\`${existing.robloxUsername}\``, inline: true },
                            { name: '🔗  Verified', value: ts.relative(existing.verifiedAt ?? new Date()), inline: true },
                        ],
                    })],
            });
            return;
        }
        // Look up the Roblox account
        const robloxUser = await RobloxAPI.getUserByUsername(robloxUsername);
        if (!robloxUser) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'User Not Found',
                        description: `No Roblox user found for **"${robloxUsername}"**. Check the spelling and try again.`,
                    })],
            });
            return;
        }
        if (robloxUser.isBanned) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Account Banned',
                        description: 'That Roblox account is banned and cannot be used for verification.',
                    })],
            });
            return;
        }
        // Generate a fresh random code
        const code = RobloxAPI.generateVerificationCode(userId);
        const expiry = new Date(Date.now() + 10 * 60 * 1_000); // 10 min
        // Persist pending state
        await User.findOneAndUpdate({ discordId: userId }, {
            $set: {
                username: interaction.user.username,
                discriminator: interaction.user.discriminator,
                avatar: interaction.user.avatar ?? undefined,
                pendingVerificationCode: code,
                pendingRobloxUsername: robloxUser.name,
                pendingVerificationExpiry: expiry,
                lastSeen: new Date(),
            },
            $setOnInsert: {
                joinedAt: new Date(),
                statistics: { scriptsUsed: 0 },
            },
        }, { upsert: true, new: true });
        await interaction.editReply({
            embeds: [createBrandedEmbed({
                    color: 'INFO',
                    title: '🔐  Roblox Verification — Step by Step',
                    description: 'Follow the steps below. Your code expires in **10 minutes**.',
                    thumbnail: null,
                    fields: [
                        {
                            name: '**Step 1**  —  Open your Roblox profile',
                            value: `Go to [your profile](https://www.roblox.com/users/${robloxUser.id}/profile) and click **Edit Profile**.`,
                        },
                        {
                            name: '**Step 2**  —  Paste your code',
                            value: `Add this **exact** text to your **About** section:\n\`\`\`\n${code}\n\`\`\``,
                        },
                        {
                            name: '**Step 3**  —  Save & confirm',
                            value: 'Save your Roblox profile, then run **`/verify confirm`** here.',
                        },
                        {
                            name: '⏰  Expires',
                            value: ts.relative(expiry),
                            inline: true,
                        },
                        {
                            name: '🎮  Account',
                            value: `[${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile)`,
                            inline: true,
                        },
                    ],
                    footer: 'You can run /verify status at any time to check your progress.',
                })],
        });
        Logger.info(`Verification started: ${interaction.user.tag} → Roblox: ${robloxUser.name}`);
    }
    catch (error) {
        Logger.error('Error in /verify start', error);
        await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
    }
}
// ─── /verify confirm ──────────────────────────────────────────
async function confirmVerification(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const userId = interaction.user.id;
    try {
        const user = await User.findOne({ discordId: userId });
        if (!user?.pendingVerificationCode) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'No Pending Verification',
                        description: "You haven't started verification yet. Run `/verify start` with your Roblox username first.",
                    })],
            });
            return;
        }
        // Check expiry (DB gate — in-memory gate in RobloxAPI.validateCode is a second layer)
        if (user.pendingVerificationExpiry && user.pendingVerificationExpiry < new Date()) {
            user.pendingVerificationCode = undefined;
            user.pendingRobloxUsername = undefined;
            user.pendingVerificationExpiry = undefined;
            await user.save();
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Code Expired',
                        description: 'Your verification code expired. Run `/verify start` again to get a new one.',
                    })],
            });
            return;
        }
        // In-memory code check (detects restart-invalidated codes)
        if (!RobloxAPI.validateCode(userId, user.pendingVerificationCode)) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Code Invalid',
                        description: 'The verification code is no longer valid (the bot may have restarted). Run `/verify start` again.',
                    })],
            });
            return;
        }
        // Fetch Roblox profile
        const robloxUser = await RobloxAPI.getUserByUsername(user.pendingRobloxUsername);
        if (!robloxUser) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Roblox Error',
                        description: 'Could not fetch your Roblox profile. Please try again in a moment.',
                    })],
            });
            return;
        }
        const description = await RobloxAPI.getProfileDescription(robloxUser.id);
        if (description === null) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Profile Inaccessible',
                        description: 'Could not read your Roblox **About** section. Make sure your profile is set to **Public**.',
                    })],
            });
            return;
        }
        if (!description.includes(user.pendingVerificationCode)) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Code Not Found',
                        description: 'The verification code was **not found** in your Roblox About section.',
                        fields: [
                            { name: 'Expected code', value: `\`${user.pendingVerificationCode}\`` },
                            { name: 'What to check', value: '• Make sure you pasted the code exactly\n• Make sure your profile was saved\n• Make sure your profile privacy is set to Public' },
                        ],
                    })],
            });
            return;
        }
        // ── Verification passed ──────────────────────────────────
        const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
        if (!verifiedRoleId) {
            Logger.error('VERIFIED_ROLE_ID is not set');
            await interaction.editReply({ content: '❌  Server configuration error — contact staff.' });
            return;
        }
        const guild = interaction.guild;
        const verifiedRole = guild.roles.cache.get(verifiedRoleId);
        if (!verifiedRole) {
            Logger.error(`Verified role not found: ${verifiedRoleId}`);
            await interaction.editReply({ content: '❌  Server configuration error — contact staff.' });
            return;
        }
        const member = await guild.members.fetch(userId);
        await member.roles.add(verifiedRole);
        // Update DB
        user.robloxUsername = robloxUser.name;
        user.robloxId = robloxUser.id;
        user.isVerified = true;
        user.verifiedAt = new Date();
        user.lastSeen = new Date();
        user.pendingVerificationCode = undefined;
        user.pendingRobloxUsername = undefined;
        user.pendingVerificationExpiry = undefined;
        await user.save();
        // Clear in-memory code
        RobloxAPI.clearCode(userId);
        await interaction.editReply({
            embeds: [createSuccessEmbed({
                    title: 'Verification Complete',
                    description: '🎉  Your Roblox account has been linked successfully!',
                    fields: [
                        { name: '🎮  Roblox', value: `[${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile)`, inline: true },
                        { name: '🪪  Roblox ID', value: `\`${robloxUser.id}\``, inline: true },
                        { name: '🏷️  Role Added', value: verifiedRole.name, inline: true },
                        { name: '📅  Account Created', value: ts.date(new Date(robloxUser.created)), inline: true },
                        { name: '🔢  Account Age', value: RobloxAPI.accountAge(robloxUser.created), inline: true },
                        { name: '📜  Next Steps', value: 'Use `/games` to browse scripts and `/getscript` to retrieve them.' },
                    ],
                })],
        });
        Logger.info(`Verified: ${interaction.user.tag} → Roblox: ${robloxUser.name} (${robloxUser.id})`);
    }
    catch (error) {
        Logger.error('Error in /verify confirm', error);
        await interaction.editReply({ content: '❌  An error occurred during verification. Please try again.' });
    }
}
// ─── /verify status ───────────────────────────────────────────
async function checkStatus(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const user = await User.findOne({ discordId: interaction.user.id });
        if (!user) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Not Registered',
                        description: "You haven't interacted with this bot yet. Run `/verify start` to begin.",
                    })],
            });
            return;
        }
        if (user.isVerified) {
            await interaction.editReply({
                embeds: [createSuccessEmbed({
                        title: 'Verification Status',
                        description: '✅  Your Roblox account is verified.',
                        fields: [
                            { name: '🎮  Roblox Username', value: `[${user.robloxUsername}](https://www.roblox.com/users/${user.robloxId}/profile)`, inline: true },
                            { name: '🔗  Verified', value: ts.relative(user.verifiedAt ?? new Date()), inline: true },
                        ],
                    })],
            });
            return;
        }
        if (user.pendingVerificationCode) {
            const expired = user.pendingVerificationExpiry && user.pendingVerificationExpiry < new Date();
            await interaction.editReply({
                embeds: [createWarningEmbed({
                        title: 'Pending Verification',
                        description: expired
                            ? '⏰  Your code has expired. Run `/verify start` again to get a new one.'
                            : `Verification is in progress for Roblox user **${user.pendingRobloxUsername}**.\nRun \`/verify confirm\` after adding the code to your profile.`,
                        fields: expired ? [] : [
                            { name: '🔑  Code', value: `\`${user.pendingVerificationCode}\``, inline: true },
                            { name: '⏰  Expires', value: ts.relative(user.pendingVerificationExpiry ?? new Date()), inline: true },
                        ],
                    })],
            });
            return;
        }
        await interaction.editReply({
            embeds: [createErrorEmbed({
                    title: 'Not Verified',
                    description: "You are not verified. Run `/verify start` with your Roblox username to begin.",
                })],
        });
    }
    catch (error) {
        Logger.error('Error in /verify status', error);
        await interaction.editReply({ content: '❌  An error occurred. Please try again.' });
    }
}
//# sourceMappingURL=verify.js.map