Logger = {}

-- Cache des logs pour éviter le spam
local logCache = {}
local logQueue = {}
local isProcessingQueue = false

-- Fonction principale pour envoyer un log
function Logger.Send(logType, title, description, fields, color)
    if not Config.Discord.Enable then
        return
    end
    
    -- Déterminer le webhook à utiliser
    local webhook = Config.Discord.AdminWebhook
    if logType == 'security' or logType == 'cheat' then
        webhook = Config.Discord.SecurityWebhook
    end
    
    -- Créer l'embed
    local embed = {
        title = title,
        description = description,
        color = color or Config.Discord.Colors.Admin,
        fields = fields or {},
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        footer = {
            text = Config.Discord.ServerName .. " | Admin System v" .. Config.Version,
            icon_url = Config.Discord.ServerIcon
        }
    }
    
    -- Ajouter à la queue
    table.insert(logQueue, {
        webhook = webhook,
        embed = embed
    })
    
    -- Traiter la queue si elle n'est pas déjà en cours
    if not isProcessingQueue then
        ProcessLogQueue()
    end
end

-- Fonction pour traiter la queue des logs
function ProcessLogQueue()
    if #logQueue == 0 then
        isProcessingQueue = false
        return
    end
    
    isProcessingQueue = true
    
    Citizen.CreateThread(function()
        while #logQueue > 0 do
            local logData = table.remove(logQueue, 1)
            
            -- Envoyer le log
            PerformHttpRequest(logData.webhook, function(err, text, headers)
                if Config.Debug then
                    if err == 200 then
                        print("^2[Admin System] Log Discord envoyé avec succès^0")
                    else
                        print("^1[Admin System] Erreur lors de l'envoi du log Discord: " .. err .. "^0")
                    end
                end
            end, 'POST', json.encode({
                username = "Admin System",
                avatar_url = Config.Discord.ServerIcon,
                embeds = {logData.embed}
            }), {
                ['Content-Type'] = 'application/json'
            })
            
            -- Attendre un peu pour éviter les limites de taux
            Citizen.Wait(1000)
        end
        
        isProcessingQueue = false
    end)
end

-- Fonction pour logger une action staff
function Logger.LogStaffAction(source, action, target, details)
    local staffInfo = GetPlayerInfo(source)
    local targetInfo = target and GetPlayerInfo(target) or nil
    
    if not staffInfo then
        return
    end
    
    local fields = {
        {
            name = "👤 Staff",
            value = string.format("**%s** (%s)\nGroupe: %s\nID: %d", 
                staffInfo.name, staffInfo.identifier, staffInfo.group, staffInfo.id),
            inline = true
        },
        {
            name = "🎯 Action",
            value = action,
            inline = true
        }
    }
    
    if targetInfo then
        table.insert(fields, {
            name = "🎮 Cible",
            value = string.format("**%s** (%s)\nGroupe: %s\nID: %d", 
                targetInfo.name, targetInfo.identifier, targetInfo.group, targetInfo.id),
            inline = true
        })
    end
    
    if details then
        table.insert(fields, {
            name = "📄 Détails",
            value = details,
            inline = false
        })
    end
    
    Logger.Send('admin', '🛠️ Action Staff - Admin Panel', 
        string.format("Action **%s** effectuée par %s", action, staffInfo.name), 
        fields, Config.Discord.Colors.Admin)
end

-- Fonction pour logger une action joueur
function Logger.LogPlayerAction(source, action, details)
    local playerInfo = GetPlayerInfo(source)
    
    if not playerInfo then
        return
    end
    
    local fields = {
        {
            name = "👤 Joueur",
            value = string.format("**%s** (%s)\nGroupe: %s\nID: %d", 
                playerInfo.name, playerInfo.identifier, playerInfo.group, playerInfo.id),
            inline = true
        },
        {
            name = "🎯 Action",
            value = action,
            inline = true
        }
    }
    
    if details then
        table.insert(fields, {
            name = "📄 Détails",
            value = details,
            inline = false
        })
    end
    
    Logger.Send('player', '🎮 Action Joueur - Admin Panel', 
        string.format("Action **%s** par %s", action, playerInfo.name), 
        fields, Config.Discord.Colors.Player)
