document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  const countElement = document.getElementById('count');
  const toggleButton = document.getElementById('toggleButton');

  function updateUI() {
      chrome.storage.local.get(['isEnabled', 'blockedCount'], function(data) {
          statusElement.textContent = data.isEnabled ? 'Attivo' : 'Disattivato';
          statusElement.style.color = data.isEnabled ? '#27ae60' : '#e74c3c';
          countElement.textContent = data.blockedCount || 0;
          toggleButton.textContent = data.isEnabled ? 'Disattiva' : 'Attiva';
      });
  }

  toggleButton.addEventListener('click', function() {
      chrome.storage.local.get('isEnabled', function(data) {
          const newState = !data.isEnabled;
          chrome.storage.local.set({ isEnabled: newState }, function() {
              updateUI();
              chrome.runtime.sendMessage({ action: "updateIcon", isEnabled: newState });
          });
      });
  });

  // Aggiorna il conteggio in tempo reale
  function updateCount() {
      chrome.runtime.sendMessage({ action: "getBlockedCount" }, function(response) {
          countElement.textContent = response.blockedCount;
      });
  }

  // Aggiorna l'UI inizialmente e imposta un intervallo per gli aggiornamenti
  updateUI();
  updateCount();
  setInterval(updateCount, 5000); // Aggiorna ogni 5 secondi
});