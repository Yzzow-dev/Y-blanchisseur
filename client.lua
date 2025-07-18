ESX = nil
local AdminPanel = {
    isOpen = false,
    isNoclip = false,
    isCloak = false,
    isSpectating = false,
    spectateTarget = nil,
    frozenPlayers = {}
}

-- Initialisation ESX
Citizen.CreateThread(function()
    while ESX == nil do
        TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
        Citizen.Wait(0)
    end
end)

-- Gestion des touches
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        
        -- Ouvrir le panel admin
        if IsControlJustPressed(0, 167) then -- F6
            if not AdminPanel.isOpen then
                TriggerServerEvent('adminsystem:requestOpen')
            end
        end
        
        -- Fermer le panel admin
        if IsControlJustPressed(0, 177) then -- ESCAPE
            if AdminPanel.isOpen then
                CloseAdminPanel()
            end
        end
        
        -- Gestion du noclip
        if AdminPanel.isNoclip then
            HandleNoclip()
        end
        
        -- Gestion du mode spectate
        if AdminPanel.isSpectating then
            HandleSpectate()
        end
    end
end)

-- Events serveur
RegisterNetEvent('adminsystem:openPanel')
AddEventHandler('adminsystem:openPanel', function(data)
    OpenAdminPanel(data)
end)

RegisterNetEvent('adminsystem:showNotification')
AddEventHandler('adminsystem:showNotification', function(type, message)
    ShowNotification(type, message)
end)

RegisterNetEvent('adminsystem:newReport')
AddEventHandler('adminsystem:newReport', function(report)
    if AdminPanel.isOpen then
        SendNUIMessage({
            type = 'newReport',
            report = report
        })
    end
    
    ShowNotification('info', 'Nouveau report de ' .. report.playerName)
end)

-- Actions sur les joueurs
RegisterNetEvent('adminsystem:freezePlayer')
AddEventHandler('adminsystem:freezePlayer', function(freeze)
    local playerPed = PlayerPedId()
    SetEntityInvincible(playerPed, freeze)
    FreezeEntityPosition(playerPed, freeze)
    
    if freeze then
        ShowNotification('warning', 'Vous avez été figé par un administrateur')
    else
        ShowNotification('success', 'Vous avez été défigé')
    end
end)

RegisterNetEvent('adminsystem:revivePlayer')
AddEventHandler('adminsystem:revivePlayer', function()
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    
    NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z, 0.0, true, false)
    SetPlayerInvincible(PlayerId(), false)
    ClearPedBloodDamage(playerPed)
    
    ShowNotification('success', 'Vous avez été réanimé par un administrateur')
end)

RegisterNetEvent('adminsystem:healPlayer')
AddEventHandler('adminsystem:healPlayer', function()
    local playerPed = PlayerPedId()
    SetEntityHealth(playerPed, GetEntityMaxHealth(playerPed))
    SetPedArmour(playerPed, 100)
    ClearPedBloodDamage(playerPed)
    
    ShowNotification('success', 'Vous avez été soigné par un administrateur')
end)

RegisterNetEvent('adminsystem:gotoPlayer')
AddEventHandler('adminsystem:gotoPlayer', function(targetId)
    local targetPed = GetPlayerPed(GetPlayerFromServerId(targetId))
    local targetCoords = GetEntityCoords(targetPed)
    
    SetEntityCoords(PlayerPedId(), targetCoords.x, targetCoords.y, targetCoords.z)
    ShowNotification('success', 'Téléportation vers le joueur')
end)

RegisterNetEvent('adminsystem:bringPlayer')
AddEventHandler('adminsystem:bringPlayer', function(staffId)
    local staffPed = GetPlayerPed(GetPlayerFromServerId(staffId))
    local staffCoords = GetEntityCoords(staffPed)
    
    SetEntityCoords(PlayerPedId(), staffCoords.x, staffCoords.y, staffCoords.z)
    ShowNotification('info', 'Vous avez été téléporté vers un administrateur')
end)