end

-- Fonction pour logger un problème de sécurité
function Logger.LogSecurity(source, violation, details)
    local playerInfo = GetPlayerInfo(source)
    
    if not playerInfo then
        return
    end
    
    local fields = {
        {
            name = "⚠️ Joueur Suspect",
            value = string.format("**%s** (%s)\nGroupe: %s\nID: %d", 
                playerInfo.name, playerInfo.identifier, playerInfo.group, playerInfo.id),
            inline = true
        },
        {
            name = "🔍 Type de Violation",
            value = violation,
            inline = true
        },
        {
            name = "📍 Position",
            value = string.format("X: %.2f, Y: %.2f, Z: %.2f", 
                playerInfo.coords.x, playerInfo.coords.y, playerInfo.coords.z),
            inline = true
        }
    }
    
    if details then
        table.insert(fields, {
            name = "📄 Détails",
            value = details,
            inline = false
        })
    end
    
    Logger.Send('security', '🔐 Problème de Sécurité', 
        string.format("Violation **%s** détectée", violation), 
        fields, Config.Discord.Colors.Security)
end

-- Fonction pour logger une détection de triche
function Logger.LogCheat(source, cheatType, details)
    local playerInfo = GetPlayerInfo(source)
    
    if not playerInfo then
        return
    end
    
    local fields = {
        {
            name = "🚨 Tricheur Détecté",
            value = string.format("**%s** (%s)\nGroupe: %s\nID: %d", 
                playerInfo.name, playerInfo.identifier, playerInfo.group, playerInfo.id),
            inline = true
        },
        {
            name = "🔍 Type de Triche",
            value = cheatType,
            inline = true
        },
        {
            name = "📍 Position",
            value = string.format("X: %.2f, Y: %.2f, Z: %.2f", 
                playerInfo.coords.x, playerInfo.coords.y, playerInfo.coords.z),
            inline = true
        },
        {
            name = "🕒 Ping",
            value = playerInfo.ping .. " ms",
            inline = true
        }
    }
    
    if details then
        table.insert(fields, {
            name = "📄 Détails",
            value = details,
            inline = false
        })
    end
    
    Logger.Send('cheat', '🚨 Cheat Detected', 
        string.format("Triche **%s** détectée", cheatType), 
        fields, Config.Discord.Colors.Cheat)
end

-- Fonction pour logger les connexions/déconnexions
function Logger.LogConnection(source, action, reason)
    local playerInfo = GetPlayerInfo(source)
    
    if not playerInfo then
        return
    end
    
    local fields = {
        {
            name = "👤 Joueur",
            value = string.format("**%s** (%s)\nGroupe: %s\nID: %d", 
                playerInfo.name, playerInfo.identifier, playerInfo.group, playerInfo.id),
            inline = true
        },
        {
            name = "🎯 Action",
            value = action,
            inline = true
        }
    }
    
    if reason then
        table.insert(fields, {
            name = "📄 Raison",
            value = reason,
            inline = false
        })
    end
    
    local color = action == "Connexion" and Config.Discord.Colors.Player or Config.Discord.Colors.Admin
    
    Logger.Send('player', '🔗 Connexion Joueur', 
        string.format("**%s** - %s", action, playerInfo.name), 
        fields, color)
end

