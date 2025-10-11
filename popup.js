// Load settings when popup opens
function loadSettings() {
  console.log('Loading settings...');
  chrome.storage.sync.get(['settings'], function(result) {
    console.log('Loaded settings:', result.settings);
    if (result.settings) {
      // Update switch states directly from stored settings
      document.getElementById('disableForSite').checked = result.settings.disableForSite || false;
      document.getElementById('automaticPopup').checked = result.settings.automaticPopup || false;
      document.getElementById('autoReport').checked = result.settings.autoReport || false;
    }
  });
}

function saveSettings() {
  console.log('Saving settings...');
  // Get current values from switches
  const updatedSettings = {
    disableForSite: document.getElementById('disableForSite').checked,
    automaticPopup: document.getElementById('automaticPopup').checked,
    autoReport: document.getElementById('autoReport').checked
  };
  
  console.log('New settings:', updatedSettings);

  // Save to chrome.storage
  chrome.storage.sync.set({ settings: updatedSettings }, function() {
    if (chrome.runtime.lastError) {
      console.error('Error saving settings:', chrome.runtime.lastError);
      return;
    }
    
    console.log('Settings saved successfully');
    currentSettings = updatedSettings;
    
    // Show save confirmation
    const saveBtn = document.getElementById('saveSettingsBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Lagret!';
    saveBtn.classList.add('saved');
    
    // Reset button text after 2 seconds
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.classList.remove('saved');
    }, 2000);
  });
}

// Global state
const data = {
  compliance: 33,
  results: [
    { label: "Third-party tracking script", failed: true },
    { label: "Cross-site identifier cookie", failed: true },
    { label: "Missing cookie banner text", failed: false },
    { label: "Inline advertising tracker", failed: true }
  ]
};

// Default settings
let settings = {
  disableForSite: false,
  automaticPopup: false,
  autoReport: false
};

// Load settings when popup opens
function loadSettings() {
  chrome.storage.sync.get(['settings'], function(result) {
    if (result.settings) {
      settings = result.settings;
      // Update switch states
      document.getElementById('disableForSite').checked = settings.disableForSite;
      document.getElementById('automaticPopup').checked = settings.automaticPopup;
      document.getElementById('autoReport').checked = settings.autoReport;
    }
  });
}

// Add event listeners when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add click handlers for navigation
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = e.target.getAttribute('data-section');
      if (section) {
        show(section);
      }
    });
  });

  // Add click handler for "Read More" link
  const readMoreLink = document.querySelector('.read-more');
  if (readMoreLink) {
    readMoreLink.addEventListener('click', (e) => {
      e.preventDefault();
      show('readmore');
    });
  }

  // Add click handlers for buttons
  document.getElementById('downloadBtn').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Download button clicked');
    downloadReport();
  });

  document.getElementById('reportBtn').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Report button clicked');
    sendReport();
  });

  // Load violations when showing readmore section
  document.getElementById('readmore').addEventListener('show', () => {
    loadViolations();
  });

  // Show initial section and load initial data
  show('summary');
  loadViolations();
});

function show(id) {
  console.log('Showing section:', id);
  
  // Hide all sections
  document.querySelectorAll("section").forEach(s => {
    s.classList.remove("active");
    s.style.display = 'none';
  });
  
  // Show the selected section
  const active = document.getElementById(id);
  if (active) {
    active.classList.add("active");
    active.style.display = 'block';
    
    // Dispatch show event
    const showEvent = new CustomEvent('show');
    active.dispatchEvent(showEvent);
    
    // If showing readmore section, load violations
    if (id === 'readmore') {
      loadViolations();
    }
  } else {
    console.error('Section not found:', id);
  }
  
  // Update active state in navigation
  document.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('data-section') === id) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function loadViolations() {
  const container = document.getElementById("violations");
  container.innerHTML = "";
  data.results.forEach(v => {
    const div = document.createElement("div");
    div.className = "item " + (v.failed ? "bad" : "good");
    div.innerHTML = `
      <div class="label">${v.label}</div>
      <div class="small">${v.failed ? "Violation detected" : "Compliant"}</div>
    `;
    container.appendChild(div);
  });
}

function downloadReport() {
  console.log('Starting download...');
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log('Got tabs:', tabs);
    const currentUrl = tabs[0]?.url || 'Unknown URL';
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:]/g, '-');
    
    // Create the report content
    const reportContent = `CookieGuard Report
-----------------
URL: ${currentUrl}
Date: ${new Date().toLocaleDateString()}
Compliance Score: ${data.compliance}%

Violations Found:
${data.results.map(item => `- ${item.label}: ${item.failed ? 'Failed' : 'Passed'}`).join('\n')}`;

    // Create blob
    const blob = new Blob([reportContent], {type: 'text/plain'});
    const blobUrl = URL.createObjectURL(blob);
    
    console.log('Created blob URL:', blobUrl);
    
    // Trigger download
    chrome.downloads.download({
      url: blobUrl,
      filename: `cookieguard-report-${timestamp}.txt`,
      saveAs: true
    }, (downloadId) => {
      console.log('Download started:', downloadId);
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
        alert('Kunne ikke laste ned rapporten. Prøv igjen.');
      }
      // Clean up
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    });
  });
}

function sendReport() {
  console.log('Preparing report email...');
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log('Got tabs:', tabs);
    const currentUrl = tabs[0]?.url || 'Unknown URL';
    
    const subject = 'Rapportering av Cookie Policy Brudd';
    const body = `
Hei Datatilsynet,

Jeg ønsker å rapportere følgende nettside for brudd på cookie-regler:
${currentUrl}

Oppdagede brudd:
${data.results.filter(item => item.failed)
  .map(item => `- ${item.label}`)
  .join('\n')}

Compliance Score: ${data.compliance}%

Generert av CookieGuard
`;

    const mailtoUrl = `mailto:post@datatilsynet.no?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    console.log('Opening mailto URL');
    
    // Open in new tab instead of using window.open
    chrome.tabs.create({ url: mailtoUrl }, (tab) => {
      console.log('Opened mail client in new tab:', tab);
      if (chrome.runtime.lastError) {
        console.error('Email error:', chrome.runtime.lastError);
        alert('Kunne ikke åpne e-postklient. Prøv igjen.');
      }
    });
  });
}

function saveSettings() {
  console.log('Saving settings...');
  
  const updatedSettings = {
    disableForSite: document.getElementById('disableForSite').checked,
    automaticPopup: document.getElementById('automaticPopup').checked,
    autoReport: document.getElementById('autoReport').checked
  };

  console.log('New settings:', updatedSettings);

  chrome.storage.sync.set({ settings: updatedSettings }, function() {
    if (chrome.runtime.lastError) {
      console.error('Error saving settings:', chrome.runtime.lastError);
      return;
    }

    console.log('Settings saved successfully');
    
    const saveBtn = document.querySelector('.save');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Lagret!';
    saveBtn.classList.add('saved');
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.classList.remove('saved');
    }, 2000);
  });
}
