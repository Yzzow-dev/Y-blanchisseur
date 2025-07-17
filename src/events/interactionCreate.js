const { Events, InteractionType } = require('discord.js');
const { logError } = require('../utils/logger');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            // Gestion des commandes slash
            if (interaction.isChatInputCommand()) {
                await handleSlashCommand(interaction);
            }
            
            // Gestion des boutons
            else if (interaction.isButton()) {
                await handleButton(interaction);
            }
            
            // Gestion des menus de sélection
            else if (interaction.isStringSelectMenu()) {
                await handleSelectMenu(interaction);
            }
            
            // Gestion des modales
            else if (interaction.isModalSubmit()) {
                await handleModal(interaction);
            }
            
            // Gestion de l'autocomplétion
            else if (interaction.isAutocomplete()) {
                await handleAutocomplete(interaction);
            }
            
        } catch (error) {
            logError(error, 'INTERACTION_CREATE');
            
            const embed = require('../utils/embedBuilder').createErrorEmbed(
                'Erreur',
                'Une erreur est survenue lors du traitement de votre interaction.'
            );

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};

/**
 * Gère les commandes slash
 * @param {CommandInteraction} interaction
 */
async function handleSlashCommand(interaction) {
    await interaction.client.commandHandler.handleCommand(interaction);
}

/**
 * Gère les interactions de boutons
 * @param {ButtonInteraction} interaction
 */