-- Fonction pour logger les commandes
function Logger.LogCommand(source, command, args)
    local playerInfo = GetPlayerInfo(source)
    
    if not playerInfo then
        return
    end
    
    local fields = {
        {
            name = "👤 Joueur",
            value = string.format("**%s** (%s)\nGroupe: %s\nID: %d", 
                playerInfo.name, playerInfo.identifier, playerInfo.group, playerInfo.id),
            inline = true
        },
        {
            name = "💻 Commande",
            value = "/" .. command,
            inline = true
        }
    }
    
    if args and #args > 0 then
        table.insert(fields, {
            name = "📄 Arguments",
            value = table.concat(args, " "),
            inline = false
        })
    end
    
    Logger.Send('admin', '💻 Commande Exécutée', 
        string.format("Commande **/%s** par %s", command, playerInfo.name), 
        fields, Config.Discord.Colors.Admin)
end

-- Fonction pour logger les sanctions
function Logger.LogSanction(source, target, sanctionType, reason, duration)
    local staffInfo = GetPlayerInfo(source)
    local targetInfo = GetPlayerInfo(target)
    
    if not staffInfo or not targetInfo then
        return
    end
    
    local fields = {
        {
            name = "👤 Staff",
            value = string.format("**%s** (%s)\nGroupe: %s\nID: %d", 
                staffInfo.name, staffInfo.identifier, staffInfo.group, staffInfo.id),
            inline = true
        },
        {
            name = "🎯 Sanctionné",
            value = string.format("**%s** (%s)\nGroupe: %s\nID: %d", 
                targetInfo.name, targetInfo.identifier, targetInfo.group, targetInfo.id),
            inline = true
        },
        {
            name = "⚖️ Type",
            value = sanctionType,
            inline = true
        }
    }
    
    if reason then
        table.insert(fields, {
            name = "📄 Raison",
            value = reason,
            inline = false
        })
    end
    
    if duration then
        table.insert(fields, {
            name = "⏱️ Durée",
            value = duration,
            inline = true
        })
    end
    
    Logger.Send('admin', '⚖️ Sanction Appliquée', 
        string.format("**%s** sanctionné par %s", targetInfo.name, staffInfo.name), 
        fields, Config.Discord.Colors.Admin)
end

-- Fonction pour logger les erreurs système
function Logger.LogError(error, details)
    local fields = {
        {
            name = "❌ Erreur",
            value = error,
            inline = false
        }
    }
    
    if details then
        table.insert(fields, {
            name = "📄 Détails",
            value = details,
            inline = false
        })
    end
    
    Logger.Send('security', '❌ Erreur Système', 
        "Une erreur système s'est produite", 
        fields, Config.Discord.Colors.Cheat)
end

-- Fonction pour logger les redémarrages serveur
function Logger.LogRestart(source, type, reason)
    local staffInfo = source and GetPlayerInfo(source) or nil
    
    local fields = {}
    
    if staffInfo then
        table.insert(fields, {
            name = "👤 Staff",
            value = string.format("**%s** (%s)\nGroupe: %s\nID: %d", 
                staffInfo.name, staffInfo.identifier, staffInfo.group, staffInfo.id),
            inline = true
        })
    end
    
    table.insert(fields, {
        name = "🔄 Type",
        value = type,
        inline = true
    })
    
    if reason then
        table.insert(fields, {
            name = "📄 Raison",
            value = reason,
            inline = false
        })
    end
    
    Logger.Send('admin', '🔄 Redémarrage Serveur', 
        string.format("Redémarrage **%s** du serveur", type), 
        fields, Config.Discord.Colors.Admin)
end

-- Fonction utilitaire pour vérifier si un log est en cache (anti-spam)
function IsLogCached(logKey, duration)
    duration = duration or 5000 -- 5 secondes par défaut
    
    if logCache[logKey] then
        if GetGameTimer() - logCache[logKey] < duration then
            return true
        end
    end
    
    logCache[logKey] = GetGameTimer()
    return false
end

-- Nettoyer le cache des logs périodiquement
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(300000) -- 5 minutes
        
        local currentTime = GetGameTimer()
        for key, time in pairs(logCache) do
            if currentTime - time > 300000 then -- 5 minutes
                logCache[key] = nil
            end
        end
    end
end)