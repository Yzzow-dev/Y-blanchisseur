const { Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { logBot, logError, logSuccess } = require('../utils/logger');

class CommandHandler {
    constructor(client) {
        this.client = client;
        this.commands = new Collection();
        this.cooldowns = new Collection();
    }

    /**
     * Charge toutes les commandes depuis le dossier commands
     */
    async loadCommands() {
        const commandsPath = path.join(__dirname, '..', 'commands');
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            if (!fs.statSync(folderPath).isDirectory()) continue;

            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                try {
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);

                    if (command.data && command.execute) {
                        this.commands.set(command.data.name, command);
                        logBot(`Commande chargée: ${command.data.name}`);
                    } else {
                        logError(new Error(`Commande invalide: ${filePath}`), 'COMMAND_HANDLER');
                    }
                } catch (error) {
                    logError(error, `COMMAND_LOAD_${file}`);
                }
            }
        }

        logSuccess(`${this.commands.size} commandes chargées avec succès`);
    }

    /**
     * Recharge une commande spécifique
     * @param {string} commandName - Nom de la commande
     */
    async reloadCommand(commandName) {
        const command = this.commands.get(commandName);
        if (!command) {
            throw new Error(`Commande "${commandName}" non trouvée`);
        }

        // Trouver le fichier de la commande
        const commandsPath = path.join(__dirname, '..', 'commands');
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            if (!fs.statSync(folderPath).isDirectory()) continue;

            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                try {
                    delete require.cache[require.resolve(filePath)];
                    const reloadedCommand = require(filePath);

                    if (reloadedCommand.data && reloadedCommand.data.name === commandName) {
                        this.commands.set(commandName, reloadedCommand);
                        logSuccess(`Commande "${commandName}" rechargée`);
                        return;
                    }
                } catch (error) {
                    logError(error, `COMMAND_RELOAD_${file}`);
                    throw error;
                }
            }
        }

        throw new Error(`Fichier de la commande "${commandName}" non trouvé`);
    }

    /**
     * Déploie les commandes slash sur Discord
     */
    async deployCommands() {
        const commands = [];
        this.commands.forEach(command => {
            commands.push(command.data.toJSON());
        });

        const rest = new REST({ version: '10' }).setToken(config.token);

        try {
            logBot('Déploiement des commandes slash...');

            await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commands }
            );

            logSuccess(`${commands.length} commandes slash déployées avec succès`);
        } catch (error) {
            logError(error, 'COMMAND_DEPLOY');
            throw error;
        }
    }

    /**
     * Déploie les commandes slash pour un serveur spécifique
     * @param {string} guildId - ID du serveur
     */
    async deployGuildCommands(guildId) {
        const commands = [];
        this.commands.forEach(command => {
            commands.push(command.data.toJSON());
        });

        const rest = new REST({ version: '10' }).setToken(config.token);

        try {
            logBot(`Déploiement des commandes slash pour le serveur ${guildId}...`);

            await rest.put(
                Routes.applicationGuildCommands(config.clientId, guildId),
                { body: commands }
            );

            logSuccess(`${commands.length} commandes slash déployées pour le serveur ${guildId}`);
        } catch (error) {
            logError(error, 'GUILD_COMMAND_DEPLOY');
            throw error;
        }
    }

    /**
     * Gère l'exécution d'une commande
     * @param {Object} interaction - Interaction Discord
     */
    async handleCommand(interaction) {
        const command = this.commands.get(interaction.commandName);
        if (!command) {
            logError(new Error(`Commande "${interaction.commandName}" non trouvée`), 'COMMAND_HANDLER');
            return;
        }

        try {
            // Vérification des cooldowns
            if (this.checkCooldown(interaction, command)) {
                return;
            }

            // Vérification des permissions
            if (command.permissions && !this.checkPermissions(interaction, command)) {
                return;
            }

            // Exécution de la commande
            await command.execute(interaction);
            
            // Logging
            const { logCommand } = require('../utils/logger');
            logCommand(interaction.commandName, interaction.user, interaction.guild);

        } catch (error) {
            logError(error, `COMMAND_EXECUTE_${interaction.commandName}`);
            
            const embed = require('../utils/embedBuilder').createErrorEmbed(
                'Erreur',
                'Une erreur est survenue lors de l\'exécution de cette commande.'
            );

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }

    /**
     * Vérifie le cooldown d'une commande
     * @param {Object} interaction - Interaction Discord
     * @param {Object} command - Commande
     * @returns {boolean} - True si en cooldown
     */
    checkCooldown(interaction, command) {
        if (!command.cooldown) return false;

        const now = Date.now();
        const timestamps = this.cooldowns.get(command.data.name) || new Collection();
        const cooldownAmount = command.cooldown * 1000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                const embed = require('../utils/embedBuilder').createWarningEmbed(
                    'Cooldown',
                    `Vous devez attendre ${timeLeft.toFixed(1)} seconde(s) avant de réutiliser cette commande.`
                );

                interaction.reply({ embeds: [embed], ephemeral: true });
                return true;
            }
        }

        timestamps.set(interaction.user.id, now);
        this.cooldowns.set(command.data.name, timestamps);

        // Nettoyer le cooldown après expiration
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        return false;
    }

    /**
     * Vérifie les permissions d'une commande
     * @param {Object} interaction - Interaction Discord
     * @param {Object} command - Commande
     * @returns {boolean} - True si autorisé
     */
    async checkPermissions(interaction, command) {
        if (!command.permissions) return true;

        const permissions = require('../utils/permissions');
        const Guild = require('../models/Guild');

        try {
            const guildData = await Guild.findOne({ guildId: interaction.guild.id });
            const member = interaction.member;

            const hasPermission = permissions.canUseCommand(member, command.data.name, guildData);

            if (!hasPermission) {
                const embed = require('../utils/embedBuilder').createErrorEmbed(
                    'Permissions insuffisantes',
                    'Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.'
                );

                await interaction.reply({ embeds: [embed], ephemeral: true });
                return false;
            }

            return true;
        } catch (error) {
            logError(error, 'PERMISSION_CHECK');
            return false;
        }
    }

    /**
     * Obtient une commande par son nom
     * @param {string} name - Nom de la commande
     * @returns {Object|null}
     */
    getCommand(name) {
        return this.commands.get(name);
    }

    /**
     * Obtient toutes les commandes
     * @returns {Collection}
     */
    getCommands() {
        return this.commands;
    }

    /**
     * Obtient les commandes par catégorie
     * @param {string} category - Catégorie
     * @returns {Array}
     */
    getCommandsByCategory(category) {
        return Array.from(this.commands.values()).filter(cmd => cmd.category === category);
    }

    /**
     * Obtient les statistiques des commandes
     * @returns {Object}
     */
    getStats() {
        const categories = {};
        this.commands.forEach(command => {
            const category = command.category || 'Autre';
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category]++;
        });

        return {
            total: this.commands.size,
            categories,
            cooldowns: this.cooldowns.size
        };
    }
}

module.exports = CommandHandler;