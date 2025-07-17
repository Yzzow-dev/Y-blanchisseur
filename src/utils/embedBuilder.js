const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

class EmbedBuilderUtil {
    constructor() {
        this.defaultColor = config.settings.embedColor;
        this.errorColor = config.settings.errorColor;
        this.successColor = config.settings.successColor;
        this.warningColor = config.settings.warningColor;
    }

    /**
     * Crée un embed de base
     * @param {string} title - Titre de l'embed
     * @param {string} description - Description de l'embed
     * @param {string} color - Couleur de l'embed
     * @returns {EmbedBuilder}
     */
    createEmbed(title, description, color = this.defaultColor) {
        return new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();
    }

    /**
     * Crée un embed de succès
     * @param {string} title - Titre de l'embed
     * @param {string} description - Description de l'embed
     * @returns {EmbedBuilder}
     */
    createSuccessEmbed(title, description) {
        return this.createEmbed(title, description, this.successColor)
            .setAuthor({ name: '✅ Succès' });
    }

    /**
     * Crée un embed d'erreur
     * @param {string} title - Titre de l'embed
     * @param {string} description - Description de l'embed
     * @returns {EmbedBuilder}
     */
    createErrorEmbed(title, description) {
        return this.createEmbed(title, description, this.errorColor)
            .setAuthor({ name: '❌ Erreur' });
    }

    /**
     * Crée un embed d'avertissement
     * @param {string} title - Titre de l'embed
     * @param {string} description - Description de l'embed
     * @returns {EmbedBuilder}
     */
    createWarningEmbed(title, description) {
        return this.createEmbed(title, description, this.warningColor)
            .setAuthor({ name: '⚠️ Avertissement' });
    }

    /**
     * Crée un embed d'information
     * @param {string} title - Titre de l'embed
     * @param {string} description - Description de l'embed
     * @returns {EmbedBuilder}
     */
    createInfoEmbed(title, description) {
        return this.createEmbed(title, description, this.defaultColor)
            .setAuthor({ name: 'ℹ️ Information' });
    }

    /**
     * Crée un embed pour les tickets
     * @param {Object} ticket - Objet ticket
     * @param {string} action - Action effectuée
     * @returns {EmbedBuilder}
     */
    createTicketEmbed(ticket, action = 'created') {
        const embed = new EmbedBuilder()
            .setColor(this.defaultColor)
            .setTimestamp();

        switch (action) {
            case 'created':
                embed.setTitle('🎫 Nouveau Ticket')
                    .setDescription(`**Ticket ID:** ${ticket.ticketId}\n**Catégorie:** ${ticket.category}\n**Sujet:** ${ticket.subject}`)
                    .addFields(
                        { name: 'Description', value: ticket.description.substring(0, 1024) },
                        { name: 'Priorité', value: ticket.priority, inline: true },
                        { name: 'Statut', value: ticket.status, inline: true }
                    );
                break;
            case 'closed':
                embed.setTitle('🔒 Ticket Fermé')
                    .setDescription(`**Ticket ID:** ${ticket.ticketId}`)
                    .addFields(
                        { name: 'Fermé par', value: ticket.closedBy.username, inline: true },
                        { name: 'Raison', value: ticket.closedBy.reason || 'Aucune raison spécifiée', inline: true }
                    )
                    .setColor(this.errorColor);
                break;
            case 'assigned':
                embed.setTitle('👤 Ticket Assigné')
                    .setDescription(`**Ticket ID:** ${ticket.ticketId}`)
                    .addFields(
                        { name: 'Assigné à', value: ticket.assignedTo.username, inline: true },
                        { name: 'Statut', value: ticket.status, inline: true }
                    )
                    .setColor(this.warningColor);
                break;
        }

        return embed;
    }

