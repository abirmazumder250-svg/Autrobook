/* ==================================================================
   AUTROBOOK — PROFILE PAGE SCRIPT
   Handles: posts, tabs, modals, profile name/username editing (persisted)
   ================================================================== */

// ==================== PROFILE STATE (NAME / USERNAME) ====================
const PROFILE_STORAGE_KEY = 'autrobook_profile_v1';

const DEFAULT_PROFILE = {
  name: 'Abir Mazumder',
  username: 'abirmazumder'
};

let profileData = { ...DEFAULT_PROFILE };

/** Load saved profile from localStorage (name + username) */
function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      profileData = { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch (err) {
    profileData = { ...DEFAULT_PROFILE };
  }
  applyProfileToDOM();
}

/** Persist profile data to localStorage */
function saveProfileToStorage() {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
  } catch (err) {
    /* ignore quota errors */
  }
}

/** Reflect profileData into visible DOM elements */
function applyProfileToDOM() {
  const nameEl = document.getElementById('profileName');
  if (nameEl) nameEl.textContent = profileData.name;

  const usernameEl = document.getElementById('profileUsername');
  if (usernameEl) usernameEl.textContent = '@' + profileData.username;

  const shareInput = document.getElementById('shareLinkInput');
  if (shareInput) {
    shareInput.value = `https://autrobook.com/u/${profileData.username}`;
  }
}

// ==================== POSTS DATA ====================
const postsData = [
  {
    id: 1,
    author: 'Abir Mazumder',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
    time: '2 hours ago',
    text: 'Just finished recording my new single! 🎶 Can\'t wait for you all to hear it. #NewMusic #Autrobook',
    media: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    likes: 234,
    comments: 45,
    shares: 12,
    pinned: true,
    reactions: { like: 120, love: 80, care: 20, haha: 8, wow: 4, sad: 2, angry: 0 },
    userReaction: null
  },
  {
    id: 2,
    author: 'Abir Mazumder',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
    time: 'Yesterday at 8:30 PM',
    text: 'Grateful for all the love and support. This journey has been incredible. 🙏❤️',
    media: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    likes: 567,
    comments: 89,
    shares: 34,
    pinned: false,
    reactions: { like: 300, love: 150, care: 60, haha: 20, wow: 25, sad: 10, angry: 2 },
    userReaction: null
  },
  {
    id: 3,
    author: 'Abir Mazumder',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
    time: '2 days ago',
    text: 'Dhaka nights 🌙✨',
    media: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80',
    likes: 189,
    comments: 23,
    shares: 5,
    pinned: false,
    reactions: { like: 100, love: 60, care: 10, haha: 5, wow: 12, sad: 2, angry: 0 },
    userReaction: null
  }
];

// ==================== UI STATE ====================
let currentTab = 'posts';
let currentView = 'list';
let currentPostFilter = 'recent';
let searchQuery = '';

// ==================== RENDER: POSTS ====================
function renderPosts() {
  const container = document.getElementById('profileFeedContainer');
  if (!container) return;

  const filterEl = document.getElementById('postFilter');
  const filter = filterEl ? filterEl.value : 'recent';
  currentPostFilter = filter;

  let filtered = [...postsData];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.text.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)
    );
  }

  if (filter === 'recent') {
    filtered.sort((a, b) => b.id - a.id);
  } else if (filter === 'popular') {
    filtered.sort((a, b) => b.likes - a.likes);
  } else if (filter === 'pinned') {
    filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }

  if (filtered.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;padding:40px;color:var(--muted);">No posts found</div>';
    return;
  }

  container.innerHTML = filtered.map(post => createPostHTML(post)).join('');
}

