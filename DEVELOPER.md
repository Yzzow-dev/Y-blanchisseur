# 🛠️ Documentation Développeur - Admin System

Cette documentation s'adresse aux développeurs souhaitant comprendre, modifier ou étendre le système d'administration.

## 📋 Architecture

### Vue d'ensemble
Le système suit une architecture client-serveur sécurisée :
- **Serveur (server.lua)** : Logique métier, sécurité, base de données
- **Client (client.lua)** : Interface utilisateur, outils staff
- **NUI (html/)** : Interface web moderne et responsive
- **Logs (logger.lua)** : Système de logs Discord centralisé

### Flux de données
```
Client (NUI) → Client (Lua) → Serveur (Lua) → Base de données
                                     ↓
                              Discord (Logs)
```

## 🔧 Structure des fichiers

### Fichiers principaux
- `fxmanifest.lua` - Manifest FiveM
- `config.lua` - Configuration globale
- `permissions.lua` - Système de permissions (shared)
- `server.lua` - Logique serveur
- `client.lua` - Logique client
- `logger.lua` - Système de logs Discord
- `nui.js` - Interface NUI côté client

### Interface NUI
- `html/index.html` - Structure HTML
- `html/style.css` - Styles CSS modernes
- `html/script.js` - JavaScript interface

## 🛡️ Sécurité

### Principes de sécurité
1. **Validation côté serveur** - Toutes les données sont validées côté serveur
2. **Vérification des permissions** - Chaque action vérifie les permissions
3. **Rate limiting** - Protection contre le spam d'actions
4. **Anti-spoof** - Vérification des identifiants joueurs
5. **Logs complets** - Toutes les actions sont loggées

### Exemple de vérification sécurisée
```lua
-- Dans server.lua
RegisterNetEvent('adminsystem:playerAction')
AddEventHandler('adminsystem:playerAction', function(action, targetId, data)
    local source = source
    
    -- 1. Vérifier les permissions
    local canPerform, errorMsg = CanPerformAction(source, action, targetId)
    if not canPerform then
        TriggerClientEvent('adminsystem:showNotification', source, 'error', errorMsg)
        return
    end
    
    -- 2. Vérifier la cible
    if targetId and not GetPlayerName(targetId) then
        return
    end
    
    -- 3. Exécuter l'action
    local success = ExecutePlayerAction(source, action, targetId, data)
    
    -- 4. Logger l'action
    if success then
        Logger.LogStaffAction(source, action, targetId, data)
    end
end)
```

## 🎨 Interface NUI

### Communication NUI ↔ Client
```javascript
// Envoyer une action au client
fetch(`https://${GetParentResourceName()}/playerAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        action: 'freeze',
        targetId: playerId
    })
});
```

```lua
-- Dans client.lua
RegisterNUICallback('playerAction', function(data, cb)
    TriggerServerEvent('adminsystem:playerAction', data.action, data.targetId, data.data)
    cb('ok')
end)
```

### Système de notifications
```javascript
function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    // Animation d'apparition
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Suppression automatique
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 5000);
}
```

## 📊 Système de permissions

### Structure des permissions
```lua
Config.Groups = {
    ['owner'] = {
        label = 'Propriétaire',
        level = 100,
        permissions = { 'all' }
    },
    ['admin'] = {
        label = 'Administrateur',
        level = 80,
        permissions = {
            'player.manage',
            'player.ban',
            'server.restart'
        }
    }
}
```

### Vérification des permissions
```lua
function HasPermission(source, permission)
    local xPlayer = ESX.GetPlayerFromId(source)
    local group = xPlayer.getGroup()
    local groupConfig = Config.Groups[group]
    
    -- Vérifier permission 'all'
    if groupConfig.permissions and table.contains(groupConfig.permissions, 'all') then
        return true
    end
    
    -- Vérifier permission spécifique
    return groupConfig.permissions and table.contains(groupConfig.permissions, permission)
end
```

## 📨 Système de logs Discord

### Structure des logs
```lua
function Logger.LogStaffAction(source, action, target, details)
    local staffInfo = GetPlayerInfo(source)
    local targetInfo = target and GetPlayerInfo(target) or nil
    
    local fields = {
        {
            name = "👤 Staff",
            value = string.format("**%s** (%s)", staffInfo.name, staffInfo.identifier),
            inline = true
        },
        {
            name = "🎯 Action",
            value = action,
            inline = true
        }
    }
    
    Logger.Send('admin', '🛠️ Action Staff', 
        string.format("Action **%s** effectuée", action), 
        fields, Config.Discord.Colors.Admin)
end
```

### Embeds Discord
```lua
local embed = {
    title = title,
    description = description,
    color = color,
    fields = fields,
    timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
    footer = {
        text = Config.Discord.ServerName .. " | Admin System",
        icon_url = Config.Discord.ServerIcon
    }
}
```

## 🔄 Ajout de nouvelles fonctionnalités

### 1. Ajouter une nouvelle action
```lua
-- Dans config.lua
Config.Actions['nouvelle_action'] = {
    permission = 'player.manage',
    log = true
}
```

### 2. Implémenter côté serveur
```lua
-- Dans server.lua, fonction ExecutePlayerAction
elseif action == 'nouvelle_action' then
    -- Logique de l'action
    return true
