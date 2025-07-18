-- Test d'installation du système d'administration
-- Ce fichier peut être utilisé pour vérifier que tous les composants sont correctement installés

print("^2[Admin System] Test d'installation^0")
print("^3[Admin System] Vérification des fichiers...^0")

-- Vérifier les fichiers principaux
local files = {
    'fxmanifest.lua',
    'config.lua',
    'permissions.lua',
    'server.lua',
    'client.lua',
    'logger.lua',
    'nui.js',
    'html/index.html',
    'html/style.css',
    'html/script.js'
}

local allFilesPresent = true

for _, file in ipairs(files) do
    local f = io.open(file, "r")
    if f then
        f:close()
        print("^2[Admin System] ✓ " .. file .. " trouvé^0")
    else
        print("^1[Admin System] ✗ " .. file .. " manquant^0")
        allFilesPresent = false
    end
end

if allFilesPresent then
    print("^2[Admin System] ✓ Tous les fichiers sont présents^0")
    print("^3[Admin System] Installation terminée avec succès !^0")
    print("^3[Admin System] N'oubliez pas de :^0")
    print("^3[Admin System] 1. Configurer les webhooks Discord dans config.lua^0")
    print("^3[Admin System] 2. Ajouter les groupes admin dans votre base ESX^0")
    print("^3[Admin System] 3. Redémarrer le serveur^0")
    print("^3[Admin System] 4. Utiliser /admin ou F6 pour ouvrir le panel^0")
else
    print("^1[Admin System] ✗ Installation incomplète^0")
    print("^1[Admin System] Veuillez vérifier les fichiers manquants^0")
end

-- Test des configurations
print("^3[Admin System] Test des configurations...^0")

if Config then
    print("^2[Admin System] ✓ Config chargé^0")
    
    if Config.Discord and Config.Discord.AdminWebhook then
        if Config.Discord.AdminWebhook == 'https://discord.com/api/webhooks/YOUR_WEBHOOK_HERE' then
            print("^1[Admin System] ⚠️ Webhook Discord non configuré^0")
        else
            print("^2[Admin System] ✓ Webhook Discord configuré^0")
        end
    end
    
    if Config.Groups then
        print("^2[Admin System] ✓ Groupes configurés^0")
        for group, data in pairs(Config.Groups) do
            print("^3[Admin System]   - " .. group .. " (niveau " .. data.level .. ")^0")
        end
    end
    
    if Config.Actions then
        print("^2[Admin System] ✓ Actions configurées (" .. #Config.Actions .. " actions)^0")
    end
else
    print("^1[Admin System] ✗ Config non chargé^0")
end

print("^2[Admin System] Test terminé^0")
print("^3[Admin System] Pour plus d'aide, consultez le README.md^0")