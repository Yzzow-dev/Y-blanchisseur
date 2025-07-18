// Variables globales
let currentData = null;
let currentTab = 'dashboard';
let currentPlayer = null;
let currentSanctionType = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Cacher le panel par défaut
    document.getElementById('adminPanel').style.display = 'none';
    
    // Initialiser les événements des formulaires
    initializeFormEvents();
});

// Écouter les messages de FiveM
window.addEventListener('message', function(event) {
    const data = event.data;
    
    switch(data.type) {
        case 'openPanel':
            openPanel(data.data);
            break;
        case 'closePanel':
            closePanel();
            break;
        case 'notification':
            showNotification(data.notificationType, data.message);
            break;
        case 'newReport':
            addNewReport(data.report);
            break;
        case 'updateData':
            updateData(data.data);
            break;
    }
});

// Fonction pour ouvrir le panel
function openPanel(data) {
    currentData = data;
    document.getElementById('adminPanel').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Initialiser l'interface
    initializeInterface();
    
    // Charger le dashboard par défaut
    switchTab('dashboard');
    
    // Animation d'ouverture
    setTimeout(() => {
        document.getElementById('adminPanel').classList.add('active');
    }, 50);
}

// Fonction pour fermer le panel
function closePanel() {
    document.getElementById('adminPanel').classList.remove('active');
    document.body.style.overflow = 'auto';
    
    setTimeout(() => {
        document.getElementById('adminPanel').style.display = 'none';
    }, 300);
    
    // Envoyer la notification de fermeture
    fetch(`https://${GetParentResourceName()}/closePanel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
    });
}

// Fonction pour initialiser l'interface
function initializeInterface() {
    if (!currentData) return;
    
    // Mettre à jour les informations du staff
    updateStaffInfo();
    
    // Initialiser la sidebar
    initializeSidebar();
    
    // Charger les données initiales
    loadInitialData();
}

// Fonction pour mettre à jour les informations du staff
function updateStaffInfo() {
    const staffInfo = currentData.playerInfo;
    
    document.getElementById('staffName').textContent = staffInfo.name;
    document.getElementById('staffGroup').textContent = staffInfo.group;
    document.getElementById('staffLevel').textContent = `Niveau ${staffInfo.level}`;
}

// Fonction pour initialiser la sidebar
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const tabs = [
        {id: 'dashboard', label: 'Tableau de bord', icon: 'fas fa-tachometer-alt'},
        {id: 'players', label: 'Joueurs', icon: 'fas fa-users'},
        {id: 'reports', label: 'Reports', icon: 'fas fa-flag'},
        {id: 'sanctions', label: 'Sanctions', icon: 'fas fa-gavel'},
        {id: 'tools', label: 'Outils', icon: 'fas fa-tools'},
        {id: 'server', label: 'Serveur', icon: 'fas fa-server'},
        {id: 'logs', label: 'Logs', icon: 'fas fa-file-alt'},
        {id: 'stats', label: 'Statistiques', icon: 'fas fa-chart-bar'},
        {id: 'settings', label: 'Paramètres', icon: 'fas fa-cog'}
    ];
    
    sidebar.innerHTML = '';
    
    tabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = 'sidebar-item';
        tabElement.setAttribute('data-tab', tab.id);
        tabElement.innerHTML = `
            <i class="${tab.icon}"></i>
            <span>${tab.label}</span>
        `;
        
        tabElement.addEventListener('click', () => switchTab(tab.id));
        sidebar.appendChild(tabElement);
    });
}

// Fonction pour changer d'onglet
function switchTab(tabId) {
    currentTab = tabId;
    
    // Mettre à jour la sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Charger le contenu de l'onglet
    loadTabContent(tabId);
}

// Fonction pour charger le contenu d'un onglet
function loadTabContent(tabId) {
    const content = document.getElementById('content');
    
    switch(tabId) {
        case 'dashboard':
            content.innerHTML = generateDashboardContent();
            break;
        case 'players':
            content.innerHTML = generatePlayersContent();
            break;
        case 'reports':
            content.innerHTML = generateReportsContent();
            break;
        case 'sanctions':
            content.innerHTML = generateSanctionsContent();
            break;
        case 'tools':
            content.innerHTML = generateToolsContent();
            break;
        case 'server':
            content.innerHTML = generateServerContent();
            break;
        case 'logs':
            content.innerHTML = generateLogsContent();
            break;
        case 'stats':
            content.innerHTML = generateStatsContent();
            break;
        case 'settings':
            content.innerHTML = generateSettingsContent();
            break;
    }
    
    // Initialiser les événements spécifiques à l'onglet
    initializeTabEvents(tabId);
}

// Fonction pour générer le contenu du dashboard
function generateDashboardContent() {
    const stats = currentData.serverStats;
    const uptime = formatUptime(stats.uptime);
    
    return `
        <div class="tab-header">
            <h2><i class="fas fa-tachometer-alt"></i> Tableau de bord</h2>
            <button class="btn btn-primary" onclick="refreshData()">
                <i class="fas fa-sync-alt"></i> Actualiser
            </button>
        </div>
        
        <div class="dashboard-grid">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.playersOnline}/${stats.maxPlayers}</h3>
                    <p>Joueurs en ligne</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-info">
                    <h3>${uptime}</h3>
                    <p>Uptime serveur</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-flag"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.activeReports}</h3>
                    <p>Reports actifs</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-gavel"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.activeBans}</h3>
                    <p>Bans actifs</p>
                </div>
            </div>
        </div>
        
        <div class="dashboard-sections">
            <div class="section">
                <h3><i class="fas fa-bell"></i> Notifications récentes</h3>
                <div class="notification-list" id="recentNotifications">
                    <div class="activity-item">
                        <i class="fas fa-user-plus"></i>
                        <span>Nouveau joueur connecté</span>
                        <small>Il y a 2 minutes</small>
                    </div>
                    <div class="activity-item">
                        <i class="fas fa-flag"></i>
                        <span>Nouveau report reçu</span>
                        <small>Il y a 5 minutes</small>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3><i class="fas fa-activity"></i> Activité temps réel</h3>
                <div class="activity-list" id="realtimeActivity">
                    <div class="activity-item">
                        <i class="fas fa-eye"></i>
                        <span>Mode spectate activé</span>
                        <small>Il y a 1 minute</small>
                    </div>
                    <div class="activity-item">
                        <i class="fas fa-ban"></i>
                        <span>Joueur banni</span>
                        <small>Il y a 3 minutes</small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour générer le contenu des joueurs
function generatePlayersContent() {
    const players = currentData.onlinePlayers;
    
    return `
        <div class="tab-header">
            <h2><i class="fas fa-users"></i> Gestion des joueurs</h2>
            <div class="search-container">
                <input type="text" id="playerSearch" placeholder="Rechercher un joueur..." 
                       onkeyup="filterPlayers(this.value)">
                <i class="fas fa-search"></i>
            </div>
        </div>
        
        <div class="players-grid" id="playersGrid">
            ${generatePlayersGrid(players)}
        </div>
    `;
}

// Fonction pour générer la grille des joueurs
function generatePlayersGrid(players) {
    let html = '';
    
    for (const [playerId, player] of Object.entries(players)) {
        html += `
            <div class="player-card" data-player-id="${playerId}">
                <div class="player-header">
                    <div class="player-info">
                        <h3>${player.name}</h3>
                        <span class="player-id">ID: ${playerId}</span>
                        <span class="player-group ${player.group}">${player.group}</span>
                    </div>
                    <div class="player-status">
                        <span class="status-indicator online"></span>
                        <span class="ping">${player.ping}ms</span>
                    </div>
                </div>
                
                <div class="player-details">
                    <div class="detail-item">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Argent: $${formatNumber(player.money)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-university"></i>
                        <span>Banque: $${formatNumber(player.bank)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-briefcase"></i>
                        <span>Métier: ${player.job}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Position: ${Math.round(player.coords.x)}, ${Math.round(player.coords.y)}</span>
                    </div>
                </div>
                
                <div class="player-actions">
                    <button class="btn btn-sm btn-info" onclick="spectatePlayer(${playerId})">
                        <i class="fas fa-eye"></i> Spectate
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="freezePlayer(${playerId})">
                        <i class="fas fa-snowflake"></i> Freeze
                    </button>
                    <button class="btn btn-sm btn-success" onclick="gotoPlayer(${playerId})">
                        <i class="fas fa-location-arrow"></i> Goto
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="bringPlayer(${playerId})">
                        <i class="fas fa-hand-paper"></i> Bring
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="showPlayerActionsModal(${playerId}, '${player.name}')">
                        <i class="fas fa-cog"></i> Actions
                    </button>
                </div>
            </div>
        `;
    }
    
    return html;
}

// Fonction pour générer le contenu des reports
function generateReportsContent() {
    const reports = currentData.reports;
    
    return `
        <div class="tab-header">
            <h2><i class="fas fa-flag"></i> Gestion des reports</h2>
            <div class="report-filters">
                <select id="reportFilter" onchange="filterReports(this.value)">
                    <option value="all">Tous les reports</option>
                    <option value="pending">En attente</option>
                    <option value="handled">Traités</option>
                </select>
            </div>
        </div>
        
        <div class="reports-list" id="reportsList">
            ${generateReportsList(reports)}
        </div>
    `;
}

// Fonction pour générer la liste des reports
function generateReportsList(reports) {
    let html = '';
    
    for (const [reportId, report] of Object.entries(reports)) {
        const timeAgo = formatTimeAgo(report.timestamp);
        const statusClass = report.status === 'pending' ? 'pending' : 'handled';
        
        html += `
            <div class="report-card ${statusClass}" data-report-id="${reportId}">
                <div class="report-header">
                    <div class="report-info">
                        <h3>${report.playerName}</h3>
                        <span class="report-time">${timeAgo}</span>
                    </div>
                    <div class="report-status">
                        <span class="status-badge ${statusClass}">${report.status}</span>
                    </div>
                </div>
                
                <div class="report-content">
                    <p><strong>Raison:</strong> ${report.reason}</p>
                    ${report.response ? `<p><strong>Réponse:</strong> ${report.response}</p>` : ''}
                </div>
                
                <div class="report-actions">
                    ${report.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="handleReport(${reportId}, 'handle')">
                            <i class="fas fa-check"></i> Traiter
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="handleReport(${reportId}, 'dismiss')">
                            <i class="fas fa-times"></i> Rejeter
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    return html || '<div class="no-data">Aucun report trouvé</div>';
}

// Fonction pour générer le contenu des sanctions
function generateSanctionsContent() {
    return `
        <div class="tab-header">
            <h2><i class="fas fa-gavel"></i> Gestion des sanctions</h2>
            <button class="btn btn-primary" onclick="showUnbanModal()">
                <i class="fas fa-unlock"></i> Débannir
            </button>
        </div>
        
        <div class="sanctions-grid">
            <div class="section">
                <h3><i class="fas fa-ban"></i> Bans actifs</h3>
                <div class="sanctions-list" id="bansList">
                    <!-- Les bans seront chargés ici -->
                </div>
            </div>
            
            <div class="section">
                <h3><i class="fas fa-exclamation-triangle"></i> Warnings récents</h3>
                <div class="sanctions-list" id="warningsList">
                    <!-- Les warnings seront chargés ici -->
                </div>
            </div>
        </div>
    `;
}

// Fonction pour générer le contenu des outils
function generateToolsContent() {
    return `
        <div class="tab-header">
            <h2><i class="fas fa-tools"></i> Outils Staff</h2>
        </div>
        
        <div class="tools-grid">
            <div class="tool-card">
                <div class="tool-icon">
                    <i class="fas fa-ghost"></i>
                </div>
                <div class="tool-info">
                    <h3>Mode Invisible</h3>
                    <p>Devenir invisible aux autres joueurs</p>
                </div>
                <button class="btn btn-primary" onclick="toggleTool('cloak')">
                    <i class="fas fa-toggle-off"></i> Activer
                </button>
            </div>
            
            <div class="tool-card">
                <div class="tool-icon">
                    <i class="fas fa-plane"></i>
                </div>
                <div class="tool-info">
                    <h3>Noclip</h3>
                    <p>Voler et traverser les murs</p>
                </div>
                <button class="btn btn-primary" onclick="toggleTool('noclip')">
                    <i class="fas fa-toggle-off"></i> Activer
                </button>
            </div>
            
            <div class="tool-card">
                <div class="tool-icon">
                    <i class="fas fa-map"></i>
                </div>
                <div class="tool-info">
                    <h3>Téléportation</h3>
                    <p>Se téléporter rapidement</p>
                </div>
                <button class="btn btn-primary" onclick="showTeleportModal()">
                    <i class="fas fa-location-arrow"></i> Ouvrir
                </button>
            </div>
            
            <div class="tool-card">
                <div class="tool-icon">
                    <i class="fas fa-eye"></i>
                </div>
                <div class="tool-info">
                    <h3>Caméra libre</h3>
                    <p>Caméra de surveillance</p>
                </div>
                <button class="btn btn-primary" onclick="toggleFreeCam()">
                    <i class="fas fa-toggle-off"></i> Activer
                </button>
            </div>
        </div>
    `;
}

// Fonction pour générer le contenu du serveur
function generateServerContent() {
    return `
        <div class="tab-header">
            <h2><i class="fas fa-server"></i> Contrôle Serveur</h2>
        </div>
        
        <div class="server-grid">
            <div class="section">
                <h3><i class="fas fa-power-off"></i> Redémarrage</h3>
                <div class="server-actions">
                    <button class="btn btn-warning" onclick="restartServer('soft')">
                        <i class="fas fa-refresh"></i> Redémarrage Soft
                    </button>
                    <button class="btn btn-danger" onclick="restartServer('hard')">
                        <i class="fas fa-power-off"></i> Redémarrage Hard
                    </button>
                </div>
            </div>
            
            <div class="section">
                <h3><i class="fas fa-bullhorn"></i> Annonces</h3>
                <div class="announcement-form">
                    <textarea id="announcementText" class="form-control" placeholder="Message d'annonce..."></textarea>
                    <button class="btn btn-primary" onclick="sendAnnouncement()">
                        <i class="fas fa-paper-plane"></i> Envoyer
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour générer le contenu des logs
function generateLogsContent() {
    return `
        <div class="tab-header">
            <h2><i class="fas fa-file-alt"></i> Logs Système</h2>
        </div>
        
        <div class="logs-container">
            <div class="logs-filters">
                <select id="logType" onchange="filterLogs(this.value)">
                    <option value="all">Tous les logs</option>
                    <option value="admin">Actions Admin</option>
                    <option value="player">Actions Joueur</option>
                    <option value="security">Sécurité</option>
                    <option value="cheat">Détections</option>
                </select>
            </div>
            
            <div class="logs-list" id="logsList">
                <div class="log-item">
                    <span class="log-time">12:34:56</span>
                    <span class="log-type admin">ADMIN</span>
                    <span class="log-message">John_Doe a banni Player123</span>
                </div>
                <div class="log-item">
                    <span class="log-time">12:33:42</span>
                    <span class="log-type player">PLAYER</span>
                    <span class="log-message">Player456 s'est connecté</span>
                </div>
                <div class="log-item">
                    <span class="log-time">12:32:15</span>
                    <span class="log-type security">SECURITY</span>
                    <span class="log-message">Tentative de connexion suspecte détectée</span>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour générer le contenu des statistiques
function generateStatsContent() {
    return `
        <div class="tab-header">
            <h2><i class="fas fa-chart-bar"></i> Statistiques</h2>
        </div>
        
        <div class="stats-container">
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Connexions aujourd'hui</h3>
                    <div class="stat-value">127</div>
                </div>
                <div class="stat-card">
                    <h3>Actions staff</h3>
                    <div class="stat-value">45</div>
                </div>
                <div class="stat-card">
                    <h3>Reports traités</h3>
                    <div class="stat-value">23</div>
                </div>
                <div class="stat-card">
                    <h3>Bans appliqués</h3>
                    <div class="stat-value">8</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3>Activité des dernières 24h</h3>
                <div class="chart-placeholder">
                    <p>Graphique des connexions et activités</p>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour générer le contenu des paramètres
function generateSettingsContent() {
    return `
        <div class="tab-header">
            <h2><i class="fas fa-cog"></i> Paramètres</h2>
        </div>
        
        <div class="settings-container">
            <div class="section">
                <h3><i class="fas fa-palette"></i> Thème</h3>
                <div class="theme-options">
                    <button class="btn btn-primary" onclick="changeTheme('dark')">
                        <i class="fas fa-moon"></i> Sombre
                    </button>
                    <button class="btn btn-secondary" onclick="changeTheme('light')">
                        <i class="fas fa-sun"></i> Clair
                    </button>
                </div>
            </div>
            
            <div class="section">
                <h3><i class="fas fa-bell"></i> Notifications</h3>
                <div class="notification-settings">
                    <label class="checkbox-label">
                        <input type="checkbox" id="notifReports" checked>
                        <span>Nouveaux reports</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="notifConnections" checked>
                        <span>Connexions/Déconnexions</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="notifSecurity">
                        <span>Alertes sécurité</span>
                    </label>
                </div>
            </div>
        </div>
    `;
}

// Fonctions d'actions
function spectatePlayer(playerId) {
    fetch(`https://${GetParentResourceName()}/playerAction`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'spectate',
            targetId: playerId
        })
    });
}

function freezePlayer(playerId) {
    fetch(`https://${GetParentResourceName()}/playerAction`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'freeze',
            targetId: playerId
        })
    });
}

