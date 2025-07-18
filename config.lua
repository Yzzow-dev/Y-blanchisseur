Config = {}

-- Configuration générale
Config.Locale = 'fr'
Config.Debug = false
Config.Version = '1.0.0'

-- Interface
Config.UI = {
    OpenKey = 'F6',
    CloseKey = 'ESCAPE',
    DefaultTheme = 'dark',
    AnimationSpeed = 300,
    NotificationDuration = 5000
}

-- Permissions
Config.Permissions = {
    MinRank = 'mod',
    RequiredGroup = 'admin',
    SuperAdminGroup = 'superadmin',
    OwnerGroup = 'owner'
}

-- Sécurité
Config.Security = {
    EnableRateLimit = true,
    RateLimitDelay = 1000, -- ms
    MaxActionsPerMinute = 30,
    EnableAntiSpoof = true,
    LogAllActions = true,
    AutoKickOnCheat = true,
    EnableIPBan = true
}

-- Logs Discord
Config.Discord = {
    Enable = true,
    AdminWebhook = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_HERE',
    SecurityWebhook = 'https://discord.com/api/webhooks/YOUR_SECURITY_WEBHOOK_HERE',
    ServerName = 'Mon Serveur RP',
    ServerIcon = 'https://i.imgur.com/example.png',
    Colors = {
        Admin = 3447003,     -- Bleu
        Player = 65280,      -- Vert
        Security = 16776960, -- Jaune
        Cheat = 16711680     -- Rouge
    }
}

-- Groupes et permissions
Config.Groups = {
    ['owner'] = {
        label = 'Propriétaire',
        level = 100,
        permissions = {
            'all'
        }
    },
    ['superadmin'] = {
        label = 'Super Admin',
        level = 90,
        permissions = {
            'player.manage', 'player.ban', 'player.unban', 'player.kick',
            'server.restart', 'server.resources', 'server.events',
            'reports.manage', 'logs.view', 'stats.view'
        }
    },
    ['admin'] = {
        label = 'Administrateur',
        level = 80,
        permissions = {
            'player.manage', 'player.ban', 'player.kick', 'player.spectate',
            'reports.manage', 'logs.view', 'tools.noclip', 'tools.cloak'
        }
    },
    ['mod'] = {
        label = 'Modérateur',
        level = 50,
        permissions = {
            'player.freeze', 'player.spectate', 'player.tp',
            'reports.view', 'reports.answer', 'tools.cloak'
        }
    }
}

-- Actions disponibles
Config.Actions = {
    ['freeze'] = { permission = 'player.freeze', log = true },
    ['unfreeze'] = { permission = 'player.freeze', log = true },
    ['spectate'] = { permission = 'player.spectate', log = true },
    ['revive'] = { permission = 'player.manage', log = true },
    ['heal'] = { permission = 'player.manage', log = true },
    ['goto'] = { permission = 'player.tp', log = true },
    ['bring'] = { permission = 'player.tp', log = true },
    ['kick'] = { permission = 'player.kick', log = true },
    ['ban'] = { permission = 'player.ban', log = true },
    ['tempban'] = { permission = 'player.ban', log = true },
    ['warn'] = { permission = 'player.manage', log = true },
    ['givemoney'] = { permission = 'player.manage', log = true },
    ['setjob'] = { permission = 'player.manage', log = true },
    ['noclip'] = { permission = 'tools.noclip', log = false },
    ['cloak'] = { permission = 'tools.cloak', log = true },
    ['restart'] = { permission = 'server.restart', log = true }
}

-- Statistiques
Config.Stats = {
    EnableTracking = true,
    TrackPlaytime = true,
    TrackStaffActions = true,
    TrackConnections = true,
    ExportFormats = {'csv', 'json'}
}

-- Outils staff
Config.Tools = {
    NoClip = {
        Speed = 1.0,
        FastSpeed = 5.0,
        SuperSpeed = 10.0
    },
    Spectate = {
        ShowHUD = true,
        ShowBlips = true,
        EnableThermal = true
    },
    Cloak = {
        Invisible = true,
        Godmode = true,
        NoCollision = true
    }
}

-- Interface utilisateur
Config.UI.Tabs = {
    {id = 'dashboard', label = 'Tableau de bord', icon = 'fas fa-tachometer-alt'},
    {id = 'players', label = 'Joueurs', icon = 'fas fa-users'},
    {id = 'reports', label = 'Reports', icon = 'fas fa-flag'},
    {id = 'sanctions', label = 'Sanctions', icon = 'fas fa-gavel'},
    {id = 'tools', label = 'Outils', icon = 'fas fa-tools'},
    {id = 'server', label = 'Serveur', icon = 'fas fa-server'},
    {id = 'logs', label = 'Logs', icon = 'fas fa-file-alt'},
    {id = 'stats', label = 'Statistiques', icon = 'fas fa-chart-bar'},
    {id = 'settings', label = 'Paramètres', icon = 'fas fa-cog'}
}

-- Messages
Config.Messages = {
    ['no_permission'] = 'Vous n\'avez pas la permission d\'effectuer cette action.',
    ['player_not_found'] = 'Joueur introuvable.',
    ['action_success'] = 'Action effectuée avec succès.',
    ['action_failed'] = 'Échec de l\'action.',
    ['rate_limit'] = 'Vous effectuez trop d\'actions rapidement.',
    ['invalid_target'] = 'Cible invalide.',
    ['security_violation'] = 'Violation de sécurité détectée.',
    ['cheat_detected'] = 'Tentative de triche détectée.'
}