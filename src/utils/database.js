const mongoose = require('mongoose');
const config = require('../config/config');
const { logDatabase, logError } = require('./logger');

class Database {
    constructor() {
        this.isConnected = false;
        this.connection = null;
    }

    async connect() {
        try {
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4
            };

            this.connection = await mongoose.connect(config.mongodb.uri, options);
            this.isConnected = true;
            
            logDatabase('Connexion à MongoDB établie avec succès');
            
            // Événements de connexion
            mongoose.connection.on('connected', () => {
                logDatabase('Mongoose connecté à MongoDB');
            });

            mongoose.connection.on('error', (err) => {
                logDatabase(`Erreur de connexion Mongoose: ${err.message}`, 'error');
            });

            mongoose.connection.on('disconnected', () => {
                logDatabase('Mongoose déconnecté de MongoDB');
                this.isConnected = false;
            });

            // Gestion de la fermeture propre
            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });

            return this.connection;
        } catch (error) {
            logError(error, 'DATABASE_CONNECTION');
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.isConnected) {
                await mongoose.connection.close();
                this.isConnected = false;
                logDatabase('Connexion à MongoDB fermée');
            }
        } catch (error) {
            logError(error, 'DATABASE_DISCONNECTION');
            throw error;
        }
    }

    async ping() {
        try {
            if (!this.isConnected) {
                throw new Error('Base de données non connectée');
            }
            
            await mongoose.connection.db.admin().ping();
            return true;
        } catch (error) {
            logError(error, 'DATABASE_PING');
            return false;
        }
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
        };
    }
}

module.exports = new Database();