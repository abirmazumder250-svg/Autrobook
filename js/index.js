// ===== AUTROBOOK - js/index.js - FULL - PERMANENT PHOTO + VOICE =====
// Supabase + Auth + Posts + Comments + Reactions + Voice Effect + Storage

// ===== 1. CONFIG =====
const SUPABASE_URL = "https://gemyqaniztqrsilayblx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_";

let supabaseClient = null;
if (window.supabase && SUPABASE_URL.indexOf("YOUR-PROJECT") === -1) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ===== 2. STATE =====
let myName = localStorage.getItem("autro_user_name") || "Guest User";
let myEmail = localStorage.getItem("autro_user_email") || "";
let myAvatar = "https://i.pravatar.cc/100?img=12";
let myAccountCreated = localStorage.getItem("autro_account_created") || "";
let myIsOwner = (myEmail.toLowerCase().indexOf("abir") !== -1);
let allPosts = [];
let currentFilter = "all";
let currentPostId = null;
let currentCommentId = null;
let selectedReportReason = "";
let selectedVoiceEffect = "normal";
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;
let recTimer = null;
let recSeconds = 0;
let currentCreateType = "post";
let commentReactionsCache = {};
let commentPhotoBlob = null;

let demoPosts = [
  { id: "demo1", user_name: "Karim Uddin", user_avatar: "https://i.pravatar.cc/60?img=13", text: "Good morning from Tongi! Stay safe, stay kind. Autrobook is for everyone.", img: "https://picsum.photos/600/350?10", type: "posts", likes: 24, created_at: new Date().toISOString() },
  { id: "demo2", user_name: "Sumi Akter", user_avatar: "https://i.pravatar.cc/60?img=47", text: "O+ blood needed urgently at Dhaka Medical. Please share. Be a hero.", img: "", type: "blood", likes: 58, created_at: new Date().toISOString() },
  { id: "demo3", user_name: "Abir Mazumder", user_avatar: "https://i.pravatar.cc/60?img=12", text: "Missing: Sakib, Age 12, Last seen Tongi. Please share this post.", img: "https://picsum.photos/600/350?11", type: "missing", likes: 112, created_at: new Date().toISOString() }
];

const REPORT_REASONS = [
  { id: "harassment", label: "Harassment / Bullying", desc: "Targeted abuse, threats, or bullying" },
  { id: "hate", label: "Hate Speech", desc: "Attack based on race, religion, gender, disability" },
  { id: "violence", label: "Violence / Threat", desc: "Threat to harm a person or group" },
  { id: "sexual", label: "Sexual / Harassment Content", desc: "Non-consensual or explicit sexual content" },
  { id: "child", label: "Child Safety", desc: "Content harming or exploiting a minor" },
  { id: "spam", label: "Spam / Scam", desc: "Fake, scam, or misleading content" },
  { id: "misinformation", label: "False Information", desc: "Dangerous false health / news info" },
  { id: "privacy", label: "Privacy Violation", desc: "Private address, phone, photo without consent" },
  { id: "selfharm", label: "Self-Harm", desc: "Content promoting self-harm" },
  { id: "illegal", label: "Illegal Activity", desc: "Drugs, weapons, or other illegal acts" }
];

const REACTIONS = [
  { id: "like", emoji: "👍", label: "Like" },
  { id: "love", emoji: "❤️", label: "Love" },
  { id: "haha", emoji: "😆", label: "Haha" },
  { id: "wow", emoji: "😮", label: "Wow" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "angry", emoji: "😠", label: "Angry" }
];

// ===== 3. HELPERS =====
function showToast(msg) {
  let t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}
function escapeHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function timeAgo(dateStr) {
  try {
    let d = new Date(dateStr).getTime();
    let diff = Date.now() - d;
    let m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return m + "m ago";
    let h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  } catch (e) { return "Just now"; }
}
function getAccountAgeDays() {
  if (!myAccountCreated) return 0;
  let diff = Date.now() - new Date(myAccountCreated).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}
function canGoLive() {
  if (myIsOwner) return true;
  if (!myAccountCreated) return false;
  return getAccountAgeDays() >= 90;
}
function isLoggedIn() {
  return myName && myName !== "Guest User" && myEmail !== "";
}
function scrollTopPage() { window.scrollTo({ top: 0, behavior: "smooth" }); }
function handleSearch(e) {
  if (e.key !== "Enter") return;
  let q = document.getElementById("globalSearch").value.toLowerCase().trim();
  if (!q) { renderFeed(); return; }
  let filtered = allPosts.filter(p => (p.text || "").toLowerCase().includes(q) || (p.user_name || "").toLowerCase().includes(q));
  renderFeed(filtered);
  showToast("Found " + filtered.length + " results");
}