function createPostHTML(post) {
  const reactionEmojis = {
    like: '👍', love: '❤️', care: '🥰', haha: '😂',
    wow: '😮', sad: '😢', angry: '😡'
  };
  const reactionLabels = {
    like: 'Like', love: 'Love', care: 'Care', haha: 'Haha',
    wow: 'Wow', sad: 'Sad', angry: 'Angry'
  };

  const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0);

  const reactionBarHTML = Object.entries(reactionEmojis).map(([key, emoji]) => {
    const isActive = post.userReaction === key;
    return `
      <button class="reaction-btn ${isActive ? 'active' : ''}" onclick="handleReaction(${post.id}, '${key}')">
        <span class="emoji">${emoji}</span> ${reactionLabels[key]}
      </button>
    `;
  }).join('');

  const mediaHTML = post.media
    ? `<img src="${post.media}" class="post-media" alt="Post" loading="lazy">`
    : '';
  const pinnedHTML = post.pinned
    ? '<span style="font-size:11px;color:var(--primary);font-weight:600;">📌 Pinned</span>'
    : '';

  return `
    <div class="post-card" data-post-id="${post.id}">
      <div class="post-header">
        <img src="${post.avatar}" alt="${post.author}">
        <div class="post-header-info">
          <b>${post.author}</b>
          <small>${post.time} ${pinnedHTML}</small>
        </div>
        <button class="post-more-btn" onclick="openPostMenu(${post.id})">
          <i class="fas fa-ellipsis-h"></i>
        </button>
      </div>
      <div class="post-text">${post.text}</div>
      ${mediaHTML}
      <div class="post-actions">
        <button class="post-action-btn" onclick="toast('Liked!')">
          <i class="far fa-thumbs-up"></i> Like
        </button>
        <button class="post-action-btn" onclick="toast('Comment opened')">
          <i class="far fa-comment"></i> Comment
        </button>
        <button class="post-action-btn" onclick="toast('Share opened')">
          <i class="fas fa-share"></i> Share
        </button>
      </div>
      <div class="reaction-bar">${reactionBarHTML}</div>
      <div class="reaction-count">
        ${totalReactions} reactions · ${post.comments} comments · ${post.shares} shares
      </div>
    </div>
  `;
}

function handleReaction(postId, reactionType) {
  const post = postsData.find(p => p.id === postId);
  if (!post) return;

  if (post.userReaction === reactionType) {
    post.reactions[reactionType] = Math.max(0, (post.reactions[reactionType] || 0) - 1);
    post.userReaction = null;
    post.likes = Math.max(0, post.likes - 1);
    toast('Reaction removed');
  } else {
    if (post.userReaction) {
      post.reactions[post.userReaction] = Math.max(
        0,
        (post.reactions[post.userReaction] || 0) - 1
      );
    } else {
      post.likes += 1;
    }
    post.reactions[reactionType] = (post.reactions[reactionType] || 0) + 1;
    post.userReaction = reactionType;
    const emojis = {
      like: '👍', love: '❤️', care: '🥰', haha: '😂',
      wow: '😮', sad: '😢', angry: '😡'
    };
    toast(`Reacted with ${emojis[reactionType]}`);
  }

  renderPosts();
}

// ==================== UI HELPERS ====================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function openOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 2500);
}

function openPostMenu(postId) { openModal('mOwnPostMenu'); }

function savePost() { toast('Post saved'); }
function pinPost() { toast('Post pinned to profile'); }
function editPost() { toast('Edit post opened'); }
function deletePost() { toast('Post deleted'); }

function scrollToTab(tab) {
  switchTab(tab);
  const el = document.getElementById('tab-' + tab);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  const target = document.getElementById('tab-' + tab);
  if (target) target.classList.add('active');

  document.querySelectorAll('.tab-btn').forEach(el => {
    if (el.dataset.tab === tab) el.classList.add('active');
  });

  if (tab === 'posts') renderPosts();
  if (tab === 'photos') renderPhotos();
  if (tab === 'reels') renderReels();
  if (tab === 'events') renderEvents();
  if (tab === 'about') renderAbout();
  if (tab === 'badges') renderBadges();
}

