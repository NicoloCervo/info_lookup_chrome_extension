let permanentDisplay = false;

const patterns = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi // Email pattern
];

chrome.storage.sync.get('permanentDisplay', function(data) {
  permanentDisplay = data.permanentDisplay || false;
  applyDisplaySetting();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "updateDisplay") {
    permanentDisplay = request.permanentDisplay;
    applyDisplaySetting();
  }
});

function applyDisplaySetting() {
  const overlays = document.querySelectorAll('.regex-match-overlay');
  overlays.forEach(overlay => {
    if (permanentDisplay) {
      overlay.style.display = 'inline';
      overlay.parentNode.removeEventListener('mouseenter', showOverlay);
      overlay.parentNode.removeEventListener('mouseleave', hideOverlay);
    } else {
      overlay.style.display = 'none';
      overlay.parentNode.addEventListener('mouseenter', showOverlay);
      overlay.parentNode.addEventListener('mouseleave', hideOverlay);
    }
  });
}

function showOverlay() {
  this.querySelector('.regex-match-overlay').style.display = 'inline';
}

function hideOverlay() {
  this.querySelector('.regex-match-overlay').style.display = 'none';
}

function addInformation(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    let content = node.textContent;
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        
        matches.forEach(match => {
          // Add text before the match
          fragment.appendChild(document.createTextNode(content.slice(lastIndex, content.indexOf(match, lastIndex))));
          
          // Create wrapper for match and overlay
          const wrapper = document.createElement('span');
          wrapper.style.position = 'relative';
          wrapper.style.display = 'inline-block';
          
          // Add match text
          const matchSpan = document.createElement('span');
          matchSpan.textContent = match;
          matchSpan.className = 'regex-match';
          wrapper.appendChild(matchSpan);
          
          // Create overlay
          const overlay = document.createElement('span');
          overlay.className = 'regex-match-overlay';
          overlay.style.position = 'absolute';
          overlay.style.left = '100%';
          overlay.style.top = '0';
          overlay.style.zIndex = '1000';
          overlay.style.padding = '2px 5px';
          overlay.style.borderRadius = '3px';
          overlay.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.2)';
          overlay.style.whiteSpace = 'nowrap';
          overlay.textContent = '[Loading...]';
          overlay.style.display = permanentDisplay ? 'inline' : 'none';
          wrapper.appendChild(overlay);
          
          if (!permanentDisplay) {
            wrapper.addEventListener('mouseenter', showOverlay);
            wrapper.addEventListener('mouseleave', hideOverlay);
          }
          
          fragment.appendChild(wrapper);
          
          lastIndex = content.indexOf(match, lastIndex) + match.length;
          
          // Fetch information from backend
          fetchInformation(match).then(info => {
            overlay.textContent = `[${info}]`;
          }).catch(error => {
            console.error("Error fetching information:", error);
            overlay.textContent = `[Error: ${error.toString().replace(/[<>]/g, '')}]`;
            overlay.style.color = 'red';
          });
        });
        
        // Add any remaining text
        fragment.appendChild(document.createTextNode(content.slice(lastIndex)));
        
        // Replace the original text node with our fragment
        node.parentNode.replaceChild(fragment, node);
      }
    });
  } else {
    Array.from(node.childNodes).forEach(addInformation);
  }
}

// Add a style to highlight matches
const style = document.createElement('style');
style.textContent = `
  .regex-match {
    background-color: #ffad008c;
    cursor: pointer;
  }
`;
document.head.appendChild(style);

// Function to fetch information from backend
function fetchInformation(match) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "fetchInfo", match: match }, response => {
      if (chrome.runtime.lastError) {
        console.error("Runtime error:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError.message);
      } else if (response && response.success) {
        resolve(response.info);
      } else {
        reject(response ? response.error : "Unknown error");
      }
    });
  });
}

// Run the script
console.log("Content script starting");
addInformation(document.body);
console.log("Content script finished initial run");