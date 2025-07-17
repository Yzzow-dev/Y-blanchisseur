const fs = require('fs');
const path = require('path');
const { logBot, logError, logSuccess } = require('../utils/logger');

class EventHandler {
    constructor(client) {
        this.client = client;
        this.events = new Map();
    }

    /**
     * Charge tous les événements depuis le dossier events
     */
    async loadEvents() {
        const eventsPath = path.join(__dirname, '..', 'events');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            try {
                delete require.cache[require.resolve(filePath)];
                const event = require(filePath);

                if (event.name && event.execute) {
                    this.events.set(event.name, event);
                    
                    if (event.once) {
                        this.client.once(event.name, (...args) => event.execute(...args));
                    } else {
                        this.client.on(event.name, (...args) => event.execute(...args));
                    }
                    
                    logBot(`Événement chargé: ${event.name}`);
                } else {
                    logError(new Error(`Événement invalide: ${filePath}`), 'EVENT_HANDLER');
                }
            } catch (error) {
                logError(error, `EVENT_LOAD_${file}`);
            }
        }

        logSuccess(`${this.events.size} événements chargés avec succès`);
    }

    /**
     * Recharge un événement spécifique
     * @param {string} eventName - Nom de l'événement
     */
    async reloadEvent(eventName) {
        const event = this.events.get(eventName);
        if (!event) {
            throw new Error(`Événement "${eventName}" non trouvé`);
        }

        // Retirer les listeners existants
        this.client.removeAllListeners(eventName);

        // Recharger l'événement
        const eventsPath = path.join(__dirname, '..', 'events');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            try {
                delete require.cache[require.resolve(filePath)];
                const reloadedEvent = require(filePath);

                if (reloadedEvent.name === eventName) {
                    this.events.set(eventName, reloadedEvent);
                    
                    if (reloadedEvent.once) {
                        this.client.once(eventName, (...args) => reloadedEvent.execute(...args));
                    } else {
                        this.client.on(eventName, (...args) => reloadedEvent.execute(...args));
                    }
                    
                    logSuccess(`Événement "${eventName}" rechargé`);
                    return;
                }
            } catch (error) {
                logError(error, `EVENT_RELOAD_${file}`);
                throw error;
            }
        }

        throw new Error(`Fichier de l'événement "${eventName}" non trouvé`);
    }

    /**
     * Obtient un événement par son nom
     * @param {string} name - Nom de l'événement
     * @returns {Object|null}
     */
    getEvent(name) {
        return this.events.get(name);
    }

    /**
     * Obtient tous les événements
     * @returns {Map}
     */
    getEvents() {
        return this.events;
    }

    /**
     * Obtient les statistiques des événements
     * @returns {Object}
     */
    getStats() {
        const onceEvents = Array.from(this.events.values()).filter(event => event.once).length;
        const regularEvents = this.events.size - onceEvents;

        return {
            total: this.events.size,
            once: onceEvents,
            regular: regularEvents,
            listeners: this.client.eventNames().length
        };
    }

    /**
     * Supprime un événement
     * @param {string} eventName - Nom de l'événement
     */
    removeEvent(eventName) {
        if (this.events.has(eventName)) {
            this.client.removeAllListeners(eventName);
            this.events.delete(eventName);
            logSuccess(`Événement "${eventName}" supprimé`);
        }
    }

    /**
     * Supprime tous les événements
     */
    removeAllEvents() {
        this.events.forEach((event, name) => {
            this.client.removeAllListeners(name);
        });
        this.events.clear();
        logSuccess('Tous les événements ont été supprimés');
    }
}

module.exports = EventHandler;