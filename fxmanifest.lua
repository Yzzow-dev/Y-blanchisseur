fx_version 'cerulean'
game 'gta5'

author 'Admin System'
description 'Système d\'administration complet, moderne et sécurisé'
version '1.0.0'

ui_page 'html/index.html'

shared_scripts {
    'config.lua',
    'permissions.lua'
}

server_scripts {
    'server.lua',
    'logger.lua'
}

client_scripts {
    'client.lua',
    'nui.js'
}

files {
    'html/index.html',
    'html/style.css',
    'html/script.js',
    'html/assets/*.png',
    'html/assets/*.jpg',
    'html/assets/*.svg'
}

dependencies {
    'es_extended'
}

lua54 'yes'