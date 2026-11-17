const currentSessionUser = "Abir Mazumder";

let systemReelsDataset = [
  { id: 101, author: "Abir Mazumder", caption: "Uploading my development workflows in clean 16K stream layer! 🚀", resolution: "16K Neural", views: 245300, reacts: 999, userReacted: false, soundEnhanced: false, isFollowing: false },
  { id: 102, author: "Sarah Jenkins", caption: "Testing systemic matrix loops with AI resolution scaler configurations.", resolution: "4K Quad", views: 12400, reacts: 1420, userReacted: false, soundEnhanced: false, isFollowing: false }
];

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark-theme");
  initializeReelDisplayGrid();
});

function initializeReelDisplayGrid() {
  const container = document.getElementById("reelsContainer");
  if (!container) return;
  container.innerHTML = "";

  systemReelsDataset.forEach(reel => {
    const isOwnReel = reel.author === currentSessionUser;
    const card = document.createElement("div");
    card.className = "reel-viewport";
    card.innerHTML = `
      <div class="reel-video-placeholder">
        <i class="fas fa-clapperboard"></i>
        <span>Active Media Playback Segment</span>
        <div class="ai-badge-indicator" id="resolutionTag-${reel.id}"><i class="fas fa-microchip"></i> AI Enhanced (${reel.resolution})</div>
      </div>
      
      <div class="reel-overlay">
        <div class="reel-profile">
          <div class="avatar"><i class="fas fa-user"></i></div>
          <span class="reel-username">${reel.author}</span>
          ${!isOwnReel ? `<button class="follow-btn ${reel.isFollowing ? 'following' : ''}" onclick="toggleFollowState(${reel.id}, this)">${reel.isFollowing ? 'Following' : 'Follow'}</button>` : ''}
        </div>
        <div class="reel-caption">${reel.caption}</div>
        <div class="views-hud-tag"><i class="fas fa-eye"></i> ${formatMetricDisplay(reel.views)} views</div>
      </div>
      
      <div class="reel-actions-sidebar">
        <div class="action-item" onclick="processIncrementalReact(${reel.id}, this)">
          <button style="color: ${reel.userReacted ? '#0b5d3b' : '#fff'}">
            <i class="${reel.userReacted ? 'fas' : 'far'} fa-thumbs-up"></i>
          </button>
          <span class="react-counter-label">${formatMetricDisplay(reel.reacts)}</span>
        </div>
        
        <div class="action-item" onclick="triggerAiDownload(${reel.id})">
          <button><i class="fas fa-cloud-arrow-down"></i></button>
          <span>Download</span>
        </div>
        
        <div class="action-item" onclick="openOptionsContextLayer(${reel.id})">
          <button><i class="fas fa-ellipsis-h"></i></button>
          <span>Options</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function formatMetricDisplay(count) {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toString();
}

function toggleFollowState(id, btnElement) {
  const reel = systemReelsDataset.find(r => r.id === id);
  if (!reel) return;
  
  reel.isFollowing = !reel.isFollowing;
  if (reel.isFollowing) {
    btnElement.classList.add("following");
    btnElement.textContent = "Following";
    displayToast(`You started following ${reel.author}`);
  } else {
    btnElement.classList.remove("following");
    btnElement.textContent = "Follow";
    displayToast(`Unfollowed ${reel.author}`);
  }
}

function processIncrementalReact(id, targetElement) {
  const reel = systemReelsDataset.find(r => r.id === id);
  if (!reel) return;

  if (reel.userReacted) {
    reel.reacts -= 1;
    reel.userReacted = false;
  } else {
    reel.reacts += 1;
    reel.userReacted = true;
  }

  const label = targetElement.querySelector(".react-counter-label");
  const button = targetElement.querySelector("button");
  const icon = targetElement.querySelector("i");

  label.textContent = formatMetricDisplay(reel.reacts);
  button.style.color = reel.userReacted ? '#0b5d3b' : '#fff';
  icon.className = `${reel.userReacted ? 'fas' : 'far'} fa-thumbs-up`;
}

let activeContextReelId = null;

function openOptionsContextLayer(id) {
  activeContextReelId = id;
  const reel = systemReelsDataset.find(r => r.id === id);
  if (!reel) return;

  document.getElementById("resolutionScaler").value = reel.resolution.includes("16K") ? "16K" : (reel.resolution.includes("8K") ? "8K" : "4K");
  document.getElementById("soundEnhanceToggle").checked = reel.soundEnhanced;

  const menu = document.getElementById("reelActionsMenu");
  menu.innerHTML = "";

  if (reel.author === currentSessionUser) {
    menu.innerHTML = `
      <button class="menu-action-row" onclick="executeMockAction('Shared with Friends successfully')"><i class="fas fa-user-group"></i> Share with Friends</button>
      <button class="menu-action-row" onclick="executeMockAction('Saved to Collection database')"><i class="fas fa-bookmark"></i> Save</button>
      <button class="menu-action-row" onclick="executeMockAction('Edit module layer initialized')"><i class="fas fa-pen"></i> Edit</button>
      <button class="menu-action-row danger" onclick="deleteReelInstance(${reel.id})"><i class="fas fa-trash-can"></i> Delete</button>
    `;
  } else {
    menu.innerHTML = `
      <button class="menu-action-row" onclick="executeMockAction('Link forwarded directly to network contacts')"><i class="fas fa-share"></i> Share with Friends</button>
      <button class="menu-action-row" onclick="executeMockAction('Saved to Collection database')"><i class="fas fa-bookmark"></i> Save</button>
      <button class="menu-action-row danger" onclick="invokeReportMatrix()"><i class="fas fa-triangle-exclamation"></i> Report</button>
    `;
  }
  openModal("mReelOptions");
}

function changeResolutionProfile() {
  const select = document.getElementById("resolutionScaler");
  const reel = systemReelsDataset.find(r => r.id === activeContextReelId);
  if (!reel) return;

  reel.resolution = select.value === "16K" ? "16K Neural" : (select.value === "8K" ? "8K Cinema" : "4K Quad");
  const tag = document.getElementById(`resolutionTag-${reel.id}`);
  if (tag) tag.innerHTML = `<i class="fas fa-microchip"></i> AI Enhanced (${reel.resolution})`;
  displayToast(`Resolution scaled to ${reel.resolution} profile dynamically.`);
}

function toggleSoundEnhancement() {
  const toggle = document.getElementById("soundEnhanceToggle");
  const reel = systemReelsDataset.find(r => r.id === activeContextReelId);
  if (!reel) return;

  reel.soundEnhanced = toggle.checked;
  displayToast(reel.soundEnhanced ? "Enhance Sound set to 200% (On)" : "Enhance Sound restored to 100% (Off)");
}

function executeMockAction(msg) {
  closeModal("mReelOptions");
  displayToast(msg);
}

function deleteReelInstance(id) {
  systemReelsDataset = systemReelsDataset.filter(r => r.id !== id);
  closeModal("mReelOptions");
  initializeReelDisplayGrid();
  displayToast("Reel deleted permanently");
}

function invokeReportMatrix() {
  closeModal("mReelOptions");
  openModal("mReelReport");
}

function submitReelReport() {
  const reason = document.getElementById("reelReportReason").value;
  closeModal("mReelReport");
  displayToast("Report standard log routed to audit. Review verification completes within 24-48 hrs.");
  localStorage.setItem(`reported_reel_reason_${activeContextReelId}`, reason);
}

function triggerAiUpload() {
  displayToast("Processing payload: Upscaling and enhancing target file matching 4K-16K limits...");
}

function triggerAiDownload(id) {
  displayToast("Downloading AI Enhanced media stream tracking asset components...");
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
