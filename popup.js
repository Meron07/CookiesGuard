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
let scoringSystem = new CookieScoringSystem();

// Example data - this will be replaced with actual detection logic
const data = {
  compliance: 33,
  results: []
};

// Initialize scoring system with violations from content script
function initializeScoringSystem() {
  console.log('[CookieGuard Popup] Initializing scoring system...');
  scoringSystem.reset();
  
  // Request violations from background script
  chrome.runtime.sendMessage({ type: 'GET_VIOLATIONS' }, (response) => {
    console.log('[CookieGuard Popup] Received response:', response);
    
    if (response && response.success && response.data) {
      const violations = response.data.violations;
      console.log('[CookieGuard Popup] Processing violations:', violations);
      
      // Add violations based on detection results
      scoringSystem.addViolation('NO_REJECT_BUTTON', violations.NO_REJECT_BUTTON);
      scoringSystem.addViolation('LAYERING', violations.LAYERING, { 
        note: violations.LAYERING ? 'User must click through multiple pages to reject cookies' : null
      });
      scoringSystem.addViolation('PRE_TICKED_BOXES', violations.PRE_TICKED_BOXES);
      scoringSystem.addViolation('LINK_INSTEAD_OF_BUTTON', violations.LINK_INSTEAD_OF_BUTTON, {
        note: violations.LINK_INSTEAD_OF_BUTTON ? 'Reject option is hidden in small text link' : null
      });
      scoringSystem.addViolation('REFUSE_OUTSIDE_BANNER', violations.REFUSE_OUTSIDE_BANNER);
      scoringSystem.addViolation('LACK_OF_INFORMATION', violations.LACK_OF_INFORMATION);
      scoringSystem.addViolation('DIFFERENT_COLORED_BUTTONS', violations.DIFFERENT_COLORED_BUTTONS, {
        note: violations.DIFFERENT_COLORED_BUTTONS ? 'Accept button is more prominent than reject' : null
      });
      scoringSystem.addViolation('LEGITIMATE_INTEREST', violations.LEGITIMATE_INTEREST, {
        note: violations.LEGITIMATE_INTEREST ? 'Non-essential cookies categorized under legitimate interest' : null
      });
      scoringSystem.addViolation('INACCURATE_ESSENTIAL_CLASSIFICATION', violations.INACCURATE_ESSENTIAL_CLASSIFICATION);
      scoringSystem.addViolation('NO_WITHDRAW_CONSENT', violations.NO_WITHDRAW_CONSENT);
      
      // Update data.results from scoring system
      const summary = scoringSystem.getSummary();
      console.log('[CookieGuard Popup] Score summary:', summary);
      data.compliance = summary.overallScore;
      data.results = summary.violations.map(v => ({
        label: v.name,
        failed: true,
        description: v.description,
        darkPattern: v.darkPattern,
        complianceImpact: v.compliance,
        legal: v.legal
      }));
      
      updateUI();
      loadViolations();
    } else {
      console.log('[CookieGuard Popup] No data from background, using example data');
      // Use example data if no real data available
      loadExampleData();
    }
  });
}

// Load example data for demonstration
function loadExampleData() {
  scoringSystem.reset();
  
  // Example violations
  scoringSystem.addViolation('NO_REJECT_BUTTON', false);
  scoringSystem.addViolation('LAYERING', true, { 
    note: 'User must click through multiple pages to reject cookies' 
  });
  scoringSystem.addViolation('PRE_TICKED_BOXES', false);
  scoringSystem.addViolation('LINK_INSTEAD_OF_BUTTON', true, {
    note: 'Reject option is hidden in small text link'
  });
  scoringSystem.addViolation('REFUSE_OUTSIDE_BANNER', false);
  scoringSystem.addViolation('LACK_OF_INFORMATION', false);
  scoringSystem.addViolation('DIFFERENT_COLORED_BUTTONS', true, {
    note: 'Accept button is bright green while reject is grey'
  });
  scoringSystem.addViolation('LEGITIMATE_INTEREST', true, {
    note: 'Analytics cookies categorized under legitimate interest'
  });
  scoringSystem.addViolation('INACCURATE_ESSENTIAL_CLASSIFICATION', false);
  scoringSystem.addViolation('NO_WITHDRAW_CONSENT', false);
  
  // Update data.results from scoring system
  const summary = scoringSystem.getSummary();
  data.compliance = summary.overallScore;
  data.results = summary.violations.map(v => ({
    label: v.name,
    failed: true,
    description: v.description,
    darkPattern: v.darkPattern,
    complianceImpact: v.compliance,
    legal: v.legal
  }));
  
  updateUI();
  loadViolations();
}

