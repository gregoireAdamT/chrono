// SCRIPT GOOGLE APPS SCRIPT POUR CHRONOMÉTRAGE AQUATHLON
// À déployer comme Web App

// ⚠️ IMPORTANT: REMPLACEZ L'ID CI-DESSOUS PAR VOTRE VRAI ID DE GOOGLE SHEET
const SHEET_ID = '1Pmow1wBR3D1paMLNWNDj6mPaPOiFXfw2iAHNkUg6f2A'; // <-- VOTRE ID EST DÉJÀ LÀ !

// CORRECTION CORS: Google Apps Script gère automatiquement CORS pour les Web Apps
// Il suffit de s'assurer que le déploiement est accessible à "Tout le monde"

function doPost(e) {
  try {
    // Récupérer les données envoyées par les chronos
    const data = JSON.parse(e.postData.contents);
    console.log('Données reçues:', data);
    
    // Initialiser le spreadsheet et les onglets
    const spreadsheet = initSpreadsheet();
    
    // Traiter les données selon le type
    let departsCount = 0;
    let arriveesCount = 0;
    
    data.records.forEach(record => {
      const row = [
        new Date(record.timestamp),
        record.dossard,
        record.type,
        record.heure,
        data.source || 'chrono',
        new Date() // Timestamp de réception
      ];
      
      // Ajouter à l'onglet principal (tout)
      const sheetPrincipal = spreadsheet.getSheetByName('Chronos');
      sheetPrincipal.appendRow(row);
      
      // Ajouter aux onglets spécialisés
      if (record.type === 'Départ') {
        const sheetDeparts = spreadsheet.getSheetByName('Départs');
        sheetDeparts.appendRow(row);
        departsCount++;
      } else if (record.type === 'Arrivée') {
        const sheetArrivees = spreadsheet.getSheetByName('Arrivées');
        sheetArrivees.appendRow(row);
        arriveesCount++;
      }
    });
    
    // Log pour debug
    console.log(`Traités: ${data.records.length} records (${departsCount} départs, ${arriveesCount} arrivées)`);
    
    // Retourner succès (Apps Script gère automatiquement CORS)
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: `${data.records.length} records ajoutés`,
        details: {
          departs: departsCount,
          arrivees: arriveesCount,
          timestamp: new Date().toISOString()
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log d'erreur détaillé
    console.error('Erreur webhook:', error);
    
    // Retourner erreur
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Erreur lors du traitement des données',
        sheet_id: SHEET_ID
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// FONCTION GET pour test simple
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Webhook opérationnel',
        sheet_name: spreadsheet.getName(),
        sheet_url: spreadsheet.getUrl(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// FONCTION SIMPLE POUR FORCER L'AUTORISATION (LANCEZ CELLE-CI D'ABORD)
function autoriserPermissions() {
  try {
    console.log('🔐 Test d\'autorisation...');
    
    // Test simple d'accès à Google Sheets
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    console.log('✅ Spreadsheet accessible:', spreadsheet.getName());
    console.log('📊 URL:', spreadsheet.getUrl());
    
    // Test d'écriture simple
    let sheet = spreadsheet.getSheetByName('Test');
    if (sheet === null) {
      sheet = spreadsheet.insertSheet('Test');
    }
    
    // Écrire une cellule de test
    sheet.getRange('A1').setValue('Test autorisation - ' + new Date());
    console.log('✅ Écriture autorisée');
    
    return '✅ PERMISSIONS ACCORDÉES ! Vous pouvez maintenant utiliser les autres fonctions.';
    
  } catch (error) {
    console.error('❌ Erreur d\'autorisation:', error);
    
    if (error.toString().includes('Access denied')) {
      return '❌ ACCÈS REFUSÉ - Suivez les instructions pour autoriser le script';
    } else if (error.toString().includes('Invalid value')) {
      return '❌ ID DE SHEET INVALIDE - Vérifiez que l\'ID est correct';
    } else {
      return `❌ ERREUR: ${error.toString()}`;
    }
  }
}

// Fonction pour initialiser le spreadsheet et créer les onglets
function initSpreadsheet() {
  try {
    // Ouvrir le spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    console.log('Spreadsheet ouvert:', spreadsheet.getName());
    
    // Configuration des onglets
    const ONGLETS_CONFIG = [
      { nom: 'Chronos', description: 'Tous les enregistrements' },
      { nom: 'Départs', description: 'Départs seulement' },
      { nom: 'Arrivées', description: 'Arrivées seulement' }
    ];
    
    // Créer/vérifier chaque onglet
    ONGLETS_CONFIG.forEach(config => {
      let sheet = null;
      
      // Essayer d'obtenir l'onglet existant
      try {
        sheet = spreadsheet.getSheetByName(config.nom);
        console.log(`Onglet '${config.nom}' existe déjà`);
      } catch (e) {
        // L'onglet n'existe pas, le créer avec gestion d'erreur robuste
        console.log(`Création de l'onglet '${config.nom}'...`);
        
        try {
          sheet = spreadsheet.insertSheet(config.nom);
          console.log(`Onglet '${config.nom}' créé avec insertSheet()`);
        } catch (insertError) {
          // Fallback: utiliser insertSheet sans nom puis renommer
          console.log('insertSheet() avec nom a échoué, essai avec méthode alternative...');
          sheet = spreadsheet.insertSheet();
          sheet.setName(config.nom);
          console.log(`Onglet '${config.nom}' créé avec méthode alternative`);
        }
      }
      
      // Vérifier que sheet n'est pas null avant de continuer
      if (!sheet) {
        throw new Error(`Impossible de créer ou d'accéder à l'onglet '${config.nom}'`);
      }
      
      // Configurer les en-têtes si nécessaire (avec vérification supplémentaire)
      try {
        const lastRow = sheet.getLastRow();
        console.log(`Onglet '${config.nom}' - dernière ligne: ${lastRow}`);
        
        if (lastRow === 0) {
          setupHeaders(sheet);
          console.log(`En-têtes ajoutés à '${config.nom}'`);
        } else {
          console.log(`Onglet '${config.nom}' a déjà des données (${lastRow} lignes)`);
        }
      } catch (headerError) {
        console.error(`Erreur lors de la configuration des en-têtes pour '${config.nom}':`, headerError);
        // Essayer de toute façon d'ajouter les en-têtes
        try {
          setupHeaders(sheet);
          console.log(`En-têtes ajoutés à '${config.nom}' (après erreur)`);
        } catch (retryError) {
          console.error(`Impossible d'ajouter les en-têtes à '${config.nom}':`, retryError);
        }
      }
    });
    
    return spreadsheet;
    
  } catch (error) {
    console.error('Erreur init spreadsheet:', error);
    throw new Error(`Impossible d'ouvrir le Google Sheet. Erreur: ${error.toString()}`);
  }
}

// Fonction pour configurer les en-têtes d'un onglet (version renforcée)
function setupHeaders(sheet) {
  try {
    const headers = [
      'Timestamp',
      'N° Dossard', 
      'Type',
      'Heure',
      'Source',
      'Reçu le'
    ];
    
    // Ajouter les en-têtes avec vérification
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    console.log('Headers écrits:', headers);
    
    // Mise en forme des en-têtes (avec gestion d'erreur)
    try {
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      console.log('Mise en forme des en-têtes appliquée');
    } catch (formatError) {
      console.log('Mise en forme des en-têtes échouée (pas grave):', formatError);
    }
    
    // Auto-ajuster les colonnes (avec gestion d'erreur)
    try {
      sheet.autoResizeColumns(1, headers.length);
      console.log('Colonnes auto-ajustées');
    } catch (resizeError) {
      console.log('Auto-ajustement des colonnes échoué (pas grave):', resizeError);
    }
    
  } catch (error) {
    console.error('Erreur dans setupHeaders:', error);
    throw error;
  }
}

// NOUVELLE FONCTION: Création d'onglet pas à pas pour debug (VERSION CORRIGÉE)
function creerOngletsUnParUn() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    console.log('=== CRÉATION D\'ONGLETS ÉTAPE PAR ÉTAPE ===');
    
    const onglets = ['Chronos', 'Départs', 'Arrivées'];
    
    for (let i = 0; i < onglets.length; i++) {
      const nomOnglet = onglets[i];
      console.log(`\n--- Traitement de l'onglet: ${nomOnglet} ---`);
      
      let sheet = null;
      
      // CORRECTION: Vérifier si l'onglet existe (getSheetByName peut retourner null)
      sheet = spreadsheet.getSheetByName(nomOnglet);
      
      if (sheet !== null) {
        console.log(`✅ Onglet '${nomOnglet}' existe déjà`);
      } else {
        console.log(`🔧 Onglet '${nomOnglet}' n'existe pas, création...`);
        
        // Méthode 1: insertSheet avec nom
        try {
          sheet = spreadsheet.insertSheet(nomOnglet);
          if (sheet !== null) {
            console.log(`✅ Méthode 1 réussie pour '${nomOnglet}'`);
          } else {
            console.log(`❌ Méthode 1: insertSheet a retourné null`);
          }
        } catch (e1) {
          console.log(`❌ Méthode 1 échouée: ${e1}`);
          sheet = null;
        }
        
        // Méthode 2: insertSheet puis renommer (si méthode 1 a échoué)
        if (sheet === null) {
          try {
            sheet = spreadsheet.insertSheet();
            if (sheet !== null) {
              sheet.setName(nomOnglet);
              console.log(`✅ Méthode 2 réussie pour '${nomOnglet}'`);
            } else {
              console.log(`❌ Méthode 2: insertSheet() a retourné null`);
            }
          } catch (e2) {
            console.log(`❌ Méthode 2 échouée: ${e2}`);
            sheet = null;
          }
        }
        
        // Méthode 3: Utiliser l'onglet par défaut et le renommer (si tout a échoué)
        if (sheet === null && i === 0) { // Premier onglet seulement
          try {
            const sheets = spreadsheet.getSheets();
            console.log(`Onglets existants: ${sheets.length}`);
            if (sheets.length > 0) {
              sheet = sheets[0];
              const ancienNom = sheet.getName();
              sheet.setName(nomOnglet);
              console.log(`✅ Méthode 3 réussie pour '${nomOnglet}' (renommé '${ancienNom}' → '${nomOnglet}')`);
            } else {
              console.log(`❌ Méthode 3: Aucun onglet existant trouvé`);
            }
          } catch (e3) {
            console.log(`❌ Méthode 3 échouée: ${e3}`);
          }
        }
      }
      
      // Vérifier que nous avons bien un onglet
      if (sheet === null) {
        console.log(`❌ ÉCHEC TOTAL: Impossible de créer/accéder à l'onglet '${nomOnglet}'`);
        continue;
      }
      
      console.log(`🔍 Test de l'onglet '${nomOnglet}':`);
      console.log(`   - Nom: ${sheet.getName()}`);
      console.log(`   - ID: ${sheet.getSheetId()}`);
      
      // Test getLastRow avec gestion d'erreur
      try {
        const lastRow = sheet.getLastRow();
        console.log(`   - Dernière ligne: ${lastRow}`);
        
        // Ajouter les en-têtes si nécessaire
        if (lastRow === 0) {
          console.log(`🔧 Ajout des en-têtes à '${nomOnglet}'`);
          
          const headers = ['Timestamp', 'N° Dossard', 'Type', 'Heure', 'Source', 'Reçu le'];
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          
          console.log(`✅ En-têtes ajoutés à '${nomOnglet}'`);
        } else {
          console.log(`ℹ️ Onglet '${nomOnglet}' a déjà des données`);
        }
        
      } catch (rowError) {
        console.log(`❌ Erreur getLastRow pour '${nomOnglet}': ${rowError}`);
        
        // Essayer de toute façon d'écrire les en-têtes
        try {
          const headers = ['Timestamp', 'N° Dossard', 'Type', 'Heure', 'Source', 'Reçu le'];
          sheet.getRange('A1:F1').setValues([headers]);
          console.log(`✅ En-têtes ajoutés par méthode alternative à '${nomOnglet}'`);
        } catch (altError) {
          console.log(`❌ Échec total pour '${nomOnglet}': ${altError}`);
        }
      }
      
      // Petit délai entre les créations
      Utilities.sleep(1000);
    }
    
    console.log('\n=== RÉSUMÉ ===');
    const allSheets = spreadsheet.getSheets();
    console.log(`Nombre total d'onglets: ${allSheets.length}`);
    allSheets.forEach((s, idx) => {
      console.log(`  ${idx + 1}. ${s.getName()} (${s.getLastRow()} lignes)`);
    });
    
    return '✅ Création terminée - Vérifiez les logs pour les détails';
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
    return `❌ ERREUR: ${error.toString()}`;
  }
}

// Fonction pour initialiser le spreadsheet et créer les onglets (VERSION CORRIGÉE)
function initSpreadsheet() {
  try {
    // Ouvrir le spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    console.log('Spreadsheet ouvert:', spreadsheet.getName());
    
    // Configuration des onglets
    const ONGLETS_CONFIG = [
      { nom: 'Chronos', description: 'Tous les enregistrements' },
      { nom: 'Départs', description: 'Départs seulement' },
      { nom: 'Arrivées', description: 'Arrivées seulement' }
    ];
    
    // Créer/vérifier chaque onglet
    ONGLETS_CONFIG.forEach(config => {
      let sheet = null;
      
      // CORRECTION: Vérifier si l'onglet existe (sans try/catch car getSheetByName peut retourner null)
      sheet = spreadsheet.getSheetByName(config.nom);
      
      if (sheet !== null) {
        console.log(`Onglet '${config.nom}' existe déjà`);
      } else {
        // L'onglet n'existe pas, le créer
        console.log(`Création de l'onglet '${config.nom}'...`);
        
        try {
          sheet = spreadsheet.insertSheet(config.nom);
          if (sheet === null) {
            // Fallback si insertSheet retourne null
            sheet = spreadsheet.insertSheet();
            if (sheet !== null) {
              sheet.setName(config.nom);
            }
          }
          console.log(`Onglet '${config.nom}' créé`);
        } catch (insertError) {
          console.error(`Erreur création onglet '${config.nom}':`, insertError);
          // Essayer méthode alternative
          try {
            sheet = spreadsheet.insertSheet();
            if (sheet !== null) {
              sheet.setName(config.nom);
              console.log(`Onglet '${config.nom}' créé avec méthode alternative`);
            }
          } catch (altError) {
            console.error(`Échec complet pour '${config.nom}':`, altError);
            throw new Error(`Impossible de créer l'onglet '${config.nom}'`);
          }
        }
      }
      
      // Vérifier que sheet n'est pas null avant de continuer
      if (sheet === null) {
        throw new Error(`L'onglet '${config.nom}' est null après création`);
      }
      
      // Configurer les en-têtes si nécessaire (avec vérification supplémentaire)
      try {
        const lastRow = sheet.getLastRow();
        console.log(`Onglet '${config.nom}' - dernière ligne: ${lastRow}`);
        
        if (lastRow === 0) {
          setupHeaders(sheet);
          console.log(`En-têtes ajoutés à '${config.nom}'`);
        } else {
          console.log(`Onglet '${config.nom}' a déjà des données (${lastRow} lignes)`);
        }
      } catch (headerError) {
        console.error(`Erreur lors de la configuration des en-têtes pour '${config.nom}':`, headerError);
        // Essayer de toute façon d'ajouter les en-têtes
        try {
          setupHeaders(sheet);
          console.log(`En-têtes ajoutés à '${config.nom}' (après erreur)`);
        } catch (retryError) {
          console.error(`Impossible d'ajouter les en-têtes à '${config.nom}':`, retryError);
          // Ne pas faire échouer tout le processus pour ça
        }
      }
    });
    
    return spreadsheet;
    
  } catch (error) {
    console.error('Erreur init spreadsheet:', error);
    throw new Error(`Impossible d'initialiser le Google Sheet. Erreur: ${error.toString()}`);
  }
}

// FONCTION ALTERNATIVE: Créer les onglets manuellement un par un
function creerOngletManuel(nomOnglet) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    console.log(`=== CRÉATION MANUELLE DE L'ONGLET: ${nomOnglet} ===`);
    
    // Vérifier s'il existe déjà
    let sheet = spreadsheet.getSheetByName(nomOnglet);
    
    if (sheet !== null) {
      console.log(`✅ L'onglet '${nomOnglet}' existe déjà`);
      return sheet;
    }
    
    // Créer l'onglet
    console.log(`🔧 Création de l'onglet '${nomOnglet}'...`);
    sheet = spreadsheet.insertSheet(nomOnglet);
    
    if (sheet === null) {
      throw new Error(`insertSheet a retourné null pour '${nomOnglet}'`);
    }
    
    console.log(`✅ Onglet '${nomOnglet}' créé avec succès`);
    
    // Ajouter les en-têtes
    const headers = ['Timestamp', 'N° Dossard', 'Type', 'Heure', 'Source', 'Reçu le'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    console.log(`✅ En-têtes ajoutés à '${nomOnglet}'`);
    
    return sheet;
    
  } catch (error) {
    console.error(`❌ Erreur création '${nomOnglet}':`, error);
    throw error;
  }
}

// FONCTION POUR CRÉER LES 3 ONGLETS UN PAR UN
function creerTousLesOnglets() {
  const onglets = ['Chronos', 'Départs', 'Arrivées'];
  const resultats = [];
  
  for (const nom of onglets) {
    try {
      const sheet = creerOngletManuel(nom);
      resultats.push(`✅ ${nom}: OK`);
    } catch (error) {
      resultats.push(`❌ ${nom}: ${error.toString()}`);
    }
  }
  
  console.log('=== RÉSULTATS ===');
  resultats.forEach(r => console.log(r));
  
  return resultats.join('\n');
}

// Fonction pour tester le script manuellement
function testerScript() {
  try {
    console.log('=== DÉBUT DU TEST ===');
    
    // Tester l'initialisation du spreadsheet
    const spreadsheet = initSpreadsheet();
    console.log('✅ Spreadsheet initialisé avec succès');
    
    // Données de test
    const testData = {
      timestamp: new Date().toISOString(),
      records: [
        {
          id: 1,
          dossard: '001',
          type: 'Départ',
          heure: '10:00:15',
          timestamp: Date.now()
        },
        {
          id: 2,
          dossard: '001',
          type: 'Arrivée',
          heure: '10:25:30',
          timestamp: Date.now() + 1000000
        }
      ],
      source: 'test_manuel'
    };
    
    // Simuler un POST request
    const mockEvent = {
      postData: {
        contents: JSON.stringify(testData)
      }
    };
    
    const result = doPost(mockEvent);
    console.log('✅ Test réussi !');
    console.log('Résultat:', result.getContent());
    
    return '✅ TOUT FONCTIONNE !';
    
  } catch (error) {
    console.error('❌ Erreur de test:', error);
    return `❌ ERREUR: ${error.toString()}`;
  }
}

// Fonction d'initialisation manuelle (pour forcer la création des onglets)
function initialiserOnglets() {
  try {
    const spreadsheet = initSpreadsheet();
    console.log('✅ Onglets initialisés avec succès');
    console.log('📊 Accédez à votre Google Sheet:', spreadsheet.getUrl());
    return spreadsheet.getUrl();
  } catch (error) {
    console.error('❌ Erreur initialisation:', error);
    throw error;
  }
}

// NOUVELLE FONCTION: Diagnostic complet
function diagnosticComplet() {
  console.log('=== DIAGNOSTIC COMPLET ===');
  console.log('SHEET_ID:', SHEET_ID);
  console.log('User email:', Session.getActiveUser().getEmail());
  
  try {
    // Test 1: Accès de base
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    console.log('✅ Test 1 - Accès de base: OK');
    console.log('   Nom:', spreadsheet.getName());
    console.log('   URL:', spreadsheet.getUrl());
    
    // Test 2: Lecture
    const sheets = spreadsheet.getSheets();
    console.log('✅ Test 2 - Lecture: OK');
    console.log('   Nombre d\'onglets:', sheets.length);
    
    // Test 3: Écriture
    const firstSheet = sheets[0];
    firstSheet.getRange('A1').setValue('Test diagnostic - ' + new Date());
    console.log('✅ Test 3 - Écriture: OK');
    
    return '✅ TOUS LES TESTS SONT PASSÉS !';
    
  } catch (error) {
    console.error('❌ Diagnostic échoué:', error);
    
    if (error.toString().includes('Permission denied')) {
      console.log('💡 SOLUTION: Exécutez la fonction "autoriserPermissions" d\'abord');
    } else if (error.toString().includes('Invalid value')) {
      console.log('💡 SOLUTION: Vérifiez que l\'ID du Google Sheet est correct');
    }
    
    return `❌ ÉCHEC: ${error.toString()}`;
  }
}