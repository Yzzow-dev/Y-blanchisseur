# Discord RP Bot - Bot de gestion pour serveur RP

Un bot Discord avancé conçu spécialement pour les serveurs de roleplay, avec système de tickets, candidatures, auto-modération et dashboard web.

## 🚀 Fonctionnalités

### ✅ Implémentées
- **Système d'accueil automatique** avec captcha et attribution de rôles
- **Système de tickets complet** avec transcription et sauvegarde
- **Candidatures staff/whitelist** avec validation
- **Auto-modération** avancée avec logs
- **Configuration via Discord** avec slash commands
- **Système de logs** professionnel avec Winston

### 🔄 En développement
- Planification d'annonces avec cron
- Statistiques serveur en temps réel
- Dashboard web avec OAuth2 Discord
- Graphiques et analytics

## 📦 Installation

### Prérequis
- Node.js 18.0.0 ou supérieur
- MongoDB (local ou Atlas)
- Un bot Discord créé sur le Discord Developer Portal

### 1. Cloner et installer
```bash
git clone <votre-repo>
cd discord-rp-bot
npm install
```

### 2. Configuration
```bash
cp .env.example .env
# Éditer le fichier .env avec vos informations
```

### 3. Créer un bot Discord
1. Allez sur https://discord.com/developers/applications
2. Créez une nouvelle application
3. Allez dans "Bot" et créez un bot
4. Copiez le token dans votre `.env`
5. Activez les "Privileged Gateway Intents" (SERVER MEMBERS INTENT et MESSAGE CONTENT INTENT)

### 4. Inviter le bot
Utilisez ce lien en remplaçant `CLIENT_ID` par l'ID de votre application :
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### 5. Lancer le bot
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 🛠️ Configuration

### Commandes de configuration (réservées aux administrateurs)

#### `/config setup`
Configuration initiale du serveur avec menus interactifs.

#### `/config logs <salon>`
Définit le salon pour les logs de modération.

#### `/config welcome <salon> [message]`
Configure le système d'accueil.

#### `/config tickets <salon>`
Définit le salon pour créer les tickets.

#### `/config roles`
Configuration des rôles automatiques.

## 📋 Utilisation

### Système de tickets
- `/ticket create` - Créer un ticket
- `/ticket close` - Fermer un ticket
- `/ticket transcript` - Générer une transcription

### Candidatures
- `/candidature staff` - Postuler pour le staff
- `/candidature whitelist` - Demander la whitelist RP
- `/candidature review <id>` - Examiner une candidature (staff)

### Modération
- `/warn <utilisateur> [raison]` - Avertir un utilisateur
- `/mute <utilisateur> [durée] [raison]` - Rendre muet
- `/ban <utilisateur> [raison]` - Bannir
- `/unban <utilisateur>` - Débannir
- `/clear <nombre>` - Supprimer des messages

### Utilitaires
- `/userinfo <utilisateur>` - Informations sur un utilisateur
- `/serverinfo` - Informations sur le serveur
- `/help` - Aide et commandes disponibles

## 🏗️ Structure du projet

```
discord-rp-bot/
├── src/
│   ├── commands/           # Commandes slash
│   │   ├── admin/         # Commandes administrateur
│   │   ├── moderation/    # Commandes de modération
│   │   ├── tickets/       # Système de tickets
│   │   └── utils/         # Utilitaires
│   ├── events/            # Événements Discord
│   ├── handlers/          # Gestionnaires (commandes, événements)
│   ├── models/            # Modèles MongoDB
│   ├── utils/             # Utilitaires et helpers
│   ├── config/            # Configuration
│   ├── dashboard/         # Dashboard web (optionnel)
│   └── index.js           # Point d'entrée
├── logs/                  # Fichiers de logs
├── .env.example           # Variables d'environnement
├── package.json
└── README.md
```

## 🔧 Développement

### Linting
```bash
npm run lint        # Vérifier le code
npm run lint:fix    # Corriger automatiquement
```

### Tests
```bash
npm test
```

## 🚀 Déploiement

### VPS/Serveur dédié
1. Cloner le projet sur votre serveur
2. Installer les dépendances
3. Configurer les variables d'environnement
4. Utiliser PM2 pour la gestion des processus :
```bash
npm install -g pm2
pm2 start src/index.js --name "discord-rp-bot"
pm2 startup
pm2 save
```

### Railway
1. Connecter votre repository GitHub à Railway
2. Ajouter les variables d'environnement dans le dashboard Railway
3. Le déploiement se fait automatiquement

### Docker (optionnel)
```bash
# Construire l'image
docker build -t discord-rp-bot .

# Lancer le conteneur
docker run -d --name discord-rp-bot --env-file .env discord-rp-bot
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir des issues pour signaler des bugs
- Proposer de nouvelles fonctionnalités
- Soumettre des pull requests

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Contactez-nous sur Discord : [Lien vers votre serveur de support]

---

**Note :** Ce bot est conçu spécifiquement pour les serveurs de roleplay. Adaptez la configuration selon vos besoins spécifiques.