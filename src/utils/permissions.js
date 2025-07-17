const { PermissionFlagsBits } = require('discord.js');
const Guild = require('../models/Guild');
const User = require('../models/User');

class PermissionsUtil {
    constructor() {
        this.adminPermissions = [
            PermissionFlagsBits.Administrator,
            PermissionFlagsBits.ManageGuild
        ];
        
        this.moderatorPermissions = [
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.KickMembers,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.ModerateMembers
        ];
        
        this.staffPermissions = [
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ManageThreads
        ];
    }

    /**
     * Vérifie si un utilisateur est propriétaire du bot
     * @param {string} userId - ID de l'utilisateur
     * @returns {boolean}
     */
    isOwner(userId) {
        const config = require('../config/config');
        return userId === config.ownerId;
    }

    /**
     * Vérifie si un utilisateur est administrateur
     * @param {Object} member - Membre Discord
     * @param {Object} guildData - Données du serveur
     * @returns {boolean}
     */
    isAdmin(member, guildData = null) {
        if (this.isOwner(member.user.id)) return true;
        
        // Vérification des permissions Discord
        if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
        
        // Vérification des rôles configurés
        if (guildData && guildData.roles.admin) {
            return member.roles.cache.some(role => guildData.roles.admin.includes(role.id));
        }
        
        return false;
    }

    /**
     * Vérifie si un utilisateur est modérateur
     * @param {Object} member - Membre Discord
     * @param {Object} guildData - Données du serveur
     * @returns {boolean}
     */
    isModerator(member, guildData = null) {
        if (this.isAdmin(member, guildData)) return true;
        
        // Vérification des permissions Discord
        if (this.moderatorPermissions.some(perm => member.permissions.has(perm))) return true;
        
        // Vérification des rôles configurés
        if (guildData && guildData.roles.moderator) {
            return member.roles.cache.some(role => guildData.roles.moderator.includes(role.id));
        }
        
        return false;
    }

    /**
     * Vérifie si un utilisateur est staff
     * @param {Object} member - Membre Discord
     * @param {Object} guildData - Données du serveur
     * @returns {boolean}
     */
    isStaff(member, guildData = null) {
        if (this.isModerator(member, guildData)) return true;
        
        // Vérification des rôles configurés
        if (guildData && guildData.roles.staff) {
            return member.roles.cache.some(role => guildData.roles.staff.includes(role.id));
        }
        
        return false;
    }

    /**
     * Vérifie si un utilisateur peut utiliser une commande
     * @param {Object} member - Membre Discord
     * @param {string} commandName - Nom de la commande
     * @param {Object} guildData - Données du serveur
     * @returns {boolean}
     */
    canUseCommand(member, commandName, guildData = null) {
        const commandPermissions = {
            // Commandes administrateur
            'config': 'admin',
            'setup': 'admin',
            
            // Commandes modérateur
            'ban': 'moderator',
            'unban': 'moderator',
            'kick': 'moderator',
            'mute': 'moderator',
            'unmute': 'moderator',
            'warn': 'moderator',
            'clear': 'moderator',
            'candidature-review': 'moderator',
            
            // Commandes staff
            'ticket-assign': 'staff',
            'ticket-close': 'staff',
            'userinfo': 'staff',
            'notes': 'staff',
            
            // Commandes publiques
            'ticket-create': 'public',
            'candidature': 'public',
            'help': 'public',
            'serverinfo': 'public'
        };

        const requiredLevel = commandPermissions[commandName] || 'public';

        switch (requiredLevel) {
            case 'admin':
                return this.isAdmin(member, guildData);
            case 'moderator':
                return this.isModerator(member, guildData);
            case 'staff':
                return this.isStaff(member, guildData);
            case 'public':
                return true;
            default:
                return false;
        }
    }

    /**
     * Vérifie si un utilisateur peut sanctionner un autre utilisateur
     * @param {Object} moderator - Modérateur
     * @param {Object} target - Utilisateur cible
     * @param {Object} guildData - Données du serveur
     * @returns {boolean}
     */
    canSanction(moderator, target, guildData = null) {
        // Le propriétaire peut tout faire
        if (this.isOwner(moderator.user.id)) return true;
        
        // Ne peut pas se sanctionner soi-même
        if (moderator.user.id === target.user.id) return false;
        
        // Ne peut pas sanctionner le propriétaire
        if (this.isOwner(target.user.id)) return false;
        
        // Ne peut pas sanctionner quelqu'un de rang supérieur ou égal
        if (this.isAdmin(target, guildData) && !this.isAdmin(moderator, guildData)) return false;
        if (this.isModerator(target, guildData) && !this.isAdmin(moderator, guildData)) return false;
        
        // Vérification de la hiérarchie des rôles
        if (moderator.roles.highest.position <= target.roles.highest.position) return false;
        
        return true;
    }

