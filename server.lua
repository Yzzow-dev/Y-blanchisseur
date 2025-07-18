ESX = nil
TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)

-- Variables globales
local AdminSystem = {}
local OnlinePlayers = {}
local Reports = {}
local Bans = {}
local Warnings = {}
local ServerStats = {
    startTime = os.time(),
    totalConnections = 0,
    staffActions = 0,
    reportsHandled = 0
}

-- Initialisation
Citizen.CreateThread(function()
    while ESX == nil do
        Citizen.Wait(0)
    end
    
    print("^2[Admin System] Système d'administration chargé avec succès^0")
    
    -- Charger les données depuis la base de données
    LoadBansFromDatabase()
    LoadWarningsFromDatabase()
    
    -- Démarrer les threads de surveillance
    StartMonitoringThreads()
end)

-- Fonction pour charger les bans depuis la base de données
function LoadBansFromDatabase()
    MySQL.Async.fetchAll('SELECT * FROM bans WHERE active = 1', {}, function(result)
        for _, ban in ipairs(result) do
            Bans[ban.identifier] = {
                identifier = ban.identifier,
                reason = ban.reason,
                bannedBy = ban.bannedBy,
                bannedAt = ban.bannedAt,
                expiresAt = ban.expiresAt,
                permanent = ban.permanent == 1
            }
        end
        print("^2[Admin System] " .. #result .. " bans chargés depuis la base de données^0")
    end)
end

-- Fonction pour charger les warnings depuis la base de données
function LoadWarningsFromDatabase()
    MySQL.Async.fetchAll('SELECT * FROM warnings', {}, function(result)
        for _, warning in ipairs(result) do
            if not Warnings[warning.identifier] then
                Warnings[warning.identifier] = {}
            end
            table.insert(Warnings[warning.identifier], {
                reason = warning.reason,
                warnedBy = warning.warnedBy,
                warnedAt = warning.warnedAt
            })
        end
        print("^2[Admin System] " .. #result .. " warnings chargés depuis la base de données^0")
    end)
end

-- Threads de surveillance
function StartMonitoringThreads()
    -- Thread pour surveiller les joueurs en ligne
    Citizen.CreateThread(function()
        while true do
            Citizen.Wait(5000) -- 5 secondes
            
            local players = GetPlayers()
            OnlinePlayers = {}
            
            for _, playerId in ipairs(players) do
                local playerInfo = GetPlayerInfo(playerId)
                if playerInfo then
                    OnlinePlayers[playerId] = playerInfo
                end
            end
        end
    end)
    
    -- Thread pour nettoyer les reports expirés
    Citizen.CreateThread(function()
        while true do
            Citizen.Wait(300000) -- 5 minutes
            
            local currentTime = os.time()
            for reportId, report in pairs(Reports) do
                if currentTime - report.timestamp > 3600 then -- 1 heure
                    Reports[reportId] = nil
                end
            end
        end
    end)
end

-- Events côté client
RegisterNetEvent('adminsystem:requestOpen')
AddEventHandler('adminsystem:requestOpen', function()
    local source = source
    
    -- Vérifier les permissions
    if not IsPlayerAdmin(source) then
        TriggerClientEvent('adminsystem:showNotification', source, 'error', Config.Messages['no_permission'])
        Logger.LogSecurity(source, 'Tentative d\'ouverture du panel admin sans permission')
        return
    end
    
    -- Vérifier l'anti-spoof
    if not CheckAntiSpoof(source) then
        DropPlayer(source, 'Violation de sécurité détectée')
        Logger.LogSecurity(source, 'Anti-spoof échoué lors de l\'ouverture du panel')
        return
    end
    
    -- Envoyer les données au client
    TriggerClientEvent('adminsystem:openPanel', source, {
        playerInfo = GetPlayerInfo(source),
        onlinePlayers = OnlinePlayers,
        reports = Reports,
        serverStats = GetServerStats(),
        permissions = GetPlayerPermissions(source)
    })
    
    Logger.LogStaffAction(source, 'Ouverture du panel admin')
end)

-- Gestion des joueurs
RegisterNetEvent('adminsystem:playerAction')
AddEventHandler('adminsystem:playerAction', function(action, targetId, data)
    local source = source
    
    -- Vérifications de sécurité
    local canPerform, errorMsg = CanPerformAction(source, action, targetId)
    if not canPerform then
        TriggerClientEvent('adminsystem:showNotification', source, 'error', errorMsg)
        if errorMsg == Config.Messages['security_violation'] then
            DropPlayer(source, 'Violation de sécurité détectée')
        end
        return
    end
    
    -- Vérifier que la cible existe
    if targetId and not GetPlayerName(targetId) then
        TriggerClientEvent('adminsystem:showNotification', source, 'error', Config.Messages['player_not_found'])
        return
    end
    
    -- Exécuter l'action
    local success = ExecutePlayerAction(source, action, targetId, data)
    
    if success then
        TriggerClientEvent('adminsystem:showNotification', source, 'success', Config.Messages['action_success'])
        
        -- Logger l'action si nécessaire
        local actionConfig = Config.Actions[action]
        if actionConfig and actionConfig.log then
            Logger.LogStaffAction(source, action, targetId, data and data.reason or nil)
        end
        
        -- Mettre à jour les statistiques
        ServerStats.staffActions = ServerStats.staffActions + 1
        
        -- Notifier les autres admins si nécessaire
        if action == 'ban' or action == 'kick' or action == 'tempban' then
            NotifyAllAdmins(source, action, targetId, data)
        end
    else
        TriggerClientEvent('adminsystem:showNotification', source, 'error', Config.Messages['action_failed'])
    end
end)

-- Fonction pour exécuter une action sur un joueur
function ExecutePlayerAction(source, action, targetId, data)
    local targetPlayer = ESX.GetPlayerFromId(targetId)
    
    if not targetPlayer and action ~= 'unban' then
        return false
    end
    
    if action == 'freeze' then
        TriggerClientEvent('adminsystem:freezePlayer', targetId, true)
        return true
        
    elseif action == 'unfreeze' then
        TriggerClientEvent('adminsystem:freezePlayer', targetId, false)
        return true
        
    elseif action == 'spectate' then
        TriggerClientEvent('adminsystem:spectatePlayer', source, targetId)
        return true
        
    elseif action == 'revive' then
        TriggerClientEvent('adminsystem:revivePlayer', targetId)
        return true
        
    elseif action == 'heal' then
        TriggerClientEvent('adminsystem:healPlayer', targetId)
        return true
        
    elseif action == 'goto' then
        TriggerClientEvent('adminsystem:gotoPlayer', source, targetId)
        return true
        
    elseif action == 'bring' then
        TriggerClientEvent('adminsystem:bringPlayer', targetId, source)
        return true
        
    elseif action == 'kick' then
        DropPlayer(targetId, data.reason or 'Vous avez été expulsé par un administrateur')
        return true
        
    elseif action == 'ban' then
        return BanPlayer(targetId, source, data.reason, data.permanent)
        
    elseif action == 'tempban' then
        return TempBanPlayer(targetId, source, data.reason, data.duration)
        
    elseif action == 'unban' then
        return UnbanPlayer(data.identifier, source)
        
    elseif action == 'warn' then
        return WarnPlayer(targetId, source, data.reason)
        
    elseif action == 'givemoney' then
        if data.amount and data.amount > 0 and data.amount <= 1000000 then
            if data.type == 'cash' then
                targetPlayer.addMoney(data.amount)
            elseif data.type == 'bank' then
                targetPlayer.addAccountMoney('bank', data.amount)
            end
            return true
        end
        return false
        
    elseif action == 'setjob' then
        if data.job and data.grade then
            targetPlayer.setJob(data.job, data.grade)
            return true
        end
        return false
    end
    
    return false
end

-- Fonction pour bannir un joueur
function BanPlayer(targetId, staffId, reason, permanent)
    local targetPlayer = ESX.GetPlayerFromId(targetId)
    if not targetPlayer then
        return false
    end
    
    local identifier = targetPlayer.identifier
    local staffPlayer = ESX.GetPlayerFromId(staffId)
    
    -- Ajouter le ban à la base de données
    MySQL.Async.execute('INSERT INTO bans (identifier, reason, bannedBy, bannedAt, permanent, active) VALUES (?, ?, ?, ?, ?, ?)', {
        identifier,
        reason or 'Aucune raison spécifiée',
        staffPlayer.identifier,
        os.date('%Y-%m-%d %H:%M:%S'),
        permanent and 1 or 0,
        1
    })
    
    -- Ajouter au cache
    Bans[identifier] = {
        identifier = identifier,
        reason = reason,
        bannedBy = staffPlayer.identifier,
        bannedAt = os.time(),
        permanent = permanent
    }
    
    -- Kicker le joueur
    DropPlayer(targetId, 'Vous avez été banni du serveur. Raison: ' .. (reason or 'Aucune raison spécifiée'))
    
    -- Logger
    Logger.LogSanction(staffId, targetId, permanent and 'Ban permanent' or 'Ban temporaire', reason)
    
    return true
end

-- Fonction pour bannir temporairement un joueur
function TempBanPlayer(targetId, staffId, reason, duration)
    local targetPlayer = ESX.GetPlayerFromId(targetId)
    if not targetPlayer then
        return false
    end
    
    local identifier = targetPlayer.identifier
    local staffPlayer = ESX.GetPlayerFromId(staffId)
    local expiresAt = os.time() + (duration * 3600) -- duration en heures
    
    -- Ajouter le ban à la base de données
    MySQL.Async.execute('INSERT INTO bans (identifier, reason, bannedBy, bannedAt, expiresAt, permanent, active) VALUES (?, ?, ?, ?, ?, ?, ?)', {
        identifier,
        reason or 'Aucune raison spécifiée',
        staffPlayer.identifier,
        os.date('%Y-%m-%d %H:%M:%S'),
        os.date('%Y-%m-%d %H:%M:%S', expiresAt),
        0,
        1
    })
    
    -- Ajouter au cache
    Bans[identifier] = {
        identifier = identifier,
        reason = reason,
        bannedBy = staffPlayer.identifier,
        bannedAt = os.time(),
        expiresAt = expiresAt,
        permanent = false
    }
    
    -- Kicker le joueur
    DropPlayer(targetId, 'Vous avez été banni temporairement. Raison: ' .. (reason or 'Aucune raison spécifiée') .. '. Durée: ' .. duration .. ' heures')
    
    -- Logger
    Logger.LogSanction(staffId, targetId, 'Ban temporaire', reason, duration .. ' heures')
    
    return true
end

-- Fonction pour débannir un joueur
function UnbanPlayer(identifier, staffId)
    if not Bans[identifier] then
        return false
    end
    
    -- Supprimer de la base de données
    MySQL.Async.execute('UPDATE bans SET active = 0 WHERE identifier = ?', {identifier})
    
    -- Supprimer du cache
    Bans[identifier] = nil
    
    -- Logger
    Logger.LogStaffAction(staffId, 'Unban', nil, 'Identifier: ' .. identifier)
    
    return true
end

-- Fonction pour avertir un joueur
function WarnPlayer(targetId, staffId, reason)
    local targetPlayer = ESX.GetPlayerFromId(targetId)
    if not targetPlayer then
        return false
    end
    
    local identifier = targetPlayer.identifier
    local staffPlayer = ESX.GetPlayerFromId(staffId)
    
    -- Ajouter à la base de données
    MySQL.Async.execute('INSERT INTO warnings (identifier, reason, warnedBy, warnedAt) VALUES (?, ?, ?, ?)', {
        identifier,
        reason or 'Aucune raison spécifiée',
        staffPlayer.identifier,
        os.date('%Y-%m-%d %H:%M:%S')
    })
    
    -- Ajouter au cache
    if not Warnings[identifier] then
        Warnings[identifier] = {}
    end
    
    table.insert(Warnings[identifier], {
        reason = reason,
        warnedBy = staffPlayer.identifier,
        warnedAt = os.time()
    })
    
    -- Notifier le joueur
    TriggerClientEvent('adminsystem:showNotification', targetId, 'warning', 'Vous avez reçu un avertissement: ' .. (reason or 'Aucune raison spécifiée'))
    
    -- Logger
    Logger.LogSanction(staffId, targetId, 'Avertissement', reason)
    
    return true
end

-- Gestion des reports
RegisterNetEvent('adminsystem:createReport')
AddEventHandler('adminsystem:createReport', function(reportData)
    local source = source
    
    -- Vérifier les données
    if not reportData.reason or reportData.reason == '' then
        TriggerClientEvent('adminsystem:showNotification', source, 'error', 'Vous devez spécifier une raison')
        return
    end
    
    -- Créer le report
    local reportId = #Reports + 1
    Reports[reportId] = {
        id = reportId,
        playerId = source,
        playerName = GetPlayerName(source),
        reason = reportData.reason,
        timestamp = os.time(),
        status = 'pending',
        handledBy = nil
    }
    
    -- Notifier tous les admins
    for _, playerId in ipairs(GetPlayers()) do
        if IsPlayerAdmin(playerId) then
            TriggerClientEvent('adminsystem:newReport', playerId, Reports[reportId])
        end
    end
    
    TriggerClientEvent('adminsystem:showNotification', source, 'success', 'Votre report a été envoyé aux administrateurs')
    
    -- Logger
    Logger.LogPlayerAction(source, 'Création de report', reportData.reason)
end)

RegisterNetEvent('adminsystem:handleReport')
AddEventHandler('adminsystem:handleReport', function(reportId, action, response)
    local source = source
    
    -- Vérifier les permissions
    if not HasPermission(source, 'reports.manage') then
        TriggerClientEvent('adminsystem:showNotification', source, 'error', Config.Messages['no_permission'])
        return
    end
    
    local report = Reports[reportId]
    if not report then
        TriggerClientEvent('adminsystem:showNotification', source, 'error', 'Report introuvable')
        return
    end
    
    if action == 'handle' then
        report.status = 'handled'
        report.handledBy = source
        report.response = response
        
        -- Notifier le joueur qui a fait le report
        if GetPlayerName(report.playerId) then
            TriggerClientEvent('adminsystem:showNotification', report.playerId, 'info', 'Votre report a été traité: ' .. (response or 'Aucune réponse'))
        end
        
        ServerStats.reportsHandled = ServerStats.reportsHandled + 1
        
    elseif action == 'dismiss' then
        Reports[reportId] = nil
    end
    
    -- Logger
    Logger.LogStaffAction(source, 'Gestion de report', report.playerId, 'Action: ' .. action .. (response and ' - Réponse: ' .. response or ''))
end)

-- Outils staff
RegisterNetEvent('adminsystem:toggleTool')
AddEventHandler('adminsystem:toggleTool', function(tool)
    local source = source
    
    -- Vérifier les permissions
    local canPerform, errorMsg = CanPerformAction(source, tool)
    if not canPerform then
        TriggerClientEvent('adminsystem:showNotification', source, 'error', errorMsg)
        return
    end
    
    if tool == 'noclip' then
        TriggerClientEvent('adminsystem:toggleNoclip', source)
    elseif tool == 'cloak' then
        TriggerClientEvent('adminsystem:toggleCloak', source)
    end
    
    -- Logger si nécessaire
    local actionConfig = Config.Actions[tool]
    if actionConfig and actionConfig.log then
        Logger.LogStaffAction(source, 'Toggle ' .. tool)
    end
end)

-- Contrôle serveur
RegisterNetEvent('adminsystem:serverAction')
AddEventHandler('adminsystem:serverAction', function(action, data)
    local source = source
    
    -- Vérifier les permissions
    local canPerform, errorMsg = CanPerformAction(source, action)
    if not canPerform then
        TriggerClientEvent('adminsystem:showNotification', source, 'error', errorMsg)
        return
    end
    
    if action == 'restart' then
        Logger.LogRestart(source, data.type or 'Manuel', data.reason)
        
        -- Notifier tous les joueurs
        TriggerClientEvent('chatMessage', -1, '^1[SERVEUR]', {255, 0, 0}, 'Redémarrage du serveur dans 30 secondes...')
        
        -- Programmer le redémarrage
        Citizen.SetTimeout(30000, function()
            ExecuteCommand('quit')
        end)
        
    elseif action == 'announce' then
        if data.message then
            TriggerClientEvent('chatMessage', -1, '^3[ADMIN]', {255, 165, 0}, data.message)
            Logger.LogStaffAction(source, 'Annonce serveur', nil, data.message)
        end
    end
end)

-- Fonction pour obtenir les statistiques du serveur
function GetServerStats()
    local currentTime = os.time()
    local uptime = currentTime - ServerStats.startTime
    
    return {
        uptime = uptime,
        playersOnline = #GetPlayers(),
        maxPlayers = GetConvarInt('sv_maxclients', 32),
        totalConnections = ServerStats.totalConnections,
        staffActions = ServerStats.staffActions,
        reportsHandled = ServerStats.reportsHandled,
        activeBans = GetTableLength(Bans),
        activeReports = GetTableLength(Reports)
    }
end

-- Fonction pour obtenir les permissions d'un joueur
function GetPlayerPermissions(source)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then
        return {}
    end
    
    local group = xPlayer.getGroup()
    local groupConfig = Config.Groups[group]
    
    return {
        group = group,
        level = groupConfig and groupConfig.level or 0,
        permissions = groupConfig and groupConfig.permissions or {}
    }
end

-- Fonction pour notifier tous les admins
function NotifyAllAdmins(source, action, targetId, data)
    local staffName = GetPlayerName(source)
    local targetName = GetPlayerName(targetId)
    local message = string.format('%s a %s %s', staffName, action, targetName)
    
    if data and data.reason then
        message = message .. ' (Raison: ' .. data.reason .. ')'
    end
    
    for _, playerId in ipairs(GetPlayers()) do
        if IsPlayerAdmin(playerId) and playerId ~= source then
            TriggerClientEvent('adminsystem:showNotification', playerId, 'info', message)
        end
    end
end

-- Fonction utilitaire pour obtenir la longueur d'une table
function GetTableLength(table)
    local count = 0
    for _ in pairs(table) do
        count = count + 1
    end
    return count
end

-- Events de connexion/déconnexion
RegisterNetEvent('esx:playerLoaded')
AddEventHandler('esx:playerLoaded', function(source)
    ServerStats.totalConnections = ServerStats.totalConnections + 1
    
    -- Vérifier si le joueur est banni
    local xPlayer = ESX.GetPlayerFromId(source)
    if xPlayer then
        local ban = Bans[xPlayer.identifier]
        if ban then
            if ban.permanent or (ban.expiresAt and ban.expiresAt > os.time()) then
                DropPlayer(source, 'Vous êtes banni du serveur. Raison: ' .. ban.reason)
                return
            else
                -- Ban expiré, le supprimer
                Bans[xPlayer.identifier] = nil
                MySQL.Async.execute('UPDATE bans SET active = 0 WHERE identifier = ?', {xPlayer.identifier})
            end
        end
    end
    
    Logger.LogConnection(source, 'Connexion')
end)

AddEventHandler('playerDropped', function(reason)
    local source = source
    Logger.LogConnection(source, 'Déconnexion', reason)
end)

-- Commandes chat
RegisterCommand('admin', function(source, args, rawCommand)
    if source == 0 then
        print('Cette commande ne peut pas être utilisée depuis la console')
        return
    end
    
    TriggerEvent('adminsystem:requestOpen', source)
end, false)

RegisterCommand('report', function(source, args, rawCommand)
    if source == 0 then
        print('Cette commande ne peut pas être utilisée depuis la console')
        return
    end
    
    local reason = table.concat(args, ' ')
    if reason == '' then
        TriggerClientEvent('adminsystem:showNotification', source, 'error', 'Usage: /report <raison>')
        return
    end
    
    TriggerEvent('adminsystem:createReport', {reason = reason})
end, false)

-- Initialisation des tables de base de données
MySQL.ready(function()
    MySQL.Async.execute([[
        CREATE TABLE IF NOT EXISTS `bans` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `identifier` varchar(50) NOT NULL,
            `reason` text,
            `bannedBy` varchar(50) NOT NULL,
            `bannedAt` datetime NOT NULL,
            `expiresAt` datetime DEFAULT NULL,
            `permanent` tinyint(1) DEFAULT 0,
            `active` tinyint(1) DEFAULT 1,
            PRIMARY KEY (`id`),
            KEY `identifier` (`identifier`),
            KEY `active` (`active`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ]])
    
    MySQL.Async.execute([[
        CREATE TABLE IF NOT EXISTS `warnings` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `identifier` varchar(50) NOT NULL,
            `reason` text,
            `warnedBy` varchar(50) NOT NULL,
            `warnedAt` datetime NOT NULL,
            PRIMARY KEY (`id`),
            KEY `identifier` (`identifier`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ]])
    
    print("^2[Admin System] Tables de base de données initialisées^0")
end)