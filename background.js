// Inizializzazione dell'estensione
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isEnabled: true, blockedCount: 0 });
    console.log('Estensione Blocco Annunci Avanzato installata.');
  });
  
  // Conteggio degli annunci bloccati
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    if (info.request.initiator !== 'chrome-extension://' + chrome.runtime.id) {
      chrome.storage.local.get('blockedCount', (data) => {
        chrome.storage.local.set({ blockedCount: (data.blockedCount || 0) + 1 });
      });
    }
  });
  
  // Gestione dell'attivazione/disattivazione dell'estensione
  chrome.action.onClicked.addListener((tab) => {
    chrome.storage.local.get('isEnabled', (data) => {
      const newState = !data.isEnabled;
      chrome.storage.local.set({ isEnabled: newState }, () => {
        // updateIcon(newState);
        updateRules(newState);
      });
    });
  });
  
  // Aggiornamento dell'icona dell'estensione
  function updateIcon(isEnabled) {
    const path = isEnabled ? 'images/icon48.png' : 'images/icon48_disabled.png';
    chrome.action.setIcon({ path: path });
  }
  
  // Aggiornamento delle regole di blocco
  function updateRules(isEnabled) {
    chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: isEnabled ? [] : ['ruleset_1'],
      enableRulesetIds: isEnabled ? ['ruleset_1'] : []
    });
  }
  
  // Inizializzazione dell'icona
//   updateIcon(true);
  
  // Blocco dei popup
  chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
    chrome.storage.local.get('isEnabled', (data) => {
      if (data.isEnabled) {
        // Controlla se la nuova finestra è stata creata da un'azione dell'utente
        if (!details.sourceFrameId) {
          // Se non è stata creata dall'utente, chiudila
          chrome.tabs.remove(details.tabId);
          console.log('Popup bloccato:', details.url);
        }
      }
    });
  });
  
  // Blocco dei reindirizzamenti
  chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId === 0) {  // Solo per il frame principale
      chrome.storage.local.get('isEnabled', (data) => {
        if (data.isEnabled) {
          // Controlla se l'URL di destinazione corrisponde a un pattern di annuncio noto
          if (/doubleclick\.net|googleadservices\.com|adservice\.google\.com/i.test(details.url)) {
            // Blocca la navigazione solo per questi domini pubblicitari noti
            chrome.tabs.update(details.tabId, {url: "about:blank"});
            console.log('Reindirizzamento bloccato:', details.url);
          }
        }
      });
    }
  });
  
  // Aggiornamento del conteggio dei blocchi nella popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getBlockedCount") {
      chrome.storage.local.get('blockedCount', (data) => {
        sendResponse({blockedCount: data.blockedCount || 0});
      });
      return true;  // Indica che la risposta sarà asincrona
    }
  });
  
  // Funzione per resettare il conteggio dei blocchi
  function resetBlockedCount() {
    chrome.storage.local.set({blockedCount: 0}, () => {
      console.log('Conteggio dei blocchi resettato');
    });
  }
  
  // Resetta il conteggio ogni giorno a mezzanotte
  function scheduleReset() {
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // il giorno successivo
      0, 0, 0 // a mezzanotte
    );
    const msToMidnight = night.getTime() - now.getTime();
  
    setTimeout(() => {
      resetBlockedCount();
      scheduleReset(); // Pianifica il prossimo reset
    }, msToMidnight);
  }
  
  // Avvia la pianificazione del reset
  scheduleReset();