function updateUI() {
  const summary = scoringSystem.getSummary();
  
  // Update main score circle
  const circle = document.getElementById('circle');
  circle.textContent = summary.overallScore;
  circle.className = 'circle ' + summary.severityLevel;
  
  // Update summary text
  const summaryText = document.getElementById('summaryText');
  if (summary.violationsCount === 0) {
    summaryText.textContent = 'Cookie banner appears compliant!';
    summaryText.style.color = '#2ecc71';
  } else if (summary.violationsCount <= 2) {
    summaryText.textContent = 'Minor cookie violations found.';
    summaryText.style.color = '#f39c12';
  } else {
    summaryText.textContent = 'Several major cookie breaches found.';
    summaryText.style.color = '#e74c3c';
  }
  
  // Update violations list
  const violationsList = document.getElementById('violationsList');
  if (summary.violations.length > 0) {
    const topViolations = summary.violations.slice(0, 2);
    violationsList.textContent = topViolations.map(v => v.name).join(', ');
  } else {
    violationsList.textContent = 'No violations detected';
  }
  
  // Update score details
  document.getElementById('darkPatternScore').textContent = 
    `${summary.darkPatternScore}/${summary.maxDarkPatternScore} (${summary.darkPatternPercentage}%)`;
  document.getElementById('complianceIssues').textContent = 
    `${summary.complianceScore}/${summary.maxComplianceScore} points`;
}

// Default settings
let settings = {
  disableForSite: false,
  automaticPopup: false,
  autoReport: false,
  zoomLevel: 1.0  // Add zoom level to settings
};

// Zoom functionality
let currentZoom = 1.0;

function setZoom(level) {
  currentZoom = Math.max(0.7, Math.min(1.5, level)); // Clamp between 70% and 150%
  document.documentElement.style.setProperty('--zoom-level', currentZoom);
  
  // Don't change body width - keep it fixed at 380px
  // The transform: scale() will handle the visual zoom
  
  // Update zoom display
  const zoomDisplay = document.getElementById('zoomDisplay');
  if (zoomDisplay) {
    zoomDisplay.textContent = Math.round(currentZoom * 100) + '%';
  }
  
  // Save zoom preference
  chrome.storage.sync.get(['settings'], (result) => {
    const currentSettings = result.settings || settings;
    currentSettings.zoomLevel = currentZoom;
    chrome.storage.sync.set({ settings: currentSettings });
  });
}

function zoomIn() {
  setZoom(currentZoom + 0.1);
}

function zoomOut() {
  setZoom(currentZoom - 0.1);
}

function zoomReset() {
  setZoom(1.0);
}

