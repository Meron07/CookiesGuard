/**
 * Cookie Banner Scoring System
 * Based on "Report of the work undertaken by the Cookie Banner Taskforce"
 * Adopted on 17 January 2023
 */

const VIOLATION_TYPES = {
  NO_REJECT_BUTTON: {
    name: "No Cookie Reject Button",
    description: "Missing clear reject button for user to object from data collection",
    darkPattern: 5,
    compliance: 5,
    legal: "Article 5(3) ePrivacy Directive & GDPR"
  },
  LAYERING: {
    name: "Layering (Multiple Pages to Opt Out)",
    description: "Multiple pages required to opt out - 'see more' or 'learn more' pages",
    darkPattern: 3,
    compliance: 0,
    legal: "ePrivacy Directive Article 5(3)"
  },
  PRE_TICKED_BOXES: {
    name: "Pre-ticked Boxes",
    description: "Non-essential cookie boxes are pre-selected on first page",
    darkPattern: 5,
    compliance: 5,
    legal: "Article 32 GDPR & Article 5(3) ePrivacy Directive"
  },
  LINK_INSTEAD_OF_BUTTON: {
    name: "Link Instead of Clear Button",
    description: "Reject option is a text link instead of a clear button",
    darkPattern: 4,
    compliance: 4,
    legal: "GDPR consent requirements"
  },
  REFUSE_OUTSIDE_BANNER: {
    name: "Refuse Button Outside Banner",
    description: "Reject option is placed outside the visible cookie banner",
    darkPattern: 5,
    compliance: 4,
    legal: "GDPR consent requirements"
  },
  LACK_OF_INFORMATION: {
    name: "No/Lack of Cookie Information",
    description: "Missing or insufficient information about cookie types and purposes",
    darkPattern: 4,
    compliance: 4,
    legal: "GDPR transparency requirements"
  },
  DIFFERENT_COLORED_BUTTONS: {
    name: "Different Colored Buttons",
    description: "Accept and reject buttons have contrasting colors that favor acceptance",
    darkPattern: 4,
    compliance: 3,
    legal: "GDPR consent requirements"
  },
  LEGITIMATE_INTEREST: {
    name: "Legitimate Interest for Non-Essential Cookies",
    description: "Non-essential cookies collected under 'legitimate interest'",
    darkPattern: 3,
    compliance: 3,
    legal: "Article 5(3) ePrivacy Directive"
  },
  INACCURATE_ESSENTIAL_CLASSIFICATION: {
    name: "Inaccurate Essential Cookie Classification",
    description: "Non-essential cookies misclassified as essential",
    darkPattern: 5,
    compliance: 5,
    legal: "GDPR & ePrivacy Directive"
  },
  NO_WITHDRAW_CONSENT: {
    name: "No Possibility to Withdraw Consent",
    description: "Missing easy way to withdraw previously given consent",
    darkPattern: 3,
    compliance: 3,
    legal: "GDPR Article 7(3)"
  }
};

/**
 * Scoring System Class
 */
class CookieScoringSystem {
  constructor() {
    this.violations = [];
    this.darkPatternScore = 0;
    this.complianceScore = 0;
    this.maxDarkPatternScore = 0;
    this.maxComplianceScore = 0;
  }

