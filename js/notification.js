const appSessionOwner = "Abir Mazumder";

let notificationLogs = [
  { id: 401, targetPostAuthor: "Abir Mazumder", message: "liked your emergency configuration status update.", time: "Just now", type: "like", unread: true },
  { id: 402, targetPostAuthor: "Sarah Jenkins", message: "posted an unverified security alert containing parameters mismatch.", time: "2 hours ago", type: "alert", unread: true },
  { id: 501, type: "audit_positive", targetPostAuthor: "Enforcement Bot", message: "Audit update regarding your flagged report transaction criteria.", time: "1 day ago", unread: false, textSummary: "no problem in this reels" },
  { id: 502, type: "audit_negative", targetPostAuthor: "Enforcement Bot", message: "Enforcement compliance response confirmation update log:", time: "2 days ago", unread: false, textSummary: "successful your review, we take this profile down" }
];

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark-theme");
  renderNotificationCenter();
  triggerPlatformPingSound();
});

function triggerPlatformPingSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    setTimeout(() => executeToneGen(ctx, 880, 0.07), 0);
    setTimeout(() => executeToneGen(ctx, 1318, 0.11), 55);
  } catch(e) {
    console.log("Audio constraints parameters interaction log catch exception:", e);
  }
}

function executeToneGen(ctx, freq, duration) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function renderNotificationCenter() {
  const targetBox = document.getElementById("notificationAuditBox");
  if (!targetBox) return;
  targetBox.innerHTML = "";

  notificationLogs.forEach(log => {
    const container = document.createElement("div");
    const isAudit = log.type.startsWith("audit");
    const isPositive = log.type === "audit_positive";
    
    container.className = `notif-item ${log.unread ? 'unread' : ''}`;
    
    let iconHTML = `<i class="fas fa-bell"></i>`;
    if (log.type === "like") iconHTML = `<i class="fas fa-thumbs-up" style="color:var(--fb-green);"></i>`;
    if (log.type === "alert") iconHTML = `<i class="fas fa-triangle-exclamation" style="color:var(--error);"></i>`;
    if (isAudit) iconHTML = `<i class="fas ${isPositive ? 'fa-circle-check' : 'fa-user-slash'}"></i>`;

    container.innerHTML = `
      ${log.unread ? '<div class="unread-dot"></div>' : ''}
      <div class="notif-icon ${isAudit ? (isPositive ? 'verdict-positive' : 'verdict-negative') : ''}">
        ${iconHTML}
      </div>
      <div class="notif-details" onclick="markAsRead(${log.id}, this)">
        <div class="notif-message">
          <b>${log.targetPostAuthor}</b> ${log.message}
          ${log.textSummary ? `<div class="enforcement-card-banner">${log.textSummary}</div>` : ''}
        </div>
        <div class="notif-time">${log.time}</div>
      </div>
      <button class="notif-more-btn" onclick="openNotifContextOverlay(${log.id}, event)"><i class="fas fa-ellipsis-h"></i></button>
    `;

    targetBox.appendChild(container);
  });
}

function markAsRead(id, element) {
  const log = notificationLogs.find(n => n.id === id);
  if (log) log.unread = false;
  const item = element.closest(".notif-item");
  item.classList.remove("unread");
  item.querySelector(".unread-dot")?.remove();
}

let activeNotifContextId = null;

function openNotifContextOverlay(id, event) {
  event.stopPropagation();
  activeNotifContextId = id;
  const log = notificationLogs.find(n => n.id === id);
  if (!log) return;

  const menu = document.getElementById("notifActionsMenu");
  menu.innerHTML = "";

  // Dynamic context conditional rules mapping out whether log resource item belongs to current active user profile identity
  if (log.targetPostAuthor === appSessionOwner || log.type.startsWith("audit")) {
    menu.innerHTML = `
      <button class="menu-action-row" onclick="dismissNotifAction('Notifications turned off for this asset post payload.')"><i class="fas fa-bell-slash"></i> Turn off notifications for this post</button>
      <button class="menu-action-row" onclick="dismissNotifAction('Item saved securely into local database configuration.')"><i class="fas fa-bookmark"></i> Save Notification</button>
      <button class="menu-action-row" onclick="dismissNotifAction('Forwarding tracking URL link parameters to network entries...')"><i class="fas fa-share-nodes"></i> Share Notification</button>
    `;
  } else {
    menu.innerHTML = `
      <i class="fas fa-bell-slash"></i> Turn off notifications for this post</button>
      <button class="menu-action-row" onclick="dismissNotifAction('Item saved securely into local database configuration.')"><i class="fas fa-bookmark"></i> Save Notification</button>
      <button class="menu-action-row" onclick="dismissNotifAction('Forwarding tracking URL link parameters to network entries...')"><i class="fas fa-share-nodes"></i> Share Notification</button>
      <button class="menu-action-row danger" onclick="invokeNotifReportMatrix()"><i class="fas fa-flag"></i> Report Activity</button>
    `;
  }
  openModal("mNotifOptions");
}

function dismissNotifAction(msg) {
  closeModal("mNotifOptions");
  displayToast(msg);
}

function invokeNotifReportMatrix() {
  closeModal("mNotifOptions");
  openModal("mNotifReport");
}

function submitNotifReport() {
  const reason = document.getElementById("notifReportReason").value;
  closeModal("mNotifReport");
  displayToast(`Report processed securely: ${reason}. Enforcement dashboard logs evaluate within 24 hours.`);
}

function displayToast(msg) {
  const container = document.getElementById("toast");
  if (!container) return;
  container.textContent = msg;
  container.classList.add("show");
  setTimeout(() => container.classList.remove("show"), 3500);
}

function openModal(id) { document.getElementById(id)?.classList.add("active"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("active"); }
