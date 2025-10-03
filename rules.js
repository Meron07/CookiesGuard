// Heuristikker: juster/utvid for prosjektet
export const RULES = [
  {
    id: "cookies_before_consent",
    label: "Tracking-cookies satt før samtykke",
    weight: 5,
    detect: async () => {
      // sjekk om kjente tredjeparts cookies finnes tidlig
      const suspicious = ["_ga", "_gid", "_fbp", "IDE", "uid", "cid"];
      const all = document.cookie.split(";").map(c => c.trim().split("=")[0]);
      return suspicious.some(n => all.includes(n));
    }
  },
  {
    id: "no_reject_equal",
    label: "Manglende likeverdige valg (Avslå/aksepter)",
    weight: 4,
    detect: async () => {
      const text = (el) => (el.textContent || "").toLowerCase();
      const buttons = [...document.querySelectorAll("button,a,[role='button']")];
      const accept = buttons.find(b => /accept|godta|allow|ok/.test(text(b)));
      const reject = buttons.find(b => /reject|avsl(å|a)|deny/.test(text(b)));
      if (!accept || !reject) return true;
      // sjekk visuell vekt (enkelt): størrelse/kontrast
      const sA = getComputedStyle(accept), sR = getComputedStyle(reject);
      const bigger = (el)=> el.offsetWidth*el.offsetHeight;
      const sizeBias = bigger(accept) > bigger(reject) * 1.6;
      const opacityBias = parseFloat(sR.opacity) < 0.8;
      return sizeBias || opacityBias;
    }
  },
  {
    id: "prechecked_toggles",
    label: "Forhånds-avkrysset for ikke-nødvendige cookies",
    weight: 3,
    detect: async () => {
      const inputs = [...document.querySelectorAll("input[type='checkbox']")];
      return inputs.some(i =>
        /marketing|tracking|analytics|preferences|advert/i.test(i.name+i.id+i.labels?.[0]?.textContent || "") && i.checked
      );
    }
  },
  {
    id: "hidden_reject",
    label: "Avslå-knapp gjemt bak ekstra steg",
    weight: 4,
    detect: async () => {
      const btns = [...document.querySelectorAll("button,a,[role='button']")];
      const more = btns.find(b => /more|flere valg|innstillinger|preferences/i.test(b.textContent||""));
      const reject = btns.find(b => /reject|avsl(å|a)|deny/i.test(b.textContent||""));
      return !!more && !reject; // krever ekstra steg
    }
  },
  {
    id: "misleading_colors",
    label: "Villedende farger (grått ‘Avslå’, sterkt ‘Godta’)",
    weight: 2,
    detect: async () => {
      const buttons = [...document.querySelectorAll("button,a,[role='button']")];
      const accept = buttons.find(b => /accept|godta|allow|ok/i.test(b.textContent||""));
      const reject = buttons.find(b => /reject|avsl(å|a)|deny/i.test(b.textContent||""));
      if (!accept || !reject) return false;
      const c = getComputedStyle;
      const accSat = c(accept).color + c(accept).backgroundColor;
      const rejSat = c(reject).color + c(reject).backgroundColor;
      // naive: gråtoner for reject
      const grayish = /rgb\(\s*(\d+)\s*,\s*\1\s*,\s*\1\s*\)/i.test(c(reject).color);
      return grayish;
    }
  }
];

export function scoreFindings(findings) {
  // findings: {id, passed:false, weight}
  const max = RULES.reduce((a,r)=>a+r.weight,0);
  const penalty = findings.filter(f=>f.failed).reduce((a,f)=>a+f.weight,0);
  const compliance = Math.max(0, Math.round(100 * (1 - penalty/max)));
  return { compliance, violations: findings.filter(f=>f.failed) };
}
