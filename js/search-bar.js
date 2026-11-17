const globalSystemRegistry = [
  { label: "Abir Mazumder", segment: "profile", trace: "Verified Safety System Architect" },
  { label: "Sector 4 Emergency Gathering Point", segment: "location", trace: "Safe Zone Outpost Base" },
  { label: "Dhaka Central Fire Department Terminal", segment: "contact", trace: "24/7 First Responder Hotline Link" }
];

let persistentHistoricalLogs = ["AI Enhance Code Systems", "Missing Alerts Registry Info"];

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark-theme");
  
  const searchInput = document.getElementById("activeSearchField");
  renderHistoryView();

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      const normalizedString = event.target.value.toLowerCase().trim();
      executeLiveDirectoryFiltering(normalizedString);
    });
  }
});

function renderHistoryView() {
  const container = document.getElementById("searchResultsList");
  const heading = document.getElementById("searchContextTitle");
  if (!container) return;

  heading.textContent = "History Manifest Logs";
  container.innerHTML = "";

  persistentHistoricalLogs.forEach((query, offset) => {
    const row = document.createElement("div");
    row.className = "search-result-row";
    row.innerHTML = `
      <div class="result-main-info">
        <i class="fas fa-history"></i>
        <span>${query}</span>
      </div>
      <button class="clear-history-item" onclick="purgeHistoryElement(${offset}, event)"><i class="fas fa-xmark"></i></button>
    `;
    container.appendChild(row);
  });
}

function executeLiveDirectoryFiltering(queryString) {
  const container = document.getElementById("searchResultsList");
  const heading = document.getElementById("searchContextTitle");
  if (!container) return;

  if (!queryString) {
    renderHistoryView();
    return;
  }

  heading.textContent = "Matching Structural Directory Logs";
  container.innerHTML = "";

  const filteredSet = globalSystemRegistry.filter(entry => 
    entry.label.toLowerCase().includes(queryString) || entry.trace.toLowerCase().includes(queryString)
  );

  if (filteredSet.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:24px; color:var(--text-muted);">No entries verified matching search filter payload.</div>`;
    return;
  }

  filteredSet.forEach(entry => {
    const row = document.createElement("div");
    row.className = "search-result-row";
    
    let graphicNode = "fa-search";
    if (entry.segment === "profile") graphicNode = "fa-user-shield";
    if (entry.segment === "location") graphicNode = "fa-map-location-dot";
    if (entry.segment === "contact") graphicNode = "fa-phone-flip";

    row.innerHTML = `
      <div class="result-main-info">
        <i class="fas ${graphicNode}"></i>
        <div>
          <div style="font-weight: 600; font-size: 14px;">${entry.label}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${entry.trace}</div>
        </div>
      </div>
    `;
    container.appendChild(row);
  });
}

function purgeHistoryElement(offset, event) {
  event.stopPropagation();
  persistentHistoricalLogs.splice(offset, 1);
  renderHistoryView();
                             }
