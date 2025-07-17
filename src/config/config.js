require('dotenv').config();

module.exports = {
    // Bot Configuration
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    ownerId: process.env.OWNER_ID,
    prefix: process.env.PREFIX || '!',
    
    // Database Configuration
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/discord-rp-bot'
    },
    
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-here',
        dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
        redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/auth/discord/callback'
    },
    
    // Logs Configuration
    logs: {
        level: process.env.LOG_LEVEL || 'info',
        directory: './logs'
    },
    
    // Bot Settings
    settings: {
        embedColor: '#5865F2',
        errorColor: '#ED4245',
        successColor: '#57F287',
        warningColor: '#FEE75C',
        
        // Timeouts
        ticketInactivityTimeout: 24 * 60 * 60 * 1000, // 24 heures
        muteMaxDuration: 7 * 24 * 60 * 60 * 1000, // 7 jours
        
        // Limits
        maxWarnings: 3,
        maxTicketsPerUser: 3,
        maxCandidaturesPerUser: 1,
        
        // Auto-modération
        automod: {
            antiSpam: {
                enabled: true,
                maxMessages: 5,
                timeWindow: 5000, // 5 secondes
                muteTime: 10 * 60 * 1000 // 10 minutes
            },
            antiLink: {
                enabled: true,
                whitelist: ['discord.gg', 'youtube.com', 'github.com'],
                action: 'delete' // 'delete', 'warn', 'mute'
            }
        }
    }
};