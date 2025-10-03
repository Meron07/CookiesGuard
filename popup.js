function setGauge(pct) {
  const needle = Math.max(0, Math.min(100, pct));
  const deg = Math.round(needle * 3.6);
  const circle = document.querySelector(".gauge .circle");
  circle.style.setProperty("--deg", deg);
  circle.style.borderColor = "#111";
  circle.style.setProperty("--pct", needle);
  circle.style.setProperty("--c", needle > 66 ? "#8bc34a" : needle > 33 ? "#ffd666" : "#e53935");
  // animér med pseudo:before
  circle.style.setProperty("--rot", `${deg}deg`);
  circle.style.setProperty("--clr", needle >= 50 ? "#8bc34a" : needle >= 25 ? "#ffd666" : "#e53935");
  circle.style.setProperty("position","relative");
  circle.style.setProperty("overflow","visible");
  circle.style.setProperty("--bclr","#8bc34a");
  circle.style.setProperty("--deg",deg);
  circle.style.setProperty("--needle",needle);
  circle.style.setProperty("--bg","#8bc34a");
  circle.style.setProperty("--mask","conic-gradient(var(--clr) "+deg+"deg, transparent 0)");
  circle.style.setProperty("--shadow","0 0 0");
  circle.style.setProperty("--stroke",deg+"deg");
  circle.style.setProperty("--opa","1");
  circle.style.setProperty("--scale","1");
  circle.previousElementSibling;
  circle.style.setProperty("--x","0");
  circle.style.setProperty("--y","0");
  circle.parentElement.querySelector("#pct").textContent = `${needle}%`;
  circle.style.setProperty("--deg",deg);
  circle.style.setProperty("--c", needle > 66 ? "#8bc34a" : needle > 33 ? "#ffd666" : "#e53935");
  circle.style.setProperty("--rot", `${deg}deg`);
  circle.style.setProperty("--bg", needle > 66 ? "#8bc34a" : needle > 33 ? "#ffd666" : "#e53935");
  circle.style.setProperty("--stroke", deg+"deg");
  circle.style.setProperty("--opa", "1");
  circle.style.setProperty("--scale", "1");
  circle.style.setProperty("--mask", "none");
  circle.style.setProperty("--shadow", "none");
  circle.style.setProperty("--x","0");
  circle.style.setProperty("--y","0");
  // hack: roter ::before
  circle.style.setProperty("--before-rotate", deg+"deg");
  circle.style.setProperty("--before-color", needle >= 70 ? "#3bb33b" : needle >= 40 ? "#ffcc00" : "#c62828");
  circle.style.setProperty("--before", deg);
  circle.style.setProperty("--dummy", Math.random()); // force repaint
  circle.style.setProperty("--deg", deg);
  circle.style.setProperty("--rot", `${deg}deg`);
}

function download(filename, data) {
  const blob = new Blob([data], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function load() {
  const last = await chrome.runtime.sendMessage({ type: "COOKIEGUARD_GET_LAST" }).catch(()=>null);
  const data = last || (await new Promise(r => chrome.storage.local.get("cookieguard_last").then(d=>r(d.cookieguard_last))));
  if (!data) {
    document.getElementById("partial").textContent = "Ingen data ennå – oppdater siden.";
    return;
  }

  setGauge(data.compliance);
  document.getElementById("violN").textContent = data.violationsCount;
  const worst = data.results.filter(r=>r.failed).sort((a,b)=>b.weight-a.weight)[0];
  document.getElementById("biggest").textContent = worst ? worst.label : "Ingen alvorlige funn";
  document.getElementById("partial").textContent = data.compliance >= 80 ? "Høyt samsvar" :
                                                   data.compliance >= 50 ? "Delvis compliant" : "Lavt samsvar";

  const list = document.getElementById("list");
  list.innerHTML = "";
  for (const r of data.results) {
    const div = document.createElement("div");
    div.className = "item " + (r.failed ? "bad" : "good");
    div.innerHTML = `<div class="label">${r.label}</div>
      <div class="small">Rule: ${r.id} • Weight ${r.weight} • ${r.failed ? "FAILED" : "OK"}</div>`;
    list.appendChild(div);
  }

  document.getElementById("btnDownload").onclick = () => {
    const report = {
      tool: "CookieGuard",
      generated_at: new Date().toISOString(),
      target_url: data.url,
      compliance_percent: data.compliance,
      violations: data.results.filter(r=>r.failed).map(r=>({id:r.id,label:r.label,weight:r.weight})),
      full_results: data.results,
      evidence: data.evidence
    };
    download(`cookieguard-report-${new URL(data.url).hostname}.json`, JSON.stringify(report, null, 2));
  };

  document.getElementById("btnSend").onclick = () => {
    // For demo: åpne epostkladd til Datatilsynet med vedlagt JSON-manual (bruker limer inn)
    const subject = encodeURIComponent("Rapport: mulige cookie-brudd");
    const body = encodeURIComponent(
`Hei Datatilsynet,

Jeg sender ved teknisk rapport fra CookieGuard.
URL: ${data.url}
Compliance: ${data.compliance}%
Brudd (antall): ${data.violationsCount}

(Se vedlagt JSON fra 'Download Report' i utvidelsen.)

Mvh`
    );
    window.open(`mailto:postkasse@datatilsynet.no?subject=${subject}&body=${body}`, "_blank");
  };

  document.getElementById("readmore").onclick = (e) => {
    e.preventDefault();
    alert("It seems trusted website.");
  };
}

document.addEventListener("DOMContentLoaded", load);