-- Outils staff
RegisterNetEvent('adminsystem:toggleNoclip')
AddEventHandler('adminsystem:toggleNoclip', function()
    AdminPanel.isNoclip = not AdminPanel.isNoclip
    
    local playerPed = PlayerPedId()
    SetEntityInvincible(playerPed, AdminPanel.isNoclip)
    SetEntityVisible(playerPed, not AdminPanel.isNoclip, 0)
    
    ShowNotification('info', AdminPanel.isNoclip and 'Noclip activé' or 'Noclip désactivé')
end)

RegisterNetEvent('adminsystem:toggleCloak')
AddEventHandler('adminsystem:toggleCloak', function()
    AdminPanel.isCloak = not AdminPanel.isCloak
    
    local playerPed = PlayerPedId()
    local playerId = PlayerId()
    
    if AdminPanel.isCloak then
        SetEntityInvincible(playerPed, true)
        SetEntityVisible(playerPed, false, 0)
        SetPlayerInvincible(playerId, true)
        SetEntityAlpha(playerPed, 0, false)
        
        -- Désactiver les blips
        SetPlayerCanBeHassledByGangs(playerId, false)
        SetPlayerCanUseCover(playerId, false)
        
        ShowNotification('info', 'Mode invisible activé')
    else
        SetEntityInvincible(playerPed, false)
        SetEntityVisible(playerPed, true, 0)
        SetPlayerInvincible(playerId, false)
        SetEntityAlpha(playerPed, 255, false)
        
        -- Réactiver les blips
        SetPlayerCanBeHassledByGangs(playerId, true)
        SetPlayerCanUseCover(playerId, true)
        
        ShowNotification('info', 'Mode invisible désactivé')
    end
end)

RegisterNetEvent('adminsystem:spectatePlayer')
AddEventHandler('adminsystem:spectatePlayer', function(targetId)
    if AdminPanel.isSpectating and AdminPanel.spectateTarget == targetId then
        -- Arrêter le spectate
        StopSpectating()
    else
        -- Commencer le spectate
        StartSpectating(targetId)
    end
end)

-- Fonctions principales
function OpenAdminPanel(data)
    AdminPanel.isOpen = true
    SetNuiFocus(true, true)
    
    SendNUIMessage({
        type = 'openPanel',
        data = data
    })
end

function CloseAdminPanel()
    AdminPanel.isOpen = false
    SetNuiFocus(false, false)
    
    SendNUIMessage({
        type = 'closePanel'
    })
end

function ShowNotification(type, message)
    SendNUIMessage({
        type = 'notification',
        notificationType = type,
        message = message
    })
end

-- Gestion du noclip
function HandleNoclip()
    local playerPed = PlayerPedId()
    local x, y, z = table.unpack(GetEntityCoords(playerPed))
    local dx, dy, dz = GetCamDirection()
    local speed = Config.Tools.NoClip.Speed
    
    -- Vitesse rapide
    if IsControlPressed(0, 21) then -- Left Shift
        speed = Config.Tools.NoClip.FastSpeed
    end
    
    -- Super vitesse
    if IsControlPressed(0, 19) then -- Alt
        speed = Config.Tools.NoClip.SuperSpeed
    end
    
    -- Mouvements
    if IsControlPressed(0, 32) then -- W
        x = x + dx * speed
        y = y + dy * speed
        z = z + dz * speed
    end
    
    if IsControlPressed(0, 33) then -- S
        x = x - dx * speed
        y = y - dy * speed
        z = z - dz * speed
    end
    
    if IsControlPressed(0, 34) then -- A
        x = x + (-dy) * speed
        y = y + dx * speed
    end
    
    if IsControlPressed(0, 35) then -- D
        x = x - (-dy) * speed
        y = y - dx * speed
    end
    
    if IsControlPressed(0, 44) then -- Q
        z = z - speed
    end
    
    if IsControlPressed(0, 38) then -- E
        z = z + speed
    end
    
    SetEntityCoordsNoOffset(playerPed, x, y, z, true, true, true)
