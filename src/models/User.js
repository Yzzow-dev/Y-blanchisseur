const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    discriminator: String,
    avatar: String,
    
    // Données par serveur
    guilds: [{
        guildId: {
            type: String,
            required: true
        },
        
        // Informations de base
        nickname: String,
        joinedAt: Date,
        roles: [String],
        
        // Statistiques
        stats: {
            messagesCount: {
                type: Number,
                default: 0
            },
            warningsCount: {
                type: Number,
                default: 0
            },
            ticketsCount: {
                type: Number,
                default: 0
            },
            candidaturesCount: {
                type: Number,
                default: 0
            },
            voiceTime: {
                type: Number,
                default: 0
            },
            lastActive: {
                type: Date,
                default: Date.now
            }
        },
        
        // Sanctions
        sanctions: [{
            type: {
                type: String,
                enum: ['warn', 'mute', 'kick', 'ban'],
                required: true
            },
            reason: String,
            moderator: {
                userId: String,
                username: String
            },
            duration: Number, // en millisecondes
            active: {
                type: Boolean,
                default: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            expiresAt: Date,
            revokedAt: Date,
            revokedBy: {
                userId: String,
                username: String
            }
        }],
        
        // Permissions spéciales
        permissions: {
            canCreateTickets: {
                type: Boolean,
                default: true
            },
            canApply: {
                type: Boolean,
                default: true
            },
            bypassAutomod: {
                type: Boolean,
                default: false
            }
        },
        
        // Données d'accueil
        welcome: {
            completed: {
                type: Boolean,
                default: false
            },
            completedAt: Date,
            captchaAttempts: {
                type: Number,
                default: 0
            }
        },
        
        // Données de modération
        moderation: {
            notes: [{
                note: String,
                moderator: {
                    userId: String,
                    username: String
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }],
            watchlist: {
                active: {
                    type: Boolean,
                    default: false
                },
                reason: String,
                addedBy: {
                    userId: String,
                    username: String
                },
                addedAt: Date
            }
        }
    }],
    
    // Paramètres utilisateur
    settings: {
        language: {
            type: String,
            default: 'fr'
        },
        notifications: {
            tickets: {
                type: Boolean,
                default: true
            },
            candidatures: {
                type: Boolean,
                default: true
            },
            moderation: {
                type: Boolean,
                default: true
            }
        },
        privacy: {
            showStats: {
                type: Boolean,
                default: true
            },
            allowDMs: {
                type: Boolean,
                default: true
            }
        }
    }
}, {
    timestamps: true
});

// Index pour optimiser les requêtes
userSchema.index({ userId: 1 });
userSchema.index({ 'guilds.guildId': 1 });
userSchema.index({ 'guilds.guildId': 1, userId: 1 });

// Méthodes utilitaires
userSchema.methods.getGuildData = function(guildId) {
    return this.guilds.find(g => g.guildId === guildId);
};

userSchema.methods.addGuild = function(guildId, guildData = {}) {
    const existingGuild = this.getGuildData(guildId);
    if (!existingGuild) {
        this.guilds.push({
            guildId,
            joinedAt: new Date(),
            ...guildData
        });
        return this.save();
    }
    return Promise.resolve(this);
};

userSchema.methods.updateGuildData = function(guildId, updateData) {
    const guildData = this.getGuildData(guildId);
    if (guildData) {
        Object.assign(guildData, updateData);
        return this.save();
    }
    return this.addGuild(guildId, updateData);
};

userSchema.methods.addSanction = function(guildId, sanctionData) {
    const guildData = this.getGuildData(guildId);
    if (guildData) {
        guildData.sanctions.push({
            ...sanctionData,
            createdAt: new Date()
        });
        guildData.stats.warningsCount++;
        return this.save();
    }
    throw new Error('Guild data not found');
};

userSchema.methods.getActiveSanctions = function(guildId, type = null) {
    const guildData = this.getGuildData(guildId);
    if (!guildData) return [];
    
    let sanctions = guildData.sanctions.filter(s => s.active);
    if (type) {
        sanctions = sanctions.filter(s => s.type === type);
    }
    
    return sanctions;
};