async function handleButton(interaction) {
    const [action, ...params] = interaction.customId.split('_');
    
    switch (action) {
        case 'ticket':
            await handleTicketButton(interaction, params);
            break;
        case 'candidature':
            await handleCandidatureButton(interaction, params);
            break;
        case 'welcome':
            await handleWelcomeButton(interaction, params);
            break;
        case 'config':
            await handleConfigButton(interaction, params);
            break;
        default:
            await interaction.reply({
                content: 'Action de bouton non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Gère les menus de sélection
 * @param {StringSelectMenuInteraction} interaction
 */
async function handleSelectMenu(interaction) {
    const [action, ...params] = interaction.customId.split('_');
    
    switch (action) {
        case 'ticket':
            await handleTicketSelect(interaction, params);
            break;
        case 'candidature':
            await handleCandidatureSelect(interaction, params);
            break;
        case 'config':
            await handleConfigSelect(interaction, params);
            break;
        default:
            await interaction.reply({
                content: 'Menu de sélection non reconnu.',
                ephemeral: true
            });
    }
}

/**
 * Gère les modales
 * @param {ModalSubmitInteraction} interaction
 */
async function handleModal(interaction) {
    const [action, ...params] = interaction.customId.split('_');
    
    switch (action) {
        case 'ticket':
            await handleTicketModal(interaction, params);
            break;
        case 'candidature':
            await handleCandidatureModal(interaction, params);
            break;
        case 'config':
            await handleConfigModal(interaction, params);
            break;
        default:
            await interaction.reply({
                content: 'Modale non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Gère l'autocomplétion
 * @param {AutocompleteInteraction} interaction
 */
async function handleAutocomplete(interaction) {
    const command = interaction.client.commandHandler.getCommand(interaction.commandName);
    
    if (command && command.autocomplete) {
        await command.autocomplete(interaction);
    }
}

/**
 * Gère les boutons de ticket
 * @param {ButtonInteraction} interaction
 * @param {Array} params
 */
async function handleTicketButton(interaction, params) {
    const [subAction, ticketId] = params;
    
    switch (subAction) {
        case 'close':
            // Importer et utiliser le système de tickets
            const ticketSystem = require('../utils/ticketSystem');
            await ticketSystem.closeTicket(interaction, ticketId);
            break;
        case 'claim':
            const ticketSystem2 = require('../utils/ticketSystem');
            await ticketSystem2.claimTicket(interaction, ticketId);
            break;
        case 'transcript':
            const ticketSystem3 = require('../utils/ticketSystem');
            await ticketSystem3.generateTranscript(interaction, ticketId);
            break;
        default:
            await interaction.reply({
                content: 'Action de ticket non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Gère les boutons de candidature
 * @param {ButtonInteraction} interaction
 * @param {Array} params
 */
async function handleCandidatureButton(interaction, params) {
    const [subAction, candidatureId] = params;
    
    switch (subAction) {
        case 'approve':
            const candidatureSystem = require('../utils/candidatureSystem');
            await candidatureSystem.approveCandidature(interaction, candidatureId);
            break;
        case 'reject':
            const candidatureSystem2 = require('../utils/candidatureSystem');
            await candidatureSystem2.rejectCandidature(interaction, candidatureId);
            break;
        case 'view':
            const candidatureSystem3 = require('../utils/candidatureSystem');
            await candidatureSystem3.viewCandidature(interaction, candidatureId);
            break;
        default:
            await interaction.reply({
                content: 'Action de candidature non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Gère les boutons de bienvenue
 * @param {ButtonInteraction} interaction
 * @param {Array} params
 */
async function handleWelcomeButton(interaction, params) {
    const [subAction] = params;
    
    switch (subAction) {
        case 'verify':
            const welcomeSystem = require('../utils/welcomeSystem');
            await welcomeSystem.verifyUser(interaction);
            break;
        case 'rules':
            const welcomeSystem2 = require('../utils/welcomeSystem');
            await welcomeSystem2.showRules(interaction);
            break;
        default:
            await interaction.reply({
                content: 'Action de bienvenue non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Gère les boutons de configuration
 * @param {ButtonInteraction} interaction
 * @param {Array} params
 */
async function handleConfigButton(interaction, params) {
    const [subAction] = params;
    
    switch (subAction) {
        case 'save':
            await interaction.reply({
                content: 'Configuration sauvegardée !',
                ephemeral: true
            });
            break;
        case 'cancel':
            await interaction.reply({
                content: 'Configuration annulée.',
                ephemeral: true
            });
            break;
        default:
            await interaction.reply({
                content: 'Action de configuration non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Gère les sélections de ticket
 * @param {StringSelectMenuInteraction} interaction
 * @param {Array} params
 */
async function handleTicketSelect(interaction, params) {
    const [subAction] = params;
    
    if (subAction === 'category') {
        const selectedCategory = interaction.values[0];
        const ticketSystem = require('../utils/ticketSystem');
        await ticketSystem.createTicketFromCategory(interaction, selectedCategory);
    }
}

/**
 * Gère les sélections de candidature
 * @param {StringSelectMenuInteraction} interaction
 * @param {Array} params
 */
async function handleCandidatureSelect(interaction, params) {
    const [subAction] = params;
    
    if (subAction === 'type') {
        const selectedType = interaction.values[0];
        const candidatureSystem = require('../utils/candidatureSystem');
        await candidatureSystem.startCandidatureProcess(interaction, selectedType);
    }
}

/**
 * Gère les sélections de configuration
 * @param {StringSelectMenuInteraction} interaction
 * @param {Array} params
 */
async function handleConfigSelect(interaction, params) {
    const [subAction] = params;
    
    switch (subAction) {
        case 'channels':
            const selectedChannels = interaction.values;
            await interaction.reply({
                content: `Salons sélectionnés : ${selectedChannels.join(', ')}`,
                ephemeral: true
            });
            break;
        case 'roles':
            const selectedRoles = interaction.values;
            await interaction.reply({
                content: `Rôles sélectionnés : ${selectedRoles.join(', ')}`,
                ephemeral: true
            });
            break;
        default:
            await interaction.reply({
                content: 'Sélection de configuration non reconnue.',
                ephemeral: true
            });
    }
}

/**
 * Gère les modales de ticket
 * @param {ModalSubmitInteraction} interaction
 * @param {Array} params
 */
async function handleTicketModal(interaction, params) {
    const [subAction] = params;
    
    if (subAction === 'create') {
        const ticketSystem = require('../utils/ticketSystem');
        await ticketSystem.createTicketFromModal(interaction);
    }
}

/**
 * Gère les modales de candidature
 * @param {ModalSubmitInteraction} interaction
 * @param {Array} params
 */
async function handleCandidatureModal(interaction, params) {
    const [subAction] = params;
    
    if (subAction === 'submit') {
        const candidatureSystem = require('../utils/candidatureSystem');
        await candidatureSystem.submitCandidature(interaction);
    }
}

/**
 * Gère les modales de configuration
 * @param {ModalSubmitInteraction} interaction
 * @param {Array} params
 */
async function handleConfigModal(interaction, params) {
    const [subAction] = params;
    
    if (subAction === 'setup') {
        await interaction.reply({
            content: 'Configuration mise à jour !',
            ephemeral: true
        });
    }
}