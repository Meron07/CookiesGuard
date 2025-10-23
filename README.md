# CookiesGuard

Browser extension for detecting dark patterns in cookie consent banners and evaluating GDPR compliance.

## What it does

Analyzes cookie banners on websites and flags violations like missing reject buttons, pre-ticked boxes, and misleading button designs. Generates compliance scores and detailed reports you can download or send to Datatilsynet.

## Installation

1. Go to `chrome://extensions/`
2. Turn on Developer mode
3. Click "Load unpacked" and select this folder

## How to use

Visit any website with a cookie banner. The extension icon shows a badge if violations are found. Click the icon to see the full report with scores and specific issues detected.

## Scoring

**Compliance Score (0-100)**: Overall GDPR/ePrivacy compliance. Higher is better.

**Dark Pattern Score**: Manipulation tactics detected. Lower is better.

Violations are weighted by severity (1-5) based on legal requirements from the Cookie Banner Taskforce report (Jan 2023).

## What it detects

- No reject button available
- Reject button hidden behind multiple clicks
- Non-essential cookies pre-selected
- Reject option as small link instead of clear button
- Misleading use of "legitimate interest"
- Accept button more prominent than reject
- Missing or unclear information
- Incorrect classification of cookies as essential
- No way to withdraw consent later

## Technical notes

Built with Manifest V3. Main components:

- `content.js` - Scans pages for violations
- `scoring.js` - Calculates compliance metrics
- `background.js` - Handles messaging and badge updates
- `popup.js/html/css` - UI for displaying results

## Legal basis

Violations are mapped to specific GDPR articles and ePrivacy Directive requirements. Each detected issue includes the relevant legal reference in the report.


