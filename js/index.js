/* ============================================================
   AUTROBOOK — MAIN SCRIPT + MY SHIELD SECURITY CENTER
   ============================================================ */

/* ---------------- GLOBAL STATE ---------------- */
const state = {
  theme: localStorage.getItem('ab_theme') || 'system',
  sound: localStorage.getItem('ab_sound') !== 'false',
  showNumber: localStorage.getItem('ab_showNumber') !== 'false',
  notifications: [],
  posts: [], stories: [], reels: [],
  alerts: [], bloodRequests: [],
  receiver: JSON.parse(localStorage.getItem('ab_receiver') || 'null'),
  currentStory: 0,
  activeReportId: null,
  storyBg: '#0b5d3b',
  currentVoicePreset: 'Normal',

  /* ---- SHIELD STATE ---- */
  shield: {
    pin: localStorage.getItem('sh_pin') || null,
    pinEnabled: localStorage.getItem('sh_pinEnabled') === 'true',
    twoFA: localStorage.getItem('sh_2fa') === 'true',
    biometric: localStorage.getItem('sh_bio') === 'true',
    autoLockMin: parseInt(localStorage.getItem('sh_autoLock') || '0'),
    privacy: JSON.parse(localStorage.getItem('sh_privacy') || '{"hideNumber":false,"hideLocation":false,"ghost":false,"blurPhoto":false,"blockSS":true}'),
    sessions: JSON.parse(localStorage.getItem('sh_sessions') || 'null') || [
      { id: 's1', device: 'Chrome · Windows', location: 'Dhaka, BD', lastActive: Date.now(), current: true, ip: '103.108.x.x' },
      { id: 's2', device: 'Safari · iPhone', location: 'Chattogram, BD', lastActive: Date.now() - 3600000, current: false, ip: '103.22.x.x' },
    ],
    log: JSON.parse(localStorage.getItem('sh_log') || '[]'),
    trustedContacts: JSON.parse(localStorage.getItem('sh_trusted') || '[]'),
    recoveryCodes: JSON.parse(localStorage.getItem('sh_recovery') || 'null'),
    panicActive: localStorage.getItem('sh_panic') === 'true',
    failedAttempts: 0,
    lastActivity: Date.now(),
    locked: false,
  },
  pinBuffer: '',
};

const USER = {
  name: 'Abir Mazumder',
  avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
  bio: 'Software engineer · Blood donor · Safety-first thinker 🛡️',
  location: 'Dhaka, Bangladesh',
  joined: 'Joined March 2021',
  verified: true,
  trust: 98,
};

/* ---------------- UTILS ---------------- */
function $(id) { return document.getElementById(id); }
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function timeAgo(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return 'Just now';
  if (d < 3600) return Math.floor(d/60) + 'm ago';
  if (d < 86400) return Math.floor(d/3600) + 'h ago';
  return Math.floor(d/86400) + 'd ago';
}
function toast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 2400);
}
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
function saveShield() {
  const s = state.shield;
  localStorage.setItem('sh_pinEnabled', s.pinEnabled);
  localStorage.setItem('sh_2fa', s.twoFA);
  localStorage.setItem('sh_bio', s.biometric);
  localStorage.setItem('sh_autoLock', s.autoLockMin);
  localStorage.setItem('sh_privacy', JSON.stringify(s.privacy));
  localStorage.setItem('sh_sessions', JSON.stringify(s.sessions));
  localStorage.setItem('sh_log', JSON.stringify(s.log.slice(0, 100)));
  localStorage.setItem('sh_trusted', JSON.stringify(s.trustedContacts));
  localStorage.setItem('sh_panic', s.panicActive);
  if (s.recoveryCodes) localStorage.setItem('sh_recovery', JSON.stringify(s.recoveryCodes));
}

/* ---------------- THEME ---------------- */
function applyTheme() {
  const t = state.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : state.theme;
  document.documentElement.setAttribute('data-theme', t);
  const btn = $('themeBtn');
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) icon.className = t === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  ['thSystem','thLight','thDark'].forEach(id => {
    const el = $(id);
    if (el) el.classList.toggle('active',
      (id === 'thSystem' && state.theme === 'system') ||
      (id === 'thLight' && state.theme === 'light') ||
      (id === 'thDark' && state.theme === 'dark'));
  });
}
function setTheme(t) { state.theme = t; localStorage.setItem('ab_theme', t); applyTheme(); toast('Theme: ' + t); }
function cycleTheme() {
  const order = ['system', 'light', 'dark'];
  setTheme(order[(order.indexOf(state.theme) + 1) % order.length]);
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.theme === 'system') applyTheme();
});