// ===== 3B. STORAGE UPLOAD - PERMANENT URL =====
async function uploadToStorage(bucket, file, fileName) {
  if (!supabaseClient) throw new Error("Supabase not connected");
  let { error } = await supabaseClient.storage.from(bucket).upload(fileName, file, { upsert: true });
  if (error) throw error;
  let { data } = supabaseClient.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}
async function uploadImageFile(file) {
  let ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  if (ext.length > 5) ext = "jpg";
  let fileName = Date.now() + "-" + Math.floor(Math.random() * 10000) + "." + ext;
  return await uploadToStorage("posts", file, fileName);
}

// ===== 4. THEME =====
function toggleTheme() {
  let isDark = document.body.classList.contains("theme-dark");
  if (isDark) {
    document.body.classList.remove("theme-dark");
    document.body.classList.add("theme-light");
    localStorage.setItem("autro_theme", "light");
    let ic = document.getElementById("themeIcon"); if (ic) ic.className = "fas fa-moon";
  } else {
    document.body.classList.remove("theme-light");
    document.body.classList.add("theme-dark");
    localStorage.setItem("autro_theme", "dark");
    let ic = document.getElementById("themeIcon"); if (ic) ic.className = "fas fa-sun";
  }
}
function initTheme() {
  let saved = localStorage.getItem("autro_theme");
  if (saved === "dark") document.body.classList.add("theme-dark");
  if (saved === "light") document.body.classList.add("theme-light");
}

// ===== 5. MODAL =====
function openModal(id) {
  let el = document.getElementById(id);
  if (el) el.classList.add("show");
}
function closeModal(id) {
  let el = document.getElementById(id);
  if (el) el.classList.remove("show");
}
document.addEventListener("click", function (e) {
  if (e.target.classList && e.target.classList.contains("modal-back")) {
    e.target.classList.remove("show");
  }
});

// ===== 6. USER UI =====
function updateUserUI() {
  let sn = document.getElementById("sidebarUserName"); if (sn) sn.textContent = myName;
  let se = document.getElementById("sidebarUserEmail"); if (se) se.textContent = myEmail || "Guest User";
  let sa = document.getElementById("sidebarAvatar"); if (sa) sa.src = myAvatar;
  let ca = document.getElementById("composerAvatar"); if (ca) ca.src = myAvatar;
  let pn = document.getElementById("profileUserName"); if (pn) pn.textContent = myName;
  let pe = document.getElementById("profileUserEmail"); if (pe) pe.textContent = myEmail || "Joined Autrobook • Safety Member";
  let pa = document.getElementById("profileAccountAge"); if (pa) pa.textContent = "Account Age: " + getAccountAgeDays() + " days • Live: " + (canGoLive() ? "Unlocked ✅" : "Locked 🔒");
  let cu = document.getElementById("composerUserName"); if (cu) cu.textContent = "What's on your mind, " + myName.split(" ")[0] + "?";
  let ab = document.getElementById("authBtnText"); if (ab) ab.textContent = isLoggedIn() ? myName.split(" ")[0] : "Login";
  let sab = document.getElementById("sidebarAuthBtn"); if (sab) sab.style.display = isLoggedIn() ? "none" : "block";
  let slb = document.getElementById("sidebarLogoutBtn"); if (slb) slb.style.display = isLoggedIn() ? "block" : "none";
  let abtn = document.getElementById("authBtn"); if (abtn) abtn.onclick = isLoggedIn() ? logoutUser : openAuthModal;
  updateLiveUI();
}
function updateLiveUI() {
  let liveSub = document.getElementById("liveSub");
  let liveNote = document.getElementById("liveNote");
  let liveBadge = document.getElementById("liveBadge");
  if (!liveSub) return;
  if (canGoLive()) {
    liveSub.textContent = "Go Live Now";
    if (liveNote) liveNote.style.display = "none";
    if (liveBadge) liveBadge.style.display = "inline-block";
  } else {
    let left = 90 - getAccountAgeDays();
    liveSub.textContent = "Locked • " + left + " days left";
    if (liveNote) {
      liveNote.style.display = "block";
      liveNote.textContent = "Live is locked. You need 90 days old account. Your account age: " + getAccountAgeDays() + " days. " + left + " days left. Owner is always unlocked.";
    }
    if (liveBadge) liveBadge.style.display = "none";
  }
}

