# 🚀 Guide de démarrage rapide - Discord RP Bot

## Installation rapide

### 1. Prérequis
- Node.js 18.0.0 ou supérieur
- MongoDB (local ou Atlas)
- Un bot Discord créé

### 2. Installation
```bash
# Cloner le projet
git clone <votre-repo>
cd discord-rp-bot

# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer le fichier .env avec vos informations
```

### 3. Configuration du fichier .env
```env
# Bot Discord
DISCORD_TOKEN=votre_token_bot_discord
CLIENT_ID=votre_client_id
CLIENT_SECRET=votre_client_secret

# Base de données
MONGODB_URI=mongodb://localhost:27017/discord-rp-bot

# Configuration serveur
PORT=3000
SESSION_SECRET=votre_secret_session

# Configuration bot
OWNER_ID=votre_id_discord
```

### 4. Créer un bot Discord
1. Allez sur https://discord.com/developers/applications
2. Créez une nouvelle application
3. Allez dans "Bot" → Créez un bot
4. Copiez le token dans votre `.env`
5. Activez les "Privileged Gateway Intents" :
   - SERVER MEMBERS INTENT
   - MESSAGE CONTENT INTENT

### 5. Inviter le bot
Remplacez `CLIENT_ID` par l'ID de votre application :
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### 6. Lancer le bot
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## Configuration initiale sur Discord

### 1. Configuration de base
```
/config logs #salon-logs
/config welcome #salon-accueil
/config tickets #salon-tickets
```

### 2. Configuration des rôles
```
/config roles membre:@Membre staff:@Staff moderateur:@Modérateur admin:@Admin
```

### 3. Activation de l'auto-modération
```
/config automod activer:true
```

### 4. Configuration du système de tickets
```
/ticket setup
```

## Commandes principales

### Administration
- `/config view` - Voir la configuration
- `/config logs <salon>` - Configurer les logs
- `/config welcome <salon>` - Configurer l'accueil
- `/config tickets <salon>` - Configurer les tickets
- `/config roles` - Configurer les rôles

### Tickets
- `/ticket create` - Créer un ticket
- `/ticket close` - Fermer un ticket
- `/ticket list` - Lister les tickets (staff)
- `/ticket setup` - Configurer le système

### Utilitaires
- `/help` - Aide et liste des commandes
- `/help <commande>` - Aide sur une commande spécifique

## Structure des permissions

### Niveaux d'accès
1. **Propriétaire** - Accès total (défini dans .env)
2. **Admin** - Gestion serveur, configuration
3. **Modérateur** - Modération, candidatures
4. **Staff** - Tickets, infos utilisateurs
5. **Membre** - Commandes publiques

### Configuration des rôles
Le bot utilise une hiérarchie de rôles configurable :
- Rôles Discord natifs (permissions)
- Rôles configurés via `/config roles`
- Propriétaire du bot (OWNER_ID)

## Fonctionnalités disponibles

### ✅ Implémentées
- **Système de configuration** complet
- **Commandes slash** avec permissions
- **Système de tickets** de base
- **Logs professionnels** avec Winston
- **Base de données** MongoDB avec Mongoose
- **Gestion des erreurs** robuste

### 🔄 En cours de développement
- Système de candidatures complet
- Auto-modération avancée
- Système d'accueil avec captcha
- Statistiques et analytics
- Dashboard web

## Dépannage

### Problèmes courants

#### Bot ne démarre pas
```bash
# Vérifier les logs
npm start

# Vérifier la configuration
cat .env
```

#### Commandes non reconnues
1. Vérifiez que le bot a les permissions nécessaires
2. Redémarrez le bot
3. Vérifiez les logs d'erreur

#### Base de données non connectée
1. Vérifiez que MongoDB est démarré
2. Vérifiez l'URI de connexion dans .env
3. Vérifiez les permissions d'accès

### Logs utiles
```bash
# Voir les logs en temps réel
tail -f logs/combined.log

# Voir les erreurs
tail -f logs/error.log
```

## Support

### Ressources
- [Documentation Discord.js](https://discord.js.org/)
- [Documentation MongoDB](https://docs.mongodb.com/)
- [Guide des permissions Discord](https://discord.com/developers/docs/topics/permissions)

### Aide
- Ouvrez une issue sur GitHub
- Consultez les logs d'erreur
- Vérifiez la configuration

## Prochaines étapes

1. **Testez les fonctionnalités de base**
   - Créez des tickets
   - Testez la configuration
   - Vérifiez les permissions

2. **Personnalisez selon vos besoins**
   - Modifiez les catégories de tickets
   - Ajustez les messages d'accueil
   - Configurez l'auto-modération

3. **Déployez en production**
   - Utilisez PM2 pour la gestion des processus
   - Configurez un reverse proxy (nginx)
   - Mettez en place des sauvegardes

---

**🎉 Félicitations ! Votre bot Discord RP est maintenant opérationnel !**