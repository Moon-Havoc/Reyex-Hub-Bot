# Reyex Hub Discord Bot

A modern Discord bot for Roblox script hub communities, built with TypeScript, discord.js v14, and MongoDB.

## Features

### User Commands
- `/verify` - Verify your Roblox account to get access to scripts
- `/getscript` - Get a script for a specific game
- `/games` - List all available games and scripts
- `/profile` - View your profile and verification status
- `/help` - Display help information and available commands

### Admin Commands
- `/addgame` - Add a new game/script to the database
- `/removegame` - Remove a game/script from the database
- `/updategame` - Update an existing game/script
- `/whitelist` - Manually whitelist a user (bypass verification)
- `/unwhitelist` - Remove a user's access
- `/stats` - View bot statistics
- `/broadcast` - Send announcement to all verified users
- `/giveaway` - Manage giveaways (start, end, list)

## Prerequisites

- Node.js 18 or higher
- MongoDB (local or MongoDB Atlas)
- Discord Bot Token
- Discord Application ID
- Discord Guild ID (for development)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd reyex-hub-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_guild_id_here
MONGODB_URI=mongodb://localhost:27017/reyex-hub
VERIFIED_ROLE_ID=your_verified_role_id_here
ADMIN_ROLE_ID=your_admin_role_id_here
BOT_ACTIVITY=Reyex Hub | /help
```

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" tab and create a bot
4. Copy the bot token to `DISCORD_TOKEN`
5. Copy the application ID to `CLIENT_ID`
6. Enable the following intents:
   - Server Members Intent
   - Message Content Intent
7. Go to OAuth2 → URL Generator
8. Select bot and applications.commands scopes
9. Select necessary permissions (Administrator recommended)
10. Copy the invite URL and add the bot to your server
11. Copy your server ID to `GUILD_ID`

## MongoDB Setup

### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use default connection string: `mongodb://localhost:27017/reyex-hub`

### MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Replace `MONGODB_URI` with your Atlas connection string

## Role Setup

1. Create a "Verified" role in your Discord server
2. Create an "Admin" role in your Discord server
3. Copy the role IDs to `VERIFIED_ROLE_ID` and `ADMIN_ROLE_ID`

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Deploy Commands
```bash
npm run deploy-commands
```

## Project Structure

```
reyex-hub-bot/
├── src/
│   ├── commands/
│   │   ├── user/          # User commands
│   │   └── admin/         # Admin commands
│   ├── events/            # Discord event handlers
│   ├── handlers/          # Command and event handlers
│   ├── models/            # MongoDB models
│   ├── utils/             # Utility functions
│   ├── index.ts           # Bot entry point
│   └── deploy-commands.ts # Command deployment script
├── .env                   # Environment variables
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Features Explained

### Keyless System
The bot uses a keyless system based on Discord roles. Users verify their Roblox account and automatically receive the "Verified" role, which grants access to scripts.

### Roblox Integration
The bot integrates with the Roblox API to:
- Validate Roblox usernames
- Get user information
- Verify account ownership

### Script Distribution
Scripts are stored as external URLs. When a user requests a script, the bot provides the URL, which can be copied and executed in a Roblox executor.

### Giveaway System
Admins can create giveaways with:
- Custom name and description
- Prize specification
- Duration setting
- Automatic winner selection
- Participant tracking

### Statistics
The bot tracks:
- Total users
- Verified users
- Active users (last 7 days)
- Script usage statistics
- Verification rates

## Security Considerations

- Never commit `.env` file to version control
- Use strong bot tokens and API keys
- Keep dependencies updated
- Use environment variables for sensitive data
- Implement rate limiting for public commands
- Validate all user inputs

## Troubleshooting

### Bot won't start
- Check if `DISCORD_TOKEN` is set correctly
- Verify MongoDB connection string
- Check if MongoDB is running

### Commands not working
- Run `npm run deploy-commands` to register commands
- Check if bot has necessary permissions
- Verify role IDs are correct

### Database errors
- Ensure MongoDB is running
- Check connection string format
- Verify database user permissions

### Roblox verification failing
- Check internet connection
- Verify Roblox API is accessible
- Check username spelling

## Deployment

### Railway
1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy

### Fly.io
1. Install Fly CLI
2. Run `fly launch`
3. Add environment variables
4. Run `fly deploy`

### VPS
1. Set up Node.js and MongoDB on VPS
2. Clone repository
3. Install dependencies
4. Set up environment variables
5. Use PM2 for process management: `pm2 start dist/index.js --name reyex-bot`

## Future Enhancements

- Payment integration for monetization
- Web dashboard for admin management
- Advanced analytics and user insights
- Multi-language support
- Custom branding and themes
- Integration with more Roblox APIs
- Mobile app or web interface for users

## Support

For issues and questions:
- Check the troubleshooting section
- Review Discord.js documentation
- Check MongoDB documentation
- Open an issue on GitHub

## License

ISC

## Credits

Built with:
- discord.js v14
- MongoDB
- TypeScript
- Node.js

Generated with [Devin](https://devin.ai)
