# 🛡️ Système d'Administration FiveM - Ultra Moderne & Sécurisé

Un système d'administration complet, moderne et sécurisé pour serveurs FiveM avec interface NUI élégante en bleu, logs Discord stylisés et protections anti-cheat avancées.

## ✨ Fonctionnalités

### 🎛️ Interface Moderne
- **Design ultra-moderne** en bleu foncé/clair avec animations fluides
- **Sidebar interactive** avec icônes et navigation intuitive
- **Responsive design** compatible 1920x1080 et 1366x768
- **Notifications toast** stylisées avec animations
- **Thème sombre** optimisé pour les longues sessions

### 👥 Gestion des Joueurs
- **Recherche multi-critères** (ID, nom, Steam, licence, IP)
- **Fiches joueurs complètes** (argent, banque, métier, position, ping)
- **Actions rapides** : freeze, spectate, revive, heal, téléportation
- **Sanctions avancées** : warn, kick, ban temporaire/permanent
- **Gestion économique** : donner argent, changer métier

### 📝 Système de Reports
- **Notifications temps réel** pour nouveaux reports
- **Interface de gestion** intuitive avec filtres
- **Historique complet** des reports traités
- **Système de réponses** aux joueurs

### 🛠️ Outils Staff
- **Mode invisible** (cloak) avec godmode
- **Noclip avancé** avec vitesses multiples
- **Système de spectate** avec informations détaillées
- **Téléportation** vers lieux populaires ou coordonnées
- **Blips joueurs** en temps réel

### 🔐 Sécurité Avancée
- **Vérifications permissions** côté serveur uniquement
- **Rate limiting** pour éviter le spam d'actions
- **Anti-spoof** avec vérification identifiants
- **Détection activités suspectes** automatique
- **Logs complets** de toutes les actions

### 📊 Statistiques & Monitoring
- **Dashboard temps réel** avec métriques serveur
- **Statistiques détaillées** (connexions, actions, sanctions)
- **Monitoring uptime** et performances
- **Graphiques d'activité** (à implémenter)

### 📨 Logs Discord Stylisés
- **Embeds colorés** style Farming Creator
- **Logs automatiques** pour toutes les actions importantes
- **Webhooks séparés** pour admin et sécurité
- **Informations détaillées** avec timestamps

## 🚀 Installation

### Prérequis
- **ESX Framework** (testé avec ESX Legacy)
- **MySQL** pour la base de données
- **Serveur FiveM** avec accès aux ressources

### Étapes d'installation

1. **Téléchargement**
   ```bash
   git clone https://github.com/votre-repo/admin-system.git
   cd admin-system
   ```

2. **Configuration Discord**
   - Créer des webhooks Discord pour les logs
   - Modifier `config.lua` avec vos webhooks :
   ```lua
   Config.Discord = {
       AdminWebhook = 'https://discord.com/api/webhooks/VOTRE_WEBHOOK_ADMIN',
       SecurityWebhook = 'https://discord.com/api/webhooks/VOTRE_WEBHOOK_SECURITY',
       ServerName = 'Votre Serveur RP',
       ServerIcon = 'https://votre-logo.png'
   }
   ```

3. **Base de données**
   - Les tables sont créées automatiquement au démarrage
   - Vérifier que MySQL est configuré dans votre serveur

4. **Permissions ESX**
   - Ajouter les groupes admin dans votre base ESX :
   ```sql
   INSERT INTO addon_account_data (account_name, money, owner) VALUES ('bank', 0, 'society_admin');
   ```

5. **Installation sur le serveur**
   - Copier le dossier dans `resources/[admin]/`
   - Ajouter dans `server.cfg` :
   ```
   ensure admin-system
   ```

6. **Configuration des groupes**
   - Modifier `config.lua` selon vos besoins :
   ```lua
   Config.Groups = {
       ['owner'] = { level = 100, permissions = {'all'} },
       ['admin'] = { level = 80, permissions = {'player.manage', 'player.ban'} },
       ['mod'] = { level = 50, permissions = {'player.freeze', 'player.spectate'} }
   }
   ```