function filterPosts(value) {
  searchQuery = value;
  renderPosts();
}

function toggleView() {
  currentView = currentView === 'list' ? 'grid' : 'list';
  const container = document.getElementById('profileFeedContainer');
  if (container) container.classList.toggle('grid-view', currentView === 'grid');
  const btn = document.getElementById('viewToggleBtn');
  if (btn) {
    btn.innerHTML = currentView === 'list'
      ? '<i class="fas fa-th"></i>'
      : '<i class="fas fa-list"></i>';
  }
}

// ==================== RENDER: PHOTOS ====================
function renderPhotos() {
  const grid = document.getElementById('photosGrid');
  if (!grid || grid.children.length > 0) return;
  const images = [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80',
    'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=300&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80'
  ];
  grid.innerHTML = images
    .map(src => `<img src="${src}" alt="Photo" loading="lazy" onclick="toast('Photo opened')">`)
    .join('');
}

// ==================== RENDER: REELS ====================
function renderReels() {
  const grid = document.getElementById('reelsGrid');
  if (!grid || grid.children.length > 0) return;
  const reels = [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
    'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=300&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80'
  ];
  grid.innerHTML = reels
    .map(src => `<img src="${src}" alt="Reel" loading="lazy" onclick="toast('Reel playing...')">`)
    .join('');
}

// ==================== RENDER: EVENTS ====================
function renderEvents() {
  const timeline = document.getElementById('eventsTimeline');
  if (!timeline || timeline.children.length > 0) return;
  const events = [
    { icon: 'fa-briefcase', title: 'Started at Uttara High School', date: '2020' },
    { icon: 'fa-graduation-cap', title: 'Joined Dhaka Central University', date: '2022' },
    { icon: 'fa-music', title: 'Released first single', date: '2023' },
    { icon: 'fa-award', title: 'Won Best New Artist', date: '2024' }
  ];
  timeline.innerHTML = events
    .map(e => `
      <div class="event-item">
        <div class="event-icon"><i class="fas ${e.icon}"></i></div>
        <div class="event-info">
          <b>${e.title}</b>
          <small>${e.date}</small>
        </div>
      </div>
    `)
    .join('');
}

// ==================== RENDER: ABOUT ====================
function renderAbout() {
  const grid = document.getElementById('aboutGrid');
  if (!grid || grid.children.length > 0) return;
  const items = [
    { icon: 'fa-map-marker-alt', label: 'Lives in', value: 'Dhaka, Bangladesh' },
    { icon: 'fa-briefcase', label: 'Works at', value: 'Uttara High School' },
    { icon: 'fa-graduation-cap', label: 'Studied at', value: 'Dhaka Central University' },
    { icon: 'fa-heart', label: 'Relationship', value: 'Single' },
    { icon: 'fa-music', label: 'Genre', value: 'Hindi, Punjabi' },
    { icon: 'fa-envelope', label: 'Contact', value: 'DM for collabs' }
  ];
  grid.innerHTML = items
    .map(i => `
      <div class="about-item">
        <i class="fas ${i.icon}"></i>
        <div><b>${i.label}</b><small>${i.value}</small></div>
      </div>
    `)
    .join('');
}

// ==================== RENDER: BADGES ====================
function renderBadges() {
  const grid = document.getElementById('badgesGrid');
  if (!grid || grid.children.length > 0) return;
  const badges = [
    { emoji: '⭐', name: 'Rising Star', desc: 'Top creator' },
    { emoji: '🎵', name: 'Music Pro', desc: '100+ uploads' },
    { emoji: '❤️', name: 'Heart Hero', desc: '10K likes' },
    { emoji: '🔥', name: 'On Fire', desc: 'Viral post' },
    { emoji: '🛡️', name: 'Verified', desc: 'ID verified' },
    { emoji: '🌟', name: 'Early Bird', desc: 'Joined 2021' }
  ];
  grid.innerHTML = badges
    .map(b => `
      <div class="badge-item">
        <span class="badge-emoji">${b.emoji}</span>
        <b>${b.name}</b>
        <small>${b.desc}</small>
      </div>
    `)
    .join('');
}

