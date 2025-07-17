const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, '..', 'src', 'commands');

// Fonction récursive pour lire tous les fichiers de commandes
function readCommands(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            readCommands(filePath);
        } else if (file.endsWith('.js')) {
            try {
                const command = require(filePath);
                if (command.data && command.execute) {
                    commands.push(command.data.toJSON());
                    console.log(`✅ Commande chargée: ${command.data.name}`);
                } else {
                    console.log(`⚠️  Commande invalide ignorée: ${filePath}`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de ${filePath}:`, error.message);
            }
        }
    }
}

async function deployCommands() {
    try {
        console.log('🚀 Démarrage du déploiement des commandes slash...');
        
        // Vérifier les variables d'environnement
        if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
            throw new Error('DISCORD_TOKEN et CLIENT_ID doivent être définis dans le fichier .env');
        }
        
        // Charger toutes les commandes
        readCommands(commandsPath);
        console.log(`📦 ${commands.length} commandes trouvées`);
        
        // Créer l'instance REST
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        // Déployer les commandes
        if (process.argv.includes('--guild') && process.env.GUILD_ID) {
            // Déploiement pour un serveur spécifique (plus rapide pour les tests)
            console.log(`🎯 Déploiement pour le serveur ${process.env.GUILD_ID}...`);
            
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            
            console.log(`✅ ${data.length} commandes déployées avec succès pour le serveur !`);
        } else {
            // Déploiement global (peut prendre jusqu'à 1 heure pour être actif)
            console.log('🌍 Déploiement global des commandes...');
            
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            
            console.log(`✅ ${data.length} commandes déployées globalement avec succès !`);
            console.log('⏳ Les commandes peuvent prendre jusqu\'à 1 heure pour être actives sur tous les serveurs.');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du déploiement:', error);
        process.exit(1);
    }
}

async function deleteCommands() {
    try {
        console.log('🗑️  Suppression des commandes...');
        
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        if (process.argv.includes('--guild') && process.env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: [] }
            );
            console.log('✅ Commandes du serveur supprimées');
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: [] }
            );
            console.log('✅ Commandes globales supprimées');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        process.exit(1);
    }
}

async function listCommands() {
    try {
        console.log('📋 Liste des commandes actuelles...');
        
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        let data;
        if (process.argv.includes('--guild') && process.env.GUILD_ID) {
            data = await rest.get(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
            );
            console.log(`📍 Commandes du serveur ${process.env.GUILD_ID}:`);
        } else {
            data = await rest.get(
                Routes.applicationCommands(process.env.CLIENT_ID)
            );
            console.log('🌍 Commandes globales:');
        }
        
        if (data.length === 0) {
            console.log('   Aucune commande déployée');
        } else {
            data.forEach(command => {
                console.log(`   • ${command.name} - ${command.description}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des commandes:', error);
        process.exit(1);
    }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📚 Script de déploiement des commandes Discord

Usage:
  node scripts/deploy.js [options]

Options:
  --deploy     Déploie les commandes (par défaut)
  --delete     Supprime toutes les commandes
  --list       Liste les commandes actuellement déployées
  --guild      Utilise le serveur spécifique (GUILD_ID dans .env)
  --global     Déploiement global (par défaut)
  --help, -h   Affiche cette aide

Exemples:
  node scripts/deploy.js                    # Déploiement global
  node scripts/deploy.js --guild            # Déploiement pour un serveur
  node scripts/deploy.js --delete --guild   # Suppression des commandes du serveur
  node scripts/deploy.js --list             # Liste des commandes globales
    `);
    process.exit(0);
}

// Exécution du script
(async () => {
    if (args.includes('--delete')) {
        await deleteCommands();
    } else if (args.includes('--list')) {
        await listCommands();
    } else {
        await deployCommands();
    }
})();