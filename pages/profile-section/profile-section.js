// State Management
let state = {
  isVisitorView: false,
  profileLocked: false,
  screenshotGuard: true,
  profileGuard: true,
  blackBadgeVerified: true,
  allowLinkShare: "yes",
  visibility: {
    posts: "public",
    follow: "public",
    phone: "friends",
    dob: "friends",
    following: "public"
  },
  pendingImageType: null,
  pendingImageData: null,
  currentGalleryMode: null,
  selectedPostMedia: null,
  activeCommentPostId: null,
  posts: [],
  trashPosts: [],
  activityLogs: ["Profile initialized with Dark Green Theme."],
  security: {
    passwordOk: false,
    emailOk: false
  }
};

// Load saved profile data from Edit page if exists
function loadSavedProfileData() {
  const saved = JSON.parse(localStorage.getItem("autro_normal_profile"));
  if (saved) {
    if (saved.name) document.getElementById("displayName").textContent = saved.name;
    if (saved.bio) document.getElementById("displayBio").textContent = saved.bio;
    if (typeof saved.profileGuard === "boolean") state.profileGuard = saved.profileGuard;
    if (typeof saved.blackBadge === "boolean") state.blackBadgeVerified = saved.blackBadge;
  }
  applyGuardsAndBadges();
  renderPosts();
}

// Format Count (1000 -> 1k, 2000 -> 2k)
function formatCount(num) {
  if (num === 0) return "0";
  if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + "k";
  }
  return num.toString();
}

// Live Time Ago Updater
function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

setInterval(() => {
  document.querySelectorAll(".live-time").forEach(el => {
    const ts = Number(el.getAttribute("data-ts"));
    el.textContent = timeAgo(ts);
  });
}, 5000);

// Guards & Black Verification Badge
function applyGuardsAndBadges() {
  const body = document.getElementById("profileBody");
  const ssBanner = document.getElementById("screenshotGuardBanner");
  const avatarWrap = document.getElementById("avatarWrapper");
  const ppShield = document.getElementById("profileGuardShield");
  const badge = document.getElementById("blackBadge");

  if (state.screenshotGuard) {
    body.classList.add("screenshot-protected");
    ssBanner.classList.remove("hidden");
  } else {
    body.classList.remove("screenshot-protected");
    ssBanner.classList.add("hidden");
  }

  if (state.profileGuard) {
    avatarWrap.classList.add("guarded");
    ppShield.classList.remove("hidden");
  } else {
    avatarWrap.classList.remove("guarded");
    ppShield.classList.add("hidden");
  }

  badge.style.display = state.blackBadgeVerified ? "inline-flex" : "none";
  document.getElementById("ssGuardStatus").textContent = state.screenshotGuard ? "ON" : "OFF";
  document.getElementById("ppGuardStatus").textContent = state.profileGuard ? "ON" : "OFF";
}

function toggleScreenshotGuard() {
  state.screenshotGuard = !state.screenshotGuard;
  logActivity(`Screenshot Guard turned ${state.screenshotGuard ? "ON" : "OFF"}`);
  applyGuardsAndBadges();
}

function toggleProfileGuard() {
  state.profileGuard = !state.profileGuard;
  logActivity(`Profile Picture Guard turned ${state.profileGuard ? "ON" : "OFF"}`);
  applyGuardsAndBadges();
}

// Block PrintScreen Key when Screenshot Guard is ON
document.addEventListener("keyup", (e) => {
  if (state.screenshotGuard && e.key === "PrintScreen") {
    navigator.clipboard.writeText("");
    alert("Screenshot Guard is active on this profile!");
  }
});

// Image Selection & Mandatory Review Modal
function openImageReview(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.pendingImageType = type;
    state.pendingImageData = reader.result;
    document.getElementById("reviewPreviewImg").src = reader.result;
    openModal("imageReviewModal");
  };
  reader.readAsDataURL(file);
}

