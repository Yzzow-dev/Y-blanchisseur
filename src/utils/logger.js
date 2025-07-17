const winston = require('winston');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(config.logs.directory)) {
    fs.mkdirSync(config.logs.directory, { recursive: true });
}

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Format pour la console avec couleurs
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        const coloredLevel = {
            error: chalk.red.bold('ERROR'),
            warn: chalk.yellow.bold('WARN'),
            info: chalk.blue.bold('INFO'),
            debug: chalk.green.bold('DEBUG')
        }[level] || level;
        
        const coloredMessage = level === 'error' ? chalk.red(message) : message;
        const logMessage = `${chalk.gray(timestamp)} ${coloredLevel} ${coloredMessage}`;
        
        return stack ? `${logMessage}\n${chalk.red(stack)}` : logMessage;
    })
);

// Configuration du logger
const logger = winston.createLogger({
    level: config.logs.level,
    format: customFormat,
    transports: [
        // Fichier pour toutes les erreurs
        new winston.transports.File({
            filename: path.join(config.logs.directory, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5
        }),
        
        // Fichier pour tous les logs
        new winston.transports.File({
            filename: path.join(config.logs.directory, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5
        }),
        
        // Console avec couleurs
        new winston.transports.Console({
            format: consoleFormat
        })
    ]
});

// Fonctions utilitaires
const logBot = (message) => {
    logger.info(`${chalk.blue('[BOT]')} ${message}`);
};

const logCommand = (commandName, user, guild) => {
    logger.info(`${chalk.green('[COMMAND]')} ${commandName} utilisée par ${user.tag} dans ${guild?.name || 'DM'}`);
};

const logEvent = (eventName, message) => {
    logger.info(`${chalk.yellow('[EVENT]')} ${eventName}: ${message}`);
};

const logError = (error, context = '') => {
    logger.error(`${chalk.red('[ERROR]')} ${context ? `[${context}] ` : ''}${error.message}`, { 
        stack: error.stack,
        context 
    });
};

const logWarning = (message, context = '') => {
    logger.warn(`${chalk.yellow('[WARNING]')} ${context ? `[${context}] ` : ''}${message}`);
};

const logSuccess = (message, context = '') => {
    logger.info(`${chalk.green('[SUCCESS]')} ${context ? `[${context}] ` : ''}${message}`);
};

const logDatabase = (message, type = 'info') => {
    const prefix = chalk.magenta('[DATABASE]');
    if (type === 'error') {
        logger.error(`${prefix} ${message}`);
    } else {
        logger.info(`${prefix} ${message}`);
    }
};

const logModeration = (action, moderator, target, reason, guild) => {
    logger.info(`${chalk.red('[MODERATION]')} ${action} - Modérateur: ${moderator.tag}, Cible: ${target.tag}, Raison: ${reason || 'Aucune'}, Serveur: ${guild.name}`);
};

const logTicket = (action, user, ticketId, guild) => {
    logger.info(`${chalk.cyan('[TICKET]')} ${action} - Utilisateur: ${user.tag}, Ticket: ${ticketId}, Serveur: ${guild.name}`);
};

module.exports = {
    logger,
    logBot,
    logCommand,
    logEvent,
    logError,
    logWarning,
    logSuccess,
    logDatabase,
    logModeration,
    logTicket
};