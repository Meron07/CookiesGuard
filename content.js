// --- Rules og scoring ---
const RULES = [
  {
  id: "banner_present",
  label: "Cookie banner detected",
  weight: 5,
  detect: async () => {
    const el = document.querySelector("[id*='cookie'],[class*='cookie'],[id*='consent'],[class*='consent']");
    return !!el; // true means FAILED (banner present)
  }
}

];

function scoreFindings(findings) {
  const max = RULES.reduce((a,r)=>a+r.weight,0);
  const penalty = findings.filter(f=>f.failed).reduce((a,f)=>a+f.weight,0);
  const compliance = Math.max(0, Math.round(100 * (1 - penalty/max)));
  return { compliance, violations: findings.filter(f=>f.failed) };
}

// --- Audit kjøring ---
async function runAudit() {
  const results = [];
  for (const r of RULES) {
    try {
      const failed = await r.detect();
      results.push({ id: r.id, label: r.label, weight: r.weight, failed });
    } catch (e) {
      results.push({ id: r.id, label: r.label, weight: r.weight, failed: false, error: String(e) });
    }
  }

  const { compliance, violations } = scoreFindings(results);

  const payload = {
    url: location.href,
    compliance,
    results,
    violationsCount: violations.length,
    ts: new Date().toISOString()
  };

  console.log("✅ CookieGuard data:", payload);
  console.log("Rule:", r.id, "result:", failed);
  chrome.storage.local.set({ cookieguard_last: payload });
}
runAudit();