function confirmImageUpdate() {
  if (state.pendingImageType === "profile") {
    document.getElementById("profileImg").src = state.pendingImageData;
    document.getElementById("miniAvatar").src = state.pendingImageData;
    logActivity("Updated profile picture after review.");
  } else if (state.pendingImageType === "cover") {
    document.getElementById("coverImg").src = state.pendingImageData;
    logActivity("Updated cover photo after review.");
  }
  closeModal("imageReviewModal");
}

// Gallery Upload Handler (Stories, Highlights, Posts)
function triggerGalleryUpload(mode) {
  state.currentGalleryMode = mode;
  document.getElementById("galleryPicker").click();
}

function handleGallerySelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (state.currentGalleryMode === "story") {
      alert("Story uploaded from gallery!");
      logActivity("Added a new story from gallery.");
    } else if (state.currentGalleryMode === "highlight") {
      const container = document.getElementById("highlightsContainer");
      const div = document.createElement("div");
      div.className = "highlight-item";
      div.innerHTML = `<img src="${reader.result}" alt="Highlight" /><span>New</span>`;
      container.appendChild(div);
      logActivity("Added a new highlight.");
    } else if (state.currentGalleryMode === "postPhoto") {
      state.selectedPostMedia = reader.result;
      alert("Photo/Video attached to your post!");
    }
  };
  reader.readAsDataURL(file);
}

// Profile Lock & Granular Privacy
function toggleProfileLockState() {
  state.profileLocked = document.getElementById("profileLockToggle").checked;
  logActivity(`Profile Lock ${state.profileLocked ? "Enabled" : "Disabled"}`);
  applyVisitorVisibility();
}

function setAllVisibilityNone() {
  document.getElementById("visPosts").value = "none";
  document.getElementById("visFollow").value = "none";
  document.getElementById("visPhone").value = "none";
  document.getElementById("visDob").value = "none";
  document.getElementById("visFollowing").value = "none";
  saveVisibilityRules();
  alert("All profile details hidden (Set to None) for visitors.");
}

function saveVisibilityRules() {
  state.visibility.posts = document.getElementById("visPosts").value;
  state.visibility.follow = document.getElementById("visFollow").value;
  state.visibility.phone = document.getElementById("visPhone").value;
  state.visibility.dob = document.getElementById("visDob").value;
  state.visibility.following = document.getElementById("visFollowing").value;
  state.allowLinkShare = document.getElementById("allowLinkShare").value;
  applyVisitorVisibility();
}

// View As (Owner vs Visitor Simulation)
function toggleViewAs() {
  state.isVisitorView = !state.isVisitorView;
  document.getElementById("threeDotMenu").classList.add("hidden");
  document.getElementById("visitorThreeDotMenu").classList.add("hidden");

  document.querySelectorAll(".owner-only").forEach(el => {
    el.classList.toggle("hidden", state.isVisitorView);
  });
  document.querySelectorAll(".visitor-only").forEach(el => {
    el.classList.toggle("hidden", !state.isVisitorView);
  });

  document.getElementById("viewModeIndicator").innerHTML = state.isVisitorView
    ? `<i class="fa-solid fa-eye"></i> Viewing as: <strong>Public Visitor (View As)</strong>`
    : `<i class="fa-solid fa-user-check"></i> Viewing as: <strong>Owner (You)</strong>`;

  applyVisitorVisibility();
  renderPosts();
}

function applyVisitorVisibility() {
  const lockNotice = document.getElementById("lockedProfileNotice");
  const followBtn = document.getElementById("visitorFollowBtn");

  if (!state.isVisitorView) {
    lockNotice.classList.add("hidden");
    document.querySelectorAll("#aboutDetailsList li").forEach(li => li.classList.remove("hidden"));
    return;
  }

  // Show Follow button if allowed
  followBtn.classList.toggle("hidden", state.visibility.follow === "none");

  // Lock notice
  if (state.profileLocked) {
    lockNotice.classList.remove("hidden");
  } else {
    lockNotice.classList.add("hidden");
  }

  // Filter Details items based on visibility settings
  document.querySelectorAll("#aboutDetailsList li").forEach(li => {
    const type = li.getAttribute("data-privacy");
    if (type === "phone" && state.visibility.phone === "none") li.classList.add("hidden");
    else if (type === "dob" && state.visibility.dob === "none") li.classList.add("hidden");
    else if (type === "following" && state.visibility.following === "none") li.classList.add("hidden");
    else if (state.profileLocked && state.visibility.posts === "none") li.classList.add("hidden");
    else li.classList.remove("hidden");
  });
}