end

function GetCamDirection()
    local heading = GetGameplayCamRelativeHeading() + GetEntityHeading(PlayerPedId())
    local pitch = GetGameplayCamRelativePitch()
    
    local x = -math.sin(heading * math.pi / 180.0)
    local y = math.cos(heading * math.pi / 180.0)
    local z = math.sin(pitch * math.pi / 180.0)
    
    local len = math.sqrt(x * x + y * y + z * z)
    if len ~= 0 then
        x = x / len
        y = y / len
        z = z / len
    end
    
    return x, y, z
end

-- Gestion du spectate
function StartSpectating(targetId)
    AdminPanel.isSpectating = true
    AdminPanel.spectateTarget = targetId
    
    local targetPed = GetPlayerPed(GetPlayerFromServerId(targetId))
    local targetName = GetPlayerName(GetPlayerFromServerId(targetId))
    
    NetworkSetInSpectatorMode(true, targetPed)
    ShowNotification('info', 'Spectate de ' .. targetName .. ' activé')
end

function StopSpectating()
    AdminPanel.isSpectating = false
    AdminPanel.spectateTarget = nil
    
    NetworkSetInSpectatorMode(false, PlayerPedId())
    ShowNotification('info', 'Spectate désactivé')
end

function HandleSpectate()
    -- Afficher les informations du joueur spectate
    if AdminPanel.spectateTarget then
        local targetPed = GetPlayerPed(GetPlayerFromServerId(AdminPanel.spectateTarget))
        local targetName = GetPlayerName(GetPlayerFromServerId(AdminPanel.spectateTarget))
        local targetCoords = GetEntityCoords(targetPed)
        local targetHealth = GetEntityHealth(targetPed)
        local targetArmour = GetPedArmour(targetPed)
        
        -- Afficher les informations à l'écran
        SetTextFont(4)
        SetTextProportional(1)
        SetTextScale(0.45, 0.45)
        SetTextColour(255, 255, 255, 255)
        SetTextDropShadow(0, 0, 0, 0, 255)
        SetTextEdge(1, 0, 0, 0, 255)
        SetTextDropShadow()
        SetTextOutline()
        SetTextEntry("STRING")
        
        local infoText = string.format(
            "Spectate: %s\nSanté: %d/%d\nArmure: %d\nPosition: %.1f, %.1f, %.1f",
            targetName,
            targetHealth,
            GetEntityMaxHealth(targetPed),
            targetArmour,
            targetCoords.x,
            targetCoords.y,
            targetCoords.z
        )
        
        AddTextComponentString(infoText)
        DrawText(0.02, 0.02)
    end
end

-- Callbacks NUI
RegisterNUICallback('closePanel', function(data, cb)
    CloseAdminPanel()
    cb('ok')
end)

RegisterNUICallback('playerAction', function(data, cb)
    TriggerServerEvent('adminsystem:playerAction', data.action, data.targetId, data.data)
    cb('ok')
end)

RegisterNUICallback('handleReport', function(data, cb)
    TriggerServerEvent('adminsystem:handleReport', data.reportId, data.action, data.response)
    cb('ok')
end)

RegisterNUICallback('toggleTool', function(data, cb)
    TriggerServerEvent('adminsystem:toggleTool', data.tool)
    cb('ok')
end)

RegisterNUICallback('serverAction', function(data, cb)
    TriggerServerEvent('adminsystem:serverAction', data.action, data.data)
    cb('ok')
end)

RegisterNUICallback('createReport', function(data, cb)
    TriggerServerEvent('adminsystem:createReport', data)
    cb('ok')
end)

RegisterNUICallback('refreshData', function(data, cb)
    TriggerServerEvent('adminsystem:requestOpen')
    cb('ok')
end)

