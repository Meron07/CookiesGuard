/**
 * Content Script for Cookie Banner Detection
 * This script runs on web pages to detect cookie banner violations
 */

class CookieBannerDetector {
  constructor() {
    this.violations = [];
  }

  /**
   * Find cookie banner elements on the page
   */
  findCookieBanner() {
    const cookieSelectors = [
      '[id*="cookie" i]', '[class*="cookie" i]',
      '[id*="consent" i]', '[class*="consent" i]',
      '[id*="gdpr" i]', '[class*="gdpr" i]',
      '[id*="privacy" i]', '[class*="privacy" i]',
      '[role="dialog"][aria-label*="cookie" i]',
      '[role="dialog"][aria-label*="consent" i]'
    ];
    
    let banners = [];
    for (const selector of cookieSelectors) {
      const elements = document.querySelectorAll(selector);
      banners.push(...Array.from(elements));
    }
    
    // Filter to only visible elements that look like banners
    banners = banners.filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 100 &&
        rect.height > 50
      );
    });
    
    return banners;
  }

  /**
   * Detect if there's no reject button (IMPROVED)
   */
  detectNoRejectButton() {
    const rejectKeywords = [
      'reject all', 'reject', 'deny', 'decline', 'refuse', 
      'avvis', 'nekt', 'avslå', 'ikke godta', 'not accept', 
      'opt out', 'opt-out', 'no thanks', 'nei takk',
      'only necessary', 'kun nødvendig', 'essential only',
      'disagree', 'uenig'
    ];
    
    const banners = this.findCookieBanner();
    
    // If no cookie banner found, check globally
    if (banners.length === 0) {
      const allButtons = document.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"], [role="button"]');
      
      for (const button of allButtons) {
        const text = button.textContent.toLowerCase().trim();
        const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
        const title = (button.getAttribute('title') || '').toLowerCase();
        
        if (rejectKeywords.some(keyword => 
          text.includes(keyword) || 
          ariaLabel.includes(keyword) || 
          title.includes(keyword)
        )) {
          return false; // Has reject button
        }
      }
      return true; // No reject button found
    }
    
    // Check within cookie banners
    for (const banner of banners) {
      const buttons = banner.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"], [role="button"]');
      
      for (const button of buttons) {
        // Check if button is visible
        const rect = button.getBoundingClientRect();
        const style = window.getComputedStyle(button);
        
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0) {
          continue;
        }
        
        const text = button.textContent.toLowerCase().trim();
        const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
        const title = (button.getAttribute('title') || '').toLowerCase();
        const dataAction = (button.getAttribute('data-action') || '').toLowerCase();
        
        if (rejectKeywords.some(keyword => 
          text.includes(keyword) || 
          ariaLabel.includes(keyword) || 
          title.includes(keyword) ||
          dataAction.includes(keyword)
        )) {
          return false; // Has reject button
        }
      }
    }
    
    return true; // No reject button found
  }

  /**
   * Detect layering (multiple pages to reject) (IMPROVED)
   */
  detectLayering() {
    const moreInfoKeywords = [
      'more info', 'more options', 'settings', 'options', 'customize', 
      'preferences', 'manage', 'mer info', 'innstillinger', 'tilpass', 
      'learn more', 'see more', 'details', 'detaljer', 'vis mer',
      'cookie settings', 'cookie preferences', 'advanced settings'
    ];
    
    const banners = this.findCookieBanner();
    
    if (banners.length === 0) return false;
    
    for (const banner of banners) {
      const buttons = banner.querySelectorAll('button, a, [role="button"]');
      let hasMoreButton = false;
      let hasVisibleReject = false;
      
      for (const button of buttons) {
        const text = button.textContent.toLowerCase().trim();
        const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
        
        // Check for "more info" type buttons
        if (moreInfoKeywords.some(keyword => text.includes(keyword) || ariaLabel.includes(keyword))) {
          hasMoreButton = true;
        }
        
        // Check for visible reject button on the same level
        const rejectKeywords = ['reject', 'decline', 'deny', 'avvis', 'nekt', 'only necessary', 'kun nødvendig'];
        if (rejectKeywords.some(keyword => text.includes(keyword) || ariaLabel.includes(keyword))) {
          // Check if it's actually visible
          const rect = button.getBoundingClientRect();
          const style = window.getComputedStyle(button);
          
          if (style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0) {
            hasVisibleReject = true;
          }
        }
      }
      
      // If there's a "more info" button but no visible reject on the first page, it's layering
      if (hasMoreButton && !hasVisibleReject) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Detect pre-ticked boxes (IMPROVED)
   */
  detectPreTickedBoxes() {
    const banners = this.findCookieBanner();
    const searchAreas = banners.length > 0 ? banners : [document.body];
    
    for (const area of searchAreas) {
      const checkboxes = area.querySelectorAll('input[type="checkbox"], input[type="radio"]');
      
      for (const checkbox of checkboxes) {
        if (!checkbox.checked) continue; // Skip unchecked boxes
        
        // Get context around the checkbox
        const label = checkbox.closest('label')?.textContent.toLowerCase() || '';
        const parent = checkbox.parentElement?.textContent.toLowerCase() || '';
        const nextSibling = checkbox.nextElementSibling?.textContent.toLowerCase() || '';
        const prevSibling = checkbox.previousElementSibling?.textContent.toLowerCase() || '';
        const ariaLabel = (checkbox.getAttribute('aria-label') || '').toLowerCase();
        
        const context = `${label} ${parent} ${nextSibling} ${prevSibling} ${ariaLabel}`;
        
        // Keywords that indicate essential/necessary cookies
        const essentialKeywords = ['essential', 'necessary', 'required', 'nødvendig', 'påkrevd', 'obligatorisk', 'strictly necessary', 'technical'];
        
        // Keywords that indicate non-essential cookies
        const nonEssentialKeywords = ['marketing', 'analytics', 'advertising', 'social', 'tracking', 'markedsføring', 'analyse', 'annonsering', 'performance', 'personalization', 'functional', 'preference'];
        
        const isEssential = essentialKeywords.some(keyword => context.includes(keyword));
        const isNonEssential = nonEssentialKeywords.some(keyword => context.includes(keyword));
        
        // If it's checked and non-essential (or not clearly essential), it's a violation
        if (isNonEssential || (!isEssential && checkbox.checked && context.length > 10)) {
          // Additional check: is it disabled (meaning user can't uncheck)?
          if (checkbox.disabled || checkbox.hasAttribute('readonly')) {
            continue; // Disabled checkboxes for essential cookies are OK
          }
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Detect link instead of button for reject (IMPROVED)
   */
  detectLinkInsteadOfButton() {
    const rejectKeywords = ['reject', 'deny', 'decline', 'avvis', 'nekt', 'refuse', 'opt out', 'no thanks'];
    const banners = this.findCookieBanner();
    const searchAreas = banners.length > 0 ? banners : [document.body];
    
    for (const area of searchAreas) {
      // Look for links (not styled as buttons)
      const links = area.querySelectorAll('a:not([role="button"]), span[onclick], div[onclick]');
      
      for (const link of links) {
        const text = link.textContent.toLowerCase().trim();
        const ariaLabel = (link.getAttribute('aria-label') || '').toLowerCase();
        
        if (rejectKeywords.some(keyword => text.includes(keyword) || ariaLabel.includes(keyword))) {
          // Check if it's styled like a link (underlined, blue, etc.) rather than a button
          const style = window.getComputedStyle(link);
          const isStyledAsLink = (
            style.textDecoration.includes('underline') ||
            style.cursor === 'pointer' && style.border === 'none' ||
            !style.backgroundColor || style.backgroundColor === 'rgba(0, 0, 0, 0)' ||
            link.tagName.toLowerCase() === 'a' && !link.hasAttribute('role')
          );
          
          if (isStyledAsLink) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Detect if refuse button is outside the visible banner (IMPROVED)
   */
  detectRefuseOutsideBanner() {
    const banners = this.findCookieBanner();
    
    if (banners.length === 0) return false;
    
    const rejectKeywords = ['reject', 'decline', 'deny', 'avvis', 'nekt', 'refuse'];
    const rejectButtons = Array.from(document.querySelectorAll('button, a'))
      .filter(btn => {
        const text = btn.textContent.toLowerCase();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        return rejectKeywords.some(keyword => text.includes(keyword) || ariaLabel.includes(keyword));
      });
    
    // Check if reject buttons are inside cookie banners
    for (const rejectBtn of rejectButtons) {
      let isInside = false;
      for (const banner of banners) {
        if (banner.contains(rejectBtn)) {
          isInside = true;
          break;
        }
      }
      // If button is outside and visible, it's a violation
      if (!isInside && rejectBtn.offsetParent !== null) {
        const rect = rejectBtn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Detect lack of information about cookies (IMPROVED)
   */
  detectLackOfInformation() {
    const banners = this.findCookieBanner();
    const searchAreas = banners.length > 0 ? banners : [document.body];
    
    const infoKeywords = [
      'cookie', 'analytics', 'marketing', 'advertising', 'tracking',
      'personalization', 'functional', 'performance', 'essential',
      'necessary', 'privacy policy', 'data protection'
    ];
    
    for (const area of searchAreas) {
      const allText = area.textContent.toLowerCase();
      let infoCount = 0;
      
      for (const keyword of infoKeywords) {
        if (allText.includes(keyword)) {
          infoCount++;
        }
      }
      
      // If found at least 4 keywords, consider it has enough information
      if (infoCount >= 4) {
        return false;
      }
    }
    
    // If less than 4 keywords found, consider it lacking information
    return true;
  }

  /**
   * Detect different colored buttons (favoring accept) (IMPROVED)
   */
  detectDifferentColoredButtons() {
    const acceptKeywords = ['accept', 'agree', 'godta', 'aksepter', 'allow'];
    const rejectKeywords = ['reject', 'decline', 'deny', 'avvis', 'nekt', 'refuse'];
    
    const banners = this.findCookieBanner();
    const searchAreas = banners.length > 0 ? banners : [document.body];
    
    for (const area of searchAreas) {
      const acceptButtons = Array.from(area.querySelectorAll('button, a[role="button"]'))
        .filter(btn => {
          const text = btn.textContent.toLowerCase();
          const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
          return acceptKeywords.some(keyword => text.includes(keyword) || ariaLabel.includes(keyword));
        });
      
      const rejectButtons = Array.from(area.querySelectorAll('button, a[role="button"]'))
        .filter(btn => {
          const text = btn.textContent.toLowerCase();
          const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
          return rejectKeywords.some(keyword => text.includes(keyword) || ariaLabel.includes(keyword));
        });
      
      if (acceptButtons.length > 0 && rejectButtons.length > 0) {
        const acceptBtn = acceptButtons[0];
        const rejectBtn = rejectButtons[0];
        
        const acceptStyle = window.getComputedStyle(acceptBtn);
        const rejectStyle = window.getComputedStyle(rejectBtn);
        
        const acceptBg = acceptStyle.backgroundColor;
        const rejectBg = rejectStyle.backgroundColor;
        const acceptFontSize = parseFloat(acceptStyle.fontSize);
        const rejectFontSize = parseFloat(rejectStyle.fontSize);
        const acceptFontWeight = acceptStyle.fontWeight;
        const rejectFontWeight = rejectStyle.fontWeight;
        
        // Check multiple factors for prominence
        let prominenceFactors = 0;
        
        // Factor 1: Different background colors
        if (acceptBg !== rejectBg) {
          const acceptRgb = this.parseRgb(acceptBg);
          const rejectRgb = this.parseRgb(rejectBg);
          
          if (acceptRgb && rejectRgb) {
            const acceptBrightness = (acceptRgb.r + acceptRgb.g + acceptRgb.b) / 3;
            const rejectBrightness = (rejectRgb.r + rejectRgb.g + rejectRgb.b) / 3;
            
            // If accept is significantly brighter or more saturated
            if (Math.abs(acceptBrightness - rejectBrightness) > 50) {
              prominenceFactors++;
            }
          }
        }
        
        // Factor 2: Font size difference
        if (acceptFontSize > rejectFontSize) {
          prominenceFactors++;
        }
        
        // Factor 3: Font weight difference
        if (parseInt(acceptFontWeight) > parseInt(rejectFontWeight)) {
          prominenceFactors++;
        }
        
        // If 2 or more factors favor accept button, it's a violation
        if (prominenceFactors >= 2) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Detect legitimate interest usage (IMPROVED)
   */
  detectLegitimateInterest() {
    const searchText = document.body.textContent.toLowerCase();
    const legitKeywords = [
      'legitimate interest', 'berettiget interesse', 'legitim interesse',
      'legitimate purpose', 'rechtmatige belangen'
    ];
    
    return legitKeywords.some(keyword => searchText.includes(keyword));
  }

  /**
   * Detect inaccurate essential classification (IMPROVED)
   */
  detectInaccurateEssentialClassification() {
    const suspiciousKeywords = ['analytics', 'marketing', 'advertising', 'social media', 'tracking', 'personalization'];
    const essentialKeywords = ['essential', 'necessary', 'required', 'nødvendig', 'strictly necessary'];
    
    const banners = this.findCookieBanner();
    const searchAreas = banners.length > 0 ? banners : [document.body];
    
    for (const area of searchAreas) {
      const checkboxes = area.querySelectorAll('input[type="checkbox"][disabled], input[type="checkbox"][checked][disabled]');
      
      for (const checkbox of checkboxes) {
        const label = checkbox.closest('label')?.textContent.toLowerCase() || '';
        const parent = checkbox.parentElement?.textContent.toLowerCase() || '';
        const context = label + ' ' + parent;
        
        const hasEssentialLabel = essentialKeywords.some(keyword => context.includes(keyword));
        const hasSuspiciousContent = suspiciousKeywords.some(keyword => context.includes(keyword));
        
        if (hasEssentialLabel && hasSuspiciousContent) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Detect no possibility to withdraw consent (IMPROVED)
   */
  detectNoWithdrawConsent() {
    const withdrawKeywords = [
      'withdraw', 'change settings', 'cookie settings', 'preferences',
      'trekke tilbake', 'endre innstillinger', 'cookie-innstillinger',
      'manage cookies', 'cookie preferences', 'revoke', 'tilbakekall'
    ];
    
    const allLinks = document.querySelectorAll('a, button');
    
    for (const link of allLinks) {
      const text = link.textContent.toLowerCase();
      const ariaLabel = (link.getAttribute('aria-label') || '').toLowerCase();
      const href = (link.getAttribute('href') || '').toLowerCase();
      
      if (withdrawKeywords.some(keyword => 
        text.includes(keyword) || 
        ariaLabel.includes(keyword) ||
        href.includes(keyword)
      )) {
        return false; // Found withdraw option
      }
    }
    
    return true; // No withdraw option found
  }

  /**
   * Helper: Parse RGB color
   */
  parseRgb(rgbString) {
    const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return null;
  }

  /**
   * Run all detection methods
   */
  detectAll() {
    console.log('%c[CookieGuard] Starting detection...', 'color: #3348ff; font-weight: bold');
    
    const banners = this.findCookieBanner();
    console.log(`[CookieGuard] Found ${banners.length} cookie banner(s)`);
    
    const results = {
      NO_REJECT_BUTTON: this.detectNoRejectButton(),
      LAYERING: this.detectLayering(),
      PRE_TICKED_BOXES: this.detectPreTickedBoxes(),
      LINK_INSTEAD_OF_BUTTON: this.detectLinkInsteadOfButton(),
      REFUSE_OUTSIDE_BANNER: this.detectRefuseOutsideBanner(),
      LACK_OF_INFORMATION: this.detectLackOfInformation(),
      DIFFERENT_COLORED_BUTTONS: this.detectDifferentColoredButtons(),
      LEGITIMATE_INTEREST: this.detectLegitimateInterest(),
      INACCURATE_ESSENTIAL_CLASSIFICATION: this.detectInaccurateEssentialClassification(),
      NO_WITHDRAW_CONSENT: this.detectNoWithdrawConsent()
    };
    
    // Count violations
    const violationCount = Object.values(results).filter(v => v === true).length;
    console.log(`%c[CookieGuard] Detected ${violationCount} violations`, violationCount > 0 ? 'color: #e74c3c; font-weight: bold' : 'color: #2ecc71; font-weight: bold');
    console.table(results);
    
    return results;
  }
}

// Run detection when page loads
const detector = new CookieBannerDetector();

console.log('%c[CookieGuard] Content script loaded', 'color: #3348ff; font-weight: bold');

// Wait for page to fully load
setTimeout(() => {
  console.log('[CookieGuard] Running initial detection...');
  const results = detector.detectAll();
  
  // Send results to extension
  chrome.runtime.sendMessage({
    type: 'COOKIE_VIOLATIONS_DETECTED',
    violations: results,
    url: window.location.href
  }, response => {
    if (chrome.runtime.lastError) {
      console.error('[CookieGuard] Error sending message:', chrome.runtime.lastError);
    } else {
      console.log('%c[CookieGuard] Results sent to background script ✓', 'color: #2ecc71');
    }
  });
}, 2000); // Wait 2 seconds for cookie banners to appear

// Also listen for dynamic content changes
const observer = new MutationObserver((mutations) => {
  // Re-run detection if significant DOM changes
  const banners = detector.findCookieBanner();
  if (banners.length > 0) {
    console.log('[CookieGuard] Cookie banner detected via MutationObserver, re-running detection...');
    setTimeout(() => {
      const results = detector.detectAll();
      chrome.runtime.sendMessage({
        type: 'COOKIE_VIOLATIONS_DETECTED',
        violations: results,
        url: window.location.href
      });
    }, 500);
    observer.disconnect(); // Stop observing after first detection
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Stop observing after 10 seconds
setTimeout(() => {
  observer.disconnect();
  console.log('[CookieGuard] Stopped observing DOM changes');
}, 10000);
