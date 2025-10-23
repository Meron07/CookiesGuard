/**
 * Background Service Worker
 * Handles communication between content script and popup
 */

// Store violations for current tab
let tabViolations = {};

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'COOKIE_VIOLATIONS_DETECTED') {
    const tabId = sender.tab?.id;
    
    if (tabId) {
      // Store violations for this tab
      tabViolations[tabId] = {
        violations: message.violations,
        url: message.url,
        timestamp: Date.now()
      };
      
      console.log('Stored violations for tab', tabId, ':', message.violations);
      
      // Update badge to show violations count
      const violationCount = Object.values(message.violations).filter(v => v === true).length;
      
      if (violationCount > 0) {
        chrome.action.setBadgeText({
          text: violationCount.toString(),
          tabId: tabId
        });
        chrome.action.setBadgeBackgroundColor({
          color: '#e74c3c',
          tabId: tabId
        });
      } else {
        chrome.action.setBadgeText({
          text: '✓',
          tabId: tabId
        });
        chrome.action.setBadgeBackgroundColor({
          color: '#2ecc71',
          tabId: tabId
        });
      }
    }
    
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

// Listen for requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_VIOLATIONS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      
      if (tabId && tabViolations[tabId]) {
        sendResponse({
          success: true,
          data: tabViolations[tabId]
        });
      } else {
        sendResponse({
          success: false,
          message: 'No violations data found for current tab'
        });
      }
    });
    
    return true; // Keep message channel open
  }
});

// Clean up old violations when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabViolations[tabId];
});

// Clear badge when navigating to new page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    delete tabViolations[tabId];
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
});

console.log('CookieGuard background service worker initialized');
