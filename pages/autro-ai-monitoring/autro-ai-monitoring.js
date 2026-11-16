document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const zenToggleBtn = document.getElementById("zenToggleBtn");
  const feedListContainer = document.getElementById("monitoringFeedList");
  const filterButtons = document.querySelectorAll(".filter-tabs .tab-btn");

  let currentFilter = "all";
  let isZen = localStorage.getItem("autro_ai_zen") === "true";

  // Apply Zen State on load
  if (isZen) {
    document.body.classList.add("zen-mode");
  }

  // Back Navigation
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "../../index.html";
      }
    });
  }

  // Zen Mode Toggle
  if (zenToggleBtn) {
    zenToggleBtn.addEventListener("click", () => {
      isZen = !isZen;
      localStorage.setItem("autro_ai_zen", isZen);
      document.body.classList.toggle("zen-mode", isZen);
      showToast(isZen ? "🧘 Zen Mode Enabled" : "Zen Mode Disabled");
    });
  }

  // Refresh
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadFeedMonitoringData();
      showToast("✓ Feed Monitor Refreshed");
    });
  }

  // Filter Tabs
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-filter");
      loadFeedMonitoringData();
    });
  });

  // Load Feed Data from localStorage (Scans posts, comments, voice notes, reels across the feed)
  function loadFeedMonitoringData() {
    let allItems = [];

    // Scan all local storage keys related to feed items, comments, reels, etc.
    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      if (key && (key.startsWith("ab_comments_") || key.startsWith("autro_posts_") || key.startsWith("ab_reels_"))) {
        try {
          let data = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(data)) {
            data.forEach(item => {
              let timestamp = item.time || item.createdAt || Date.now();
              let elapsed = Date.now() - timestamp;
              let hoursLeft = Math.max(0, 24 - (elapsed / (1000 * 60 * 60))).toFixed(1);

              allItems.push({
                id: item.id || Math.random().toString(),
                storageKey: key,
                author: item.name || item.author || "Autrobook User",
                text: item.text || item.caption || item.voiceUrl ? "[Voice / Media Post]" : "Community Post Item",
                time: timestamp,
                hoursLeft: parseFloat(hoursLeft),
                flagged: item.reported || item.flagged || false,
                type: key.includes("comments") ? "Comment" : key.includes("reels") ? "Reel" : "Post"
              });
            });
          }
        } catch (e) {}
      }
    }

    // Update Metrics
    let scanning = allItems.filter(x => x.hoursLeft > 0).length;
    let restricted = allItems.filter(x => x.flagged).length;
    let cleared = allItems.filter(x => !x.flagged).length;

    document.getElementById("countScanning").innerText = scanning;
    document.getElementById("countRestricted").innerText = restricted;
    document.getElementById("countCleared").innerText = cleared;

    // Filter Items
    let filtered = allItems;
    if (currentFilter === "scanning") {
      filtered = allItems.filter(x => x.hoursLeft > 0);
    } else if (currentFilter === "restricted") {
      filtered = allItems.filter(x => x.flagged);
    }

    if (filtered.length === 0) {
      feedListContainer.innerHTML = `<div class="empty-state">✨ All clear! No feed items currently under 24h AI observation.</div>`;
      return;
    }

    feedListContainer.innerHTML = filtered.map(item => `
      <div class="feed-monitor-card">
        <div class="card-top">
          <span><b>👤 ${escapeHtml(item.author)}</b> (${item.type})</span>
          <span class="badge-status ${item.flagged ? 'flagged' : item.hoursLeft > 0 ? 'review' : 'safe'}">
            ${item.flagged ? 'Flagged' : item.hoursLeft > 0 ? '24h Review Window' : 'AI Cleared'}
          </span>
        </div>
        <div class="card-content">${escapeHtml(item.text)}</div>
        <div class="card-footer">
          <span>⏳ Time left: <b>${item.hoursLeft} hrs</b></span>
          <span>${timeAgo(item.time)}</span>
        </div>
        <div class="card-actions">
          <button class="action-btn" onclick="approveItem('${item.storageKey}', '${item.id}')">
            <i class="ri-check-line"></i> AI Clear
          </button>
          <button class="action-btn danger" onclick="removeItem('${item.storageKey}', '${item.id}')">
            <i class="ri-delete-bin-line"></i> Remove & Issue
          </button>
        </div>
      </div>
    `).join("");
  }

  window.approveItem = function(storageKey, id) {
    let list = JSON.parse(localStorage.getItem(storageKey) || "[]");
    let target = list.find(x => (x.id || '') == id);
    if (target) {
      target.reported = false;
      target.flagged = false;
      localStorage.setItem(storageKey, JSON.stringify(list));
      loadFeedMonitoringData();
      showToast("🤖 Autro AI: Item approved and restored to feed.");
    }
  };

  window.removeItem = function(storageKey, id) {
    let list = JSON.parse(localStorage.getItem(storageKey) || "[]");
    list = list.filter(x => (x.id || '') != id);
    localStorage.setItem(storageKey, JSON.stringify(list));
    loadFeedMonitoringData();
    showToast("🤖 Autro AI: Item permanently removed from feed.");
  };

  function escapeHtml(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function timeAgo(t) {
    const mins = Math.floor((Date.now() - t) / 1000 / 60);
    if (mins < 1) return "Just now";
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.floor(hrs / 24) + "d ago";
  }

  function showToast(msg) {
    const t = document.getElementById("toastNotification");
    t.textContent = msg;
    t.removeAttribute("hidden");
    setTimeout(() => t.setAttribute("hidden", ""), 2500);
  }

  loadFeedMonitoringData();
});
