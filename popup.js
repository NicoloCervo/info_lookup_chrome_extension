document.addEventListener('DOMContentLoaded', function() {
  var checkbox = document.getElementById('permanentDisplay');
  
  // Load saved settings
  chrome.storage.sync.get('permanentDisplay', function(data) {
    checkbox.checked = data.permanentDisplay || false;
  });

  // Save settings when changed
  checkbox.addEventListener('change', function() {
    chrome.storage.sync.set({permanentDisplay: checkbox.checked}, function() {
      console.log('Settings saved');
      // Notify content script about the change
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "updateDisplay", permanentDisplay: checkbox.checked});
      });
    });
  });
});