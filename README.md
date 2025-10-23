# CookiesGuard
Browser extension prototype to detect cookie consent dark patterns and generate GDPR violation reports

## Overview
CookieGuard is a browser extension that automatically detects and scores cookie banner violations based on GDPR and ePrivacy Directive requirements.

## Scoring System Implementation

The scoring system is based on the **"Report of the work undertaken by the Cookie Banner Taskforce"** (Adopted on 17 January 2023).

### Violation Types & Scoring

| Violation | Dark Pattern Score | Compliance Score | Legal Basis |
|-----------|-------------------|------------------|-------------|
| **No Reject Button** | 5/5 | 5/5 | Article 5(3) ePrivacy Directive |
| **Layering** (Multiple pages to opt-out) | 3/5 | 0/5 | ePrivacy Directive Article 5(3) |
| **Pre-ticked Boxes** | 5/5 | 5/5 | Article 32 GDPR & Article 5(3) ePrivacy |
| **Link Instead of Button** | 4/5 | 4/5 | GDPR consent requirements |
| **Refuse Button Outside Banner** | 5/5 | 4/5 | GDPR consent requirements |
| **Lack of Information** | 4/5 | 4/5 | GDPR transparency requirements |
| **Different Colored Buttons** | 4/5 | 3/5 | GDPR consent requirements |
| **Legitimate Interest** (for non-essential cookies) | 3/5 | 3/5 | Article 5(3) ePrivacy Directive |
| **Inaccurate Essential Classification** | 5/5 | 5/5 | GDPR & ePrivacy Directive |
| **No Withdraw Consent** | 3/5 | 3/5 | GDPR Article 7(3) |

### Score Calculation

1. **Compliance Score (0-100)**: Higher is better
   - 100 = Perfect compliance, no violations
   - 0 = Maximum violations detected

2. **Dark Pattern Score (0-100)**: Lower is better
   - Percentage of dark pattern techniques detected

3. **Severity Levels**:
   - **Excellent** (90-100): Follows best practices
   - **Good** (70-89): Minor issues
   - **Fair** (50-69): Moderate issues
   - **Poor** (30-49): Serious issues
   - **Critical** (0-29): Major compliance violations

## Files Structure

```
CookiesGuard/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.css             # Styling with contrast buttons
├── popup.js              # UI logic and integration
├── scoring.js            # Scoring system logic
├── content.js            # Cookie banner detection
├── background.js         # Service worker for messaging
└── README.md             # This file
```

## Key Features

### 1. Automatic Detection
- Scans cookie banners on page load
- Detects 10 different violation types
- Real-time analysis

### 2. Visual Scoring
- Color-coded compliance circle
- Dark pattern score display
- Detailed violation list

### 3. Reporting
- Download detailed reports (TXT format)
- Email reports to Datatilsynet
- Includes all detected violations with legal references

### 4. Button Styling (Contrast)
Added high-contrast button styles:
- **Allow button**: Green (`#2ecc71`) with hover effect
- **Reject button**: Red (`#e74c3c`) with hover effect
- Clear visual distinction for accessibility

### 5. Legitimate Interest Detection
- Identifies when non-essential cookies use "legitimate interest"
- Visual indicator with warning icon
- Scores violation appropriately

## Usage

### Installation
1. Open Chrome/Edge Extensions page (`chrome://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the CookiesGuard folder

### Using the Extension
1. Visit any website with a cookie banner
2. Extension badge shows violation count
3. Click extension icon to see detailed report
4. Download report or email to Datatilsynet

### Understanding Scores

**Compliance Score**: The main score (0-100)
- Shows overall GDPR/ePrivacy compliance
- Higher = Better compliance

**Dark Pattern Score**: Shows manipulation techniques (0-100)
- Shows percentage of dark patterns detected
- Lower = Less manipulation

**Violations**: Detailed list of detected issues
- Each violation shows:
  - Name and description
  - Dark pattern impact (1-5)
  - Compliance impact (1-5)
  - Legal basis

## Technical Implementation

### Detection Methods

1. **No Reject Button**: Searches for reject/deny buttons
2. **Layering**: Detects "see more" patterns without visible reject
3. **Pre-ticked Boxes**: Finds non-essential checkboxes checked by default
4. **Link vs Button**: Identifies text links instead of clear buttons
5. **Outside Banner**: Checks if reject is outside cookie banner area
6. **Lack of Info**: Counts cookie-related keywords
7. **Color Contrast**: Compares accept/reject button styling
8. **Legitimate Interest**: Text search for "legitimate interest"
9. **Inaccurate Classification**: Finds marketing cookies marked as essential
10. **No Withdraw**: Checks for settings/preferences links

### Message Flow

```
Website Page
    ↓ (detects violations)
content.js
    ↓ (sends message)
background.js
    ↓ (stores & updates badge)
popup.js
    ↓ (requests data)
scoring.js
    ↓ (calculates scores)
popup.html (displays results)
```

## Button Color Contrast Implementation

### CSS Classes
```css
.btn-allow {
  background: #2ecc71; /* Green */
  color: white;
  border: 1px solid #27ae60;
}

.btn-reject {
  background: #e74c3c; /* Red */
  color: white;
  border: 1px solid #c0392b;
}
```

### Usage in HTML
```html
<button class="btn-allow">Accept Cookies</button>
<button class="btn-reject">Reject Cookies</button>
```

## Legitimate Interest Styling

### CSS Class
```css
.legitimate-interest {
  background: #f8f9fa;
  border-left: 4px solid #ffd700;
  padding: 8px 12px;
  display: flex;
  align-items: center;
}
```

### Usage in HTML
```html
<div class="legitimate-interest">
  This website uses legitimate interest for analytics cookies
</div>
```

## Legal References

- **GDPR**: General Data Protection Regulation
- **ePrivacy Directive Article 5(3)**: Cookie consent requirements
- **Article 32 GDPR**: Security of processing
- **Article 7(3) GDPR**: Right to withdraw consent

## Testing

To test the extension:

1. **Test with example data**: Extension uses fallback example data if no cookie banner detected
2. **Test on real websites**: Visit websites with cookie banners
3. **Check detection**: View console logs for detection results
4. **Verify scoring**: Download report to see detailed breakdown

## Changelog

### Version 1.0
- Initial implementation
- 10 violation types detected
- Comprehensive scoring system
- Report generation
- Email integration
- Contrast button styling
- Legitimate interest detection

