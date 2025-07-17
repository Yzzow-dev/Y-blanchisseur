const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const permissions = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Affiche la liste des commandes disponibles')
        .addStringOption(option =>
            option.setName('commande')
                .setDescription('Obtenir de l\'aide sur une commande spécifique')
                .setRequired(false)
        ),
    category: 'Utilitaires',
    cooldown: 5,
    async execute(interaction) {
        const commandName = interaction.options.getString('commande');
        const commandHandler = interaction.client.commandHandler;
        
        if (commandName) {
            // Aide pour une commande spécifique
            const command = commandHandler.getCommand(commandName);
            if (!command) {
                const embed = embedBuilder.createErrorEmbed(
                    'Commande non trouvée',
                    `La commande \`${commandName}\` n'existe pas.`
                );
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            const embed = await createCommandHelpEmbed(command);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            // Liste générale des commandes
            const embed = await createGeneralHelpEmbed(interaction, commandHandler);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};

/**
 * Crée un embed d'aide pour une commande spécifique
 * @param {Object} command - Commande
 * @returns {EmbedBuilder}
 */
async function createCommandHelpEmbed(command) {
    const embed = new EmbedBuilder()
        .setTitle(`📖 Aide - /${command.data.name}`)
        .setDescription(command.data.description)
        .setColor('#5865F2')
        .setTimestamp();

    // Catégorie
    if (command.category) {
        embed.addFields({ name: 'Catégorie', value: command.category, inline: true });
    }

    // Cooldown
    if (command.cooldown) {
        embed.addFields({ name: 'Cooldown', value: `${command.cooldown} secondes`, inline: true });
    }

    // Permissions requises
    if (command.permissions) {
        embed.addFields({ name: 'Permissions', value: command.permissions, inline: true });
    }

    // Options de la commande
    if (command.data.options && command.data.options.length > 0) {
        const optionsText = command.data.options.map(option => {
            const required = option.required ? '**[Requis]**' : '[Optionnel]';
            return `• **${option.name}** ${required}: ${option.description}`;
        }).join('\n');

        embed.addFields({ name: 'Options', value: optionsText, inline: false });
    }

    // Exemples d'utilisation
    if (command.examples) {
        const examplesText = command.examples.map(example => `• \`${example}\``).join('\n');
        embed.addFields({ name: 'Exemples', value: examplesText, inline: false });
    }

    return embed;
}

/**
 * Crée un embed d'aide générale
 * @param {CommandInteraction} interaction
 * @param {CommandHandler} commandHandler
 * @returns {EmbedBuilder}
 */
async function createGeneralHelpEmbed(interaction, commandHandler) {
    const embed = new EmbedBuilder()
        .setTitle('📚 Liste des commandes')
        .setDescription('Voici toutes les commandes disponibles sur ce serveur.')
        .setColor('#5865F2')
        .setTimestamp();

    // Obtenir les données du serveur pour les permissions
    const Guild = require('../../models/Guild');
    const guildData = await Guild.findOne({ guildId: interaction.guild.id });
    
    // Organiser les commandes par catégorie
    const categories = {};
    const commands = commandHandler.getCommands();
    
    for (const [name, command] of commands) {
        // Vérifier si l'utilisateur peut utiliser cette commande
        const canUse = permissions.canUseCommand(interaction.member, name, guildData);
        if (!canUse) continue;
        
        const category = command.category || 'Autre';
        if (!categories[category]) {
            categories[category] = [];
        }
        
        categories[category].push(`\`/${name}\` - ${command.data.description}`);
    }

    // Ajouter chaque catégorie comme field
    for (const [category, commandList] of Object.entries(categories)) {
        if (commandList.length > 0) {
            const categoryEmoji = getCategoryEmoji(category);
            embed.addFields({
                name: `${categoryEmoji} ${category}`,
                value: commandList.join('\n'),
                inline: false
            });
        }
    }

    // Informations supplémentaires
    embed.addFields(
        { name: 'ℹ️ Aide spécifique', value: 'Utilisez `/help <commande>` pour plus d\'informations sur une commande.', inline: false },
        { name: '🔗 Liens utiles', value: '[Support](https://discord.gg/support) • [Documentation](https://docs.bot.com)', inline: false }
    );

    // Footer avec statistiques
    const stats = commandHandler.getStats();
    embed.setFooter({ 
        text: `${stats.total} commandes disponibles • ${Object.keys(categories).length} catégories`,
        iconURL: interaction.client.user.displayAvatarURL()
    });

    return embed;
}

/**
 * Obtient l'emoji correspondant à une catégorie
 * @param {string} category - Catégorie
 * @returns {string}
 */
function getCategoryEmoji(category) {
    const emojis = {
        'Administration': '🛡️',
        'Modération': '🔨',
        'Tickets': '🎫',
        'Candidatures': '📝',
        'Utilitaires': '🔧',
        'Configuration': '⚙️',
        'Statistiques': '📊',
        'Autre': '📋'
    };
    
    return emojis[category] || '📋';
}