// ===== 7. AUTH =====
var authMode = "login";
function openAuthModal() { openModal("mAuth"); }
function switchAuthTab(mode) {
  authMode = mode;
  let loginBtn = document.getElementById("tabLogin");
  let signupBtn = document.getElementById("tabSignup");
  let nameWrap = document.getElementById("signupNameWrap");
  let submitBtn = document.getElementById("authSubmitBtn");
  if (mode === "login") {
    loginBtn.style.background = "var(--primary)"; loginBtn.style.color = "#fff";
    signupBtn.style.background = "var(--input-bg)"; signupBtn.style.color = "var(--text)";
    nameWrap.style.display = "none"; submitBtn.textContent = "Login";
  } else {
    signupBtn.style.background = "var(--primary)"; signupBtn.style.color = "#fff";
    loginBtn.style.background = "var(--input-bg)"; loginBtn.style.color = "var(--text)";
    nameWrap.style.display = "block"; submitBtn.textContent = "Create Account";
  }
}
async function submitAuth() {
  let email = document.getElementById("authEmail").value.trim();
  let pass = document.getElementById("authPassword").value.trim();
  let nameEl = document.getElementById("authName");
  let name = nameEl ? nameEl.value.trim() : "";
  if (!email || email.indexOf("@") === -1) { showToast("Enter a valid email"); return; }
  if (pass.length < 6) { showToast("Password must be 6+ characters"); return; }
  if (authMode === "signup" && !name) { showToast("Enter your full name"); return; }
  let btn = document.getElementById("authSubmitBtn");
  btn.textContent = "Please wait..."; btn.disabled = true;
  try {
    if (!supabaseClient) throw new Error("Supabase not connected. Check keys in js/index.js");
    if (authMode === "signup") {
      let { data, error } = await supabaseClient.auth.signUp({ email: email, password: pass, options: { data: { full_name: name } } });
      if (error) throw error;
      try { await fetch("/api/welcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name, email: email }) }); } catch (e) {}
      showToast("✅ Account created! You can login now.");
      switchAuthTab("login");
    } else {
      let { data, error } = await supabaseClient.auth.signInWithPassword({ email: email, password: pass });
      if (error) throw error;
      let user = data.user;
      myName = (user.user_metadata && user.user_metadata.full_name) || email.split("@")[0];
      myEmail = email; myAccountCreated = user.created_at; myIsOwner = email.toLowerCase().indexOf("abir") !== -1;
      localStorage.setItem("autro_user_name", myName);
      localStorage.setItem("autro_user_email", myEmail);
      localStorage.setItem("autro_account_created", myAccountCreated);
      updateUserUI();
      showToast("✅ Welcome back, " + myName);
      closeModal("mAuth");
    }
    document.getElementById("authPassword").value = "";
  } catch (err) { showToast(err.message || "Auth failed"); }
  btn.textContent = authMode === "signup" ? "Create Account" : "Login";
  btn.disabled = false;
}
async function logoutUser() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  localStorage.removeItem("autro_user_name"); localStorage.removeItem("autro_user_email"); localStorage.removeItem("autro_account_created");
  myName = "Guest User"; myEmail = ""; myAccountCreated = ""; myIsOwner = false;
  updateUserUI(); showToast("Logged out");
}
async function forgotPassword() {
  let email = document.getElementById("authEmail").value.trim();
  if (!email) { showToast("Enter your email first"); return; }
  if (!supabaseClient) { showToast("Supabase not connected"); return; }
  let { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset.html" });
  if (error) showToast(error.message); else showToast("📧 Reset email sent from autrobooksupport@gmail.com");
}
async function initAuth() {
  if (!supabaseClient) { updateUserUI(); return; }
  let { data } = await supabaseClient.auth.getSession();
  if (data && data.session && data.session.user) {
    let user = data.session.user;
    myName = (user.user_metadata && user.user_metadata.full_name) || user.email.split("@")[0];
    myEmail = user.email; myAccountCreated = user.created_at; myIsOwner = user.email.toLowerCase().indexOf("abir") !== -1;
    localStorage.setItem("autro_user_name", myName);
    localStorage.setItem("autro_user_email", myEmail);
    localStorage.setItem("autro_account_created", myAccountCreated);
  }
  updateUserUI();
}

// ===== 8. FEED =====
async function loadPosts() {
  if (supabaseClient) {
    try {
      let { data, error } = await supabaseClient.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
      if (!error && data && data.length > 0) { allPosts = data; renderFeed(); return; }
    } catch (e) {}
  }
  allPosts = demoPosts.slice(); renderFeed();
}
function filterFeed(type, btn) {
  currentFilter = type;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderFeed();
}
function renderFeed(list) {
  let container = document.getElementById("feedContainer");
  if (!container) return;
  let posts = list || allPosts;
  if (currentFilter !== "all" && !list) posts = allPosts.filter(p => p.type === currentFilter);
  if (posts.length === 0) { container.innerHTML = '<div class="post-card" style="text-align:center;color:var(--muted)">No posts yet. Be the first to post! 🎉</div>'; return; }
  container.innerHTML = posts.map(p => `
    <div class="post-card">
      <div class="post-head">
        <img src="${escapeHtml(p.user_avatar || myAvatar)}" class="post-avatar">
        <div><b>${escapeHtml(p.user_name || "User")}</b><small>${timeAgo(p.created_at)} • ${escapeHtml(p.type || "posts")}</small></div>
        <span class="dots" onclick="openReportPost('${p.id}')">⋯</span>
      </div>
      <div class="post-text">${escapeHtml(p.text || "")}</div>
      ${p.img ? `<img src="${escapeHtml(p.img)}" class="post-img">` : ""}
      <div class="post-actions">
        <button onclick="likePost('${p.id}', this)">❤️ Like (${p.likes || 0})</button>
        <button onclick="openComments('${p.id}')">💬 Comment</button>
        <button onclick="sharePost('${p.id}')">↗ Share</button>
      </div>
    </div>
  `).join("");
}
async function likePost(postId, btn) {
  if (!isLoggedIn()) { showToast("Please login to like"); openAuthModal(); return; }
  let post = allPosts.find(p => String(p.id) === String(postId));
  if (!post) return;
  post.likes = (post.likes || 0) + 1;
  if (btn) btn.textContent = "❤️ Like (" + post.likes + ")";
  if (supabaseClient && String(postId).indexOf("demo") === -1) {
    await supabaseClient.from("posts").update({ likes: post.likes }).eq("id", postId);
  }
}

// ===== 9. CREATE - POST / STORY / REEL / LIVE =====
function openCreateMenu() {
  if (!isLoggedIn()) { showToast("Please login to create"); openAuthModal(); return; }
  updateLiveUI(); openModal("mCreateMenu");
}
function createType(type) {
  currentCreateType = type;
  closeModal("mCreateMenu");
  if (type === "post") { openModal("mComposer"); return; }
  if (type === "live") {
    if (!canGoLive()) { showToast("🔒 Live locked. " + (90 - getAccountAgeDays()) + " days left. Owner always unlocked."); return; }
    openModal("mLive"); return;
  }
  let title = document.getElementById("storyReelTitle");
  if (title) title.childNodes[0].textContent = type === "story" ? "Create Story " : "Create Reel ";
  openModal("mStoryReel");
}
async function publishPost() {
  let text = document.getElementById("postText").value.trim();
  let fileInput = document.getElementById("postFile");
  if (!text && (!fileInput.files || fileInput.files.length === 0)) { showToast("Write something or add photo"); return; }
  if (!isLoggedIn()) { showToast("Please login first"); openAuthModal(); return; }
  let imgUrl = "";
  if (fileInput.files && fileInput.files[0]) {
    try {
      showToast("Uploading photo...");
      imgUrl = await uploadImageFile(fileInput.files[0]);
    } catch (e) {
      showToast("Photo upload failed: " + e.message + " - Check Storage bucket 'posts'");
      return;
    }
  }
  let newPost = { user_name: myName, user_avatar: myAvatar, text: text, img: imgUrl, type: "posts", likes: 0, created_at: new Date().toISOString() };
  if (supabaseClient) {
    try {
      let { data, error } = await supabaseClient.from("posts").insert([{ user_name: myName, user_avatar: myAvatar, text: text, img: imgUrl, type: "posts", likes: 0 }]).select().single();
      if (!error && data) newPost = data;
    } catch (e) {}
  }
  allPosts.unshift(newPost); renderFeed(); closeModal("mComposer");
  document.getElementById("postText").value = ""; fileInput.value = "";
  showToast("✅ Post published!");
}
async function publishStoryReel() {
  let text = document.getElementById("storyReelText").value.trim();
  let fileInput = document.getElementById("storyReelFile");
  if (!text && (!fileInput.files || fileInput.files.length === 0)) { showToast("Add text or photo"); return; }
  let imgUrl = "";
  if (fileInput.files && fileInput.files[0]) {
    try { imgUrl = await uploadImageFile(fileInput.files[0]); } catch (e) { showToast("Photo upload failed: " + e.message); return; }
  }
  if (supabaseClient) {
    try { await supabaseClient.from("stories").insert([{ user_name: myName, user_avatar: myAvatar, text: text, img: imgUrl, kind: currentCreateType }]); } catch (e) {}
  }
  closeModal("mStoryReel");
  document.getElementById("storyReelText").value = ""; fileInput.value = "";
  showToast("✅ " + currentCreateType + " published!");
}
function startLive() {
  let title = document.getElementById("liveTitleInput").value.trim() || "Live in Tongi";
  closeModal("mLive"); showToast("🔴 You are LIVE: " + title);
  let v = document.getElementById("liveViewers"); if (v) v.textContent = Math.floor(10 + Math.random() * 50);
}
function sosAlert() { showToast("🚨 SOS sent! Location shared with emergency contacts."); }
function openShield() { showToast("🛡️ My Shield: Your account is protected. Report: autrobooksupport@gmail.com"); }
function viewStory(name) { showToast("Viewing story: " + name); }
function sharePost(id) {
  if (navigator.share) navigator.share({ title: "Autrobook", text: "Check this post on Autrobook" }).catch(() => {});
  else showToast("Link copied! Share it with friends.");
}

// ===== 10. VOICE EFFECT - REAL NORMAL / ECHO / DEEP =====
async function applyVoiceEffect(blob, effect) {
  if (!blob) return blob;
  if (!effect || effect === "normal") return blob;
  try {
    let ctx = new (window.AudioContext || window.webkitAudioContext)();
    let arrayBuffer = await blob.arrayBuffer();
    let audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    let outLength = Math.floor(audioBuffer.length * 2);
    let offline = new OfflineAudioContext(audioBuffer.numberOfChannels, outLength, audioBuffer.sampleRate);
    let source = offline.createBufferSource();
    source.buffer = audioBuffer;
    if (effect === "echo") {
      let delay = offline.createDelay(1.0); delay.delayTime.value = 0.3;
      let feedback = offline.createGain(); feedback.gain.value = 0.4;
      let wet = offline.createGain(); wet.gain.value = 0.5;
      source.connect(offline.destination); source.connect(delay);
      delay.connect(feedback); feedback.connect(delay); delay.connect(wet); wet.connect(offline.destination);
      source.start(0);
    }
    if (effect === "deep") {
      source.playbackRate.value = 0.7;
      let filter = offline.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 800;
      let gain = offline.createGain(); gain.gain.value = 1.2;
      source.connect(filter); filter.connect(gain); gain.connect(offline.destination);
      source.start(0);
    }
    let rendered = await offline.render();
    let wavBlob = bufferToWav(rendered);
    try { await ctx.close(); } catch (e) {}
    return wavBlob;
  } catch (e) { return blob; }
}
function bufferToWav(buffer) {
  let numOfChan = buffer.numberOfChannels;
  let length = buffer.length * numOfChan * 2 + 44;
  let bufferArray = new ArrayBuffer(length);
  let view = new DataView(bufferArray);
  let channels = [];
  for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));
  function writeString(offset, str) { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); }
  writeString(0, 'RIFF'); view.setUint32(4, length - 8, true); writeString(8, 'WAVE');
  writeString(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true); view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true); view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true); writeString(36, 'data'); view.setUint32(40, length - 44, true);
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      let sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample * 0x7FFF, true); offset += 2;
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}

