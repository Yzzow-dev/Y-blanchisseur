const { Events, ActivityType } = require('discord.js');
const { logBot, logSuccess } = require('../utils/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        logSuccess(`Bot connecté en tant que ${client.user.tag}!`);
        
        // Définir le statut du bot
        client.user.setPresence({
            activities: [{
                name: 'Gérer le serveur RP',
                type: ActivityType.Watching
            }],
            status: 'online'
        });

        // Afficher les statistiques de connexion
        const guildsCount = client.guilds.cache.size;
        const usersCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        
        logBot(`Connecté à ${guildsCount} serveur(s) avec ${usersCount} utilisateur(s)`);
        
        // Lister les serveurs
        client.guilds.cache.forEach(guild => {
            logBot(`- ${guild.name} (${guild.id}) - ${guild.memberCount} membres`);
        });

        // Vérifier la configuration de chaque serveur
        await checkGuildsConfiguration(client);
    }
};

/**
 * Vérifie la configuration de chaque serveur
 * @param {Client} client - Client Discord
 */
async function checkGuildsConfiguration(client) {
    const Guild = require('../models/Guild');
    
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            let guildData = await Guild.findOne({ guildId });
            
            if (!guildData) {
                // Créer une nouvelle configuration pour ce serveur
                guildData = new Guild({
                    guildId,
                    name: guild.name
                });
                await guildData.save();
                logBot(`Configuration créée pour le serveur ${guild.name}`);
            } else {
                // Mettre à jour le nom du serveur si nécessaire
                if (guildData.name !== guild.name) {
                    guildData.name = guild.name;
                    await guildData.save();
                    logBot(`Nom du serveur mis à jour: ${guild.name}`);
                }
            }
        } catch (error) {
            console.error(`Erreur lors de la vérification de la configuration pour ${guild.name}:`, error);
        }
    }
}