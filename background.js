chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request);
  if (request.action === "fetchInfo") {
    fetch('http://localhost:5001/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ match: request.match }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Fetch successful, sending response:", data);
      sendResponse({ success: true, info: data.info });
    })
    .catch(error => {
      console.error('Error in background script:', error);
      sendResponse({ success: false, error: error.message || "Unknown error occurred" });
    });

    return true;  // Indicates that the response is sent asynchronously
  }
});

console.log("Background script loaded");