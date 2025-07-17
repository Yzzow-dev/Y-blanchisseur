const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    
    // Configuration des salons
    channels: {
        logs: String,
        welcome: String,
        tickets: String,
        candidatures: String,
        modlogs: String,
        stats: String
    },
    
    // Configuration des rôles
    roles: {
        staff: [String],
        moderator: [String],
        admin: [String],
        member: String,
        muted: String,
        verified: String
    },
    
    // Messages personnalisés
    messages: {
        welcome: {
            type: String,
            default: 'Bienvenue sur le serveur {user} ! Veuillez réagir avec ✅ pour accéder au serveur.'
        },
        rules: String,
        ticketCreate: {
            type: String,
            default: 'Merci de créer un ticket. Un membre du staff vous répondra bientôt.'
        }
    },
    
    // Configuration de l'auto-modération
    automod: {
        enabled: {
            type: Boolean,
            default: true
        },
        antiSpam: {
            enabled: {
                type: Boolean,
                default: true
            },
            maxMessages: {
                type: Number,
                default: 5
            },
            timeWindow: {
                type: Number,
                default: 5000
            },
            action: {
                type: String,
                enum: ['warn', 'mute', 'kick', 'ban'],
                default: 'mute'
            }
        },
        antiLink: {
            enabled: {
                type: Boolean,
                default: true
            },
            whitelist: {
                type: [String],
                default: ['discord.gg', 'youtube.com', 'github.com']
            },
            action: {
                type: String,
                enum: ['delete', 'warn', 'mute'],
                default: 'delete'
            }
        },
        antiInvite: {
            enabled: {
                type: Boolean,
                default: true
            },
            action: {
                type: String,
                enum: ['delete', 'warn', 'mute', 'ban'],
                default: 'delete'
            }
        }
    },
    
    // Configuration des tickets
    tickets: {
        enabled: {
            type: Boolean,
            default: true
        },
        categories: {
            type: [String],
            default: ['Support technique', 'Plainte', 'Demande d\'unban', 'Candidature', 'Autre']
        },
        autoClose: {
            type: Number,
            default: 24 * 60 * 60 * 1000 // 24 heures
        },
        transcriptChannel: String
    },
    
    // Configuration des candidatures
    candidatures: {
        enabled: {
            type: Boolean,
            default: true
        },
        types: {
            type: [String],
            default: ['Staff', 'Whitelist RP', 'Partenariat']
        },
        autoReview: {
            type: Boolean,
            default: false
        }
    },
    
    // Statistiques
    stats: {
        totalMembers: {
            type: Number,
            default: 0
        },
        totalTickets: {
            type: Number,
            default: 0
        },
        totalCandidatures: {
            type: Number,
            default: 0
        },
        totalWarnings: {
            type: Number,
            default: 0
        }
    },
    
    // Paramètres avancés
    settings: {
        prefix: {
            type: String,
            default: '!'
        },
        language: {
            type: String,
            default: 'fr'
        },
        timezone: {
            type: String,
            default: 'Europe/Paris'
        },
        embedColor: {
            type: String,
            default: '#5865F2'
        }
    }
}, {
    timestamps: true
});

// Index pour optimiser les requêtes
guildSchema.index({ guildId: 1 });

// Méthodes utilitaires
guildSchema.methods.isStaff = function(userId) {
    return this.roles.staff.includes(userId) || 
           this.roles.moderator.includes(userId) || 
           this.roles.admin.includes(userId);
};

guildSchema.methods.isModerator = function(userId) {
    return this.roles.moderator.includes(userId) || 
           this.roles.admin.includes(userId);
};

guildSchema.methods.isAdmin = function(userId) {
    return this.roles.admin.includes(userId);
};

guildSchema.methods.incrementStat = function(statName) {
    if (this.stats[statName] !== undefined) {
        this.stats[statName]++;
        return this.save();
    }
};

module.exports = mongoose.model('Guild', guildSchema);