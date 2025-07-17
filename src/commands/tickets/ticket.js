const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const permissions = require('../../utils/permissions');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Gère les tickets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Crée un nouveau ticket')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Ferme le ticket actuel')
                .addStringOption(option =>
                    option.setName('raison')
                        .setDescription('Raison de la fermeture')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Liste tous les tickets')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Configure le système de tickets')
        ),
    category: 'Tickets',
    cooldown: 5,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        // Obtenir les données du serveur
        const guildData = await Guild.findOne({ guildId: interaction.guild.id });
        
        switch (subcommand) {
            case 'create':
                await handleCreateTicket(interaction, guildData);
                break;
            case 'close':
                await handleCloseTicket(interaction, guildData);
                break;
            case 'list':
                await handleListTickets(interaction, guildData);
                break;
            case 'setup':
                await handleSetupTickets(interaction, guildData);
                break;
        }
    }
};

/**
 * Gère la création d'un ticket
 */
async function handleCreateTicket(interaction, guildData) {
    // Vérifier si le système de tickets est configuré
    if (!guildData || !guildData.channels.tickets) {
        const embed = embedBuilder.createErrorEmbed(
            'Système non configuré',
            'Le système de tickets n\'est pas configuré. Demandez à un administrateur d\'utiliser `/config tickets`.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Vérifier si l'utilisateur peut créer un ticket
    const canCreate = await permissions.canCreateTicket(interaction.user.id, interaction.guild.id);
    if (!canCreate) {
        const embed = embedBuilder.createErrorEmbed(
            'Création interdite',
            'Vous ne pouvez pas créer de ticket pour le moment (sanctions actives ou limite atteinte).'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Créer le menu de sélection des catégories
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_category')
        .setPlaceholder('Sélectionnez une catégorie')
        .addOptions(
            guildData.tickets.categories.map(category => ({
                label: category,
                value: category,
                description: `Créer un ticket pour ${category}`
            }))
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = embedBuilder.createInfoEmbed(
        'Création de ticket',
        'Sélectionnez la catégorie qui correspond le mieux à votre demande :'
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

/**
 * Gère la fermeture d'un ticket
 */
async function handleCloseTicket(interaction, guildData) {
    // Vérifier si nous sommes dans un salon de ticket
    const Ticket = require('../../models/Ticket');
    const ticket = await Ticket.findOne({ 
        guildId: interaction.guild.id,
        channelId: interaction.channel.id,
        status: { $ne: 'closed' }
    });

    if (!ticket) {
        const embed = embedBuilder.createErrorEmbed(
            'Ticket non trouvé',
            'Cette commande ne peut être utilisée que dans un salon de ticket ouvert.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Vérifier les permissions
    const canClose = ticket.userId === interaction.user.id || 
                    permissions.canManageTickets(interaction.member, guildData);
    
    if (!canClose) {
        const embed = embedBuilder.createErrorEmbed(
            'Permissions insuffisantes',
            'Vous ne pouvez fermer que vos propres tickets ou être membre du staff.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';

    // Créer les boutons de confirmation
    const confirmButton = new ButtonBuilder()
        .setCustomId('ticket_close_confirm')
        .setLabel('Confirmer')
        .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
        .setCustomId('ticket_close_cancel')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    const embed = embedBuilder.createWarningEmbed(
        'Confirmation de fermeture',
        `Êtes-vous sûr de vouloir fermer ce ticket ?\n\n**Raison :** ${reason}\n\n⚠️ Cette action est irréversible !`
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

/**
 * Gère la liste des tickets
 */
async function handleListTickets(interaction, guildData) {
    // Vérifier les permissions
    if (!permissions.canManageTickets(interaction.member, guildData)) {
        const embed = embedBuilder.createErrorEmbed(
            'Permissions insuffisantes',
            'Vous devez être membre du staff pour voir la liste des tickets.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const Ticket = require('../../models/Ticket');
    const tickets = await Ticket.find({ 
        guildId: interaction.guild.id,
        status: { $ne: 'closed' }
    }).sort({ createdAt: -1 });

    if (tickets.length === 0) {
        const embed = embedBuilder.createInfoEmbed(
            'Aucun ticket',
            'Il n\'y a actuellement aucun ticket ouvert.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = embedBuilder.createInfoEmbed(
        'Liste des tickets ouverts',
        `Il y a actuellement ${tickets.length} ticket(s) ouvert(s) :`
    );

    // Ajouter les tickets à l'embed
    const ticketList = tickets.slice(0, 10).map(ticket => {
        const statusEmoji = {
            'open': '🔓',
            'in_progress': '⏳',
            'waiting': '⏸️'
        }[ticket.status] || '❓';

        const user = interaction.guild.members.cache.get(ticket.userId);
        const username = user ? user.displayName : 'Utilisateur inconnu';

        return `${statusEmoji} **${ticket.ticketId}** - ${ticket.category}\n` +
               `👤 ${username} • <#${ticket.channelId}>\n` +
               `📅 <t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>`;
    }).join('\n\n');

    embed.setDescription(ticketList);

    if (tickets.length > 10) {
        embed.setFooter({ text: `Affichage de 10 tickets sur ${tickets.length}` });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Gère la configuration du système de tickets
 */
async function handleSetupTickets(interaction, guildData) {
    // Vérifier les permissions
    if (!permissions.isAdmin(interaction.member, guildData)) {
        const embed = embedBuilder.createErrorEmbed(
            'Permissions insuffisantes',
            'Vous devez être administrateur pour configurer le système de tickets.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Vérifier si le système est configuré
    if (!guildData || !guildData.channels.tickets) {
        const embed = embedBuilder.createErrorEmbed(
            'Configuration requise',
            'Vous devez d\'abord configurer le salon des tickets avec `/config tickets`.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Créer le message de setup dans le salon de tickets
    const ticketChannel = interaction.guild.channels.cache.get(guildData.channels.tickets);
    if (!ticketChannel) {
        const embed = embedBuilder.createErrorEmbed(
            'Salon non trouvé',
            'Le salon de tickets configuré n\'existe plus. Reconfigurez-le avec `/config tickets`.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Créer l'embed du message de tickets
    const ticketEmbed = embedBuilder.createInfoEmbed(
        '🎫 Système de Tickets',
        'Cliquez sur le bouton ci-dessous pour créer un nouveau ticket.\n\n' +
        '**Catégories disponibles :**\n' +
        guildData.tickets.categories.map(cat => `• ${cat}`).join('\n') +
        '\n\n**Règles :**\n' +
        '• Un seul ticket ouvert par utilisateur\n' +
        '• Soyez précis dans votre demande\n' +
        '• Respectez le staff et les autres utilisateurs'
    );

    // Créer le bouton pour créer un ticket
    const createButton = new ButtonBuilder()
        .setCustomId('ticket_create_button')
        .setLabel('Créer un ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫');

    const row = new ActionRowBuilder().addComponents(createButton);

    // Envoyer le message dans le salon de tickets
    await ticketChannel.send({ embeds: [ticketEmbed], components: [row] });

    const embed = embedBuilder.createSuccessEmbed(
        'Système configuré',
        `Le système de tickets a été configuré dans ${ticketChannel}.`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}