const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const permissions = require('../../utils/permissions');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure le bot pour ce serveur')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Affiche la configuration actuelle')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Configure le salon des logs')
                .addChannelOption(option =>
                    option.setName('salon')
                        .setDescription('Salon pour les logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Configure le système d\'accueil')
                .addChannelOption(option =>
                    option.setName('salon')
                        .setDescription('Salon d\'accueil')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Message de bienvenue personnalisé')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tickets')
                .setDescription('Configure le système de tickets')
                .addChannelOption(option =>
                    option.setName('salon')
                        .setDescription('Salon pour créer les tickets')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('roles')
                .setDescription('Configure les rôles automatiques')
                .addRoleOption(option =>
                    option.setName('membre')
                        .setDescription('Rôle membre par défaut')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('staff')
                        .setDescription('Rôle staff')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('moderateur')
                        .setDescription('Rôle modérateur')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option.setName('admin')
                        .setDescription('Rôle administrateur')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('automod')
                .setDescription('Configure l\'auto-modération')
                .addBooleanOption(option =>
                    option.setName('activer')
                        .setDescription('Activer ou désactiver l\'auto-modération')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Remet la configuration à zéro')
        ),
    category: 'Administration',
    permissions: 'admin',
    cooldown: 10,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        // Vérifier les permissions
        const Guild = require('../../models/Guild');
        const guildData = await Guild.findOne({ guildId: interaction.guild.id });
        
        if (!permissions.isAdmin(interaction.member, guildData)) {
            const embed = embedBuilder.createErrorEmbed(
                'Permissions insuffisantes',
                'Vous devez être administrateur pour utiliser cette commande.'
            );
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        switch (subcommand) {
            case 'view':
                await handleViewConfig(interaction, guildData);
                break;
            case 'logs':
                await handleLogsConfig(interaction, guildData);
                break;
            case 'welcome':
                await handleWelcomeConfig(interaction, guildData);
                break;
            case 'tickets':
                await handleTicketsConfig(interaction, guildData);
                break;
            case 'roles':
                await handleRolesConfig(interaction, guildData);
                break;
            case 'automod':
                await handleAutomodConfig(interaction, guildData);
                break;
            case 'reset':
                await handleResetConfig(interaction, guildData);
                break;
        }
    }
};

/**
 * Affiche la configuration actuelle
 */
async function handleViewConfig(interaction, guildData) {
    if (!guildData) {
        const embed = embedBuilder.createWarningEmbed(
            'Configuration non trouvée',
            'Aucune configuration trouvée pour ce serveur. Utilisez les commandes de configuration pour commencer.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = embedBuilder.createInfoEmbed(
        'Configuration du serveur',
        'Voici la configuration actuelle de ce serveur :'
    );

    // Salons
    const channels = [];
    if (guildData.channels.logs) channels.push(`**Logs :** <#${guildData.channels.logs}>`);
    if (guildData.channels.welcome) channels.push(`**Accueil :** <#${guildData.channels.welcome}>`);
    if (guildData.channels.tickets) channels.push(`**Tickets :** <#${guildData.channels.tickets}>`);
    if (guildData.channels.candidatures) channels.push(`**Candidatures :** <#${guildData.channels.candidatures}>`);

    if (channels.length > 0) {
        embed.addFields({ name: '📋 Salons', value: channels.join('\n'), inline: false });
    }

    // Rôles
    const roles = [];
    if (guildData.roles.member) roles.push(`**Membre :** <@&${guildData.roles.member}>`);
    if (guildData.roles.staff && guildData.roles.staff.length > 0) {
        roles.push(`**Staff :** ${guildData.roles.staff.map(r => `<@&${r}>`).join(', ')}`);
    }
    if (guildData.roles.moderator && guildData.roles.moderator.length > 0) {
        roles.push(`**Modérateur :** ${guildData.roles.moderator.map(r => `<@&${r}>`).join(', ')}`);
    }
    if (guildData.roles.admin && guildData.roles.admin.length > 0) {
        roles.push(`**Admin :** ${guildData.roles.admin.map(r => `<@&${r}>`).join(', ')}`);
    }

    if (roles.length > 0) {
        embed.addFields({ name: '👥 Rôles', value: roles.join('\n'), inline: false });
    }

    // Auto-modération
    const automodStatus = guildData.automod.enabled ? '✅ Activée' : '❌ Désactivée';
    embed.addFields({ name: '🤖 Auto-modération', value: automodStatus, inline: true });

    // Statistiques
    embed.addFields(
        { name: '📊 Tickets', value: guildData.stats.totalTickets.toString(), inline: true },
        { name: '📝 Candidatures', value: guildData.stats.totalCandidatures.toString(), inline: true },
        { name: '⚠️ Avertissements', value: guildData.stats.totalWarnings.toString(), inline: true }
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Configure le salon des logs
 */
async function handleLogsConfig(interaction, guildData) {
    const channel = interaction.options.getChannel('salon');
    
    // Vérifier les permissions du bot sur le salon
    if (!channel.permissionsFor(interaction.guild.members.me).has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks
    ])) {
        const embed = embedBuilder.createErrorEmbed(
            'Permissions insuffisantes',
            'Je n\'ai pas les permissions nécessaires sur ce salon. Vérifiez que j\'ai les permissions "Voir le salon", "Envoyer des messages" et "Intégrer des liens".'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Créer ou mettre à jour la configuration
    if (!guildData) {
        guildData = new Guild({
            guildId: interaction.guild.id,
            name: interaction.guild.name
        });
    }

    guildData.channels.logs = channel.id;
    await guildData.save();

    const embed = embedBuilder.createSuccessEmbed(
        'Configuration mise à jour',
        `Le salon des logs a été configuré sur ${channel}.`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Configure le système d'accueil
 */
async function handleWelcomeConfig(interaction, guildData) {
    const channel = interaction.options.getChannel('salon');
    const message = interaction.options.getString('message');

    // Vérifier les permissions du bot sur le salon
    if (!channel.permissionsFor(interaction.guild.members.me).has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AddReactions
    ])) {
        const embed = embedBuilder.createErrorEmbed(
            'Permissions insuffisantes',
            'Je n\'ai pas les permissions nécessaires sur ce salon. Vérifiez que j\'ai les permissions "Voir le salon", "Envoyer des messages", "Intégrer des liens" et "Ajouter des réactions".'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Créer ou mettre à jour la configuration
    if (!guildData) {
        guildData = new Guild({
            guildId: interaction.guild.id,
            name: interaction.guild.name
        });
    }

    guildData.channels.welcome = channel.id;
    if (message) {
        guildData.messages.welcome = message;
    }
    await guildData.save();

    const embed = embedBuilder.createSuccessEmbed(
        'Configuration mise à jour',
        `Le système d'accueil a été configuré sur ${channel}.${message ? `\n\n**Message personnalisé :** ${message}` : ''}`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Configure le système de tickets
 */
async function handleTicketsConfig(interaction, guildData) {
    const channel = interaction.options.getChannel('salon');

    // Vérifier les permissions du bot sur le salon
    if (!channel.permissionsFor(interaction.guild.members.me).has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageChannels
    ])) {
        const embed = embedBuilder.createErrorEmbed(
            'Permissions insuffisantes',
            'Je n\'ai pas les permissions nécessaires. Vérifiez que j\'ai les permissions "Voir le salon", "Envoyer des messages", "Intégrer des liens" et "Gérer les salons".'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Créer ou mettre à jour la configuration
    if (!guildData) {
        guildData = new Guild({
            guildId: interaction.guild.id,
            name: interaction.guild.name
        });
    }

    guildData.channels.tickets = channel.id;
    await guildData.save();

    const embed = embedBuilder.createSuccessEmbed(
        'Configuration mise à jour',
        `Le système de tickets a été configuré sur ${channel}.`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Configure les rôles automatiques
 */
async function handleRolesConfig(interaction, guildData) {
    const memberRole = interaction.options.getRole('membre');
    const staffRole = interaction.options.getRole('staff');
    const moderatorRole = interaction.options.getRole('moderateur');
    const adminRole = interaction.options.getRole('admin');

    // Créer ou mettre à jour la configuration
    if (!guildData) {
        guildData = new Guild({
            guildId: interaction.guild.id,
            name: interaction.guild.name
        });
    }

    const updates = [];

    if (memberRole) {
        guildData.roles.member = memberRole.id;
        updates.push(`**Membre :** ${memberRole}`);
    }

    if (staffRole) {
        if (!guildData.roles.staff.includes(staffRole.id)) {
            guildData.roles.staff.push(staffRole.id);
        }
        updates.push(`**Staff :** ${staffRole}`);
    }

    if (moderatorRole) {
        if (!guildData.roles.moderator.includes(moderatorRole.id)) {
            guildData.roles.moderator.push(moderatorRole.id);
        }
        updates.push(`**Modérateur :** ${moderatorRole}`);
    }

    if (adminRole) {
        if (!guildData.roles.admin.includes(adminRole.id)) {
            guildData.roles.admin.push(adminRole.id);
        }
        updates.push(`**Admin :** ${adminRole}`);
    }

    if (updates.length === 0) {
        const embed = embedBuilder.createWarningEmbed(
            'Aucune modification',
            'Aucun rôle n\'a été spécifié.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await guildData.save();

    const embed = embedBuilder.createSuccessEmbed(
        'Configuration mise à jour',
        `Les rôles suivants ont été configurés :\n${updates.join('\n')}`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Configure l'auto-modération
 */
async function handleAutomodConfig(interaction, guildData) {
    const enabled = interaction.options.getBoolean('activer');

    // Créer ou mettre à jour la configuration
    if (!guildData) {
        guildData = new Guild({
            guildId: interaction.guild.id,
            name: interaction.guild.name
        });
    }

    guildData.automod.enabled = enabled;
    await guildData.save();

    const status = enabled ? 'activée' : 'désactivée';
    const embed = embedBuilder.createSuccessEmbed(
        'Configuration mise à jour',
        `L'auto-modération a été ${status}.`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Remet la configuration à zéro
 */
async function handleResetConfig(interaction, guildData) {
    if (!guildData) {
        const embed = embedBuilder.createWarningEmbed(
            'Aucune configuration',
            'Il n\'y a pas de configuration à réinitialiser.'
        );
        return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Réinitialiser la configuration
    await Guild.findOneAndDelete({ guildId: interaction.guild.id });

    const embed = embedBuilder.createSuccessEmbed(
        'Configuration réinitialisée',
        'La configuration du serveur a été remise à zéro.'
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}