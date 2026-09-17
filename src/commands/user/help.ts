import { SlashCommandBuilder } from 'discord.js';
import { createBrandedInfoEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display help information and available commands'),

  async execute(interaction: any) {
    const helpEmbed = createBrandedInfoEmbed({
      title: '🎮 Reyex Hub Bot Commands',
      description: 'Here are all the available commands:',
      fields: [
        {
          name: '👤 User Commands',
          value: '`/verify start` - Begin Roblox verification\n`/verify confirm` - Confirm verification code\n`/verify status` - Check verification status\n`/getscript` - Get a script for a game\n`/games` - List all available games\n`/profile` - View your profile\n`/executors` - Live executor status tracker\n`/poll` - Create and manage polls',
        },
        {
          name: '🛡️ Moderation',
          value: '`/ban` - Ban a user\n`/unban` - Unban a user by ID\n`/kick` - Kick a user\n`/timeout` - Timeout a user\n`/warn` - Warn a user\n`/warnings` - View user warnings\n`/purge` - Delete messages',
        },
        {
          name: '🔧 Admin',
          value: '`/addgame` - Add a new game/script\n`/removegame` - Remove a game\n`/updategame` - Update game information\n`/whitelist` - Manually whitelist a user\n`/unwhitelist` - Remove user access\n`/stats` - View bot statistics\n`/broadcast` - Send announcement\n`/giveaway` - Start a giveaway',
        },
        {
          name: '📝 Information',
          value: 'Use `/help` to see this message again.\nFor support, contact the server staff.',
        },
      ],
    });

    await interaction.reply({ embeds: [helpEmbed] });
  },
};