// Load zoom level from settings
function loadZoomLevel() {
  chrome.storage.sync.get(['settings'], (result) => {
    if (result.settings && result.settings.zoomLevel) {
      setZoom(result.settings.zoomLevel);
    }
  });
}

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
  // Load zoom level first
  loadZoomLevel();
  
  // Add zoom control handlers
  document.getElementById('zoomIn').addEventListener('click', (e) => {
    e.preventDefault();
    zoomIn();
  });
  
  document.getElementById('zoomOut').addEventListener('click', (e) => {
    e.preventDefault();
    zoomOut();
  });
  
  // Click zoom display to reset
  document.getElementById('zoomDisplay').addEventListener('click', (e) => {
    e.preventDefault();
    zoomReset();
  });
  
  // Keyboard shortcuts for zoom (Ctrl/Cmd + Plus/Minus)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '+') {
      e.preventDefault();
      zoomIn();
    } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
      e.preventDefault();
      zoomOut();
    } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault();
      zoomReset();
    }
  });
  
  // Add click handlers for navigation
  const navLinks = document.querySelectorAll('nav a[data-section]');
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
  initializeScoringSystem();
  loadViolations();
  loadSettings();
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
  
  const summary = scoringSystem.getSummary();
  
  if (summary.violations.length === 0) {
    container.innerHTML = `
      <div class="item good">
        <div class="label">No violations detected</div>
        <div class="small">This cookie banner appears to follow best practices!</div>
      </div>
    `;
    return;
  }
  
  summary.violations.forEach(v => {
    const div = document.createElement("div");
    div.className = "item bad";
    div.innerHTML = `
      <div class="label">${v.name}</div>
      <div class="small">${v.description}</div>
      <div class="small" style="margin-top: 4px;">
        <strong>Dark Pattern:</strong> ${v.darkPattern}/5 | 
        <strong>Compliance Impact:</strong> ${v.compliance}/5
      </div>
      <div class="small" style="color: #666; margin-top: 2px;">
        ${v.legal}
      </div>
      ${v.details && v.details.note ? `<div class="small" style="margin-top: 4px; font-style: italic;">Note: ${v.details.note}</div>` : ''}
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
    
    // Generate comprehensive report using scoring system
    const summary = scoringSystem.getSummary();
    const reportContent = `CookieGuard - Cookie Banner Analysis Report
===========================================

Website: ${currentUrl}
Date: ${new Date().toLocaleString()}
Generated by: CookieGuard Extension

===========================================
SCORES
===========================================

Overall Compliance Score: ${summary.overallScore}/100
Severity Level: ${summary.severityLevel.toUpperCase()}

Dark Pattern Score: ${summary.darkPatternScore}/${summary.maxDarkPatternScore} (${summary.darkPatternPercentage}%)
Compliance Violations: ${summary.complianceScore}/${summary.maxComplianceScore} points

Total Violations Found: ${summary.violationsCount}

===========================================
DETECTED VIOLATIONS
===========================================

${summary.violations.length === 0 ? 'No violations detected. This cookie banner appears to be compliant!' : 
  summary.violations.map((v, index) => `
${index + 1}. ${v.name}
   Description: ${v.description}
   Dark Pattern Score: ${v.darkPattern}/5
   Compliance Impact: ${v.compliance}/5
   Legal Basis: ${v.legal}
   ${v.details && v.details.note ? `Note: ${v.details.note}` : ''}`).join('\n')}

===========================================
RECOMMENDATIONS
===========================================

${summary.overallScore < 50 ? 
  '⚠️ CRITICAL: This website has serious compliance issues.\n   Recommended Action: Contact website owner and/or report to Datatilsynet.' :
  summary.overallScore < 70 ?
  '⚠️ WARNING: This website has moderate compliance issues.\n   Recommended Action: Website should improve cookie consent practices.' :
  '✓ This website follows good cookie consent practices.'}

===========================================
LEGAL BASIS
===========================================

This report is based on:
- GDPR (General Data Protection Regulation)
- ePrivacy Directive Article 5(3)
- Report of the work undertaken by the Cookie Banner Taskforce
  Adopted on: 17 January 2023

For more information, visit: https://www.datatilsynet.no/
`;

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
    const summary = scoringSystem.getSummary();
    
    const subject = 'Rapportering av Cookie Policy Brudd';
    const body = `
Hei Datatilsynet,

Jeg ønsker å rapportere følgende nettside for brudd på cookie-regler:
${currentUrl}

SAMMENDRAG:
- Compliance Score: ${summary.overallScore}/100
- Alvorlighetsgrad: ${summary.severityLevel.toUpperCase()}
- Antall brudd: ${summary.violationsCount}
- Dark Pattern Score: ${summary.darkPatternScore}/${summary.maxDarkPatternScore}

OPPDAGEDE BRUDD:
${summary.violations.map((v, i) => `${i + 1}. ${v.name}
   - ${v.description}
   - Lovgrunnlag: ${v.legal}`).join('\n\n')}

Dette er basert på analyse fra CookieGuard extension.
Rapporten følger retningslinjene fra Cookie Banner Taskforce (17. januar 2023).

Med vennlig hilsen
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
