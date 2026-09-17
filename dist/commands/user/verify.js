import { SlashCommandBuilder } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import User from '../../models/User.js';
import { RobloxAPI } from '../../utils/roblox.js';
import { createSuccessEmbed, createErrorEmbed, createWarningEmbed, createBrandedInfoEmbed } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your Roblox account to get access to scripts')
        .addSubcommand(subcommand => subcommand
        .setName('start')
        .setDescription('Begin verification with your Roblox username')
        .addStringOption(option => option.setName('roblox_username').setDescription('Your Roblox username').setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('confirm')
        .setDescription('Confirm verification after adding the code to your Roblox profile'))
        .addSubcommand(subcommand => subcommand
        .setName('status')
        .setDescription('Check your verification status')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'start') {
            await startVerification(interaction);
        }
        else if (subcommand === 'confirm') {
            await confirmVerification(interaction);
        }
        else if (subcommand === 'status') {
            await checkStatus(interaction);
        }
    },
};
async function startVerification(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const robloxUsername = interaction.options.getString('roblox_username');
        const userId = interaction.user.id;
        // Check if already verified
        const existingUser = await User.findOne({ discordId: userId });
        if (existingUser && existingUser.isVerified) {
            await interaction.editReply({
                embeds: [createWarningEmbed({
                        title: 'Already Verified',
                        description: 'You are already verified with Roblox!',
                        fields: [
                            { name: 'Roblox Username', value: existingUser.robloxUsername || 'Unknown' },
                            { name: 'Verified At', value: existingUser.verifiedAt?.toLocaleDateString() || 'Unknown' },
                        ],
                    })],
            });
            return;
        }
        // Look up the Roblox user
        const robloxUser = await RobloxAPI.getUserByUsername(robloxUsername);
        if (!robloxUser) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'User Not Found',
                        description: `Could not find a Roblox user with the username "${robloxUsername}". Please double-check the spelling.`,
                    })],
            });
            return;
        }
        if (robloxUser.isBanned) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Account Banned',
                        description: 'This Roblox account is banned and cannot be verified.',
                    })],
            });
            return;
        }
        // Generate verification code
        const verificationCode = RobloxAPI.generateVerificationCode(userId);
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        // Save pending verification to DB
        if (existingUser) {
            existingUser.pendingVerificationCode = verificationCode;
            existingUser.pendingRobloxUsername = robloxUser.name;
            existingUser.pendingVerificationExpiry = expiry;
            await existingUser.save();
        }
        else {
            const member = await interaction.guild.members.fetch(userId);
            const newUser = new User({
                discordId: userId,
                username: interaction.user.username,
                discriminator: interaction.user.discriminator,
                avatar: interaction.user.avatar,
                pendingVerificationCode: verificationCode,
                pendingRobloxUsername: robloxUser.name,
                pendingVerificationExpiry: expiry,
                lastSeen: new Date(),
                joinedAt: member.joinedAt,
                statistics: { scriptsUsed: 0 },
            });
            await newUser.save();
        }
        await interaction.editReply({
            embeds: [createBrandedInfoEmbed({
                    title: 'Roblox Verification',
                    description: 'Follow these steps to verify your account:',
                    fields: [
                        {
                            name: 'Step 1',
                            value: `Go to your Roblox profile and edit your **About** section.\nProfile: https://www.roblox.com/users/${robloxUser.id}/profile`,
                        },
                        {
                            name: 'Step 2',
                            value: `Paste this verification code into your About section:\n\`\`\`${verificationCode}\`\`\``,
                        },
                        {
                            name: 'Step 3',
                            value: 'Run `/verify confirm` once you\'ve saved the changes.',
                        },
                        {
                            name: '⏱️ Expiry',
                            value: `This code expires in **10 minutes**. If it expires, run \`/verify start\` again.`,
                        },
                    ],
                })],
        });
        Logger.info(`Verification started for ${interaction.user.tag} → Roblox: ${robloxUser.name}`);
    }
    catch (error) {
        Logger.error('Error in verify start:', error);
        await interaction.editReply({ content: 'An error occurred. Please try again.' });
    }
}
async function confirmVerification(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const userId = interaction.user.id;
        const user = await User.findOne({ discordId: userId });
        if (!user || !user.pendingVerificationCode) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'No Pending Verification',
                        description: 'You haven\'t started verification yet. Run `/verify start` with your Roblox username first.',
                    })],
            });
            return;
        }
        if (user.pendingVerificationExpiry && user.pendingVerificationExpiry < new Date()) {
            user.pendingVerificationCode = undefined;
            user.pendingRobloxUsername = undefined;
            user.pendingVerificationExpiry = undefined;
            await user.save();
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Code Expired',
                        description: 'Your verification code has expired. Run `/verify start` again to get a new one.',
                    })],
            });
            return;
        }
        // Fetch Roblox profile description
        const robloxUser = await RobloxAPI.getUserByUsername(user.pendingRobloxUsername);
        if (!robloxUser) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Roblox Error',
                        description: 'Could not fetch your Roblox profile. Please try again.',
                    })],
            });
            return;
        }
        const description = await RobloxAPI.getProfileDescription(robloxUser.id);
        if (!description) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Profile Inaccessible',
                        description: 'Could not read your Roblox profile description. Make sure your profile is public.',
                    })],
            });
            return;
        }
        // Check if the verification code is in the profile description
        if (!description.includes(user.pendingVerificationCode)) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Code Not Found',
                        description: 'The verification code was not found in your Roblox profile description.',
                        fields: [
                            { name: 'What to do', value: 'Make sure you pasted the **exact** code and saved your profile.' },
                        ],
                    })],
            });
            return;
        }
        // Verification successful!
        const guild = interaction.guild;
        const verifiedRoleId = process.env.VERIFIED_ROLE_ID;
        if (!verifiedRoleId) {
            Logger.error('VERIFIED_ROLE_ID not set');
            await interaction.editReply({ content: 'Server configuration error. Please contact staff.' });
            return;
        }
        const verifiedRole = guild.roles.cache.get(verifiedRoleId);
        if (!verifiedRole) {
            Logger.error(`Verified role not found: ${verifiedRoleId}`);
            await interaction.editReply({ content: 'Server configuration error. Please contact staff.' });
            return;
        }
        const member = await guild.members.fetch(userId);
        await member.roles.add(verifiedRole);
        // Update user record
        user.robloxUsername = robloxUser.name;
        user.robloxId = robloxUser.id;
        user.isVerified = true;
        user.verifiedAt = new Date();
        user.lastSeen = new Date();
        user.pendingVerificationCode = undefined;
        user.pendingRobloxUsername = undefined;
        user.pendingVerificationExpiry = undefined;
        await user.save();
        await interaction.editReply({
            embeds: [createSuccessEmbed({
                    title: 'Verification Successful',
                    description: 'Your Roblox account has been verified!',
                    fields: [
                        { name: 'Roblox Username', value: robloxUser.name, inline: true },
                        { name: 'Roblox ID', value: robloxUser.id, inline: true },
                        { name: 'Role Added', value: verifiedRole.name, inline: true },
                        { name: 'Next Steps', value: 'Use `/games` to browse scripts and `/getscript` to get them.' },
                    ],
                })],
        });
        Logger.info(`User ${interaction.user.tag} verified as Roblox: ${robloxUser.name}`);
    }
    catch (error) {
        Logger.error('Error in verify confirm:', error);
        await interaction.editReply({ content: 'An error occurred during verification. Please try again.' });
    }
}
async function checkStatus(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        const user = await User.findOne({ discordId: interaction.user.id });
        if (!user) {
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: 'Not Registered',
                        description: 'You haven\'t interacted with the bot yet. Run `/verify start` to begin.',
                    })],
            });
            return;
        }
        if (user.isVerified) {
            await interaction.editReply({
                embeds: [createSuccessEmbed({
                        title: 'Verification Status',
                        description: 'You are **verified**.',
                        fields: [
                            { name: 'Roblox Username', value: user.robloxUsername || 'Unknown', inline: true },
                            { name: 'Verified At', value: user.verifiedAt?.toLocaleDateString() || 'Unknown', inline: true },
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
                            ? 'Your verification code has expired. Run `/verify start` again.'
                            : `You have a pending verification for Roblox user **${user.pendingRobloxUsername}**.\nRun \`/verify confirm\` after adding the code to your profile.`,
                        fields: expired ? [] : [
                            { name: 'Code', value: `\`${user.pendingVerificationCode}\`` },
                            { name: 'Expires', value: user.pendingVerificationExpiry?.toLocaleString() || 'Unknown' },
                        ],
                    })],
            });
            return;
        }
        await interaction.editReply({
            embeds: [createErrorEmbed({
                    title: 'Not Verified',
                    description: 'You are not verified. Run `/verify start` with your Roblox username to begin.',
                })],
        });
    }
    catch (error) {
        Logger.error('Error checking verification status:', error);
        await interaction.editReply({ content: 'An error occurred. Please try again.' });
    }
}
//# sourceMappingURL=verify.js.map