function gotoPlayer(playerId) {
    fetch(`https://${GetParentResourceName()}/playerAction`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'goto',
            targetId: playerId
        })
    });
}

function bringPlayer(playerId) {
    fetch(`https://${GetParentResourceName()}/playerAction`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'bring',
            targetId: playerId
        })
    });
}

function toggleTool(tool) {
    fetch(`https://${GetParentResourceName()}/toggleTool`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tool: tool
        })
    });
}

function handleReport(reportId, action) {
    let response = '';
    
    if (action === 'handle') {
        response = prompt('Réponse au report:');
        if (!response) return;
    }
    
    fetch(`https://${GetParentResourceName()}/handleReport`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            reportId: reportId,
            action: action,
            response: response
        })
    });
}

function refreshData() {
    fetch(`https://${GetParentResourceName()}/refreshData`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
    });
}

// Fonctions de modal
function showPlayerActionsModal(playerId, playerName) {
    currentPlayer = playerId;
    document.getElementById('modalPlayerName').textContent = playerName;
    document.getElementById('modalPlayerId').textContent = `ID: ${playerId}`;
    showModal('playerActionsModal');
}

function showWarnModal() {
    currentSanctionType = 'warn';
    document.getElementById('sanctionModalTitle').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Avertissement';
    document.getElementById('sanctionSubmit').textContent = 'Avertir';
    document.getElementById('durationGroup').style.display = 'none';
    showModal('sanctionModal');
}

