// Base Application Architecture Storage Objects
let feedData = [
  { id: 1, author: "Jane Doe", type: "posts", text: "Building clean interface component architectures for global application routers!", time: "Just now" },
  { id: 2, author: "Safety Team", type: "missing", text: "Urgent: Missing Person alert raised in Sector 4. Please verify status records immediately.", time: "45 mins ago" },
  { id: 3, author: "Rafiq Hasan", type: "posts", text: "Explored the new dashboard modular routing dependencies today. Exceptional speed layers.", time: "2 hrs ago" }
];

document.addEventListener("DOMContentLoaded", function () {
  // Check localStorage, falling back to System Preferences (Default Theme Check)
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.body.classList.add("dark-theme");
    const icon = document.getElementById("themeIcon");
    if (icon) icon.className = "fas fa-sun";
  }

  // Set mock live state properties for notification indicators
  const notifDot = document.getElementById("notifDot");
  if (notifDot) notifDot.style.display = "block";

  // Initial Content Execution Thread Rendering
  renderFeed("all");
});

// Layout Navigation Feed Renderer
function renderFeed(filterType) {
  const container = document.getElementById("feedContainer");
  if (!container) return;

  container.innerHTML = "";

  const filtered = feedData.filter(item => filterType === "all" || item.type === filterType);

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted)">No updates processed in this directory.</div>`;
    return;
  }

  filtered.forEach(post => {
    const postCard = document.createElement("article");
    postCard.className = "post-card";
    postCard.innerHTML = `
      <div class="post-header">
        <div class="post-author-info">
          <div class="avatar"><i class="fas fa-user"></i></div>
          <div>
            <div class="author-name">${post.author}</div>
            <div class="post-meta"><span>${post.time}</span> &middot; <i class="fas fa-globe"></i></div>
          </div>
        </div>
        <div class="icon-btn" style="background:transparent;" onclick="triggerReportModal(${post.id})"><i class="fas fa-ellipsis-h"></i></div>
      </div>
      <div class="post-type-tag">${post.type.toUpperCase()}</div>
      <div class="post-text">${post.text}</div>
      <div class="post-interactions">
        <button class="interact-btn" onclick="showToast('Liked post')"><i class="far fa-thumbs-up"></i> Like</button>
        <button class="interact-btn" onclick="triggerReportModal(${post.id})"><i class="far fa-flag"></i> Report</button>
      </div>
    `;
    container.appendChild(postCard);
  });
}

// Global Category Filter Trigger
function filterFeed(type, buttonElement = null) {
  renderFeed(type);

  if (buttonElement) {
    const buttons = document.querySelectorAll(".filter-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    buttonElement.classList.add("active");
  }
}

// Light & Dark Modality Toggle Routine
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-theme");
  const icon = document.getElementById("themeIcon");
  
  if (isDark) {
    localStorage.setItem("theme", "dark");
    if (icon) icon.className = "fas fa-sun";
  } else {
    localStorage.setItem("theme", "light");
    if (icon) icon.className = "fas fa-moon";
  }
}

// Modal Toggle Mechanisms
function openModal(modalId) {
  const target = document.getElementById(modalId);
  if (target) target.classList.add("active");
}

function closeModal(modalId) {
  const target = document.getElementById(modalId);
  if (target) target.classList.remove("active");
}

// Interactive Feed Actions Handling Processes
function publishPost() {
  const textInput = document.getElementById("postText");
  if (!textInput || textInput.value.trim() === "") return;

  const newPost = {
    id: Date.now(),
    author: "Abir Mazumder",
    type: "posts",
    text: textInput.value,
    time: "Just now"
  };

  feedData.unshift(newPost);
  textInput.value = "";
  closeModal("mComposer");
  renderFeed("all");
  showToast("Post published successfully!");
}

let activeReportId = null;
function triggerReportModal(postId) {
  activeReportId = postId;
  openModal("mReport");
}

function submitReport() {
  const reason = document.getElementById("reportReason")?.value;
  closeModal("mReport");
  showToast(`Post reported securely for: ${reason}`);
  activeReportId = null;
}

function sosAlert() {
  showToast("Emergency SOS broadcast! Sharing verified live location...");
}

// Global Core Toast Alert Interface Wrapper
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Navigation Auxiliary Controls
function scrollTopPage() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
      }