// Copy & Share Profile Link (Respects Owner Lock)
function copyProfileLink() {
  if (state.isVisitorView && state.allowLinkShare === "no") {
    alert("The profile owner has disabled copying or sharing this profile link.");
    return;
  }
  navigator.clipboard.writeText(window.location.href);
  alert("Profile link copied to clipboard!");
}

function shareProfileLink() {
  if (state.isVisitorView && state.allowLinkShare === "no") {
    alert("Sharing is disabled by the profile owner.");
    return;
  }
  alert("Share dialog opened for: " + window.location.href);
}

// Security Checkup Fixer
function fixSecurityIssue(type) {
  if (type === "password") {
    state.security.passwordOk = true;
    document.getElementById("secPassItem").innerHTML = `<i class="fa-solid fa-circle-check text-green"></i> Password Strength: Strong & Updated`;
  }
  if (type === "email") {
    state.security.emailOk = true;
    document.getElementById("secEmailItem").innerHTML = `<i class="fa-solid fa-circle-check text-green"></i> Recovery Email: Verified Owner Email`;
  }
  if (state.security.passwordOk && state.security.emailOk) {
    const box = document.getElementById("securityStatusBox");
    box.className = "security-alert ok";
    box.innerHTML = `<i class="fa-solid fa-circle-check"></i><div><strong>All is ok, Secure your account</strong><p>No unauthorized emails or password vulnerabilities found.</p></div>`;
    logActivity("Completed Security Checkup: All is ok.");
  }
}

// Create & Render Posts (Zero reactions initially, live timestamps, 1k/2k counts)
function publishPost() {
  const text = document.getElementById("postTextInput").value.trim();
  if (!text && !state.selectedPostMedia) return;

  const newPost = {
    id: Date.now(),
    text,
    media: state.selectedPostMedia,
    timestamp: Date.now(),
    reactions: 0,
    userReacted: null,
    commentSetting: "public",
    allowedFriends: [],
    comments: []
  };

  state.posts.unshift(newPost);
  document.getElementById("postTextInput").value = "";
  state.selectedPostMedia = null;
  logActivity("Published a new post.");
  renderPosts();
}