function showKickModal() {
    currentSanctionType = 'kick';
    document.getElementById('sanctionModalTitle').innerHTML = '<i class="fas fa-sign-out-alt"></i> Expulsion';
    document.getElementById('sanctionSubmit').textContent = 'Expulser';
    document.getElementById('durationGroup').style.display = 'none';
    showModal('sanctionModal');
}

function showBanModal() {
    currentSanctionType = 'ban';
    document.getElementById('sanctionModalTitle').innerHTML = '<i class="fas fa-ban"></i> Bannissement';
    document.getElementById('sanctionSubmit').textContent = 'Bannir';
    document.getElementById('durationGroup').style.display = 'block';
    showModal('sanctionModal');
}

function showGiveMoneyModal() {
    showModal('moneyModal');
}

function showSetJobModal() {
    showModal('jobModal');
}

function showTeleportModal() {
    showModal('teleportModal');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.getElementById('modalOverlay').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.getElementById('modalOverlay').style.display = 'none';
}

// Initialiser les événements des formulaires
function initializeFormEvents() {
    // Formulaire de sanction
    document.getElementById('sanctionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const reason = document.getElementById('sanctionReason').value;
        const duration = document.getElementById('sanctionDuration').value;
        
        if (!reason.trim()) {
            alert('Veuillez spécifier une raison');
            return;
        }
        
        const data = {
            reason: reason,
            permanent: currentSanctionType === 'ban' && !duration
        };
        
        if (currentSanctionType === 'ban' && duration) {
            data.duration = parseInt(duration);
        }
        
        fetch(`https://${GetParentResourceName()}/playerAction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: currentSanctionType,
                targetId: currentPlayer,
                data: data
            })
        });
        
        closeModal('sanctionModal');
        document.getElementById('sanctionForm').reset();
    });
    
    // Formulaire d'argent
    document.getElementById('moneyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = parseInt(document.getElementById('moneyAmount').value);
        const type = document.getElementById('moneyType').value;
        
        if (!amount || amount <= 0) {
            alert('Veuillez spécifier un montant valide');
            return;
        }
        
        fetch(`https://${GetParentResourceName()}/playerAction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'givemoney',
                targetId: currentPlayer,
                data: {
                    amount: amount,
                    type: type
                }
            })
        });
        
        closeModal('moneyModal');
        document.getElementById('moneyForm').reset();
    });
    
    // Formulaire de métier
    document.getElementById('jobForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const job = document.getElementById('jobName').value;
        const grade = parseInt(document.getElementById('jobGrade').value);
        
        fetch(`https://${GetParentResourceName()}/playerAction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'setjob',
                targetId: currentPlayer,
                data: {
                    job: job,
                    grade: grade
                }
            })
        });
        
        closeModal('jobModal');
        document.getElementById('jobForm').reset();
    });
    
    // Formulaire de téléportation
    document.getElementById('teleportForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const x = parseFloat(document.getElementById('coordX').value);
        const y = parseFloat(document.getElementById('coordY').value);
        const z = parseFloat(document.getElementById('coordZ').value);
        
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            alert('Veuillez spécifier des coordonnées valides');
            return;
        }
        
        teleportTo(x, y, z);
        closeModal('teleportModal');
        document.getElementById('teleportForm').reset();
    });
}

// Fonctions utilitaires
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days}j ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

function formatTimeAgo(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) {
        return 'À l\'instant';
    } else if (diff < 3600) {
        return `${Math.floor(diff / 60)}m`;
    } else if (diff < 86400) {
        return `${Math.floor(diff / 3600)}h`;
    } else {
        return `${Math.floor(diff / 86400)}j`;
    }
}

function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'times-circle';
        case 'warning': return 'exclamation-triangle';
        case 'info': return 'info-circle';
        default: return 'bell';
    }
}

// Fermer le panel avec Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && document.getElementById('adminPanel').classList.contains('active')) {
        closePanel();
    }
});

// Fermer les modals en cliquant sur l'overlay
document.getElementById('modalOverlay').addEventListener('click', function() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    this.style.display = 'none';
});

// Fonctions de filtre
function filterPlayers(searchTerm) {
    const playerCards = document.querySelectorAll('.player-card');
    
    playerCards.forEach(card => {
        const playerName = card.querySelector('h3').textContent.toLowerCase();
        const playerId = card.getAttribute('data-player-id');
        
        if (playerName.includes(searchTerm.toLowerCase()) || playerId.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterReports(status) {
    const reportCards = document.querySelectorAll('.report-card');
    
    reportCards.forEach(card => {
        if (status === 'all' || card.classList.contains(status)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Fonctions d'événements d'onglets
function initializeTabEvents(tabId) {
    switch(tabId) {
        case 'players':
            // Initialiser les événements des joueurs
            break;
        case 'reports':
            // Initialiser les événements des reports
            break;
        // Autres onglets...
    }
}

// Fonction pour charger les données initiales
function loadInitialData() {
    // Charger les notifications récentes
    // Charger l'activité temps réel
    // Etc.
}

// Fonction pour mettre à jour les données
function updateData(data) {
    currentData = data;
    
    // Recharger l'onglet actuel
    loadTabContent(currentTab);
}

// Fonction pour ajouter un nouveau report
function addNewReport(report) {
    if (currentTab === 'reports') {
        const reportsList = document.getElementById('reportsList');
        const newReportHtml = generateReportsList({[report.id]: report});
        reportsList.insertAdjacentHTML('afterbegin', newReportHtml);
    }
}

// Fonction pour obtenir le nom de la ressource parent
function GetParentResourceName() {
    return window.location.hostname;
}

// Fonctions supplémentaires
function teleportTo(x, y, z) {
    fetch(`https://${GetParentResourceName()}/playerAction`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'teleport',
            data: {
                x: x,
                y: y,
                z: z
            }
        })
    });
}

function restartServer(type) {
    if (confirm(`Êtes-vous sûr de vouloir effectuer un redémarrage ${type} ?`)) {
        fetch(`https://${GetParentResourceName()}/serverAction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'restart',
                data: {
                    type: type
                }
            })
        });
    }
}

function sendAnnouncement() {
    const message = document.getElementById('announcementText').value;
    
    if (!message.trim()) {
        alert('Veuillez saisir un message');
        return;
    }
    
    fetch(`https://${GetParentResourceName()}/serverAction`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'announce',
            data: {
                message: message
            }
        })
    });
    
    document.getElementById('announcementText').value = '';
}