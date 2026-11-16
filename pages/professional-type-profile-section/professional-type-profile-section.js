let proState = {
  isVisitor: false,
  screenshotGuard: true,
  profileGuard: true,
  blackBadge: true,
  followers: 0,
  accountAgeDays: 1,
  monetized: false,
  pendingType: null,
  pendingSrc: null,
  currentCreateType: "Post",
  posts: []
};

function initProProfile() {
  const saved = JSON.parse(localStorage.getItem("autro_pro_profile"));
  if (saved) {
    if (saved.name) document.getElementById("proDisplayName").textContent = saved.name;
    if (saved.bio) document.getElementById("proDisplayBio").textContent = saved.bio;
    if (typeof saved.profileGuard === "boolean") proState.profileGuard = saved.profileGuard;
    if (typeof saved.blackBadge === "boolean") proState.blackBadge = saved.blackBadge;
  }
  applyProGuards();
  renderProFeed();
  updateDashboardStats();
}

function formatNum(n) {
  if (n === 0) return "0";
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  return n.toString();
}

function applyProGuards() {
  document.getElementById("proBody").classList.toggle("screenshot-protected", proState.screenshotGuard);
  document.getElementById("screenshotGuardBanner").classList.toggle("hidden", !proState.screenshotGuard);
  document.getElementById("avatarWrapper").classList.toggle("guarded", proState.profileGuard);
  document.getElementById("profileGuardShield").classList.toggle("hidden", !proState.profileGuard);
  document.getElementById("proBlackBadge").style.display = proState.blackBadge ? "inline-flex" : "none";
  document.getElementById("proSsStatus").textContent = proState.screenshotGuard ? "ON" : "OFF";
  document.getElementById("proPpStatus").textContent = proState.profileGuard ? "ON" : "OFF";
}

function toggleProScreenshotGuard() {
  proState.screenshotGuard = !proState.screenshotGuard;
  applyProGuards();
}

function toggleProProfileGuard() {
  proState.profileGuard = !proState.profileGuard;
  applyProGuards();
}

// Photo Review
function openProImageReview(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    proState.pendingType = type;
    proState.pendingSrc = reader.result;
    document.getElementById("proReviewImg").src = reader.result;
    openModal("proImageReviewModal");
  };
  reader.readAsDataURL(file);
}

function confirmProImage() {
  if (proState.pendingType === "profile") {
    document.getElementById("profileImg").src = proState.pendingSrc;
  } else {
    document.getElementById("coverImg").src = proState.pendingSrc;
  }
  closeModal("proImageReviewModal");
}

// + Create Menu (Reels, Video, Live, Post via Gallery)
function toggleCreateMenu() {
  document.getElementById("createDropdown").classList.toggle("hidden");
}

function openGalleryCreator(type) {
  proState.currentCreateType = type;
  toggleCreateMenu();
  if (type === "Live") {
    const title = prompt("Enter Live Stream Title:", "Live Session with Fans!");
    if (title) createProContent("Live", title, null);
    return;
  }
  document.getElementById("proGalleryInput").click();
}

function handleProMediaSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  const caption = prompt(`Write a caption for your ${proState.currentCreateType}:`, `New ${proState.currentCreateType} upload!`);
  const reader = new FileReader();
  reader.onload = () => {
    createProContent(proState.currentCreateType, caption || "", reader.result);
  };
  reader.readAsDataURL(file);
}

function createProContent(type, caption, mediaUrl) {
  const post = {
    id: Date.now(),
    type,
    caption,
    media: mediaUrl,
    timestamp: Date.now(),
    views: 0,
    reactions: 0,
    comments: []
  };
  proState.posts.unshift(post);
  renderProFeed();
  updateDashboardStats();
}

function renderProFeed() {
  const container = document.getElementById("proFeedContainer");
  const visPosts = document.getElementById("proVisPosts").value;

  if (proState.isVisitor && visPosts === "none") {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-lock"></i><p>No posts visible.</p></div>`;
    return;
  }

  if (proState.posts.length === 0) {
    container.innerHTML = `<div class="empty-state"><p><strong>No post yet</strong></p><p class="hint">Tap "+ Create" to publish Reels, Videos, Live, or Posts from your gallery.</p></div>`;
    return;
  }

  container.innerHTML = proState.posts.map(p => `
    <div class="post-card">
      <div class="post-header">
        <div class="post-author-info">
          <img src="${document.getElementById("profileImg").src}" alt="Avatar" />
          <div>
            <strong>${document.getElementById("proDisplayName").textContent}</strong> <span class="category-tag">• ${p.type}</span>
            <div class="post-time">Just now • <i class="fa-solid fa-globe"></i></div>
          </div>
        </div>
        ${proState.isVisitor ? `<button class="btn-outline-sm" onclick="followCreator()">Follow</button>` : ""}
      </div>
      <div class="post-body">${p.caption}</div>
      ${p.media ? `<img src="${p.media}" class="post-media" alt="Media" />` : ""}
      <div class="post-stats-bar">
        <span>👍 ${formatNum(p.reactions)}</span>
        <span>${formatNum(p.views)} views • ${formatNum(p.comments.length)} comments</span>
      </div>
      <div class="post-actions-bar">
        <button class="post-action-btn" onclick="boostDemoReach(${p.id})"><i class="fa-regular fa-thumbs-up"></i> React (+Reach)</button>
        <button class="post-action-btn" onclick="addProVoiceOrTextComment(${p.id})"><i class="fa-regular fa-comment"></i> Comment</button>
        <button class="post-action-btn" onclick="copyProLink()"><i class="fa-solid fa-share"></i> Share</button>
      </div>
    </div>
  `).join("");
}