// ===== 11. COMMENTS =====
async function openComments(postId) {
  currentPostId = postId;
  let post = allPosts.find(p => String(p.id) === String(postId));
  let preview = document.getElementById("commentPostPreview");
  if (preview && post) preview.innerHTML = "<b>" + escapeHtml(post.user_name) + "</b> — " + escapeHtml((post.text || "").substring(0, 120));
  openModal("mComment");
  await loadComments(postId);
}
async function loadComments(postId) {
  let list = document.getElementById("commentList");
  if (!list) return;
  list.innerHTML = '<div class="empty-comment">Loading comments...</div>';
  let comments = [];
  if (supabaseClient) {
    try {
      let { data, error } = await supabaseClient.from("comments").select("*").eq("post_id", String(postId)).order("created_at", { ascending: true });
      if (!error && data) comments = data;
    } catch (e) {}
  }
  if (comments.length === 0) { list.innerHTML = '<div class="empty-comment">No comments yet. Be the first! 💬</div>'; return; }
  for (let c of comments) {
    if (supabaseClient) {
      try { let { data } = await supabaseClient.from("comment_reactions").select("*").eq("comment_id", c.id); commentReactionsCache[c.id] = data || []; } catch (e) { commentReactionsCache[c.id] = []; }
    }
  }
  list.innerHTML = comments.map(c => renderCommentCard(c)).join("");
}
function renderCommentCard(c) {
  let reacts = commentReactionsCache[c.id] || [];
  let counts = {};
  reacts.forEach(r => counts[r.reaction] = (counts[r.reaction] || 0) + 1);
  let countText = Object.keys(counts).map(k => { let f = REACTIONS.find(x => x.id === k); return (f ? f.emoji : "👍") + " " + counts[k]; }).join(" ");
  let myReact = reacts.find(r => r.user_name === myName);
  return `
  <div class="comment-card" id="comment-${c.id}">
    <div class="comment-top">
      <img src="${escapeHtml(c.user_avatar || myAvatar)}">
      <div class="comment-body">
        <b>${escapeHtml(c.user_name || "User")}</b> <span class="time">${timeAgo(c.created_at)}</span>
        <div class="comment-text">${escapeHtml(c.text || "")}</div>
        ${c.img ? `<img src="${escapeHtml(c.img)}" style="width:100%;border-radius:10px;margin-top:6px;max-height:200px;object-fit:cover">` : ""}
        ${c.voice_url ? `<div class="voice-comment"><audio src="${escapeHtml(c.voice_url)}" controls></audio> ${c.voice_effect && c.voice_effect !== "normal" ? `<span class="voice-effect-tag">${escapeHtml(c.voice_effect)}</span>` : ""}</div>` : ""}
      </div>
      <span style="cursor:pointer;color:var(--muted)" onclick="openReportComment('${c.id}', '${escapeHtml((c.text || "").replace(/'/g, ""))}', '${escapeHtml(c.user_name || "")}')">⋯</span>
    </div>
    <div class="comment-actions-row">
      <span onclick="showReactionPicker(event, '${c.id}')">👍 React ${myReact ? "(" + (REACTIONS.find(x => x.id === myReact.reaction)?.emoji || "") + ")" : ""}</span>
      <span onclick="replyToComment('${c.id}', '${escapeHtml(c.user_name || "")}')">Reply</span>
      <span onclick="openReactionsList('${c.id}')">❤️ ${reacts.length}</span>
      ${countText ? `<span class="reaction-bubble" onclick="openReactionsList('${c.id}')">${countText}</span>` : ""}
    </div>
  </div>`;
}
async function sendComment() {
  let input = document.getElementById("commentInput");
  let text = input.value.trim();
  if (!text && !audioBlob && !commentPhotoBlob) { showToast("Write a comment, add photo or record voice"); return; }
  if (!isLoggedIn()) { showToast("Please login to comment"); openAuthModal(); return; }
  let voiceUrl = "";
  let imgUrl = "";
  try {
    if (commentPhotoBlob) {
      showToast("Uploading photo...");
      imgUrl = await uploadImageFile(commentPhotoBlob);
    }
    if (audioBlob) {
      showToast("Applying voice effect & uploading...");
      let effectedBlob = await applyVoiceEffect(audioBlob, selectedVoiceEffect);
      let fileName = "voice-" + Date.now() + "-" + Math.floor(Math.random() * 10000) + ".wav";
      voiceUrl = await uploadToStorage("voices", effectedBlob, fileName);
    }
  } catch (e) {
    showToast("Upload failed: " + e.message);
    return;
  }
  let newComment = { post_id: String(currentPostId), user_name: myName, user_avatar: myAvatar, text: text, img: imgUrl, voice_url: voiceUrl, voice_effect: selectedVoiceEffect, created_at: new Date().toISOString() };
  if (supabaseClient) {
    try {
      let { data, error } = await supabaseClient.from("comments").insert([{ post_id: String(currentPostId), user_name: myName, user_avatar: myAvatar, text: text, img: imgUrl, voice_url: voiceUrl, voice_effect: selectedVoiceEffect }]).select().single();
      if (!error && data) newComment = data;
    } catch (e) {}
  }
  input.value = ""; audioBlob = null; commentPhotoBlob = null;
  let vp = document.getElementById("voicePreview"); if (vp) vp.style.display = "none";
  await loadComments(currentPostId);
  showToast("✅ Comment posted - saved forever!");
}
function sendPhotoComment(input) {
  if (!input.files || !input.files[0]) return;
  commentPhotoBlob = input.files[0];
  document.getElementById("commentInput").value = "📷 Photo ready";
  showToast("Photo ready - press Send, it will upload permanently");
  input.value = "";
}
function insertEmoji(e) {
  let input = document.getElementById("commentInput");
  input.value += e; input.focus();
}
function replyToComment(commentId, name) {
  let input = document.getElementById("commentInput");
  input.value = "@" + name + " "; input.focus();
}