    /**
     * Crée un embed pour les candidatures
     * @param {Object} candidature - Objet candidature
     * @param {string} action - Action effectuée
     * @returns {EmbedBuilder}
     */
    createCandidatureEmbed(candidature, action = 'created') {
        const embed = new EmbedBuilder()
            .setColor(this.defaultColor)
            .setTimestamp();

        switch (action) {
            case 'created':
                embed.setTitle('📝 Nouvelle Candidature')
                    .setDescription(`**ID:** ${candidature.candidatureId}\n**Type:** ${candidature.type}`)
                    .addFields(
                        { name: 'Statut', value: candidature.status, inline: true },
                        { name: 'Priorité', value: candidature.metadata.priority, inline: true }
                    );
                break;
            case 'approved':
                embed.setTitle('✅ Candidature Approuvée')
                    .setDescription(`**ID:** ${candidature.candidatureId}`)
                    .addFields(
                        { name: 'Évaluée par', value: candidature.evaluation.reviewedBy.username, inline: true },
                        { name: 'Score', value: candidature.evaluation.score?.toString() || 'N/A', inline: true }
                    )
                    .setColor(this.successColor);
                break;
            case 'rejected':
                embed.setTitle('❌ Candidature Rejetée')
                    .setDescription(`**ID:** ${candidature.candidatureId}`)
                    .addFields(
                        { name: 'Évaluée par', value: candidature.evaluation.reviewedBy.username, inline: true },
                        { name: 'Score', value: candidature.evaluation.score?.toString() || 'N/A', inline: true }
                    )
                    .setColor(this.errorColor);
                break;
        }

        if (candidature.evaluation?.feedback) {
            embed.addFields({ name: 'Commentaire', value: candidature.evaluation.feedback.substring(0, 1024) });
        }

        return embed;
    }

    /**
     * Crée un embed pour les sanctions
     * @param {Object} sanction - Objet sanction
     * @param {Object} user - Utilisateur sanctionné
     * @param {Object} moderator - Modérateur
     * @returns {EmbedBuilder}
     */
    createSanctionEmbed(sanction, user, moderator) {
        const embed = new EmbedBuilder()
            .setTimestamp();

        const colors = {
            warn: this.warningColor,
            mute: this.warningColor,
            kick: this.errorColor,
            ban: this.errorColor
        };

        const icons = {
            warn: '⚠️',
            mute: '🔇',
            kick: '👢',
            ban: '🔨'
        };

        const titles = {
            warn: 'Avertissement',
            mute: 'Mise en sourdine',
            kick: 'Expulsion',
            ban: 'Bannissement'
        };

        embed.setTitle(`${icons[sanction.type]} ${titles[sanction.type]}`)
            .setColor(colors[sanction.type])
            .addFields(
                { name: 'Utilisateur', value: `<@${user.userId}> (${user.username})`, inline: true },
                { name: 'Modérateur', value: `<@${moderator.userId}> (${moderator.username})`, inline: true },
                { name: 'Raison', value: sanction.reason || 'Aucune raison spécifiée', inline: false }
            );

        if (sanction.duration) {
            const duration = this.formatDuration(sanction.duration);
            embed.addFields({ name: 'Durée', value: duration, inline: true });
        }

        if (sanction.expiresAt) {
            embed.addFields({ name: 'Expire le', value: `<t:${Math.floor(sanction.expiresAt.getTime() / 1000)}:F>`, inline: true });
        }

        return embed;
    }

    /**
     * Crée un embed pour les statistiques utilisateur
     * @param {Object} user - Utilisateur
     * @param {Object} guildData - Données du serveur
     * @returns {EmbedBuilder}
     */
    createUserStatsEmbed(user, guildData) {
        const embed = new EmbedBuilder()
            .setTitle(`📊 Statistiques de ${user.username}`)
            .setColor(this.defaultColor)
            .setThumbnail(user.avatar ? `https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png` : null)
            .setTimestamp();

        if (guildData) {
            embed.addFields(
                { name: 'Messages', value: guildData.stats.messagesCount.toString(), inline: true },
                { name: 'Avertissements', value: guildData.stats.warningsCount.toString(), inline: true },
                { name: 'Tickets', value: guildData.stats.ticketsCount.toString(), inline: true },
                { name: 'Candidatures', value: guildData.stats.candidaturesCount.toString(), inline: true },
                { name: 'Temps vocal', value: this.formatDuration(guildData.stats.voiceTime), inline: true },
                { name: 'Dernière activité', value: `<t:${Math.floor(guildData.stats.lastActive.getTime() / 1000)}:R>`, inline: true }
            );

            if (guildData.joinedAt) {
                embed.addFields({ name: 'Rejoint le', value: `<t:${Math.floor(guildData.joinedAt.getTime() / 1000)}:F>`, inline: true });
            }
        }

        return embed;
    }

