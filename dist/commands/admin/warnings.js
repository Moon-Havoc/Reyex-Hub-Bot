import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import Warning from '../../models/Warning.js';
import { createErrorEmbed, createBrandedInfoEmbed } from '../../utils/embeds.js';
import { isStaff } from '../../utils/permissions.js';
export default {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a user')
        .addUserOption(option => option.setName('user').setDescription('The user to check warnings for').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            if (!isStaff(interaction.member)) {
                await interaction.editReply({ embeds: [createErrorEmbed({ title: 'No Permission', description: 'You need the Staff role to use this command.' })] });
                return;
            }
            const targetUser = interaction.options.getUser('user');
            const warnings = await Warning.find({ discordId: targetUser.id, active: true }).sort({ createdAt: -1 });
            if (warnings.length === 0) {
                await interaction.editReply({
                    embeds: [createBrandedInfoEmbed({
                            title: 'No Warnings',
                            description: `**${targetUser.tag}** has no active warnings.`,
                        })],
                });
                return;
            }
            const fields = warnings.map((w, i) => ({
                name: `Warning ${warnings.length - i}`,
                value: `**Reason:** ${w.reason}\n**Moderator:** <@${w.moderatorId}>\n**Date:** ${w.createdAt.toLocaleDateString()}`,
                inline: false,
            }));
            fields.push({
                name: 'Total',
                value: `${warnings.length} active warning(s)`,
                inline: false,
            });
            await interaction.editReply({
                embeds: [createErrorEmbed({
                        title: `Warnings for ${targetUser.tag}`,
                        description: '',
                        fields,
                    })],
            });
            Logger.info(`Warnings for ${targetUser.tag} viewed by ${interaction.user.tag}`);
        }
        catch (error) {
            Logger.error('Error in warnings command:', error);
            await interaction.editReply({ content: 'An error occurred while fetching warnings. Please try again.' });
        }
    },
};
//# sourceMappingURL=warnings.js.map