// ==================== RENDER: HIGHLIGHTS ====================
function renderHighlights() {
  const scroll = document.getElementById('highlightsScroll');
  if (!scroll) return;
  const highlights = [
    { name: 'Music', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80' },
    { name: 'Travel', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&q=80' },
    { name: 'Concerts', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80' },
    { name: 'Friends', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' }
  ];
  scroll.innerHTML = highlights
    .map(h => `
      <div class="highlight-item" onclick="toast('Opening ${h.name} highlight')">
        <div class="highlight-ring"><img src="${h.img}" alt="${h.name}"></div>
        <span>${h.name}</span>
      </div>
    `)
    .join('');
}

// ==================== FOLLOWERS ====================
function openFollowers(type) {
  const title = document.getElementById('followersModalTitle');
  if (title) title.textContent = type.charAt(0).toUpperCase() + type.slice(1);

  const container = document.getElementById('followersListContainer');
  if (!container) return;

  const people = [
    { name: 'Sadia Rahman', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80' },
    { name: 'Tanvir Ahmed', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80' },
    { name: 'Nusrat Jahan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80' },
    { name: 'Rafiul Islam', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80' }
  ];

  container.innerHTML = people
    .map(p => `
      <div class="list-item" style="border:none;padding:10px 8px;">
        <img src="${p.avatar}" class="mini-avatar">
        <div class="list-text">${p.name}</div>
        <button class="btn btn-secondary" style="padding:4px 12px;font-size:12px;">Follow</button>
      </div>
    `)
    .join('');

  openModal('mFollowersList');
}

function filterFollowers(value) { /* simple filter placeholder */ }

// ==================== MEDIA UPLOADS ====================
function changeCover(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('mainCoverImg').src = e.target.result;
      toast('Cover photo updated');
    };
    reader.readAsDataURL(file);
  }
}

function changeProfile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('mainProfileImg').src = e.target.result;
      toast('Profile photo updated');
    };
    reader.readAsDataURL(file);
  }
}

// ==================== EDIT PROFILE: OPEN / SAVE ====================
function openEditProfile() {
  const nameInput = document.getElementById('editNameInput');
  const userInput = document.getElementById('editUsernameInput');
  if (nameInput) nameInput.value = profileData.name;
  if (userInput) userInput.value = profileData.username;
  openOverlay('editProfileOverlay');
}

function saveProfileChanges() {
  const nameInput = document.getElementById('editNameInput');
  const userInput = document.getElementById('editUsernameInput');

  const newName = nameInput ? nameInput.value.trim() : '';
  const newUsername = userInput ? userInput.value.trim() : '';

  // Validation
  if (!newName) {
    toast('Name cannot be empty');
    if (nameInput) nameInput.focus();
    return;
  }
  if (newName.length > 50) {
    toast('Name is too long (max 50 characters)');
    return;
  }
  if (!newUsername) {
    toast('Username cannot be empty');
    if (userInput) userInput.focus();
    return;
  }
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(newUsername)) {
    toast('Username: 3-30 chars, letters/numbers/underscores');
    if (userInput) userInput.focus();
    return;
  }

  // Save
  profileData.name = newName;
  profileData.username = newUsername;
  saveProfileToStorage();
  applyProfileToDOM();

  closeOverlay('editProfileOverlay');
  toast('Profile updated successfully');
}

// ==================== MISC ACTIONS ====================
function showVerifyInfo() { openModal('mVerification'); }

function submitVerification() {
  closeModal('mVerification');
  toast('Verification submitted for review');
}

function toggleMusic() { toast('Music toggled'); }

function toggleGuard(key, el) {
  const valueEl = el.querySelector('.list-value');
  if (valueEl) {
    const newVal = valueEl.textContent === 'Off' ? 'On' : 'Off';
    valueEl.textContent = newVal;
    toast(`${key} turned ${newVal.toLowerCase()}`);
  }
}

function showBloodForm(type) {
  const form = document.getElementById('bloodForm');
  if (form) form.style.display = 'block';
  toast(`Blood ${type} form opened`);
}

function setMood(mood) {
  const moodEl = document.getElementById('moodStatus');
  if (moodEl) moodEl.querySelector('span').textContent = mood;
  closeModal('mMood');
  toast('Mood updated');
}

function publishNote() {
  const note = document.getElementById('noteText').value.trim();
  if (note) {
    toast('Note published!');
    document.getElementById('noteText').value = '';
  } else {
    toast('Please write something');
  }
  closeModal('mNote');
}

function addHighlight() {
  const name = document.getElementById('highlightName').value.trim();
  if (name) {
    toast(`Highlight "${name}" created`);
    document.getElementById('highlightName').value = '';
  } else {
    toast('Please enter a name');
  }
  closeModal('mAddHighlight');
}

function setFrame(frame, el) {
  toast(`Frame set to ${frame}`);
  closeModal('mProfileFrame');
}

function setVoicePreset(btn, name) {
  document.querySelectorAll('.vp-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  toast(`Voice preset: ${name}`);
}

function simulateRecording() {
  const status = document.getElementById('recStatus');
  if (status) {
    status.textContent = 'Recording... (simulated)';
    setTimeout(() => {
      status.textContent = 'Tap to record';
      toast('Voice comment recorded');
    }, 2000);
  }
}

function copyLink() {
  const input = document.getElementById('shareLinkInput');
  if (input) {
    input.select();
    try { document.execCommand('copy'); } catch (e) {}
    toast('Link copied!');
  }
}

function shareTo(platform) {
  toast(`Shared to ${platform}`);
  closeModal('mShareProfile');
}

// ==================== QR CODE (simple visual) ====================
function drawQRCode() {
  const canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 160;
  const cellSize = size / 21;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  let seed = 42;
  function rand() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      if (rand() > 0.5) {
        ctx.fillStyle = '#1c1e21';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  function drawMarker(x, y) {
    ctx.fillStyle = '#1c1e21';
    ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = '#1c1e21';
    ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
  }

  drawMarker(0, 0);
  drawMarker(14, 0);
  drawMarker(0, 14);
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  // Year
  const yearEl = document.getElementById('dynamicYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Load persisted profile (name + username)
  loadProfileFromStorage();

  // Initial render
  renderPosts();
  renderHighlights();
  drawQRCode();

  // Backdrop close
  document.querySelectorAll('.modal-back').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });
  });

  // Mood default
  const moodStatus = document.getElementById('moodStatus');
  if (moodStatus) moodStatus.querySelector('span').textContent = 'Feeling motivated';

  // Stats
  const postsStat = document.querySelector('.stat-card:nth-child(1) b');
  if (postsStat) postsStat.textContent = postsData.length;

  // Enter key on username field -> save
  const usernameInput = document.getElementById('editUsernameInput');
  if (usernameInput) {
    usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveProfileChanges();
      }
    });
  }
  const nameInput = document.getElementById('editNameInput');
  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveProfileChanges();
      }
    });
  }

  // Live username sanitation (lowercase, strip spaces)
  const userInputLive = document.getElementById('editUsernameInput');
  if (userInputLive) {
    userInputLive.addEventListener('input', () => {
      const start = userInputLive.selectionStart;
      userInputLive.value = userInputLive.value.replace(/\s+/g, '').replace(/[^a-zA-Z0-9_]/g, '');
      userInputLive.setSelectionRange(start, start);
    });
  }
});

// ==================== GLOBAL ERROR HANDLER ====================
window.onerror = function () { return true; };
