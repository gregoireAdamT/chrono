// SCRIPT GOOGLE APPS SCRIPT AVEC ONGLETS SÉPARÉS
// Version qui alimente les 3 onglets

const SHEET_ID = '1Pmow1wBR3D1paMLNWNDj6mPaPOiFXfw2iAHNkUg6f2A';

function doPost(e) {
  try {
    console.log('POST reçu:', e);
    
    let data;
    
    // Méthode 1: JSON dans postData (ancien)
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
        console.log('Data depuis JSON:', data);
      } catch (jsonError) {
        console.log('Pas de JSON valide dans contents');
      }
    }
    
    // Méthode 2: Form-data (nouveau, évite CORS)
    if (!data && e.parameter && e.parameter.data) {
      try {
        data = JSON.parse(e.parameter.data);
        console.log('Data depuis form-data:', data);
      } catch (formError) {
        console.log('Erreur parsing form-data:', formError);
      }
    }
    
    if (!data || !data.records) {
      throw new Error('Aucune donnée trouvée');
    }
    
    // Traiter les données dans les 3 onglets
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Créer/obtenir les onglets
    let chronosSheet = getOrCreateSheet(ss, 'Chronos');
    let departsSheet = getOrCreateSheet(ss, 'Départs');  
    let arriveesSheet = getOrCreateSheet(ss, 'Arrivées');
    
    let count = 0;
    let departsCount = 0;
    let arriveesCount = 0;
    
    data.records.forEach((record, index) => {
      console.log(`Record ${index}:`, {
        dossard: record.dossard,
        type: record.type,
        heure: record.heure
      });
      
      const row = [
        new Date(),
        record.dossard || 'N/A',
        record.type || 'N/A',
        record.heure || 'N/A',
        data.source || 'chrono'
      ];
      
      // Ajouter à l'onglet principal (tous les records)
      chronosSheet.appendRow(row);
      count++;
      
      // CORRECTION: Vérification stricte du type
      console.log(`Type détecté pour record ${index}: "${record.type}"`);
      
      if (record.type === 'Départ') {
        console.log(`Record ${index} ajouté aux DÉPARTS`);
        departsSheet.appendRow(row);
        departsCount++;
      } else if (record.type === 'Arrivée') {
        console.log(`Record ${index} ajouté aux ARRIVÉES`);
        arriveesSheet.appendRow(row);
        arriveesCount++;
      } else {
        console.log(`Record ${index} - Type non reconnu: "${record.type}"`);
      }
    });
    
    console.log(`${count} records ajoutés (${departsCount} départs, ${arriveesCount} arrivées)`);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        count: count,
        departs: departsCount,
        arrivees: arriveesCount,
        method: 'POST'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Erreur POST:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        method: 'POST'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    console.log('GET reçu:', e);
    console.log('Parameters:', e.parameter);
    
    // Si c'est une requête image tracking
    if (e.parameter && e.parameter.method === 'image') {
      console.log('=== Image tracking request ===');
      
      if (e.parameter.data) {
        const data = JSON.parse(e.parameter.data);
        console.log('Data depuis image:', data);
        
        // Traiter les données dans les 3 onglets
        const ss = SpreadsheetApp.openById(SHEET_ID);
        let chronosSheet = getOrCreateSheet(ss, 'Chronos');
        let departsSheet = getOrCreateSheet(ss, 'Départs');
        let arriveesSheet = getOrCreateSheet(ss, 'Arrivées');
        
        let count = 0;
        data.records.forEach((record, index) => {
          console.log(`Record ${index}:`, {
            dossard: record.dossard,
            type: record.type,
            heure: record.heure
          });
          
          const row = [
            new Date(),
            record.dossard || 'N/A',
            record.type || 'N/A',
            record.heure || 'N/A',
            'image_tracking'
          ];
          
          chronosSheet.appendRow(row);
          count++;
          
          console.log(`Type détecté pour record ${index}: "${record.type}"`);
          
          if (record.type === 'Départ') {
            console.log(`Record ${index} ajouté aux DÉPARTS (image)`);
            departsSheet.appendRow(row);
          } else if (record.type === 'Arrivée') {
            console.log(`Record ${index} ajouté aux ARRIVÉES (image)`);
            arriveesSheet.appendRow(row);
          } else {
            console.log(`Record ${index} - Type non reconnu (image): "${record.type}"`);
          }
        });
        
        console.log(`${count} records ajoutés via image tracking`);
      }
      
      // Retourner une image 1x1 transparente
      const transparentPixel = Utilities.base64Decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
      return Utilities.newBlob(transparentPixel, 'image/png');
    }
    
    // Si pas de paramètres, retourner status
    if (!e.parameter || !e.parameter.data) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: 'Webhook opérationnel',
          timestamp: new Date().toISOString(),
          methods: ['GET', 'POST', 'Image tracking']
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Traiter les données envoyées via GET normal
    const data = JSON.parse(e.parameter.data);
    console.log('Data depuis GET:', data);
    
    if (!data.records) {
      throw new Error('Pas de records dans les données GET');
    }
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let chronosSheet = getOrCreateSheet(ss, 'Chronos');
    let departsSheet = getOrCreateSheet(ss, 'Départs');
    let arriveesSheet = getOrCreateSheet(ss, 'Arrivées');
    
    let count = 0;
    let departsCount = 0;
    let arriveesCount = 0;
    
    data.records.forEach((record, index) => {
      console.log(`GET Record ${index}:`, {
        dossard: record.dossard,
        type: record.type,
        heure: record.heure
      });
      
      const row = [
        new Date(),
        record.dossard || 'N/A',
        record.type || 'N/A',
        record.heure || 'N/A',
        'GET'
      ];
      
      chronosSheet.appendRow(row);
      count++;
      
      console.log(`GET Type détecté pour record ${index}: "${record.type}"`);
      
      if (record.type === 'Départ') {
        console.log(`GET Record ${index} ajouté aux DÉPARTS`);
        departsSheet.appendRow(row);
        departsCount++;
      } else if (record.type === 'Arrivée') {
        console.log(`GET Record ${index} ajouté aux ARRIVÉES`);
        arriveesSheet.appendRow(row);
        arriveesCount++;
      } else {
        console.log(`GET Record ${index} - Type non reconnu: "${record.type}"`);
      }
    });
    
    console.log(`${count} records ajoutés via GET`);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        count: count,
        departs: departsCount,
        arrivees: arriveesCount,
        method: 'GET'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Erreur GET:', error);
    
    // En cas d'erreur dans image tracking, retourner quand même une image
    if (e.parameter && e.parameter.method === 'image') {
      const transparentPixel = Utilities.base64Decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
      return Utilities.newBlob(transparentPixel, 'image/png');
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        method: 'GET'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fonction pour créer ou obtenir un onglet avec en-têtes
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (sheet === null) {
    // Créer l'onglet
    sheet = spreadsheet.insertSheet(sheetName);
    
    // Ajouter les en-têtes
    const headers = ['Timestamp', 'N° Dossard', 'Type', 'Heure', 'Source'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Mise en forme
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('white');
    sheet.autoResizeColumns(1, headers.length);
  }
  
  return sheet;
}

// Test avec les nouvelles méthodes
function testNouvellesMethods() {
  console.log('=== Test POST form-data ===');
  const postResult = doPost({
    parameter: {
      data: JSON.stringify({
        records: [{
          dossard: 'TEST-POST',
          type: 'Test POST',
          heure: new Date().toLocaleTimeString()
        }]
      })
    }
  });
  console.log('POST result:', postResult.getContent());
  
  console.log('=== Test GET params ===');
  const getResult = doGet({
    parameter: {
      data: JSON.stringify({
        records: [{
          dossard: 'TEST-GET',
          type: 'Test GET',
          heure: new Date().toLocaleTimeString()
        }]
      })
    }
  });
  console.log('GET result:', getResult.getContent());
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
            console.log('❌ Méthode 1: insertSheet a retourné null');
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
              console.log('❌ Méthode 2: insertSheet() a retourné null');
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
              console.log('❌ Méthode 3: Aucun onglet existant trouvé');
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
    firstSheet.getRange('A2').setValue('Test diagnostic - ' + new Date());
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