    /**
     * Crée un embed pour les informations du serveur
     * @param {Object} guild - Serveur Discord
     * @param {Object} guildData - Données du serveur en base
     * @returns {EmbedBuilder}
     */
    createServerInfoEmbed(guild, guildData) {
        const embed = new EmbedBuilder()
            .setTitle(`📋 Informations du serveur`)
            .setColor(this.defaultColor)
            .setThumbnail(guild.iconURL())
            .setTimestamp();

        embed.addFields(
            { name: 'Nom', value: guild.name, inline: true },
            { name: 'ID', value: guild.id, inline: true },
            { name: 'Propriétaire', value: `<@${guild.ownerId}>`, inline: true },
            { name: 'Membres', value: guild.memberCount.toString(), inline: true },
            { name: 'Salons', value: guild.channels.cache.size.toString(), inline: true },
            { name: 'Rôles', value: guild.roles.cache.size.toString(), inline: true },
            { name: 'Créé le', value: `<t:${Math.floor(guild.createdAt.getTime() / 1000)}:F>`, inline: true },
            { name: 'Niveau de vérification', value: guild.verificationLevel.toString(), inline: true }
        );

        if (guildData) {
            embed.addFields(
                { name: 'Total tickets', value: guildData.stats.totalTickets.toString(), inline: true },
                { name: 'Total candidatures', value: guildData.stats.totalCandidatures.toString(), inline: true },
                { name: 'Total avertissements', value: guildData.stats.totalWarnings.toString(), inline: true }
            );
        }

        return embed;
    }

    /**
     * Crée un embed de pagination
     * @param {string} title - Titre de l'embed
     * @param {Array} items - Éléments à paginer
     * @param {number} page - Page actuelle
     * @param {number} itemsPerPage - Éléments par page
     * @returns {EmbedBuilder}
     */
    createPaginationEmbed(title, items, page = 1, itemsPerPage = 10) {
        const totalPages = Math.ceil(items.length / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = items.slice(startIndex, endIndex);

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(this.defaultColor)
            .setTimestamp();

        if (pageItems.length > 0) {
            const description = pageItems.map((item, index) => {
                const globalIndex = startIndex + index + 1;
                return `**${globalIndex}.** ${item}`;
            }).join('\n');

            embed.setDescription(description);
        } else {
            embed.setDescription('Aucun élément trouvé.');
        }

        embed.setFooter({ text: `Page ${page}/${totalPages} • Total: ${items.length} éléments` });

        return embed;
    }

    /**
     * Formate une durée en millisecondes en texte lisible
     * @param {number} ms - Durée en millisecondes
     * @returns {string}
     */
    formatDuration(ms) {
        if (!ms || ms === 0) return '0 seconde';

        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const parts = [];
        if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);
        if (hours % 24 > 0) parts.push(`${hours % 24} heure${hours % 24 > 1 ? 's' : ''}`);
        if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 > 1 ? 's' : ''}`);
        if (seconds % 60 > 0) parts.push(`${seconds % 60} seconde${seconds % 60 > 1 ? 's' : ''}`);

        return parts.join(', ');
    }

    /**
     * Tronque un texte à une longueur maximale
     * @param {string} text - Texte à tronquer
     * @param {number} maxLength - Longueur maximale
     * @returns {string}
     */
    truncate(text, maxLength = 1024) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}

module.exports = new EmbedBuilderUtil();