// ===== 12. VOICE COMMENT RECORD =====
function selectVoiceEffect(effect, btn) {
  selectedVoiceEffect = effect;
  document.querySelectorAll(".effect-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  let label = document.getElementById("voicePreviewLabel");
  if (label) label.textContent = effect.charAt(0).toUpperCase() + effect.slice(1) + " • Ready to send";
}
async function toggleVoiceRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") { stopVoiceRecording(); return; }
  try {
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      try {
        let previewBlob = await applyVoiceEffect(audioBlob, selectedVoiceEffect);
        let url = URL.createObjectURL(previewBlob);
        let audio = document.getElementById("voicePreviewAudio"); if (audio) audio.src = url;
      } catch (e) {
        let url = URL.createObjectURL(audioBlob);
        let audio = document.getElementById("voicePreviewAudio"); if (audio) audio.src = url;
      }
      let vp = document.getElementById("voicePreview"); if (vp) vp.style.display = "flex";
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.start(); recSeconds = 0;
    let bar = document.getElementById("recordingBar"); if (bar) bar.style.display = "flex";
    let mic = document.getElementById("micBtn"); if (mic) mic.classList.add("recording");
    recTimer = setInterval(() => {
      recSeconds++;
      let rt = document.getElementById("recTime"); if (rt) rt.textContent = recSeconds + "s";
      if (recSeconds >= 60) stopVoiceRecording();
    }, 1000);
  } catch (e) { showToast("Mic permission needed for voice comment"); }
}
function stopVoiceRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
  clearInterval(recTimer);
  let bar = document.getElementById("recordingBar"); if (bar) bar.style.display = "none";
  let mic = document.getElementById("micBtn"); if (mic) mic.classList.remove("recording");
}
function cancelVoiceRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
  audioBlob = null; clearInterval(recTimer);
  let bar = document.getElementById("recordingBar"); if (bar) bar.style.display = "none";
  let vp = document.getElementById("voicePreview"); if (vp) vp.style.display = "none";
  let mic = document.getElementById("micBtn"); if (mic) mic.classList.remove("recording");
}