/* ---------------- SOUND ---------------- */
function toggleSound(force) {
  state.sound = typeof force === 'boolean' ? force : !state.sound;
  localStorage.setItem('ab_sound', state.sound);
  const btn = $('soundToggle');
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) icon.className = state.sound ? 'fas fa-volume-up' : 'fas fa-volume-xmark';
  }
  const st = $('setSound');
  if (st) st.checked = state.sound;
  toast(state.sound ? 'Sound on' : 'Sound off');
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
function toggleNotifPanel() {
  const p = $('notifPanel');
  p.classList.toggle('open');
  if (p.classList.contains('open')) renderNotifications();
}
function addNotification(text, icon = 'fa-bell') {
  state.notifications.unshift({ id: 'n' + Date.now(), text, icon, time: Date.now(), unread: true });
  updateNotifBadge(); renderNotifications();
}
function updateNotifBadge() {
  const unread = state.notifications.filter(n => n.unread).length;
  const badge = $('notifBadge');
  if (badge) { badge.textContent = unread; badge.classList.toggle('show', unread > 0); }
}
function renderNotifications() {
  const list = $('notifList');
  if (!list) return;
  if (state.notifications.length === 0) {
    list.innerHTML = `<div class="notif-empty"><i class="fas fa-bell-slash" style="font-size:28px;display:block;margin-bottom:10px;opacity:.4;"></i>No notifications yet</div>`;
    return;
  }
  list.innerHTML = state.notifications.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markNotifRead('${n.id}')">
      <div class="ni-ico"><i class="fas ${n.icon}"></i></div>
      <div class="ni-body"><div>${esc(n.text)}</div><small>${timeAgo(n.time)}</small></div>
    </div>`).join('');
}
function markNotifRead(id) {
  const n = state.notifications.find(x => x.id === id);
  if (n) { n.unread = false; updateNotifBadge(); renderNotifications(); }
}
function clearAllNotifs() { state.notifications = []; updateNotifBadge(); renderNotifications(); }

/* ============================================================
   MODALS
   ============================================================ */
function openModal(id) {
  const m = $(id);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (id === 'mReceiver') prefillReceiver();
}
function closeModal(id) {
  const m = $(id);
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}
function mmTab(btn, paneId) {
  const tabBar = btn.closest('.mm-tabs');
  if (tabBar) { tabBar.querySelectorAll('.mm-tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
  const target = $(paneId);
  if (target) {
    const parent = target.parentElement;
    if (parent) parent.querySelectorAll('.mm-pane').forEach(p => p.classList.remove('active'));
    target.classList.add('active');
  }
  if (paneId === 'blMe') renderMyReceiverStatus();
  if (paneId === 'blList') renderBloodList();
  if (paneId === 'mmList') renderAlertList();
}
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-back')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
  const np = $('notifPanel');
  if (np && np.classList.contains('open') && !e.target.closest('#notifPanel') && !e.target.closest('#notifBtn')) {
    np.classList.remove('open');
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-back.open').forEach(m => m.classList.remove('open'));
    $('notifPanel')?.classList.remove('open');
    closeStoryViewer();
    document.body.style.overflow = '';
  }
});

/* ============================================================
   STORIES
   ============================================================ */
function renderStories() {
  const strip = $('storyStrip');
  if (!strip) return;
  let html = `<div class="story-item create-story" onclick="openModal('mCreateStory')">
    <div class="s-plus"><i class="fas fa-plus"></i></div>
    <div class="s-bottom">Create Story</div>
  </div>`;
  state.stories.forEach((s, i) => {
    html += `<div class="story-item" onclick="openStoryViewer(${i})">
      <div style="position:absolute;inset:0;background:${s.bg};display:flex;align-items:center;justify-content:center;padding:10px;color:#fff;font-weight:700;font-size:13px;text-align:center;">${esc(s.text)}</div>
      <img src="${s.avatar}" class="s-avatar" alt="" onerror="this.style.display='none'">
      <div class="s-name">${esc(s.name)}</div>
    </div>`;
  });
  strip.innerHTML = html;
}
function updateStoryPreview() { $('previewText').textContent = $('storyTextInput').value || 'Your Story Text'; }
function setStoryBg(color) { state.storyBg = color; $('storyPreview').style.background = color; }
function publishStory() {
  const text = $('storyTextInput').value.trim();
  if (!text) return toast('Please write something');
  state.stories.unshift({ id: 's' + Date.now(), name: USER.name, avatar: USER.avatar, text, bg: state.storyBg, time: Date.now() });
  $('storyTextInput').value = ''; $('previewText').textContent = 'Your Story Text';
  closeModal('mCreateStory'); renderStories(); toast('Story shared');
}
let storyTimer = null;
function openStoryViewer(i) {
  state.currentStory = i;
  const s = state.stories[i];
  if (!s) return;
  $('storyUserImg').src = s.avatar;
  $('storyUserName').textContent = s.name;
  const area = $('storyMainArea');
  area.style.background = s.bg; area.textContent = s.text;
  $('storyViewer').classList.add('open');
  document.body.style.overflow = 'hidden';
  startStoryTimer();
}
function startStoryTimer() {
  clearInterval(storyTimer);
  const bar = $('storyProgressBar');
  let p = 0; bar.style.width = '0%';
  storyTimer = setInterval(() => { p += 1; bar.style.width = p + '%'; if (p >= 100) { clearInterval(storyTimer); navStory(1); } }, 50);
}
function navStory(dir) {
  state.currentStory += dir;
  if (state.currentStory >= state.stories.length) { closeStoryViewer(); return; }
  if (state.currentStory < 0) state.currentStory = 0;
  openStoryViewer(state.currentStory);
}
function closeStoryViewer() { $('storyViewer').classList.remove('open'); clearInterval(storyTimer); document.body.style.overflow = ''; }
function hideStory() { state.stories.splice(state.currentStory, 1); closeStoryViewer(); renderStories(); toast('Story hidden'); }
function reactToStory(emoji) { toast('Reacted ' + emoji); closeStoryViewer(); }

/* ============================================================
   REELS
   ============================================================ */
function seedReels() {
  state.reels = [
    { id: 'r1', img: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&q=80', author: 'Tahmid', enhance: '4K', likes: 1200 },
    { id: 'r2', img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80', author: 'Sara', enhance: '8K', likes: 3400 },
    { id: 'r3', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80', author: 'Rifat', enhance: '16K', likes: 8900 },
    { id: 'r4', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80', author: 'Nisha', enhance: '4K', likes: 720 },
    { id: 'r5', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', author: 'Ayan', enhance: '8K', likes: 2200 },
  ];
}
function renderReels() {
  const el = $('reelsScroll');
  if (!el) return;
  el.innerHTML = state.reels.map(r => `
    <div class="reel-card" onclick="toast('Playing reel by ${esc(r.author)}')">
      <img src="${r.img}" alt="">
      <div class="rc-enhance">${r.enhance}</div>
      <div class="rc-play"><i class="fas fa-play"></i></div>
      <div class="rc-info"><span>@${esc(r.author)}</span><span><i class="fas fa-heart"></i> ${r.likes}</span></div>
    </div>`).join('');
}
function uploadReel() {
  const file = $('reelFileInput').files[0];
  if (!file) return toast('Please select a video');
  state.reels.unshift({ id: 'r' + Date.now(), img: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&q=80', author: USER.name.split(' ')[0], enhance: $('reelEnhance').value, likes: 0 });
  closeModal('mReelUpload'); $('reelFileInput').value = ''; renderReels(); toast('Reel uploaded');
}

/* ============================================================
   POSTS
   ============================================================ */
function seedPosts() {
  state.posts = [
    { id: 'p1', author: 'Sadia Rahman', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', time: Date.now() - 3600000, text: 'Just became a verified blood donor on Autrobook! 🩸💚', verified: true, disappearing: false, likes: 128, comments: 24, shares: 6, liked: false },
    { id: 'p2', author: 'Tanvir Ahmed', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80', time: Date.now() - 7200000, text: 'Autrobook Safety Hub helped reunite a missing child with his family today. 🛡️', verified: true, disappearing: false, likes: 421, comments: 67, shares: 33, liked: false },
    { id: 'p3', author: 'Nusrat Jahan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80', time: Date.now() - 86400000, text: 'The black verification tick actually means something here.', verified: true, disappearing: false, likes: 89, comments: 12, shares: 2, liked: false },
  ];
}
function renderFeed() {
  const el = $('feedContainer');
  if (!el) return;
  el.innerHTML = state.posts.map(p => `
    <article class="post">
      <div class="post-head">
        <div class="avatar-wrap">
          <img src="${p.avatar}" class="avatar" alt="">
          ${p.verified ? '<span class="vbadge vbadge-black avatar-badge"><i class="fas fa-check"></i></span>' : ''}
        </div>
        <div class="ph-info">
          <div class="ph-name">${esc(p.author)}${p.verified ? '<span class="vbadge vbadge-black"><i class="fas fa-check"></i></span>' : ''}</div>
          <div class="ph-meta">${timeAgo(p.time)} <i class="fas fa-circle" style="font-size:3px;opacity:.5;"></i> <i class="fas fa-globe-asia" style="font-size:11px;"></i></div>
        </div>
        <button class="ph-more" onclick="openReport('${p.id}')"><i class="fas fa-ellipsis-h"></i></button>
      </div>
      <div class="post-body">
        ${p.disappearing ? '<div class="disappearing-tag"><i class="fas fa-clock"></i> Disappearing · 24h</div>' : ''}
        ${esc(p.text)}
      </div>
      <div class="post-stats">
        <span><i class="fas fa-heart" style="color:#f02849;"></i> ${p.likes}</span>
        <span>${p.comments} comments · ${p.shares} shares</span>
      </div>
      <div class="post-actions">
        <button class="p-action ${p.liked ? 'liked' : ''}" onclick="toggleLike('${p.id}')"><i class="fas fa-thumbs-up"></i> Like</button>
        <button class="p-action" onclick="toast('Comments coming soon')"><i class="fas fa-comment"></i> Comment</button>
        <button class="p-action" onclick="toast('Share coming soon')"><i class="fas fa
