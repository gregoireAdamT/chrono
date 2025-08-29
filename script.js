let records = [];
let prochainDepartPrevu = null;
let autoSaveEnabled = true;
let lastBackupTime = null;
let webhook_url = '';
let sync_enabled = false;

// Configuration de sauvegarde
const BACKUP_CONFIG = {
    localInterval: 5000,        // Sauvegarde locale toutes les 5 secondes
    webhook_timeout: 5000,      // 5s timeout pour webhook
};

// Gestion des onglets
let currentTab = 'start';

function switchTab(tabName) {
    // Masquer tous les contenus
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Désactiver tous les boutons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activer l'onglet sélectionné
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
    
    currentTab = tabName;
    
    // Focus automatique sur le bon champ
    setTimeout(() => {
        if (tabName === 'start') {
            document.getElementById('startDossard').focus();
        } else if (tabName === 'finish') {
            document.getElementById('finishDossard').focus();
        }
    }, 100);
}

// Mise à jour de l'heure en temps réel
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR');
    document.getElementById('startTime').textContent = timeString;
    document.getElementById('finishTime').textContent = timeString;
}

// Fonction pour afficher les alertes
function showAlert(message, type = 'success', duration = 1500) {
    const alertContainer = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, duration);
}

// === SAUVEGARDE LOCALE ===

function sauvegardeLocale() {
    try {
        const backupData = {
            timestamp: new Date().toISOString(),
            records: records,
            version: '1.0'
        };
        
        localStorage.setItem('aquathlon_current', JSON.stringify(backupData));
        lastBackupTime = new Date();
        
    } catch (error) {
        console.error('Erreur sauvegarde locale:', error);
    }
}

