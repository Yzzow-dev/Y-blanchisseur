const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    guildId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    
    // Informations du ticket
    category: {
        type: String,
        required: true,
        enum: ['Support technique', 'Plainte', 'Demande d\'unban', 'Candidature', 'Autre']
    },
    subject: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // État du ticket
    status: {
        type: String,
        enum: ['open', 'in_progress', 'waiting', 'closed'],
        default: 'open'
    },
    
    // Staff assigné
    assignedTo: {
        userId: String,
        username: String,
        assignedAt: Date
    },
    
    // Messages du ticket
    messages: [{
        messageId: String,
        authorId: String,
        authorName: String,
        content: String,
        attachments: [{
            name: String,
            url: String,
            size: Number
        }],
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Participants
    participants: [{
        userId: String,
        username: String,
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Informations de fermeture
    closedBy: {
        userId: String,
        username: String,
        reason: String,
        closedAt: Date
    },
    
    // Transcription
    transcript: {
        url: String,
        generatedAt: Date,
        messageCount: Number
    },
    
    // Évaluations
    rating: {
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        ratedAt: Date
    },
    
    // Métadonnées
    metadata: {
        lastActivity: {
            type: Date,
            default: Date.now
        },
        autoCloseAt: Date,
        reminderSent: {
            type: Boolean,
            default: false
        },
        escalated: {
            type: Boolean,
            default: false
        },
        escalatedAt: Date,
        escalatedBy: String
    }
}, {
    timestamps: true
});

// Index pour optimiser les requêtes
ticketSchema.index({ guildId: 1, userId: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ 'assignedTo.userId': 1 });
ticketSchema.index({ ticketId: 1 });

// Méthodes utilitaires
ticketSchema.methods.addMessage = function(messageData) {
    this.messages.push(messageData);
    this.metadata.lastActivity = new Date();
    return this.save();
};

ticketSchema.methods.addParticipant = function(userId, username) {
    const existingParticipant = this.participants.find(p => p.userId === userId);
    if (!existingParticipant) {
        this.participants.push({ userId, username });
        return this.save();
    }
    return Promise.resolve(this);
};

ticketSchema.methods.assignTo = function(userId, username) {
    this.assignedTo = {
        userId,
        username,
        assignedAt: new Date()
    };
    this.status = 'in_progress';
    return this.save();
};

ticketSchema.methods.close = function(closedBy, reason = 'Ticket fermé') {
    this.status = 'closed';
    this.closedBy = {
        userId: closedBy.userId,
        username: closedBy.username,
        reason,
        closedAt: new Date()
    };
    return this.save();
};

ticketSchema.methods.escalate = function(escalatedBy) {
    this.metadata.escalated = true;
    this.metadata.escalatedAt = new Date();
    this.metadata.escalatedBy = escalatedBy;
    this.priority = 'high';
    return this.save();
};

ticketSchema.methods.rate = function(score, comment) {
    this.rating = {
        score,
        comment,
        ratedAt: new Date()
    };
    return this.save();
};

ticketSchema.methods.updateActivity = function() {
    this.metadata.lastActivity = new Date();
    return this.save();
};

ticketSchema.methods.isInactive = function(timeoutMs = 24 * 60 * 60 * 1000) {
    const now = new Date();
    const lastActivity = this.metadata.lastActivity;
    return (now - lastActivity) > timeoutMs;
};

// Méthodes statiques
ticketSchema.statics.findActiveByUser = function(guildId, userId) {
    return this.find({
        guildId,
        userId,
        status: { $ne: 'closed' }
    });
};

ticketSchema.statics.findByStaff = function(guildId, staffId) {
    return this.find({
        guildId,
        'assignedTo.userId': staffId,
        status: { $ne: 'closed' }
    });
};

ticketSchema.statics.findInactive = function(guildId, timeoutMs = 24 * 60 * 60 * 1000) {
    const cutoff = new Date(Date.now() - timeoutMs);
    return this.find({
        guildId,
        status: { $ne: 'closed' },
        'metadata.lastActivity': { $lt: cutoff }
    });
};

ticketSchema.statics.getStats = function(guildId, startDate, endDate) {
    const match = { guildId };
    if (startDate && endDate) {
        match.createdAt = { $gte: startDate, $lte: endDate };
    }
    
    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
                closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
                avgRating: { $avg: '$rating.score' },
                categories: { $push: '$category' }
            }
        }
    ]);
};

module.exports = mongoose.model('Ticket', ticketSchema);