  /**
   * Add a violation to the scoring system
   * @param {string} violationType - Key from VIOLATION_TYPES
   * @param {boolean} detected - Whether this violation was detected
   * @param {object} details - Additional details about the violation
   */
  addViolation(violationType, detected = true, details = {}) {
    const violation = VIOLATION_TYPES[violationType];
    
    if (!violation) {
      console.error(`Unknown violation type: ${violationType}`);
      return;
    }

    // Always add to max scores (these are the potential scores)
    this.maxDarkPatternScore += violation.darkPattern;
    this.maxComplianceScore += violation.compliance;

    if (detected) {
      this.darkPatternScore += violation.darkPattern;
      this.complianceScore += violation.compliance;
      
      this.violations.push({
        type: violationType,
        ...violation,
        detected: true,
        details: details,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Calculate the overall compliance percentage (lower is better)
   * @returns {number} - Percentage from 0-100
   */
  getCompliancePercentage() {
    if (this.maxComplianceScore === 0) return 100;
    // Invert: 0 violations = 100%, max violations = 0%
    return Math.round(((this.maxComplianceScore - this.complianceScore) / this.maxComplianceScore) * 100);
  }

  /**
   * Calculate the dark pattern score percentage (lower is better)
   * @returns {number} - Percentage from 0-100
   */
  getDarkPatternPercentage() {
    if (this.maxDarkPatternScore === 0) return 0;
    return Math.round((this.darkPatternScore / this.maxDarkPatternScore) * 100);
  }

  /**
   * Get overall score (compliance-based, 0-100, higher is better)
   * @returns {number}
   */
  getOverallScore() {
    return this.getCompliancePercentage();
  }

  /**
   * Get severity level based on score
   * @returns {string} - 'excellent', 'good', 'fair', 'poor', 'critical'
   */
  getSeverityLevel() {
    const score = this.getOverallScore();
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 30) return 'poor';
    return 'critical';
  }

  /**
   * Get all detected violations
   * @returns {Array}
   */
  getDetectedViolations() {
    return this.violations.filter(v => v.detected);
  }

  /**
   * Get summary report
   * @returns {object}
   */
  getSummary() {
    return {
      overallScore: this.getOverallScore(),
      complianceScore: this.complianceScore,
      maxComplianceScore: this.maxComplianceScore,
      darkPatternScore: this.darkPatternScore,
      maxDarkPatternScore: this.maxDarkPatternScore,
      compliancePercentage: this.getCompliancePercentage(),
      darkPatternPercentage: this.getDarkPatternPercentage(),
      severityLevel: this.getSeverityLevel(),
      violationsCount: this.getDetectedViolations().length,
      violations: this.getDetectedViolations()
    };
  }

  /**
   * Generate detailed report text
   * @returns {string}
   */
  generateReport() {
    const summary = this.getSummary();
    let report = `
===========================================
CookieGuard - Cookie Banner Analysis Report
===========================================

Overall Compliance Score: ${summary.overallScore}/100
Severity Level: ${summary.severityLevel.toUpperCase()}

Dark Pattern Score: ${summary.darkPatternScore}/${summary.maxDarkPatternScore} (${summary.darkPatternPercentage}%)
Compliance Score: ${summary.complianceScore}/${summary.maxComplianceScore} violations detected

Total Violations Found: ${summary.violationsCount}

===========================================
DETECTED VIOLATIONS
===========================================
`;

    if (summary.violations.length === 0) {
      report += "\nNo violations detected. This cookie banner appears to be compliant!\n";
    } else {
      summary.violations.forEach((v, index) => {
        report += `
${index + 1}. ${v.name}
   Description: ${v.description}
   Dark Pattern Score: ${v.darkPattern}/5
   Compliance Impact: ${v.compliance}/5
   Legal Basis: ${v.legal}
   ${v.details.note ? `Note: ${v.details.note}` : ''}
`;
      });
    }

    report += `
===========================================
RECOMMENDATIONS
===========================================
`;

    if (summary.overallScore < 50) {
      report += "⚠️ CRITICAL: This website has serious compliance issues.\n";
      report += "   Recommended Action: Contact website owner and/or report to Datatilsynet.\n\n";
    } else if (summary.overallScore < 70) {
      report += "⚠️ WARNING: This website has moderate compliance issues.\n";
      report += "   Recommended Action: Website should improve cookie consent practices.\n\n";
    } else {
      report += "✓ This website follows good cookie consent practices.\n\n";
    }

    report += "Based on: Report of the work undertaken by the Cookie Banner Taskforce\n";
    report += "Adopted on: 17 January 2023\n";
    report += `Generated: ${new Date().toLocaleString()}\n`;

    return report;
  }

  /**
   * Reset all scores and violations
   */
  reset() {
    this.violations = [];
    this.darkPatternScore = 0;
    this.complianceScore = 0;
    this.maxDarkPatternScore = 0;
    this.maxComplianceScore = 0;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CookieScoringSystem, VIOLATION_TYPES };
}