    /**
     * Vérifie si un utilisateur peut gérer les tickets
     * @param {Object} member - Membre Discord
     * @param {Object} guildData - Données du serveur
     * @returns {boolean}
     */
    canManageTickets(member, guildData = null) {
        return this.isStaff(member, guildData);
    }

    /**
     * Vérifie si un utilisateur peut gérer les candidatures
     * @param {Object} member - Membre Discord
     * @param {Object} guildData - Données du serveur
     * @returns {boolean}
     */
    canManageCandidatures(member, guildData = null) {
        return this.isModerator(member, guildData);
    }

    /**
     * Vérifie si un utilisateur peut créer un ticket
     * @param {string} userId - ID de l'utilisateur
     * @param {string} guildId - ID du serveur
     * @returns {Promise<boolean>}
     */
    async canCreateTicket(userId, guildId) {
        try {
            const user = await User.findOne({ userId });
            if (!user) return true; // Nouvel utilisateur
            
            return user.canCreateTicket(guildId);
        } catch (error) {
            console.error('Erreur lors de la vérification des permissions de ticket:', error);
            return false;
        }
    }

    /**
     * Vérifie si un utilisateur peut postuler
     * @param {string} userId - ID de l'utilisateur
     * @param {string} guildId - ID du serveur
     * @returns {Promise<boolean>}
     */
    async canApply(userId, guildId) {
        try {
            const user = await User.findOne({ userId });
            if (!user) return true; // Nouvel utilisateur
            
            return user.canApply(guildId);
        } catch (error) {
            console.error('Erreur lors de la vérification des permissions de candidature:', error);
            return false;
        }
    }

    /**
     * Vérifie si un utilisateur est muet
     * @param {string} userId - ID de l'utilisateur
     * @param {string} guildId - ID du serveur
     * @returns {Promise<boolean>}
     */
    async isMuted(userId, guildId) {
        try {
            const user = await User.findOne({ userId });
            if (!user) return false;
            
            const activeMutes = user.getActiveSanctions(guildId, 'mute');
            return activeMutes.length > 0;
        } catch (error) {
            console.error('Erreur lors de la vérification du mute:', error);
            return false;
        }
    }

    /**
     * Vérifie si un utilisateur est banni
     * @param {string} userId - ID de l'utilisateur
     * @param {string} guildId - ID du serveur
     * @returns {Promise<boolean>}
     */
    async isBanned(userId, guildId) {
        try {
            const user = await User.findOne({ userId });
            if (!user) return false;
            
            const activeBans = user.getActiveSanctions(guildId, 'ban');
            return activeBans.length > 0;
        } catch (error) {
            console.error('Erreur lors de la vérification du ban:', error);
            return false;
        }
    }

    /**
     * Obtient le niveau de permission d'un utilisateur
     * @param {Object} member - Membre Discord
     * @param {Object} guildData - Données du serveur
     * @returns {string}
     */
    getPermissionLevel(member, guildData = null) {
        if (this.isOwner(member.user.id)) return 'owner';
        if (this.isAdmin(member, guildData)) return 'admin';
        if (this.isModerator(member, guildData)) return 'moderator';
        if (this.isStaff(member, guildData)) return 'staff';
        return 'member';
    }

    /**
     * Formate le niveau de permission pour l'affichage
     * @param {string} level - Niveau de permission
     * @returns {string}
     */
    formatPermissionLevel(level) {
        const levels = {
            'owner': '👑 Propriétaire',
            'admin': '🛡️ Administrateur',
            'moderator': '🔨 Modérateur',
            'staff': '👮 Staff',
            'member': '👤 Membre'
        };
        
        return levels[level] || '❓ Inconnu';
    }

    /**
     * Vérifie les permissions requises pour une action
     * @param {Object} member - Membre Discord
     * @param {string} action - Action à effectuer
     * @param {Object} guildData - Données du serveur
     * @returns {Object}
     */
    checkPermissions(member, action, guildData = null) {
        const hasPermission = this.canUseCommand(member, action, guildData);
        const userLevel = this.getPermissionLevel(member, guildData);
        
        return {
            hasPermission,
            userLevel,
            formattedLevel: this.formatPermissionLevel(userLevel)
        };
    }
}

module.exports = new PermissionsUtil();