// ===== 13. COMMENT REACTIONS =====
function showReactionPicker(event, commentId) {
  document.querySelectorAll(".reaction-picker").forEach(p => p.remove());
  let picker = document.createElement("div"); picker.className = "reaction-picker";
  picker.innerHTML = REACTIONS.map(r => `<span onclick="reactToComment('${commentId}', '${r.id}')">${r.emoji}</span>`).join("");
  picker.style.left = "10px"; picker.style.top = "10px";
  let card = document.getElementById("comment-" + commentId); if (card) card.appendChild(picker);
  event.stopPropagation();
}
async function reactToComment(commentId, reaction) {
  if (!isLoggedIn()) { showToast("Please login to react"); openAuthModal(); return; }
  document.querySelectorAll(".reaction-picker").forEach(p => p.remove());
  let existing = (commentReactionsCache[commentId] || []).find(r => r.user_name === myName);
  if (supabaseClient && String(commentId).indexOf("demo") === -1) {
    try {
      if (existing && existing.reaction === reaction) {
        await supabaseClient.from("comment_reactions").delete().eq("id", existing.id); showToast("Reaction removed");
      } else if (existing) {
        await supabaseClient.from("comment_reactions").update({ reaction: reaction }).eq("id", existing.id); showToast("Reaction updated");
      } else {
        await supabaseClient.from("comment_reactions").insert([{ comment_id: commentId, user_name: myName, reaction: reaction }]); showToast("Reacted!");
      }
    } catch (e) { showToast("Reaction failed"); }
  } else { showToast("Reacted " + reaction); }
  await loadComments(currentPostId);
}
function openReactionsList(commentId) {
  let reacts = commentReactionsCache[commentId] || [];
  let tabs = document.getElementById("reactionTabs"); let list = document.getElementById("reactionPeopleList");
  if (!tabs || !list) return;
  tabs.innerHTML = `<button class="reaction-tab active">All (${reacts.length})</button>` + REACTIONS.map(r => { let c = reacts.filter(x => x.reaction === r.id).length; return `<button class="reaction-tab">${r.emoji} ${c}</button>`; }).join("");
  if (reacts.length === 0) list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px">No reactions yet</p>';
  else list.innerHTML = reacts.map(r => { let f = REACTIONS.find(x => x.id === r.reaction); return `<div class="reaction-person"><img src="${myAvatar}"><div><b>${escapeHtml(r.user_name)}</b><br><small>${escapeHtml(r.reaction)}</small></div><span class="react-icon">${f ? f.emoji : "👍"}</span></div>`; }).join("");
  openModal("mReactions");
}