function restaurerSauvegarde() {
    try {
        const savedData = localStorage.getItem('aquathlon_current');
        if (savedData) {
            const backup = JSON.parse(savedData);
            if (backup.records && Array.isArray(backup.records)) {
                records = backup.records;
                updateAllTables();
                showAlert(`✅ ${records.length} enregistrements restaurés`, 'success', 3000);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Erreur lors de la restauration:', error);
        showAlert('❌ Erreur lors de la restauration', 'warning', 3000);
        return false;
    }
}

// === FONCTIONS ANTI-CORS ===

// MÉTHODE 1: POST avec form-data (évite preflight CORS)
async function sendToWebhookNoCORS(data) {
    try {
        console.log('=== POST FORM-DATA ===');
        const formData = new URLSearchParams();
        formData.append('data', JSON.stringify(data));
        
        const response = await fetch(webhook_url, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.text();
            console.log('POST form-data success:', result);
            return true;
        } else {
            console.error('POST form-data HTTP error:', response.status);
            return false;
        }
        
    } catch (error) {
        console.error('POST form-data error:', error);
        return false;
    }
}

// MÉTHODE 2: GET avec paramètres (pas de preflight)
async function sendToWebhookViaGET(data) {
    try {
        console.log('=== GET PARAMS ===');
        const params = new URLSearchParams({
            data: JSON.stringify(data),
            action: 'add_records'
        });
        
        const response = await fetch(`${webhook_url}?${params.toString()}`, {
            method: 'GET'
        });
        
        if (response.ok) {
            const result = await response.text();
            console.log('GET success:', result);
            return true;
        } else {
            console.error('GET HTTP error:', response.status);
            return false;
        }
        
    } catch (error) {
        console.error('GET error:', error);
        return false;
    }
}

// MÉTHODE 3: Image tracking (0% CORS)
function sendViaImageTracking(data) {
    return new Promise((resolve, reject) => {
        console.log('=== IMAGE TRACKING ===');
        const img = new Image();
        const params = new URLSearchParams({
            data: JSON.stringify(data),
            method: 'image'
        });
        
        let timeout = setTimeout(() => {
            console.log('Image tracking timeout (mais peut avoir fonctionné)');
            resolve(true);
        }, 10000);
        
        img.onload = () => {
            clearTimeout(timeout);
            console.log('Image tracking success (onload)');
            resolve(true);
        };
        
        img.onerror = () => {
            clearTimeout(timeout);
            console.log('Image tracking "error" (mais peut avoir fonctionné côté serveur)');
            resolve(true);
        };
        
        img.src = `${webhook_url}?${params.toString()}&t=${Date.now()}`;
        console.log('Image tracking URL:', img.src);
    });
}

// === TESTS INDIVIDUELS ===

async function testStep1() {
    if (!webhook_url) {
        showAlert('Configurez d\'abord l\'URL du webhook', 'warning', 3000);
        return;
    }
    
    console.log('=== TEST ÉTAPE 1: POST FORM-DATA ===');
    updateBackupStatus('🔄 Test POST form-data...');
    
    const testData = {
        records: [{
            dossard: 'TEST1',
            type: 'Test Form-Data',
            heure: new Date().toLocaleTimeString()
        }]
    };
    
    try {
        const success = await sendToWebhookNoCORS(testData);
        if (success) {
            updateBackupStatus('✅ POST form-data OK !');
            showAlert('✅ Méthode 1 (Form-data) fonctionne !', 'success', 3000);
        } else {
            updateBackupStatus('❌ POST form-data KO');
            showAlert('❌ Méthode 1 échouée', 'warning', 3000);
        }
    } catch (error) {
        console.error('Erreur test 1:', error);
        updateBackupStatus('❌ POST form-data erreur: ' + error.message);
        showAlert('❌ Méthode 1 erreur: ' + error.message, 'warning', 4000);
    }
}

async function testStep2() {
    if (!webhook_url) {
        showAlert('Configurez d\'abord l\'URL du webhook', 'warning', 3000);
        return;
    }
    
    console.log('=== TEST ÉTAPE 2: GET PARAMS ===');
    updateBackupStatus('🔄 Test GET params...');
    
    const testData = {
        records: [{
            dossard: 'TEST2',
            type: 'Test GET',
            heure: new Date().toLocaleTimeString()
        }]
    };
    
    try {
        const success = await sendToWebhookViaGET(testData);
        if (success) {
            updateBackupStatus('✅ GET params OK !');
            showAlert('✅ Méthode 2 (GET) fonctionne !', 'success', 3000);
        } else {
            updateBackupStatus('❌ GET params KO');
            showAlert('❌ Méthode 2 échouée', 'warning', 3000);
        }
    } catch (error) {
        console.error('Erreur test 2:', error);
        updateBackupStatus('❌ GET params erreur: ' + error.message);
        showAlert('❌ Méthode 2 erreur: ' + error.message, 'warning', 4000);
    }
}

async function testStep3() {
    if (!webhook_url) {
        showAlert('Configurez d\'abord l\'URL du webhook', 'warning', 3000);
        return;
    }
    
    console.log('=== TEST ÉTAPE 3: IMAGE TRACKING ===');
    updateBackupStatus('🔄 Test image tracking...');
    
    const testData = {
        records: [{
            dossard: 'TEST3',
            type: 'Test Image',
            heure: new Date().toLocaleTimeString()
        }]
    };
    
    try {
        await sendViaImageTracking(testData);
        updateBackupStatus('✅ Image tracking tenté (vérifiez dans le Google Sheet)');
        showAlert('✅ Méthode 3 (Image) tentée - vérifiez le Google Sheet !', 'success', 4000);
    } catch (error) {
        console.error('Erreur test 3:', error);
        updateBackupStatus('❌ Image tracking erreur: ' + error.message);
        showAlert('❌ Méthode 3 erreur: ' + error.message, 'warning', 4000);
    }
}

// Configuration webhook
function configurerWebhook() {
    webhook_url = document.getElementById('webhook-url').value;
    if (webhook_url) {
        sync_enabled = true;
        updateBackupStatus('🔗 Webhook configuré - Testez les méthodes ci-dessous');
    } else {
        sync_enabled = false;
    }
}

function updateBackupStatus(message) {
    const statusElement = document.getElementById('backup-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'backup-status ' + 
            (message.includes('❌') ? 'error' : 
                message.includes('☁️') ? 'cloud' : 'success');
    }
}

// === ENREGISTREMENT ET GESTION DES DONNÉES ===

// === ENREGISTREMENT ET GESTION DES DONNÉES ===

function enregistrerDepart() {
    const dossard = document.getElementById('startDossard').value;
    const now = new Date();
    const temps = now.toLocaleTimeString('fr-FR');
    
    records.push({
        id: Date.now(),
        dossard: dossard || 'À saisir',
        type: 'Départ',
        heure: temps,
        timestamp: now.getTime()
    });
    
    updateAllTables();
    triggerAutoSave();
    document.getElementById('startDossard').value = '';
    document.getElementById('startDossard').focus();
    showAlert(`Départ enregistré : ${dossard || 'dossard à saisir'} à ${temps}`, 'success', 1200);
}

function enregistrerArrivee() {
    const dossard = document.getElementById('finishDossard').value;
    const now = new Date();
    const temps = now.toLocaleTimeString('fr-FR');
    
    records.push({
        id: Date.now(),
        dossard: dossard || 'À saisir',
        type: 'Arrivée',
        heure: temps,
        timestamp: now.getTime()
    });
    
    updateAllTables();
    triggerAutoSave();
    document.getElementById('finishDossard').value = '';
    document.getElementById('finishDossard').focus();
    showAlert(`Arrivée enregistrée : ${dossard || 'dossard à saisir'} à ${temps}`, 'success', 800);
}

function triggerAutoSave() {
    if (autoSaveEnabled) {
        sauvegardeLocale();
    }
}

// === GESTION DES TABLEAUX ===

function updateAllTables() {
    updateRecordsTable();
    updateStartRecordsTable();
    updateFinishRecordsTable();
}

function updateStartRecordsTable() {
    const tbody = document.getElementById('startRecordsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const startRecords = records
        .filter(record => record.type === 'Départ')
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
    
    startRecords.forEach(record => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${record.dossard}</td>
            <td>${record.heure}</td>
            <td>
                <button class="btn edit-btn" onclick="modifierRecord(${record.id})">✏️</button>
                <button class="btn delete-btn" onclick="supprimerRecord(${record.id})">🗑️</button>
            </td>
        `;
    });
}

function updateFinishRecordsTable() {
    const tbody = document.getElementById('finishRecordsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const finishRecords = records
        .filter(record => record.type === 'Arrivée')
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
    
    finishRecords.forEach(record => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${record.dossard}</td>
            <td>${record.heure}</td>
            <td>
                <button class="btn edit-btn" onclick="modifierRecord(${record.id})">✏️</button>
                <button class="btn delete-btn" onclick="supprimerRecord(${record.id})">🗑️</button>
            </td>
        `;
    });
}

function updateRecordsTable() {
    const tbody = document.getElementById('recordsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const sortedRecords = records.sort((a, b) => b.timestamp - a.timestamp);
    
    sortedRecords.forEach(record => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${record.dossard}</td>
            <td><span class="status ${record.type === 'Départ' ? 'status-depart' : 'status-arrivee'}">${record.type}</span></td>
            <td>${record.heure}</td>
            <td>
                <button class="btn edit-btn" onclick="modifierRecord(${record.id})">✏️</button>
                <button class="btn delete-btn" onclick="supprimerRecord(${record.id})">🗑️</button>
            </td>
        `;
    });
}

function modifierRecord(id) {
    const record = records.find(r => r.id === id);
    if (record) {
        const nouveauDossard = prompt('Nouveau numéro de dossard:', record.dossard);
        const nouvelleHeure = prompt('Nouvelle heure (HH:MM:SS):', record.heure);
        
        if (nouveauDossard !== null) record.dossard = nouveauDossard;
        if (nouvelleHeure !== null && /^\d{2}:\d{2}:\d{2}$/.test(nouvelleHeure)) {
            record.heure = nouvelleHeure;
        }
        
        updateAllTables();
        triggerAutoSave();
        showAlert('Enregistrement modifié', 'success', 1000);
    }
}

function supprimerRecord(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement ?')) {
        records = records.filter(r => r.id !== id);
        updateAllTables();
        triggerAutoSave();
        showAlert('Enregistrement supprimé', 'success', 1000);
    }
}

// === EXPORT ET UTILITAIRES ===

function exporterCSV() {
    if (records.length === 0) {
        showAlert('Aucune donnée à exporter', 'warning', 2000);
        return;
    }
    
    const headers = 'N° Dossard,Type,Heure\n';
    const csvContent = records
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(record => `${record.dossard},${record.type},${record.heure}`)
        .join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `aquathlon_chronos_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('Export CSV téléchargé !', 'success', 2000);
}

function exporterCSVPourSheets() {
    if (records.length === 0) {
        showAlert('Aucune donnée à exporter', 'warning', 2000);
        return;
    }
    
    const headers = 'Timestamp,N° Dossard,Type,Heure';
    const csvContent = records
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(record => {
            const timestamp = new Date(record.timestamp).toISOString();
            return `${timestamp},${record.dossard},${record.type},${record.heure}`;
        })
        .join('\n');
    
    const fullCSV = headers + '\n' + csvContent;
    
    navigator.clipboard.writeText(fullCSV).then(() => {
        showAlert('✅ CSV copié ! Collez-le dans votre Google Sheet (Ctrl+V)', 'success', 4000);
    }).catch(() => {
        showAlert('❌ Impossible de copier automatiquement', 'warning', 2000);
    });
}

function exporterSauvegardeAuto() {
    if (records.length === 0) {
        showAlert('Aucune donnée à sauvegarder', 'warning', 2000);
        return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const data = {
        exportTime: new Date().toISOString(),
        records: records,
        totalRecords: records.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `aquathlon_backup_${timestamp}.json`;
    a.style.visibility = 'hidden';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('Sauvegarde JSON téléchargée !', 'success', 2000);
}

function viderDonnees() {
    if (confirm('Êtes-vous sûr de vouloir supprimer tous les enregistrements ?')) {
        records = [];
        updateAllTables();
        triggerAutoSave();
        showAlert('Toutes les données ont été supprimées', 'success', 1500);
    }
}

// === GESTION DU CLAVIER ===

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const activeElement = document.activeElement;
        
        if (currentTab === 'start') {
            if (activeElement.id === 'startDossard' || activeElement.tagName !== 'INPUT') {
                event.preventDefault();
                enregistrerDepart();
            }
        }
        else if (currentTab === 'finish') {
            if (activeElement.id === 'finishDossard' || activeElement.tagName !== 'INPUT') {
                event.preventDefault();
                enregistrerArrivee();
            }
        }
    }
});

// === INITIALISATION ===

function startAutoBackup() {
    setInterval(() => {
        if (records.length > 0 && autoSaveEnabled) {
            sauvegardeLocale();
        }
    }, BACKUP_CONFIG.localInterval);
    
    setTimeout(() => {
        if (records.length === 0) {
            restaurerSauvegarde();
        }
    }, 1000);
}

window.onload = function() {
    document.getElementById('startDossard').focus();
    startAutoBackup();
    updateTime();
    setInterval(updateTime, 1000);
    
    if (records.length === 0) {
        setTimeout(restaurerSauvegarde, 500);
    }
};