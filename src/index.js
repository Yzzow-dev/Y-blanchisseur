const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config/config');
const database = require('./utils/database');
const { logBot, logError, logSuccess } = require('./utils/logger');
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');

class DiscordRPBot {
    constructor() {
        // Configuration du client Discord
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages
            ],
            partials: ['MESSAGE', 'CHANNEL', 'REACTION']
        });

        // Handlers
        this.commandHandler = new CommandHandler(this.client);
        this.eventHandler = new EventHandler(this.client);

        // Collections pour les données en cache
        this.client.guilds.cache = new Collection();
        this.client.users.cache = new Collection();
        this.client.tickets = new Collection();
        this.client.candidatures = new Collection();

        // Statistiques
        this.stats = {
            startTime: Date.now(),
            commandsExecuted: 0,
            ticketsCreated: 0,
            candidaturesReceived: 0,
            sanctionsApplied: 0
        };

        // Ajouter les handlers au client
        this.client.commandHandler = this.commandHandler;
        this.client.eventHandler = this.eventHandler;
        this.client.stats = this.stats;
    }

    /**
     * Initialise le bot
     */
    async initialize() {
        try {
            logBot('Initialisation du bot Discord RP...');

            // Connexion à la base de données
            await this.connectDatabase();

            // Chargement des handlers
            await this.loadHandlers();

            // Connexion à Discord
            await this.connectDiscord();

            // Déploiement des commandes (en développement)
            if (process.env.NODE_ENV === 'development') {
                await this.deployCommands();
            }

            logSuccess('Bot Discord RP initialisé avec succès !');
        } catch (error) {
            logError(error, 'INITIALIZATION');
            process.exit(1);
        }
    }

    /**
     * Connecte à la base de données
     */
    async connectDatabase() {
        try {
            await database.connect();
            logSuccess('Base de données connectée');
        } catch (error) {
            logError(error, 'DATABASE_CONNECTION');
            throw error;
        }
    }

    /**
     * Charge les handlers
     */
    async loadHandlers() {
        try {
            await this.commandHandler.loadCommands();
            await this.eventHandler.loadEvents();
            logSuccess('Handlers chargés');
        } catch (error) {
            logError(error, 'HANDLERS_LOADING');
            throw error;
        }
    }

    /**
     * Connecte à Discord
     */
    async connectDiscord() {
        try {
            await this.client.login(config.token);
        } catch (error) {
            logError(error, 'DISCORD_CONNECTION');
            throw error;
        }
    }

    /**
     * Déploie les commandes slash
     */
    async deployCommands() {
        try {
            await this.commandHandler.deployCommands();
            logSuccess('Commandes déployées');
        } catch (error) {
            logError(error, 'COMMAND_DEPLOYMENT');
            // Ne pas arrêter le bot si le déploiement échoue
        }
    }

    /**
     * Gère l'arrêt propre du bot
     */
    async shutdown() {
        try {
            logBot('Arrêt du bot en cours...');

            // Fermer la connexion Discord
            if (this.client.isReady()) {
                await this.client.destroy();
                logSuccess('Connexion Discord fermée');
            }

            // Fermer la connexion à la base de données
            await database.disconnect();
            logSuccess('Connexion base de données fermée');

            logSuccess('Bot arrêté proprement');
            process.exit(0);
        } catch (error) {
            logError(error, 'SHUTDOWN');
            process.exit(1);
        }
    }

    /**
     * Obtient les statistiques du bot
     */
    getStats() {
        const uptime = Date.now() - this.stats.startTime;
        const guildsCount = this.client.guilds.cache.size;
        const usersCount = this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

        return {
            uptime,
            guilds: guildsCount,
            users: usersCount,
            commands: this.commandHandler.getStats(),
            events: this.eventHandler.getStats(),
            performance: {
                commandsExecuted: this.stats.commandsExecuted,
                ticketsCreated: this.stats.ticketsCreated,
                candidaturesReceived: this.stats.candidaturesReceived,
                sanctionsApplied: this.stats.sanctionsApplied
            },
            memory: process.memoryUsage(),
            database: database.getStatus()
        };
    }

    /**
     * Recharge un module spécifique
     * @param {string} type - Type de module ('command' ou 'event')
     * @param {string} name - Nom du module
     */
    async reload(type, name) {
        try {
            if (type === 'command') {
                await this.commandHandler.reloadCommand(name);
            } else if (type === 'event') {
                await this.eventHandler.reloadEvent(name);
            } else {
                throw new Error('Type de module invalide');
            }
            
            logSuccess(`Module ${type} "${name}" rechargé`);
        } catch (error) {
            logError(error, `RELOAD_${type.toUpperCase()}`);
            throw error;
        }
    }

    /**
     * Vérifie l'état de santé du bot
     */
    async healthCheck() {
        const health = {
            status: 'healthy',
            checks: {
                discord: false,
                database: false,
                memory: false
            },
            details: {}
        };

        try {
            // Vérification Discord
            health.checks.discord = this.client.isReady();
            health.details.discord = {
                connected: health.checks.discord,
                ping: this.client.ws.ping,
                guilds: this.client.guilds.cache.size
            };

            // Vérification base de données
            health.checks.database = await database.ping();
            health.details.database = database.getStatus();

            // Vérification mémoire
            const memoryUsage = process.memoryUsage();
            const memoryThreshold = 1024 * 1024 * 1024; // 1GB
            health.checks.memory = memoryUsage.heapUsed < memoryThreshold;
            health.details.memory = memoryUsage;

            // Statut global
            const allHealthy = Object.values(health.checks).every(check => check === true);
            health.status = allHealthy ? 'healthy' : 'unhealthy';

        } catch (error) {
            health.status = 'error';
            health.error = error.message;
            logError(error, 'HEALTH_CHECK');
        }

        return health;
    }
}

// Création de l'instance du bot
const bot = new DiscordRPBot();

// Gestion des signaux système
process.on('SIGINT', () => bot.shutdown());
process.on('SIGTERM', () => bot.shutdown());

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
    logError(error, 'UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error) => {
    logError(error, 'UNCAUGHT_EXCEPTION');
    bot.shutdown();
});

// Démarrage du bot
bot.initialize().catch(error => {
    logError(error, 'STARTUP');
    process.exit(1);
});

// Export pour les tests ou usage externe
module.exports = bot;