// Simulate Reach & Views when audience interacts with a published post
function boostDemoReach(postId) {
  const post = proState.posts.find(p => p.id === postId);
  if (!post) return;
  post.reactions += 1;
  post.views += 25;
  renderProFeed();
  updateDashboardStats();
}

function addProVoiceOrTextComment(postId) {
  const post = proState.posts.find(p => p.id === postId);
  const msg = prompt("Write comment or type 'voice' for 30s Eco/Deep Voice note:");
  if (msg) {
    post.comments.push(msg);
    post.views += 10;
    renderProFeed();
    updateDashboardStats();
  }
}

// Dashboard Stats & Monetization Lock Logic
function updateDashboardStats() {
  const days = Number(document.getElementById("dashboardDaysFilter").value);
  const multiplier = days === 7 ? 1 : days === 14 ? 1.8 : 3.2;

  const totalViews = proState.posts.reduce((sum, p) => sum + p.views, 0);
  const totalEngagement = proState.posts.reduce((sum, p) => sum + p.reactions + p.comments.length, 0);

  document.getElementById("dashReach").textContent = formatNum(Math.round(totalViews * multiplier));
  document.getElementById("dashEngagement").textContent = formatNum(Math.round(totalEngagement * multiplier));
  document.getElementById("dashFollowers").textContent = formatNum(proState.followers);

  if (proState.monetized) {
    const estIncome = ((totalViews * multiplier) * 0.004).toFixed(2);
    document.getElementById("dashIncome").textContent = `$${estIncome}`;
    document.getElementById("monetizationBadge").className = "badge-unlocked";
    document.getElementById("monetizationBadge").innerHTML = `<i class="fa-solid fa-unlock"></i> Active`;
  } else {
    document.getElementById("dashIncome").textContent = "$0.00 (Locked)";
  }

  const listEl = document.getElementById("dashboardPostViewsList");
  if (proState.posts.length > 0) {
    listEl.innerHTML = proState.posts.map(p =>
      `<div class="comment-item"><strong>[${p.type}]</strong> ${p.caption || "Media"} — <strong>${formatNum(p.views)} views</strong></div>`
    ).join("");
  }
}

function simulateMonetizationUnlock() {
  proState.followers = 1050;
  proState.accountAgeDays = 370;
  proState.monetized = true;
  document.getElementById("proFollowerCount").textContent = formatNum(proState.followers);
  document.getElementById("critFollowerCount").textContent = "1,050";
  document.getElementById("followerProgress").style.width = "100%";
  document.getElementById("critAgeText").textContent = "1 Year 5 Days (Eligible)";
  document.getElementById("ageProgress").style.width = "100%";
  updateDashboardStats();
  alert("Monetization Unlocked! Approximate Income is now counting.");
}

function followCreator() {
  proState.followers += 1;
  document.getElementById("proFollowerCount").textContent = formatNum(proState.followers);
  updateDashboardStats();
  alert("Following Abir Mazumder!");
}

function toggleProViewAs() {
  proState.isVisitor = !proState.isVisitor;
  document.querySelectorAll(".owner-only").forEach(el => el.classList.toggle("hidden", proState.isVisitor));
  document.querySelectorAll(".visitor-only").forEach(el => el.classList.toggle("hidden", !proState.isVisitor));
  document.getElementById("viewModeIndicator").innerHTML = proState.isVisitor
    ? `<i class="fa-solid fa-eye"></i> Viewing as: <strong>Public Visitor</strong>`
    : `<i class="fa-solid fa-briefcase"></i> Professional Mode: <strong>Owner View</strong>`;
  renderProFeed();
}

function applyProPrivacy() {
  const phoneVis = document.getElementById("proVisPhone").value;
  const dobVis = document.getElementById("proVisDob").value;
  document.querySelector('[data-priv="phone"]').classList.toggle("hidden", proState.isVisitor && phoneVis === "none");
  document.querySelector('[data-priv="dob"]').classList.toggle("hidden", proState.isVisitor && dobVis === "none");
  renderProFeed();
}

function copyProLink() {
  if (proState.isVisitor && document.getElementById("proAllowShare").value === "no") {
    alert("Link copying is disabled by the creator.");
    return;
  }
  navigator.clipboard.writeText(window.location.href);
  alert("Creator profile link copied!");
}

function shareProLink() {
  if (proState.isVisitor && document.getElementById("proAllowShare").value === "no") {
    alert("Sharing is disabled by the creator.");
    return;
  }
  alert("Sharing creator profile link...");
}

function toggleProThreeDot() { document.getElementById("proThreeDotMenu").classList.toggle("hidden"); }
function toggleProVisitorMenu() { document.getElementById("proVisitorMenu").classList.toggle("hidden"); }
function openModal(id) { document.getElementById(id).classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }

window.onload = initProProfile;