// ===== 14. REPORTS =====
let currentReportPostId = null;
function openReportPost(postId) { currentReportPostId = postId; openModal("mReport"); }
function submitReport() {
  let reason = document.getElementById("reportReason").value;
  showToast("✅ Post reported. Team will review in 24-48h. Email: autrobooksupport@gmail.com");
  closeModal("mReport");
  if (supabaseClient) { supabaseClient.from("reports").insert([{ type: "post", post_id: String(currentReportPostId), reporter_name: myName, reporter_email: myEmail, reason: reason, reason_label: reason, status: "under_review" }]).then(() => {}); }
}
function openReportComment(commentId, commentText, reportedUser) {
  currentCommentId = commentId;
  let preview = document.getElementById("reportCommentPreview");
  if (preview) preview.innerHTML = "<b>" + escapeHtml(reportedUser) + "</b> — " + escapeHtml(commentText);
  let listEl = document.getElementById("reportReasonList");
  if (listEl) { listEl.innerHTML = REPORT_REASONS.map(r => `<div class="report-item" onclick="selectReportReason('${r.id}', this)"><div><b>${r.label}</b><br><small>${r.desc}</small></div></div>`).join(""); }
  let emailEl = document.getElementById("reportEmail"); if (emailEl && myEmail) emailEl.value = myEmail;
  closeModal("mComment"); openModal("mReportComment");
}
function selectReportReason(id, el) {
  selectedReportReason = id;
  document.querySelectorAll(".report-item").forEach(i => i.classList.remove("selected"));
  if (el) el.classList.add("selected");
}
async function submitCommentReport() {
  if (!selectedReportReason) { showToast("Select a reason"); return; }
  let details = document.getElementById("reportDetails").value.trim();
  let email = document.getElementById("reportEmail").value.trim() || myEmail;
  let reasonObj = REPORT_REASONS.find(r => r.id === selectedReportReason);
  let reportId = "AB-" + Date.now().toString().slice(-6);
  if (supabaseClient) {
    try { await supabaseClient.from("reports").insert([{ report_id: reportId, type: "comment", post_id: String(currentPostId), comment_id: String(currentCommentId), reporter_name: myName, reporter_email: email, reason: selectedReportReason, reason_label: reasonObj ? reasonObj.label : selectedReportReason, details: details, status: "under_review" }]); } catch (e) {}
  }
  closeModal("mReportComment");
  showToast("✅ Report submitted (" + reportId + "). Email will come from autrobooksupport@gmail.com");
}

// ===== 15. SIDEBAR PEOPLE =====
function loadSidebarPeople() {
  let el = document.getElementById("sidebarPeople"); if (!el) return;
  let people = [
    { name: "Karim Uddin", img: "https://i.pravatar.cc/60?img=13" },
    { name: "Sumi Akter", img: "https://i.pravatar.cc/60?img=47" },
    { name: "Tanvir Ahmed", img: "https://i.pravatar.cc/60?img=14" }
  ];
  el.innerHTML = people.map(p => `<div class="people-row"><img src="${p.img}"><div><b>${p.name}</b><br><small style="color:var(--muted)">Mutual friend</small></div><button onclick="showToast('Friend request sent to ${p.name}')">Add</button></div>`).join("");
}

// ===== 16. INIT =====
document.addEventListener("DOMContentLoaded", async function () {
  initTheme(); loadSidebarPeople(); await initAuth(); await loadPosts();
});
