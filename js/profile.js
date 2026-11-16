/* ============================================================
   AUTROBOOK - PROFILE PAGE JAVASCRIPT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Set dynamic year (2026, 2027, etc.)
  document.getElementById('dynamicYear').textContent = new Date().getFullYear();
  
  // Render Mock Profile Posts
  renderProfilePosts();
});

// ===== MOCK PROFILE POSTS DATA =====
const mockProfilePosts = [
  {
    id: 'p1',
    text: 'Just finished an amazing studio session! 🎶 New cover dropping soon.',
    media: null,
    time: Date.now() - 3600000,
    reactions: { '👍': 1200, '❤️': 340, '🥰': 120 },
    views: 25000,
    viral: 14
  },
  {
    id: 'p2',
    text: 'What a view today at Cox\'s Bazar! 🌊',
    media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    time: Date.now() - 86400000,
    reactions: { '❤️': 856, '😮': 112 },
    views: 18000,
    viral: 8
  }
];

// ===== CHANGE PROFILE & COVER PHOTO =====
function changeProfile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('mainProfileImg').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function changeCover(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('mainCoverImg').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// ===== RENDER POSTS =====
function renderProfilePosts() {
  const container = document.getElementById('profileFeedContainer');
  container.innerHTML = '';

  mockProfilePosts.forEach(post => {
    const postEl = document.createElement('div');
    postEl.className = 'post';
    
    const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0);
    const formattedViews = post.views >= 1000 ? (post.views / 1000).toFixed(1) + 'K' : post.views;

    let reactionHTML = '';
    let count = 0;
    for (const [emoji] of Object.entries(post.reactions)) {
      if (count >= 3) break;
      reactionHTML += `<span>${emoji}</span>`;
      count++;
    }

    postEl.innerHTML = `
      <div class="post-header">
        <div class="post-user">
          <div class="avatar">A</div>
          <div>
            <div style="font-weight:600; font-size:15px;">Abir Mazumder</div>
            <div class="post-meta live-time" data-time="${post.time}">Just now · <i class="fas fa-globe-americas"></i></div>
          </div>
        </div>
        <button class="icon-btn" style="background:transparent; width:30px; height:30px;" onclick="openModal('mOwnPostMenu')"><i class="fas fa-ellipsis-h"></i></button>
      </div>
      <div class="post-text">${post.text}</div>
      ${post.media ? `<img src="${post.media}" class="post-media" loading="lazy">` : ''}
      
      <div class="reactions-row">
        <div class="reaction-stack" onclick="openVoiceComment()">
          ${reactionHTML} <span>${totalReactions}</span>
        </div>
        <div class="insights">
          <span><i class="fas fa-eye"></i> ${formattedViews} Views</span>
          <span style="color:var(--success);"><i class="fas fa-chart-line"></i> ${post.viral}% Viral</span>
        </div>
      </div>

      <div class="post-actions">
        <div class="reaction-wrapper">
          <button class="action-btn" onclick="toggleReactionPicker(this)"><i class="far fa-thumbs-up"></i> Like</button>
          <div class="reaction-picker">
            <span onclick="addReaction(this, '👍')">👍</span>
            <span onclick="addReaction(this, '❤️')">❤️</span>
            <span onclick="addReaction(this, '😆')">😆</span>
            <span onclick="addReaction(this, '🥰')">🥰</span>
            <span onclick="addReaction(this, '😮')">😮</span>
            <span onclick="addReaction(this, '😢')">😢</span>
            <span onclick="addReaction(this, '😠')">😠</span>
          </div>
        </div>
        <button class="action-btn" onclick="openVoiceComment()"><i class="fas fa-microphone"></i> Voice</button>
        <button class="action-btn"><i class="fas fa-share"></i> Share</button>
      </div>
    `;
    container.appendChild(postEl);
  });

  updateLiveTimes();
  setInterval(updateLiveTimes, 60000);
}

// ===== LIVE TIME UPDATER =====
function updateLiveTimes() {
  document.querySelectorAll('.live-time').forEach(el => {
    const timeStr = el.getAttribute('data-time');
    if (!timeStr) return;
    
    const diff = Date.now() - parseInt(timeStr);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    
    let text = "";
    if (mins < 1) text = "Just now";
    else if (mins < 60) text = mins + "m ago";
    else if (hours < 24) text = hours + "h ago";
    else if (days < 7) text = days + "d ago";
    else text = Math.floor(days / 7) + "w ago";
    
    el.innerHTML = `${text} · <i class="fas fa-globe-americas"></i>`;
  });
}

// ===== OVERLAY & MODAL CONTROLS =====
function openEditProfile() { document.getElementById('editProfileOverlay').classList.add('open'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ===== FOLLOWERS MODAL LOGIC (10K) =====
const mockFollowers = [
  { name: 'Mita Mitra', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', bio: 'Travel Blogger', following: false },
  { name: 'Tripurna Mazumder', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80', bio: 'Fashion Designer', following: true },
  { name: 'Rahul Khan', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', bio: 'Musician', following: false },
  { name: 'Tech Chronicles', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&q=80', bio: 'Tech News', following: false },
  { name: 'Daily Sports', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=100&q=80', bio: 'Sports Page', following: true },
  { name: 'Foodie Finds', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&q=80', bio: 'Food Reviews', following: false },
  { name: 'Nature Lovers', img: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=100&q=80', bio: 'Photography', following: false },
  { name: 'Gaming Hub', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80', bio: 'Esports', following: false },
  { name: 'Crypto Daily', img: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=100&q=80', bio: 'Web3 Updates', following: false },
  { name: 'Design Inspiration', img: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=100&q=80', bio: 'UI/UX', following: true },
  { name: 'Motivational Quotes', img: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=100&q=80', bio: 'Daily Motivation', following: false },
  { name: 'Photography Pro', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&q=80', bio: 'Visual Arts', following: false }
];

function openFollowersModal() {
  const container = document.getElementById('followersListContainer');
  container.innerHTML = '';

  mockFollowers.forEach((user, index) => {
    const item = document.createElement('div');
    item.className = 'follower-item';
    item.innerHTML = `
      <div class="follower-info">
        <img src="${user.img}" alt="${user.name}">
        <div>
          <h4>${user.name}</h4>
          <p>${user.bio}</p>
        </div>
      </div>
      <button class="btn-follow-small ${user.following ? 'following' : ''}" onclick="toggleFollowerFollow(this, ${index})">
        ${user.following ? 'Following' : 'Follow'}
      </button>
    `;
    container.appendChild(item);
  });

  openModal('mFollowersList');
}

function toggleFollowerFollow(btn, index) {
  const user = mockFollowers[index];
  user.following = !user.following;
  
  if (user.following) {
    btn.className = 'btn-follow-small following';
    btn.innerText = 'Following';
  } else {
    btn.className = 'btn-follow-small';
    btn.innerText = 'Follow';
  }
}

// ===== REACTIONS LOGIC =====
function toggleReactionPicker(btn) {
  const picker = btn.nextElementSibling;
  const isOpen = picker.style.display === 'flex';
  document.querySelectorAll('.reaction-picker').forEach(p => p.style.display = 'none');
  if (!isOpen) {
    picker.style.display = 'flex';
    picker.style.bottom = '100%';
    picker.style.left = '50%';
    picker.style.transform = 'translateX(-50%)';
    picker.style.marginBottom = '5px';
  }
}

function addReaction(emojiEl, emoji) {
  emojiEl.closest('.reaction-picker').style.display = 'none';
  
  const btn = emojiEl.closest('.reaction-wrapper').querySelector('.action-btn');
  btn.innerHTML = `<span>${emoji}</span> Reacted`;
  btn.style.color = 'var(--primary)';
  
  const post = emojiEl.closest('.post');
  const stack = post.querySelector('.reaction-stack');
  let countSpan = stack.querySelector('span:last-child');
  countSpan.innerText = parseInt(countSpan.innerText) + 1;
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.reaction-wrapper')) {
    document.querySelectorAll('.reaction-picker').forEach(p => p.style.display = 'none');
  }
});

// ===== EDIT PROFILE TOGGLES =====
function toggleProfileGuard(el) {
  const val = el.querySelector('.list-value');
  val.textContent = val.textContent === 'Off' ? 'On' : 'Off';
  val.style.color = val.textContent === 'On' ? 'var(--primary)' : 'var(--muted)';
}

function toggle18Guard(el) {
  const val = el.querySelector('.list-value');
  val.textContent = val.textContent === 'Off' ? 'On' : 'Off';
  val.style.color = val.textContent === 'On' ? 'var(--error)' : 'var(--muted)';
  if (val.textContent === 'On') {
    alert("18+ Content Guard is now ON. Sensitive posts will be hidden.");
  }
}

function toggleZenMode(el) {
  const val = el.querySelector('.list-value');
  val.textContent = val.textContent === 'Off' ? 'On' : 'Off';
  document.body.style.background = val.textContent === 'On' ? '#000' : 'var(--bg)';
  alert(val.textContent === 'On' ? "Zen Mode Activated. Distractions hidden." : "Zen Mode Off.");
}

function toggleLowerMode(el) {
  const val = el.querySelector('.list-value');
  val.textContent = val.textContent === 'Off' ? 'On' : 'Off';
  if (val.textContent === 'On') {
    alert("Lower Mode Activated. HD images will now load in SD to save data.");
  }
}

// ===== VERIFICATION =====
function submitVerification() {
  closeModal('mVerification');
  alert("Documents submitted successfully!\nYour Black Badge will be verified in 24-48 hours.");
}

// ===== VOICE COMMENT =====
let currentVoicePreset = 'Normal';
function openVoiceComment() { openModal('mVoiceComment'); }

function setVoicePreset(btn, preset) {
  document.querySelectorAll('.vp-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentVoicePreset = preset;
}

function simulateRecording() {
  const status = document.getElementById('recStatus');
  status.innerHTML = '🔴 Recording... (0:00)';
  status.style.color = 'var(--error)';
  
  setTimeout(() => {
    status.innerHTML = `✅ Recorded using ${currentVoicePreset} mode!`;
    status.style.color = 'var(--success)';
    setTimeout(() => closeModal('mVoiceComment'), 1500);
  }, 2000);
}

// ===== BLOOD DONATION =====
function showBloodForm(type) {
  document.getElementById('bloodForm').style.display = 'block';
  document.getElementById('bloodForm').querySelector('input').placeholder = `${type} Name`;
                                            }