-- Blips des joueurs pour les admins
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1000)
        
        if AdminPanel.isOpen or AdminPanel.isCloak then
            local players = GetActivePlayers()
            
            for _, player in ipairs(players) do
                if player ~= PlayerId() then
                    local playerPed = GetPlayerPed(player)
                    local playerCoords = GetEntityCoords(playerPed)
                    local playerName = GetPlayerName(player)
                    
                    -- Créer un blip pour le joueur
                    local blip = GetBlipFromEntity(playerPed)
                    if not DoesBlipExist(blip) then
                        blip = AddBlipForEntity(playerPed)
                        SetBlipSprite(blip, 1)
                        SetBlipColour(blip, 0)
                        SetBlipScale(blip, 0.8)
                        SetBlipAsShortRange(blip, true)
                        BeginTextCommandSetBlipName("STRING")
                        AddTextComponentString(playerName)
                        EndTextCommandSetBlipName(blip)
                    end
                end
            end
        end
    end
end)

-- Commandes de test
RegisterCommand('admintoggle', function()
    if AdminPanel.isOpen then
        CloseAdminPanel()
    else
        TriggerServerEvent('adminsystem:requestOpen')
    end
end, false)

RegisterCommand('noclip', function()
    TriggerServerEvent('adminsystem:toggleTool', 'noclip')
end, false)

RegisterCommand('cloak', function()
    TriggerServerEvent('adminsystem:toggleTool', 'cloak')
end, false)

-- Désactiver les contrôles quand le panel est ouvert
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        
        if AdminPanel.isOpen then
            DisableControlAction(0, 1, true) -- LookLeftRight
            DisableControlAction(0, 2, true) -- LookUpDown
            DisableControlAction(0, 142, true) -- MeleeAttackAlternate
            DisableControlAction(0, 18, true) -- Enter
            DisableControlAction(0, 322, true) -- ESC
            DisableControlAction(0, 106, true) -- VehicleMouseControlOverride
        end
    end
end)

-- Gestion des entités figées
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1000)
        
        -- Vérifier si le joueur est figé
        local playerPed = PlayerPedId()
        if IsPedFatallyInjured(playerPed) and AdminPanel.frozenPlayers[PlayerId()] then
            -- Empêcher la mort si figé
            SetEntityHealth(playerPed, GetEntityMaxHealth(playerPed))
        end
    end
end)

-- Surveillance anti-cheat basique
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(5000)
        
        local playerPed = PlayerPedId()
        local playerCoords = GetEntityCoords(playerPed)
        local playerHealth = GetEntityHealth(playerPed)
        local playerArmour = GetPedArmour(playerPed)
        
        -- Vérifier les coordonnées anormales
        if playerCoords.z > 1000.0 or playerCoords.z < -500.0 then
            -- Possible teleport hack
            if not AdminPanel.isNoclip then
                TriggerServerEvent('adminsystem:suspiciousActivity', 'Coordonnées anormales', playerCoords)
            end
        end
        
        -- Vérifier la santé anormale
        if playerHealth > GetEntityMaxHealth(playerPed) then
            TriggerServerEvent('adminsystem:suspiciousActivity', 'Santé anormale', playerHealth)
        end
        
        -- Vérifier l'armure anormale
        if playerArmour > 100 then
            TriggerServerEvent('adminsystem:suspiciousActivity', 'Armure anormale', playerArmour)
        end
    end
end)

-- Event pour les activités suspectes
RegisterServerEvent('adminsystem:suspiciousActivity')
AddEventHandler('adminsystem:suspiciousActivity', function(type, data)
    local source = source
    
    -- Logger l'activité suspecte
    Logger.LogCheat(source, type, json.encode(data))
    
    -- Notifier les admins
    for _, playerId in ipairs(GetPlayers()) do
        if IsPlayerAdmin(playerId) then
            TriggerClientEvent('adminsystem:showNotification', playerId, 'warning', 
                string.format('Activité suspecte détectée: %s (%s)', GetPlayerName(source), type))
        end
    end
end)