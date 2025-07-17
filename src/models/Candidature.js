const mongoose = require('mongoose');

const candidatureSchema = new mongoose.Schema({
    candidatureId: {
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
    
    // Type de candidature
    type: {
        type: String,
        required: true,
        enum: ['Staff', 'Whitelist RP', 'Partenariat', 'Autre']
    },
    
    // Informations de base
    personalInfo: {
        age: Number,
        timezone: String,
        experience: String,
        motivation: String,
        availability: String,
        previousExperience: String
    },
    
    // Questions spécifiques selon le type
    questions: [{
        question: String,
        answer: String,
        required: Boolean
    }],
    
    // Informations RP (pour whitelist)
    rpInfo: {
        characterName: String,
        characterAge: Number,
        characterBackground: String,
        characterGoals: String,
        rpExperience: String,
        scenarioResponse: String
    },
    
    // État de la candidature
    status: {
        type: String,
        enum: ['pending', 'under_review', 'approved', 'rejected', 'withdrawn'],
        default: 'pending'
    },
    
    // Évaluation
    evaluation: {
        reviewedBy: {
            userId: String,
            username: String
        },
        reviewedAt: Date,
        decision: {
            type: String,
            enum: ['approved', 'rejected']
        },
        feedback: String,
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        criteria: [{
            name: String,
            score: Number,
            comment: String
        }],
        notes: String
    },
    
    // Commentaires du staff
    staffComments: [{
        authorId: String,
        authorName: String,
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Historique des actions
    history: [{
        action: {
            type: String,
            enum: ['created', 'updated', 'reviewed', 'approved', 'rejected', 'withdrawn']
        },
        performedBy: {
            userId: String,
            username: String
        },
        details: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Métadonnées
    metadata: {
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        tags: [String],
        lastModified: {
            type: Date,
            default: Date.now
        },
        autoReview: {
            type: Boolean,
            default: false
        },
        reminderSent: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Index pour optimiser les requêtes
candidatureSchema.index({ guildId: 1, userId: 1 });
candidatureSchema.index({ status: 1 });
candidatureSchema.index({ type: 1 });
candidatureSchema.index({ candidatureId: 1 });
candidatureSchema.index({ 'evaluation.reviewedBy.userId': 1 });

// Méthodes utilitaires
candidatureSchema.methods.addComment = function(authorId, authorName, comment) {
    this.staffComments.push({
        authorId,
        authorName,
        comment,
        createdAt: new Date()
    });
    this.metadata.lastModified = new Date();
    return this.save();
};

candidatureSchema.methods.addHistory = function(action, performedBy, details = '') {
    this.history.push({
        action,
        performedBy,
        details,
        timestamp: new Date()
    });
    this.metadata.lastModified = new Date();
    return this.save();
};

candidatureSchema.methods.review = function(reviewData) {
    this.status = 'under_review';
    this.evaluation = {
        ...reviewData,
        reviewedAt: new Date()
    };
    this.metadata.lastModified = new Date();
    
    this.addHistory('reviewed', reviewData.reviewedBy, 'Candidature mise en révision');
    return this.save();
};

candidatureSchema.methods.approve = function(reviewedBy, feedback = '', score = null) {
    this.status = 'approved';
    this.evaluation.decision = 'approved';
    this.evaluation.feedback = feedback;
    this.evaluation.reviewedBy = reviewedBy;
    this.evaluation.reviewedAt = new Date();
    
    if (score !== null) {
        this.evaluation.score = score;
    }
    
    this.metadata.lastModified = new Date();
    this.addHistory('approved', reviewedBy, feedback);
    return this.save();
};

candidatureSchema.methods.reject = function(reviewedBy, feedback = '', score = null) {
    this.status = 'rejected';
    this.evaluation.decision = 'rejected';
    this.evaluation.feedback = feedback;
    this.evaluation.reviewedBy = reviewedBy;
    this.evaluation.reviewedAt = new Date();
    
    if (score !== null) {
        this.evaluation.score = score;
    }
    
    this.metadata.lastModified = new Date();
    this.addHistory('rejected', reviewedBy, feedback);
    return this.save();
};

candidatureSchema.methods.withdraw = function(userId, username, reason = '') {
    this.status = 'withdrawn';
    this.metadata.lastModified = new Date();
    this.addHistory('withdrawn', { userId, username }, reason);
    return this.save();
};

candidatureSchema.methods.updateAnswers = function(newAnswers) {
    this.questions = newAnswers;
    this.metadata.lastModified = new Date();
    this.addHistory('updated', { userId: this.userId, username: 'Candidat' }, 'Réponses mises à jour');
    return this.save();
};

candidatureSchema.methods.setPriority = function(priority, performedBy) {
    this.metadata.priority = priority;
    this.metadata.lastModified = new Date();
    this.addHistory('updated', performedBy, `Priorité changée à ${priority}`);
    return this.save();
};

candidatureSchema.methods.addTag = function(tag, performedBy) {
    if (!this.metadata.tags.includes(tag)) {
        this.metadata.tags.push(tag);
        this.metadata.lastModified = new Date();
        this.addHistory('updated', performedBy, `Tag ajouté: ${tag}`);
        return this.save();
    }
    return Promise.resolve(this);
};

candidatureSchema.methods.removeTag = function(tag, performedBy) {
    const index = this.metadata.tags.indexOf(tag);
    if (index > -1) {
        this.metadata.tags.splice(index, 1);
        this.metadata.lastModified = new Date();
        this.addHistory('updated', performedBy, `Tag supprimé: ${tag}`);
        return this.save();
    }
    return Promise.resolve(this);
};

candidatureSchema.methods.getAge = function() {
    const now = new Date();
    const created = this.createdAt;
    return Math.floor((now - created) / (1000 * 60 * 60 * 24)); // en jours
};

candidatureSchema.methods.isExpired = function(maxDays = 30) {
    return this.getAge() > maxDays;
};

candidatureSchema.methods.needsReview = function() {
    return this.status === 'pending' && this.getAge() > 3; // 3 jours
};

// Méthodes statiques
candidatureSchema.statics.findPending = function(guildId) {
    return this.find({
        guildId,
        status: 'pending'
    }).sort({ createdAt: 1 });
};

candidatureSchema.statics.findByType = function(guildId, type) {
    return this.find({
        guildId,
        type
    }).sort({ createdAt: -1 });
};

candidatureSchema.statics.findByUser = function(guildId, userId) {
    return this.find({
        guildId,
        userId
    }).sort({ createdAt: -1 });
};

candidatureSchema.statics.findByReviewer = function(guildId, reviewerId) {
    return this.find({
        guildId,
        'evaluation.reviewedBy.userId': reviewerId
    }).sort({ 'evaluation.reviewedAt': -1 });
};

candidatureSchema.statics.findExpired = function(guildId, maxDays = 30) {
    const cutoff = new Date(Date.now() - (maxDays * 24 * 60 * 60 * 1000));
    return this.find({
        guildId,
        status: 'pending',
        createdAt: { $lt: cutoff }
    });
};

candidatureSchema.statics.getStats = function(guildId, startDate, endDate) {
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
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                withdrawn: { $sum: { $cond: [{ $eq: ['$status', 'withdrawn'] }, 1, 0] } },
                avgScore: { $avg: '$evaluation.score' },
                types: { $push: '$type' }
            }
        }
    ]);
};

candidatureSchema.statics.getTypeStats = function(guildId) {
    return this.aggregate([
        { $match: { guildId } },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                avgScore: { $avg: '$evaluation.score' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

module.exports = mongoose.model('Candidature', candidatureSchema);