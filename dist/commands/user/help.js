import { SlashCommandBuilder, ActionRowBuilder, } from 'discord.js';
import { createHelpEmbed, createHelpSelectMenu, } from '../../utils/embeds.js';
export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Browse all Reyex Hub commands by category'),
    async execute(interaction) {
        const embed = createHelpEmbed('user');
        const selectMenu = createHelpSelectMenu();
        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({
            embeds: [embed],
            components: [row],
        });
    },
};
//# sourceMappingURL=help.js.map