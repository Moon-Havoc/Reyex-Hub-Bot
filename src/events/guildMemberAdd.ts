import { Events, GuildMember } from 'discord.js';
import { Logger } from '../utils/logger.js';
import User from '../models/User.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member: GuildMember) {
    try {
      // Check if user already exists in database
      let user = await User.findOne({ discordId: member.id });

      if (!user) {
        // Create new user entry
        user = new User({
          discordId: member.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
          avatar: member.user.avatar || undefined,
          joinedAt: member.joinedAt,
          lastSeen: new Date(),
        });

        await user.save();
        Logger.info(`Created new user entry for ${member.user.tag}`);
      } else {
        // Update existing user
        user.username = member.user.username;
        user.discriminator = member.user.discriminator;
        user.avatar = member.user.avatar || undefined;
        user.lastSeen = new Date();
        await user.save();
        Logger.info(`Updated user entry for ${member.user.tag}`);
      }

      // Send welcome message
      const welcomeChannel = member.guild.systemChannel;
      if (welcomeChannel) {
        await welcomeChannel.send({
          content: `Welcome to Reyex Hub, ${member.user}! Use \`/verify\` to get access to scripts.`,
        });
      }
    } catch (error) {
      Logger.error('Error handling guild member add:', error);
    }
  },
};
