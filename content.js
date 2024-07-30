// Define your regex patterns
const patterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi // Email pattern
  ];
  
function createLoadingAnimation(span) {
  const frames = ['.  ', '.. ', '...'];
  let currentFrame = 0;
  
  const animate = () => {
    span.textContent = ` [Loading${frames[currentFrame]}]`;
    currentFrame = (currentFrame + 1) % frames.length;
  };

  const intervalId = setInterval(animate, 300);
  return intervalId;
}

// Function to add information next to matched patterns
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
          
          // Create span for the match and info
          const matchSpan = document.createElement('span');
          matchSpan.textContent = match;
          
          const infoSpan = document.createElement('span');
          infoSpan.textContent = ' [Loading...]';
          infoSpan.style.color = 'blue';
          infoSpan.style.cursor = 'pointer';
          
          matchSpan.appendChild(infoSpan);
          fragment.appendChild(matchSpan);
          
          lastIndex = content.indexOf(match, lastIndex) + match.length;
          
          // Start loading animation
          const animationInterval = createLoadingAnimation(infoSpan);
          
          // Fetch information from backend
          fetchInformation(match).then(info => {
            clearInterval(animationInterval);
            infoSpan.textContent = ` [${info}]`;
          }).catch(error => {
            clearInterval(animationInterval);
            console.error("Error fetching information:", error);
            infoSpan.textContent = ` [Error: ${error.toString().replace(/[<>]/g, '')}]`;
            infoSpan.style.color = 'red';
          });
        });
        
        // Add any remaining text
        fragment.appendChild(document.createTextNode(content.slice(lastIndex)));
        
        // Replace the original text node with our fragment
        node.parentNode.replaceChild(fragment, node);
      }
    });
  } else {
    for (let child of node.childNodes) {
      addInformation(child);
    }
  }
}

// Function to fetch information from backend
function fetchInformation(match) {
  return new Promise((resolve, reject) => {
    console.log("Sending message to background script");
    chrome.runtime.sendMessage({ action: "fetchInfo", match: match }, response => {
      console.log("Received response from background script:", response);
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