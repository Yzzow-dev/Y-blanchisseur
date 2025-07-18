Permissions = {}

-- Cache des permissions pour optimiser les performances
local permissionCache = {}
local rateLimitCache = {}

-- Fonction pour vérifier si un joueur est admin
function IsPlayerAdmin(source)
    if not source or source <= 0 then
        return false
    end
    
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then
        return false
    end
    
    local group = xPlayer.getGroup()
    return Config.Groups[group] and Config.Groups[group].level >= 50
end

-- Fonction pour obtenir le niveau d'un joueur
function GetPlayerLevel(source)
    if not source or source <= 0 then
        return 0
    end
    
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then
        return 0
    end
    
    local group = xPlayer.getGroup()
    return Config.Groups[group] and Config.Groups[group].level or 0
end

-- Fonction pour vérifier une permission spécifique
function HasPermission(source, permission)
    if not source or source <= 0 then
        return false
    end
    
    -- Vérifier le cache
    local cacheKey = source .. ':' .. permission
    if permissionCache[cacheKey] then
        if permissionCache[cacheKey].expires > GetGameTimer() then
            return permissionCache[cacheKey].result
        end
    end
    
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then
        return false
    end
    
    local group = xPlayer.getGroup()
    local groupConfig = Config.Groups[group]
    
    if not groupConfig then
        return false
    end
    
    -- Vérifier si le groupe a la permission 'all'
    if groupConfig.permissions and table.contains(groupConfig.permissions, 'all') then
        -- Mettre en cache
        permissionCache[cacheKey] = {
            result = true,
            expires = GetGameTimer() + 30000 -- 30 secondes
        }
        return true
    end
    
    -- Vérifier la permission spécifique
    local hasPermission = groupConfig.permissions and table.contains(groupConfig.permissions, permission)
    
    -- Mettre en cache
    permissionCache[cacheKey] = {
        result = hasPermission,
        expires = GetGameTimer() + 30000 -- 30 secondes
    }
    
    return hasPermission
end

-- Fonction pour vérifier si une cible est valide
function IsValidTarget(source, target)
    if not source or not target then
        return false
    end
    
    if source == target then
        return false -- Pas d'auto-ciblage
    end
    
    local sourceLevel = GetPlayerLevel(source)
    local targetLevel = GetPlayerLevel(target)
    
    -- Un admin ne peut pas cibler un admin de niveau supérieur ou égal
    if targetLevel >= sourceLevel and sourceLevel < 100 then
        return false
    end
    
    return true
end

-- Fonction de rate limiting
function CheckRateLimit(source, action)
    if not Config.Security.EnableRateLimit then
        return true
    end
    
    local currentTime = GetGameTimer()
    local playerId = tostring(source)
    
    if not rateLimitCache[playerId] then
        rateLimitCache[playerId] = {}
    end
    
    -- Nettoyer les anciennes entrées
    for actionName, data in pairs(rateLimitCache[playerId]) do
        if currentTime - data.lastAction > 60000 then -- 1 minute
            rateLimitCache[playerId][actionName] = nil
        end
    end
    
    if not rateLimitCache[playerId][action] then
        rateLimitCache[playerId][action] = {
            count = 0,
            lastAction = currentTime
        }
    end
    
    local actionData = rateLimitCache[playerId][action]
    
    -- Vérifier si l'action est trop rapide
    if currentTime - actionData.lastAction < Config.Security.RateLimitDelay then
        return false
    end
    
    -- Compter les actions dans la dernière minute
    if currentTime - actionData.lastAction < 60000 then
        actionData.count = actionData.count + 1
    else
        actionData.count = 1
    end
    
    actionData.lastAction = currentTime
    
    -- Vérifier le nombre maximum d'actions par minute
    if actionData.count > Config.Security.MaxActionsPerMinute then
        return false
    end
    
    return true
end

-- Fonction pour vérifier l'anti-spoof
function CheckAntiSpoof(source)
    if not Config.Security.EnableAntiSpoof then
        return true
    end
    
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then
        return false
    end
    
    -- Vérifier les identifiants du joueur
    local identifiers = GetPlayerIdentifiers(source)
    local steam = nil
    local license = nil
    
    for _, identifier in ipairs(identifiers) do
        if string.match(identifier, 'steam:') then
            steam = identifier
        elseif string.match(identifier, 'license:') then
            license = identifier
        end
    end
    
    -- Un joueur admin doit avoir au moins un Steam ou une licence
    if not steam and not license then
        return false
    end
    
    return true
end

-- Fonction pour nettoyer le cache périodiquement
function CleanupCache()
    local currentTime = GetGameTimer()
    
    -- Nettoyer le cache des permissions
    for key, data in pairs(permissionCache) do
        if data.expires < currentTime then
            permissionCache[key] = nil
        end
    end
    
    -- Nettoyer le cache de rate limiting
    for playerId, actions in pairs(rateLimitCache) do
        local hasActiveActions = false
        for actionName, data in pairs(actions) do
            if currentTime - data.lastAction < 60000 then
                hasActiveActions = true
                break
            end
        end
        
        if not hasActiveActions then
            rateLimitCache[playerId] = nil
        end
    end
end

-- Fonction utilitaire pour vérifier si une table contient une valeur
function table.contains(table, element)
    for _, value in pairs(table) do
        if value == element then
            return true
        end
    end
    return false
end

-- Fonction pour obtenir les informations d'un joueur
function GetPlayerInfo(source)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then
        return nil
    end
    
    local playerPed = GetPlayerPed(source)
    local coords = GetEntityCoords(playerPed)
    
    return {
        id = source,
        name = GetPlayerName(source),
        identifier = xPlayer.identifier,
        group = xPlayer.getGroup(),
        level = GetPlayerLevel(source),
        money = xPlayer.getMoney(),
        bank = xPlayer.getAccount('bank').money,
        job = xPlayer.job.name,
        jobGrade = xPlayer.job.grade,
        coords = {x = coords.x, y = coords.y, z = coords.z},
        ping = GetPlayerPing(source),
        playtime = xPlayer.get('playtime') or 0
    }
end

-- Fonction pour vérifier les permissions d'une action
function CanPerformAction(source, action, target)
    -- Vérifier si le joueur est admin
    if not IsPlayerAdmin(source) then
        return false, Config.Messages['no_permission']
    end
    
    -- Vérifier l'anti-spoof
    if not CheckAntiSpoof(source) then
        return false, Config.Messages['security_violation']
    end
    
    -- Vérifier le rate limiting
    if not CheckRateLimit(source, action) then
        return false, Config.Messages['rate_limit']
    end
    
    -- Vérifier la permission pour l'action
    local actionConfig = Config.Actions[action]
    if actionConfig and not HasPermission(source, actionConfig.permission) then
        return false, Config.Messages['no_permission']
    end
    
    -- Vérifier la cible si nécessaire
    if target and not IsValidTarget(source, target) then
        return false, Config.Messages['invalid_target']
    end
    
    return true, nil
end

-- Nettoyer le cache toutes les 5 minutes
if IsDuplicityVersion() then
    Citizen.CreateThread(function()
        while true do
            Citizen.Wait(300000) -- 5 minutes
            CleanupCache()
        end
    end)
end