userSchema.methods.revokeSanction = function(guildId, sanctionId, revokedBy) {
    const guildData = this.getGuildData(guildId);
    if (guildData) {
        const sanction = guildData.sanctions.id(sanctionId);
        if (sanction) {
            sanction.active = false;
            sanction.revokedAt = new Date();
            sanction.revokedBy = revokedBy;
            return this.save();
        }
    }
    throw new Error('Sanction not found');
};

userSchema.methods.addNote = function(guildId, note, moderator) {
    const guildData = this.getGuildData(guildId);
    if (guildData) {
        guildData.moderation.notes.push({
            note,
            moderator,
            createdAt: new Date()
        });
        return this.save();
    }
    throw new Error('Guild data not found');
};

userSchema.methods.addToWatchlist = function(guildId, reason, addedBy) {
    const guildData = this.getGuildData(guildId);
    if (guildData) {
        guildData.moderation.watchlist = {
            active: true,
            reason,
            addedBy,
            addedAt: new Date()
        };
        return this.save();
    }
    throw new Error('Guild data not found');
};

userSchema.methods.removeFromWatchlist = function(guildId) {
    const guildData = this.getGuildData(guildId);
    if (guildData) {
        guildData.moderation.watchlist.active = false;
        return this.save();
    }
    throw new Error('Guild data not found');
};

userSchema.methods.incrementStat = function(guildId, statName, value = 1) {
    const guildData = this.getGuildData(guildId);
    if (guildData && guildData.stats[statName] !== undefined) {
        guildData.stats[statName] += value;
        guildData.stats.lastActive = new Date();
        return this.save();
    }
    throw new Error('Guild data or stat not found');
};

userSchema.methods.updateActivity = function(guildId) {
    const guildData = this.getGuildData(guildId);
    if (guildData) {
        guildData.stats.lastActive = new Date();
        return this.save();
    }
    throw new Error('Guild data not found');
};

userSchema.methods.canCreateTicket = function(guildId) {
    const guildData = this.getGuildData(guildId);
    if (!guildData) return false;
    
    const activeMutes = this.getActiveSanctions(guildId, 'mute');
    const activeBans = this.getActiveSanctions(guildId, 'ban');
    
    return guildData.permissions.canCreateTickets && 
           activeMutes.length === 0 && 
           activeBans.length === 0;
};

userSchema.methods.canApply = function(guildId) {
    const guildData = this.getGuildData(guildId);
    if (!guildData) return false;
    
    const activeBans = this.getActiveSanctions(guildId, 'ban');
    const recentWarnings = guildData.sanctions.filter(s => 
        s.type === 'warn' && 
        s.active && 
        (Date.now() - s.createdAt) < (7 * 24 * 60 * 60 * 1000) // 7 jours
    );
    
    return guildData.permissions.canApply && 
           activeBans.length === 0 && 
           recentWarnings.length < 3;
};

// Méthodes statiques
userSchema.statics.findByGuild = function(guildId) {
    return this.find({ 'guilds.guildId': guildId });
};

userSchema.statics.findActiveInGuild = function(guildId, daysAgo = 30) {
    const cutoff = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
    return this.find({
        'guilds.guildId': guildId,
        'guilds.stats.lastActive': { $gte: cutoff }
    });
};

userSchema.statics.getTopUsers = function(guildId, statName, limit = 10) {
    return this.aggregate([
        { $match: { 'guilds.guildId': guildId } },
        { $unwind: '$guilds' },
        { $match: { 'guilds.guildId': guildId } },
        { $sort: { [`guilds.stats.${statName}`]: -1 } },
        { $limit: limit },
        {
            $project: {
                userId: 1,
                username: 1,
                stat: `$guilds.stats.${statName}`,
                lastActive: '$guilds.stats.lastActive'
            }
        }
    ]);
};

module.exports = mongoose.model('User', userSchema);