```

### 3. Ajouter l'interface
```javascript
// Dans html/script.js
function nouvelleAction(playerId) {
    fetch(`https://${GetParentResourceName()}/playerAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'nouvelle_action',
            targetId: playerId
        })
    });
}
```

### 4. Ajouter le bouton dans l'interface
```html
<!-- Dans html/index.html -->
<button class="btn btn-primary" onclick="nouvelleAction(${playerId})">
    <i class="fas fa-star"></i> Nouvelle Action
</button>
```

## 🎨 Personnalisation de l'interface

### Variables CSS
```css
:root {
    --primary-color: #2563eb;
    --primary-dark: #1d4ed8;
    --success-color: #10b981;
    --danger-color: #ef4444;
    --dark-bg: #0f172a;
    --dark-surface: #1e293b;
    --text-primary: #f8fafc;
}
```

### Ajout d'un nouvel onglet
```javascript
// Dans html/script.js
const tabs = [
    {id: 'dashboard', label: 'Tableau de bord', icon: 'fas fa-tachometer-alt'},
    {id: 'nouvel_onglet', label: 'Nouvel Onglet', icon: 'fas fa-star'}
];

function generateNouvelOngletContent() {
    return `
        <div class="tab-header">
            <h2><i class="fas fa-star"></i> Nouvel Onglet</h2>
        </div>
        <div class="content">
            <!-- Contenu de l'onglet -->
        </div>
    `;
}
```

## 🔍 Debugging

### Mode debug
```lua
-- Dans config.lua
Config.Debug = true
```

### Logs console
```lua
-- Dans server.lua
if Config.Debug then
    print("^3[Admin System] Debug: Action " .. action .. " par " .. GetPlayerName(source) .. "^0")
end
```

### Debugging NUI
```javascript
// Dans html/script.js
console.log('Admin System: Action exécutée', action, playerId);
```

## 📊 Base de données

### Tables automatiques
```sql
-- Table des bans
CREATE TABLE IF NOT EXISTS `bans` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `identifier` varchar(50) NOT NULL,
    `reason` text,
    `bannedBy` varchar(50) NOT NULL,
    `bannedAt` datetime NOT NULL,
    `expiresAt` datetime DEFAULT NULL,
    `permanent` tinyint(1) DEFAULT 0,
    `active` tinyint(1) DEFAULT 1,
    PRIMARY KEY (`id`)
);

-- Table des warnings
CREATE TABLE IF NOT EXISTS `warnings` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `identifier` varchar(50) NOT NULL,
    `reason` text,
    `warnedBy` varchar(50) NOT NULL,
    `warnedAt` datetime NOT NULL,
    PRIMARY KEY (`id`)
);
```

## 🚀 Optimisations

### Cache des permissions
```lua
local permissionCache = {}

function HasPermission(source, permission)
    local cacheKey = source .. ':' .. permission
    if permissionCache[cacheKey] then
        if permissionCache[cacheKey].expires > GetGameTimer() then
            return permissionCache[cacheKey].result
        end
    end
    
    -- Vérifier et mettre en cache
    local result = CheckPermission(source, permission)
    permissionCache[cacheKey] = {
        result = result,
        expires = GetGameTimer() + 30000
    }
    
    return result
end
```

### Rate limiting
```lua
local rateLimitCache = {}

function CheckRateLimit(source, action)
    local playerId = tostring(source)
    local currentTime = GetGameTimer()
    
    if not rateLimitCache[playerId] then
        rateLimitCache[playerId] = {}
    end
    
    local actionData = rateLimitCache[playerId][action]
    if not actionData then
        rateLimitCache[playerId][action] = {
            count = 1,
            lastAction = currentTime
        }
        return true
    end
    
    if currentTime - actionData.lastAction < Config.Security.RateLimitDelay then
        return false
    end
    
    actionData.count = actionData.count + 1
    actionData.lastAction = currentTime
    
    return actionData.count <= Config.Security.MaxActionsPerMinute
end
```

## 📝 Conventions de code

### Nommage
- **Variables** : camelCase (`currentPlayer`, `playerData`)
- **Fonctions** : PascalCase (`GetPlayerInfo`, `ExecuteAction`)
- **Constantes** : UPPER_SNAKE_CASE (`MAX_PLAYERS`, `DEFAULT_TIMEOUT`)
- **Events** : snake_case avec préfixe (`adminsystem:player_action`)

### Structure des fonctions
```lua
-- Fonction avec documentation
---@param source number ID du joueur
---@param action string Action à exécuter
---@param targetId number ID de la cible
---@return boolean success
function ExecutePlayerAction(source, action, targetId)
    -- Vérifications
    if not source or not action then
        return false
    end
    
    -- Logique
    local result = DoSomething(action, targetId)
    
    -- Retour
    return result
end
```

## 🧪 Tests

### Tests unitaires
```lua
-- test_permissions.lua
function TestPermissions()
    local testCases = {
        {source = 1, permission = 'player.manage', expected = true},
        {source = 2, permission = 'server.restart', expected = false}
    }
    
    for _, test in ipairs(testCases) do
        local result = HasPermission(test.source, test.permission)
        assert(result == test.expected, "Test échoué pour " .. test.permission)
    end
    
    print("^2[Admin System] Tests permissions réussis^0")
end
```

### Tests d'intégration
```lua
-- test_integration.lua
function TestPlayerActions()
    local success = ExecutePlayerAction(1, 'freeze', 2)
    assert(success, "Action freeze échouée")
    
    print("^2[Admin System] Tests intégration réussis^0")
end
```

## 📚 Ressources utiles

### Documentation FiveM
- [FiveM Natives](https://docs.fivem.net/natives/)
- [FiveM Scripting](https://docs.fivem.net/docs/scripting-manual/)
- [NUI Development](https://docs.fivem.net/docs/scripting-manual/nui-development/)

### Outils de développement
- [Visual Studio Code](https://code.visualstudio.com/)
- [Lua Language Server](https://marketplace.visualstudio.com/items?itemName=sumneko.lua)
- [FiveM Development Tools](https://marketplace.visualstudio.com/items?itemName=overextended.cfxlua)

---

**Cette documentation est maintenue par l'équipe de développement. N'hésitez pas à contribuer !**