## 🎮 Utilisation

### Commandes
- `/admin` - Ouvrir le panel d'administration
- `/report <raison>` - Créer un report
- `/noclip` - Toggle noclip (si permissions)
- `/cloak` - Toggle mode invisible (si permissions)

### Raccourcis clavier
- **F6** - Ouvrir/fermer le panel admin
- **ESCAPE** - Fermer le panel
- **WASD** - Déplacement en noclip
- **SHIFT** - Vitesse rapide en noclip
- **ALT** - Super vitesse en noclip

### Interface
1. **Sidebar** - Navigation entre les différents modules
2. **Dashboard** - Vue d'ensemble du serveur
3. **Joueurs** - Gestion complète des joueurs connectés
4. **Reports** - Traitement des signalements
5. **Sanctions** - Historique et gestion des bans/warns
6. **Outils** - Outils staff (noclip, cloak, téléportation)
7. **Serveur** - Contrôle serveur (restart, annonces)
8. **Logs** - Historique des actions
9. **Stats** - Statistiques détaillées

## 🔧 Configuration

### Permissions personnalisées
Modifier `config.lua` pour ajuster les permissions :

```lua
Config.Actions = {
    ['freeze'] = { permission = 'player.freeze', log = true },
    ['ban'] = { permission = 'player.ban', log = true },
    ['restart'] = { permission = 'server.restart', log = true }
}
```

### Sécurité
Ajuster les paramètres de sécurité dans `config.lua` :

```lua
Config.Security = {
    EnableRateLimit = true,
    RateLimitDelay = 1000,
    MaxActionsPerMinute = 30,
    EnableAntiSpoof = true,
    AutoKickOnCheat = true
}
```

### Interface
Personnaliser l'apparence dans `config.lua` :

```lua
Config.UI = {
    OpenKey = 'F6',
    DefaultTheme = 'dark',
    AnimationSpeed = 300,
    NotificationDuration = 5000
}
```

## 📋 Structure des fichiers

```
admin-system/
├── fxmanifest.lua          # Manifest FiveM
├── config.lua              # Configuration principale
├── permissions.lua         # Système de permissions
├── server.lua             # Logique serveur
├── client.lua             # Logique client
├── logger.lua             # Système de logs Discord
├── nui.js                 # Interface NUI (client)
├── html/
│   ├── index.html         # Interface HTML
│   ├── style.css          # Styles CSS modernes
│   └── script.js          # JavaScript interface
└── README.md              # Documentation
```

## 🛡️ Sécurité

### Protections implémentées
- ✅ **Vérification permissions** côté serveur
- ✅ **Rate limiting** anti-spam
- ✅ **Anti-spoof** identifiants
- ✅ **Validation données** côté serveur
- ✅ **Logs complets** toutes actions
- ✅ **Détection activités suspectes**

### Bonnes pratiques
- Toutes les actions critiques sont vérifiées côté serveur
- Aucune donnée sensible n'est envoyée au client
- Les permissions sont vérifiées à chaque action
- Les logs permettent un audit complet

## 🎨 Personnalisation

### Thèmes
Le système utilise des variables CSS pour faciliter la personnalisation :

```css
:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
}
```

### Ajout de fonctionnalités
1. Ajouter l'action dans `config.lua`
2. Implémenter la logique dans `server.lua`
3. Ajouter l'interface dans `html/script.js`

## 📞 Support

### Problèmes courants
- **Panel ne s'ouvre pas** : Vérifier les permissions ESX
- **Logs Discord non envoyés** : Vérifier les webhooks
- **Erreurs console** : Vérifier la configuration MySQL

### Debug
Activer le mode debug dans `config.lua` :
```lua
Config.Debug = true
```

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 🔄 Mises à jour

### Version 1.0.0
- ✅ Interface moderne complète
- ✅ Système de permissions avancé
- ✅ Logs Discord stylisés
- ✅ Protections anti-cheat
- ✅ Gestion complète des joueurs
- ✅ Système de reports
- ✅ Outils staff complets

---

**Développé avec ❤️ pour la communauté FiveM**