function renderPosts() {
  const container = document.getElementById("postsFeedContainer");

  if (state.isVisitorView && state.visibility.posts === "none") {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-lock fa-2x"></i><p>No posts visible to visitors.</p></div>`;
    return;
  }

  if (state.posts.length === 0) {
    container.innerHTML = `<div class="empty-state"><p><strong>No post yet</strong></p></div>`;
    return;
  }

  container.innerHTML = state.posts.map(post => {
    const isCommentDisabled = post.commentSetting === "off";
    return `
      <div class="post-card" id="post-${post.id}">
        <div class="post-header">
          <div class="post-author-info">
            <img src="${document.getElementById("profileImg").src}" alt="Avatar" />
            <div>
              <strong>${document.getElementById("displayName").textContent}</strong>
              <div class="post-time"><span class="live-time" data-ts="${post.timestamp}">${timeAgo(post.timestamp)}</span> • <i class="fa-solid fa-globe"></i></div>
            </div>
          </div>
          <div class="dropdown-wrapper">
            <button class="btn-outline-sm" onclick="togglePostMenu(${post.id})"><i class="fa-solid fa-ellipsis"></i></button>
            <div id="postMenu-${post.id}" class="dropdown-menu hidden">
              ${!state.isVisitorView ? `
                <button onclick="openCommentControl(${post.id})"><i class="fa-solid fa-comments"></i> Who can comment</button>
                <button onclick="editPostText(${post.id})"><i class="fa-solid fa-pen"></i> Edit Post</button>
                <button onclick="copyPostLink(${post.id})"><i class="fa-solid fa-link"></i> Copy Post Link</button>
                <button class="text-danger" onclick="movePostToTrash(${post.id})"><i class="fa-solid fa-trash"></i> Move to Trash</button>
              ` : `
                <button onclick="alert('Post Saved!')"><i class="fa-solid fa-bookmark"></i> Save Post</button>
                <button onclick="alert('Post Downloaded!')"><i class="fa-solid fa-download"></i> Download Post</button>
                <button onclick="copyPostLink(${post.id})"><i class="fa-solid fa-link"></i> Copy Post Link</button>
                <button class="text-danger" onclick="openModal('reportProfileModal')"><i class="fa-solid fa-flag"></i> Report Post</button>
              `}
            </div>
          </div>
        </div>

        <div class="post-body">${post.text}</div>
        ${post.media ? `<img src="${post.media}" class="post-media" alt="Post Media" />` : ""}

        <div class="post-stats-bar">
          <span>${post.userReacted || "👍"} <strong id="reactCount-${post.id}">${formatCount(post.reactions)}</strong></span>
          <span>${formatCount(post.comments.length)} comments</span>
        </div>

        <div class="post-actions-bar">
          <div id="reactDock-${post.id}" class="reaction-dock hidden">
            ${["👍", "❤️", "🥰", "😆", "😠", "😢", "😮"].map(emoji =>
              `<span onclick="selectReaction(${post.id}, '${emoji}')">${emoji}</span>`
            ).join("")}
          </div>
          <button class="post-action-btn"
            onmousedown="startLongPress(${post.id})"
            onmouseup="endLongPress(${post.id})"
            ontouchstart="startLongPress(${post.id})"
            ontouchend="endLongPress(${post.id})">
            ${post.userReacted ? post.userReacted + " Reacted" : '<i class="fa-regular fa-thumbs-up"></i> Like'}
          </button>
          <button class="post-action-btn" onclick="focusComment(${post.id})"><i class="fa-regular fa-comment"></i> Comment</button>
          <button class="post-action-btn" onclick="copyPostLink(${post.id})"><i class="fa-solid fa-share"></i> Share</button>
        </div>

        <!-- Comments Section with 30s Voice Filter Recorder -->
        <div class="comments-section">
          ${isCommentDisabled ? `<p class="post-time"><i class="fa-solid fa-ban"></i> Comments are turned off for this post.</p>` : `
            <div class="comment-input-row">
              <input type="text" id="commentInput-${post.id}" placeholder="Write a comment..." />
              <button class="btn-dark-green btn-sm" onclick="addTextComment(${post.id})">Send</button>
            </div>
            <div class="voice-controls">
              <i class="fa-solid fa-microphone text-green"></i>
              <span>30s Voice:</span>
              <select id="voiceFilter-${post.id}">
                <option value="Normal">Normal</option>
                <option value="Eco">Eco</option>
                <option value="Deep">Deep</option>
              </select>
              <button class="btn-xs" onclick="recordVoiceComment(${post.id})">Record & Post (30s)</button>
            </div>
          `}
          <div id="commentsList-${post.id}">
            ${post.comments.map(c => `<div class="comment-item"><strong>${c.author}:</strong> ${c.content}</div>`).join("")}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Long-Press Reaction Logic
let pressTimer;
let isLongPressed = false;

function startLongPress(postId) {
  isLongPressed = false;
  pressTimer = setTimeout(() => {
    isLongPressed = true;
    document.getElementById(`reactDock-${postId}`).classList.remove("hidden");
  }, 450);
}

function endLongPress(postId) {
  clearTimeout(pressTimer);
  if (!isLongPressed) {
    selectReaction(postId, "👍");
  }
}

function selectReaction(postId, emoji) {
  const post = state.posts.find(p => p.id === postId);
  if (!post) return;
  if (!post.userReacted) post.reactions += 1;
  post.userReacted = emoji;
  document.getElementById(`reactDock-${postId}`).classList.add("hidden");
  renderPosts();
}

// Comments & 30s Voice Comments
function addTextComment(postId) {
  const input = document.getElementById(`commentInput-${postId}`);
  if (!input.value.trim()) return;
  const post = state.posts.find(p => p.id === postId);
  post.comments.push({
    author: state.isVisitorView ? "Visitor" : document.getElementById("displayName").textContent,
    content: input.value.trim()
  });
  renderPosts();
}

function recordVoiceComment(postId) {
  const filter = document.getElementById(`voiceFilter-${postId}`).value;
  const post = state.posts.find(p => p.id === postId);
  post.comments.push({
    author: state.isVisitorView ? "Visitor" : document.getElementById("displayName").textContent,
    content: `🎤 [Voice Note 0:30 • Effect: ${filter}] ▶️ ılılıllıılılı`
  });
  renderPosts();
}

// Post 3-Dot Owner Actions
function togglePostMenu(postId) {
  document.getElementById(`postMenu-${postId}`).classList.toggle("hidden");
}

function openCommentControl(postId) {
  state.activeCommentPostId = postId;
  togglePostMenu(postId);
  openModal("commentControlModal");
}

function toggleFriendSelector() {
  const val = document.getElementById("commentAudienceSelect").value;
  document.getElementById("specificFriendsBox").classList.toggle("hidden", val !== "specific_friends");
}

function savePostCommentSetting() {
  const post = state.posts.find(p => p.id === state.activeCommentPostId);
  if (post) {
    post.commentSetting = document.getElementById("commentAudienceSelect").value;
  }
  closeModal("commentControlModal");
  renderPosts();
}

function editPostText(postId) {
  const post = state.posts.find(p => p.id === postId);
  const updated = prompt("Edit your post:", post.text);
  if (updated !== null) {
    post.text = updated;
    logActivity("Edited a post.");
    renderPosts();
  }
}

function movePostToTrash(postId) {
  const idx = state.posts.findIndex(p => p.id === postId);
  if (idx > -1) {
    const [removed] = state.posts.splice(idx, 1);
    state.trashPosts.push(removed);
    logActivity("Moved a post to Trash.");
    renderPosts();
  }
}

function copyPostLink(postId) {
  navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
  alert("Post link copied!");
}

// Activity Log & Trash
function logActivity(msg) {
  state.activityLogs.unshift(`${new Date().toLocaleTimeString()} - ${msg}`);
  updateLogsUI();
}

function updateLogsUI() {
  document.getElementById("trashCount").textContent = state.trashPosts.length;
  document.getElementById("activityLogList").innerHTML = state.activityLogs
    .map(l => `<div class="comment-item">${l}</div>`).join("");
  document.getElementById("trashPostList").innerHTML = state.trashPosts.length === 0
    ? "<p class='post-time'>Trash is empty.</p>"
    : state.trashPosts.map(p => `<div class="comment-item">${p.text || "Media Post"} <button class="btn-xs" onclick="restorePost(${p.id})">Restore</button></div>`).join("");
}

function restorePost(postId) {
  const idx = state.trashPosts.findIndex(p => p.id === postId);
  if (idx > -1) {
    const [restored] = state.trashPosts.splice(idx, 1);
    state.posts.unshift(restored);
    renderPosts();
    updateLogsUI();
  }
}

function switchLogTab(tab) {
  document.getElementById("activityLogList").classList.toggle("hidden", tab !== "activity");
  document.getElementById("trashPostList").classList.toggle("hidden", tab !== "trash");
}

// Utilities
function toggleThreeDotMenu() {
  document.getElementById("threeDotMenu").classList.toggle("hidden");
}
function toggleVisitorMenu() {
  document.getElementById("visitorThreeDotMenu").classList.toggle("hidden");
}
function sendPoke() {
  alert("You poked Abir Mazumder! 👋");
}
function submitReport() {
  closeModal("reportProfileModal");
  alert("Report submitted to moderation team.");
}
function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

window.onload = loadSavedProfileData;
