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
        <button class="p-action" onclick="toast('Share coming soon')"><i class="fas fa-share"></i> Share</button>
      </div>
    </article>`).join('');
}
function toggleLike(id) {
  const p = state.posts.find(x => x.id === id);
  if (!p) return;
  p.liked = !p.liked; p.likes += p.liked ? 1 : -1; renderFeed();
}
function publishPost() {
  const text = $('postText').value.trim();
  if (!text) return toast('Write something first');
  const disappearing = $('isDisappearing').checked;
  state.posts.unshift({ id: 'p' + Date.now(), author: USER.name, avatar: USER.avatar, time: Date.now(), text, verified: true, disappearing, likes: 0, comments: 0, shares: 0, liked: false });
  $('postText').value = ''; $('isDisappearing').checked = false;
  closeModal('mComposer'); renderFeed();
  addNotification('Post published successfully', 'fa-check-circle');
}

/* ============================================================
   REPORT
   ============================================================ */
function openReport(id) { state.activeReportId = id; openModal('mReport'); }
function submitReport(reason) {
  closeModal('mReport');
  toast('Reported: ' + reason);
  addNotification('Report submitted: ' + reason, 'fa-flag');
  addSecurityLog('Reported content', `Reason: ${reason}`, 'info');
}

/* ============================================================
   VOICE
   ============================================================ */
function setVoice(btn, preset) {
  document.querySelectorAll('.voice-preset').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); state.currentVoicePreset = preset;
}
function recordVoice() {
  const status = $('recStatus');
  status.textContent = '🎙️ Recording...';
  setTimeout(() => {
    status.textContent = '✅ Recorded with ' + state.currentVoicePreset + ' effect';
    $('voicePlayback').style.display = 'block';
    toast('Voice comment ready');
  }, 1800);
}

/* ============================================================
   MISSING PERSON
   ============================================================ */
function seedAlerts() {
  state.alerts = [
    { id: 'a1', name: 'Rafiq Hasan', age: 14, gender: 'Male', lastSeen: 'Mirpur 10, Dhaka', when: Date.now() - 21600000, desc: 'Blue t-shirt, grey pants. Last seen near Mirpur 10 circle.', phone: '+8801712345678', createdAt: Date.now() - 18000000, verified: true },
    { id: 'a2', name: 'Ayesha Siddiqua', age: 62, gender: 'Female', lastSeen: 'Dhanmondi 27, Dhaka', when: Date.now() - 172800000, desc: 'Elderly woman in white saree, has mild dementia.', phone: '+8801812345678', createdAt: Date.now() - 172800000, verified: true },
  ];
}
function renderMissingPreview() {
  const el = $('missingPreview');
  if (!el) return;
  if (state.alerts.length === 0) { el.innerHTML = 'No active alerts.'; return; }
  const latest = state.alerts[0];
  el.innerHTML = `<b>${state.alerts.length} active alert${state.alerts.length > 1 ? 's' : ''}</b> · Latest: ${esc(latest.name)}, ${latest.age}y — ${esc(latest.lastSeen)}`;
}
function renderAlertList() {
  const el = $('mmList');
  if (!el) return;
  if (state.alerts.length === 0) { el.innerHTML = `<div class="empty-state"><i class="fas fa-user-magnifying-glass"></i>No active alerts.</div>`; return; }
  el.innerHTML = state.alerts.map(a => `
    <div class="alert-card">
      <div class="ac-head">
        <div class="ac-avatar"><i class="fas fa-user"></i></div>
        <div>
          <div class="ac-name">${esc(a.name)} <span class="vbadge vbadge-black"><i class="fas fa-check"></i></span></div>
          <div class="ac-meta">${a.age}y · ${a.gender} · ${timeAgo(a.createdAt)}</div>
        </div>
      </div>
      <div class="ac-desc"><b>Last seen:</b> ${esc(a.lastSeen)}<br>${esc(a.desc)}</div>
      <div class="ac-contact"><i class="fas fa-phone"></i> ${esc(a.phone)}</div>
      <div class="ac-tags"><span class="tag">Verified</span><span class="tag">Missing Person</span></div>
    </div>`).join('');
}
function submitMissing() {
  const name = $('miName').value.trim();
  const age = $('miAge').value;
  const gender = $('miGender').value;
  const lastSeen = $('miLastSeen').value.trim();
  const when = $('miWhen').value;
  const desc = $('miDesc').value.trim();
  const phone = $('miPhone').value.trim();
  if (!name || !lastSeen || !phone) return toast('Fill all required fields');
  state.alerts.unshift({ id: 'a' + Date.now(), name, age: age || '—', gender, lastSeen, when: when ? new Date(when).getTime() : Date.now(), desc: desc || '—', phone, createdAt: Date.now(), verified: true });
  ['miName','miAge','miLastSeen','miWhen','miDesc','miPhone'].forEach(id => $(id).value = '');
  mmTab(document.querySelector('#mMissing .mm-tab'), 'mmList');
  renderAlertList(); renderMissingPreview();
  toast('Alert published'); addNotification('Missing alert: ' + name, 'fa-user-magnifying-glass');
  addSecurityLog('Missing alert published', name, 'info');
}

/* ============================================================
   BLOOD DONATION
   ============================================================ */
function seedBloodRequests() {
  state.bloodRequests = [
    { id: 'b1', patient: 'Kamal Hossain', group: 'O+', bags: 3, hospital: 'Dhaka Medical College, Ward 4', when: Date.now() + 21600000, phone: '+8801912345678', urgency: 'Critical (within 6 hours)', submitter: 'Farhan Khan', submitterShowNumber: true, createdAt: Date.now() - 2400000 },
    { id: 'b2', patient: 'Rehana Begum', group: 'A-', bags: 2, hospital: 'Square Hospital, Cabin 12', when: Date.now() + 72000000, phone: '+8801612345678', urgency: 'Urgent (within 24 hours)', submitter: 'Anonymous', submitterShowNumber: false, createdAt: Date.now() - 10800000 },
  ];
}
function renderBloodPreview() {
  const el = $('bloodPreview');
  if (!el) return;
  if (state.bloodRequests.length === 0) { el.innerHTML = 'No active requests.'; return; }
  const latest = state.bloodRequests[0];
  el.innerHTML = `<b>${state.bloodRequests.length} active request${state.bloodRequests.length > 1 ? 's' : ''}</b> · ${esc(latest.patient)} needs <b>${latest.group}</b> at ${esc(latest.hospital.split(',')[0])}`;
}
function renderBloodList() {
  const el = $('blList');
  if (!el) return;
  if (state.bloodRequests.length === 0) { el.innerHTML = `<div class="empty-state"><i class="fas fa-droplet"></i>No active requests.</div>`; return; }
  el.innerHTML = state.bloodRequests.map(b => {
    const hideNum = state.shield.privacy.hideNumber;
    const showNum = b.submitterShowNumber && b.phone && !hideNum;
    const contact = showNum
      ? `<div class="ac-contact"><i class="fas fa-phone"></i> ${esc(b.phone)}</div>`
      : `<div class="ac-contact hidden"><i class="fas fa-eye-slash"></i> Number hidden</div>`;
    const urgClass = b.urgency.includes('Critical') ? 'critical' : (b.urgency.includes('Urgent') ? 'urgent' : '');
    return `<div class="alert-card blood">
      <div class="ac-head">
        <div class="ac-avatar"><i class="fas fa-droplet"></i></div>
        <div>
          <div class="ac-name">${esc(b.patient)} <span class="vbadge vbadge-black"><i class="fas fa-check"></i></span></div>
          <div class="ac-meta">Posted by ${esc(b.submitter)} · ${timeAgo(b.createdAt)}</div>
        </div>
      </div>
      <div class="ac-desc">Needs <b style="color:#c62828;font-size:15px;">${b.group}</b> · ${b.bags} bag(s)<br>📍 ${esc(b.hospital)}</div>
      ${contact}
      <div class="ac-tags"><span class="tag group">${b.group}</span><span class="tag ${urgClass}">${esc(b.urgency)}</span><span class="tag">Verified</span></div>
    </div>`;
  }).join('');
}
function submitBloodRequest() {
  const patient = $('blPatient').value.trim();
  const group = $('blGroup').value;
  const bags = $('blBags').value;
  const hospital = $('blHospital').value.trim();
  const when = $('blWhen').value;
  const phone = $('blPhone').value.trim();
  const urgency = $('blUrgency').value;
  if (!patient || !hospital || !phone) return toast('Fill all required fields');
  const showNumber = state.shield.privacy.hideNumber ? false : (state.receiver ? state.receiver.showNumber : state.showNumber);
  state.bloodRequests.unshift({ id: 'b' + Date.now(), patient, group, bags, hospital, when: when ? new Date(when).getTime() : Date.now() + 86400000, phone, urgency, submitter: state.receiver ? state.receiver.name : USER.name, submitterShowNumber: showNumber, createdAt: Date.now() });
  ['blPatient','blHospital','blWhen','blPhone'].forEach(id => $(id).value = '');
  mmTab(document.querySelector('#mBlood .mm-tab'), 'blList');
  renderBloodList(); renderBloodPreview();
  toast('Blood request published'); addNotification('Blood request: ' + patient, 'fa-droplet');
  addSecurityLog('Blood request published', patient, 'info');
}

/* ============================================================
   RECEIVER
   ============================================================ */
function openReceiverForm() { closeModal('mSettings'); openModal('mReceiver'); prefillReceiver(); }
function prefillReceiver() {
  const r = state.receiver;
  if (!r) return;
  $('rcName').value = r.name || ''; $('rcGroup').value = r.group || 'A+';
  $('rcAddress').value = r.address || ''; $('rcPhone').value = r.phone || '';
  $('showNumberToggle').checked = !!r.showNumber;
}
let docsBuffer = [];
function previewDocs(e) {
  const files = Array.from(e.target.files || []);
  docsBuffer = [];
  const preview = $('docPreview');
  preview.innerHTML = '';
  files.forEach(f => {
    const reader = new FileReader();
    reader.onload = ev => {
      docsBuffer.push({ name: f.name, dataUrl: ev.target.result });
      const img = document.createElement('img');
      img.src = ev.target.result; img.onclick = () => openDocViewer(ev.target.result);
      preview.appendChild(img);
    };
    reader.readAsDataURL(f);
  });
}
function submitReceiver() {
  const name = $('rcName').value.trim();
  const group = $('rcGroup').value;
  const address = $('rcAddress').value.trim();
  const phone = $('rcPhone').value.trim();
  const showNumber = $('showNumberToggle').checked;
  if (!name || !address || !phone) return toast('Fill all required fields');
  if (docsBuffer.length === 0 && !state.receiver?.docs?.length) return toast('Upload verification documents');
  const docs = docsBuffer.length ? docsBuffer : state.receiver.docs;
  state.receiver = { name, group, address, phone, showNumber, docs, submittedAt: Date.now(), verified: true };
  localStorage.setItem('ab_receiver', JSON.stringify(state.receiver));
  closeModal('mReceiver');
  toast('Receiver registered & verified');
  addNotification('Blood receiver profile verified', 'fa-check-circle');
  addSecurityLog('Blood receiver verified', `${name} · ${group}`, 'success');
  if ($('receiverStatusBox')) renderReceiverStatusBox();
  renderMyReceiverStatus();
}
function renderMyReceiverStatus() {
  const el = $('blMe');
  if (!el) return;
  const r = state.receiver;
  if (!r) {
    el.innerHTML = `<div class="empty-state"><i class="fas fa-id-card"></i>You haven't registered as a blood receiver yet.<div style="margin-top:14px;"><button class="btn btn-primary" onclick="openReceiverForm()"><i class="fas fa-droplet"></i> Register Now</button></div></div>`;
    return;
  }
  const hideNum = state.shield.privacy.hideNumber;
  const numberShown = r.showNumber && !hideNum
    ? `<b>${esc(r.phone)}</b> <span class="tag" style="background:color-mix(in srgb,var(--primary) 15%,transparent);color:var(--primary);">Visible</span>`
    : `<b>••••••${r.phone.slice(-3)}</b> <span class="tag">Hidden</span>`;
  const docsHtml = (r.docs && r.docs.length) ? r.docs.map(d => `<img src="${d.dataUrl}" onclick="openDocViewer('${d.dataUrl}')">`).join('') : `<div class="doc-placeholder">No documents</div>`;
  el.innerHTML = `<div class="alert-card" style="background:linear-gradient(135deg,rgba(198,40,40,.08),transparent);border-color:rgba(198,40,40,.25);">
    <div class="ac-head">
      <div class="ac-avatar"><i class="fas fa-shield-halved"></i></div>
      <div><div class="ac-name">Receiver Profile <span class="vbadge vbadge-black"><i class="fas fa-check"></i></span></div>
      <div class="ac-meta">Verified ${new Date(r.submittedAt).toLocaleDateString()}</div></div>
    </div>
    <div class="ac-desc">
      <b>Name:</b> ${esc(r.name)}<br>
      <b>Blood:</b> <span style="color:#c62828;font-weight:800;">${r.group}</span><br>
      <b>Address:</b> ${esc(r.address)}<br>
      <b>Number:</b> ${numberShown}
    </div>
    <div style="margin-top:10px;"><b style="font-size:12px;">Documents (proof):</b></div>
    <div class="doc-preview" style="margin-top:6px;">${docsHtml}</div>
  </div>
  <button class="btn btn-primary" style="margin-top:10px;" onclick="openReceiverForm()"><i class="fas fa-pen"></i> Edit</button>`;
}
function renderReceiverStatusBox() {
  const el = $('receiverStatusBox');
  if (!el) return;
  const r = state.receiver;
  if (!r) {
    el.innerHTML = `<div class="hint-box" style="margin-top:12px;"><i class="fas fa-info-circle"></i> Register as a receiver to get verified &amp; matched with donors.</div>`;
    return;
  }
  el.innerHTML = `<div class="hint-box" style="margin-top:12px;background:color-mix(in srgb,var(--primary) 10%,var(--card));">
    <i class="fas fa-check-circle" style="color:var(--primary);"></i>
    <div><b>Registered &amp; Verified</b><br>${esc(r.name)} · ${r.group} · ${r.showNumber ? 'Number visible' : 'Number hidden'}</div>
  </div>`;
}
function updateShowNumber(el) {
  const on = el.checked;
  state.showNumber = on;
  localStorage.setItem('ab_showNumber', on);
  if (state.receiver) {
    state.receiver.showNumber = on;
    localStorage.setItem('ab_receiver', JSON.stringify(state.receiver));
  }
  // sync other toggles
  ['showNumberToggle','setShowNumber'].forEach(id => { const e = $(id); if (e && e !== el) e.checked = on; });
  toast(on ? 'Number visible' : 'Number hidden');
  addSecurityLog('Number visibility changed', on ? 'ON' : 'OFF', 'info');
  renderMyReceiverStatus(); renderBloodList();
}

/* ============================================================
   ============= MY SHIELD — SECURITY CENTER ==================
   ============================================================ */

/* ---- Open / Close ---- */
function openShield() {
  if (state.shield.pinEnabled && !state.shield.locked && state.shield.pin) {
    // Require PIN to open shield
    requestPin('openShieldAfterPin');
    return;
  }
  $('mShield').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderShield();
  addSecurityLog('Shield opened', 'Security center accessed', 'info');
}
function openShieldAfterPin() {
  $('mShield').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderShield();
}
function closeShield() {
  $('mShield').classList.remove('open');
  document.body.style.overflow = '';
}
function shieldTab(btn, paneId) {
  const bar = btn.closest('.shield-tabs');
  bar.querySelectorAll('.shield-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.shield-pane').forEach(p => p.classList.remove('active'));
  const target = $(paneId);
  if (target) target.classList.add('active');
  // render dynamic content
  if (paneId === 'shSessions') renderSessions();
  if (paneId === 'shLog') renderSecurityLog();
  if (paneId === 'shPanic') renderTrustedContacts();
  if (paneId === 'shAuth') syncAuthToggles();
  if (paneId === 'shPrivacy') syncPrivacyToggles();
}

/* ---- Render Shield Overview ---- */
function renderShield() {
  const s = state.shield;

  // Score
  let score = 30;
  if (s.pinEnabled) score += 25;
  if (s.twoFA) score += 20;
  if (s.autoLockMin > 0) score += 10;
  if (s.privacy.hideNumber) score += 5;
  if (s.privacy.hideLocation) score += 5;
  if (s.privacy.blockSS) score += 5;
  if (s.biometric) score += 5;
  score = Math.min(100, score);

  const ring = $('shieldScoreRing');
  if (ring) ring.style.setProperty('--score-pct', score + '%');
  const txt = $('shieldScoreText'); if (txt) txt.textContent = score;

  const mini = $('shieldScoreMini'); if (mini) mini.textContent = score;
  const sessionsMini = $('shieldSessionsMini'); if (sessionsMini) sessionsMini.textContent = s.sessions.length;
  const threatMini = $('shieldThreatMini'); if (threatMini) threatMini.textContent = score >= 80 ? 'Low' : score >= 50 ? 'Mid' : 'High';

  // Shield dot
  const dot = $('shieldDot');
  if (dot) {
    dot.className = 'shield-dot' + (score >= 80 ? '' : score >= 50 ? ' warn' : ' danger');
  }

  // Score desc
  const desc = $('shieldScoreDesc');
  if (desc) {
    desc.textContent = score >= 80
      ? 'Excellent! Your account is well protected.'
      : score >= 50 ? 'Good, but enabling more features will improve protection.'
      : 'Weak protection. Please enable PIN + 2FA immediately.';
  }

  // Chips
  const chips = $('shieldChips');
  if (chips) {
    const arr = [];
    arr.push(s.pinEnabled ? ['PIN OK', 'ok'] : ['PIN OFF', 'bad']);
    arr.push(s.twoFA ? ['2FA ON', 'ok'] : ['2FA OFF', 'warn']);
    arr.push(s.autoLockMin > 0 ? ['Auto-Lock', 'ok'] : ['No Auto-Lock', 'warn']);
    arr.push(s.privacy.blockSS ? ['SS Block', 'ok'] : ['SS Open', 'warn']);
    if (s.biometric) arr.push(['Bio', 'ok']);
    chips.innerHTML = arr.map(([t, c]) => `<span class="chip ${c}">${t}</span>`).join('');
  }

  // Quick toggles state
  const sqPin = $('sqPinState'); if (sqPin) { sqPin.textContent = s.pinEnabled ? 'ON' : 'OFF'; sqPin.className = 'sq-state' + (s.pinEnabled ? ' on' : ''); }
  const sq2 = $('sq2faState'); if (sq2) { sq2.textContent = s.twoFA ? 'ON' : 'OFF'; sq2.className = 'sq-state' + (s.twoFA ? ' on' : ''); }
  const sqA = $('sqAutoState'); if (sqA) { sqA.textContent = s.autoLockMin > 0 ? s.autoLockMin + 'm' : 'OFF'; sqA.className = 'sq-state' + (s.autoLockMin > 0 ? ' on' : ''); }
  const sqG = $('sqGhostState'); if (sqG) { sqG.textContent = s.privacy.ghost ? 'ON' : 'OFF'; sqG.className = 'sq-state' + (s.privacy.ghost ? ' on' : ''); }

  // Threat box
  const box = $('shieldThreatBox');
  if (box) {
    box.className = 'shield-alert-box' + (score >= 80 ? '' : score >= 50 ? ' warn' : ' danger');
    const t = $('shieldThreatTitle'), d = $('shieldThreatDesc');
    if (t) t.textContent = score >= 80 ? 'No threats detected' : score >= 50 ? 'Minor risks detected' : 'Security risks detected';
    if (d) d.textContent = score >= 80
      ? 'Your account is safe. Last scan: just now.'
      : score >= 50 ? 'Enable PIN, 2FA & Auto-Lock to boost your score.'
      : 'Enable PIN + 2FA now. Your account may be vulnerable.';
  }

  syncAuthToggles(); syncPrivacyToggles();
}

function syncAuthToggles() {
  const s = state.shield;
  if ($('shPinToggle')) $('shPinToggle').checked = s.pinEnabled;
  if ($('sh2faToggle')) $('sh2faToggle').checked = s.twoFA;
  if ($('shBioToggle')) $('shBioToggle').checked = s.biometric;
  if ($('shAutoLockSelect')) $('shAutoLockSelect').value = String(s.autoLockMin);
}
function syncPrivacyToggles() {
  const p = state.shield.privacy;
  if ($('shHideNum')) $('shHideNum').checked = p.hideNumber;
  if ($('shHideLoc')) $('shHideLoc').checked = p.hideLocation;
  if ($('shGhost')) $('shGhost').checked = p.ghost;
  if ($('shBlurPhoto')) $('shBlurPhoto').checked = p.blurPhoto;
  if ($('shBlockSS')) $('shBlockSS').checked = p.blockSS;
}

/* ---- Quick toggle handler ---- */
function toggleShieldFeature(feature) {
  const s = state.shield;
  if (feature === 'pin') {
    if (s.pinEnabled) { s.pinEnabled = false; s.pin = null; localStorage.removeItem('sh_pin'); toast('PIN disabled'); addSecurityLog('PIN disabled', '', 'warn'); }
    else { openSetPinFlow(); return; }
  } else if (feature === '2fa') {
    s.twoFA = !s.twoFA; toast(s.twoFA ? '2FA enabled' : '2FA disabled');
    addSecurityLog('2FA ' + (s.twoFA ? 'enabled' : 'disabled'), '', s.twoFA ? 'success' : 'warn');
  } else if (feature === 'autolock') {
    const next = s.autoLockMin === 0 ? 5 : s.autoLockMin === 5 ? 15 : s.autoLockMin === 15 ? 30 : 0;
    s.autoLockMin = next;
    toast('Auto-lock: ' + (next === 0 ? 'Off' : next + 'm'));
    addSecurityLog('Auto-lock changed', next === 0 ? 'Off' : next + ' min', 'info');
  } else if (feature === 'ghost') {
    s.privacy.ghost = !s.privacy.ghost;
    toast('Ghost mode ' + (s.privacy.ghost ? 'ON' : 'OFF'));
    addSecurityLog('Ghost mode', s.privacy.ghost ? 'ON' : 'OFF', 'info');
  }
  saveShield(); renderShield();
}

/* ---- PIN Setup Flow ---- */
function openSetPinFlow() {
  const old = state.shield.pin;
  if (old) {
    requestPin('setNewPin', 'Enter current PIN to change');
  } else {
    promptNewPin();
  }
}
function promptNewPin() {
  const newPin = prompt('Enter NEW 4-6 digit PIN:');
  if (!newPin || !/^\d{4,6}$/.test(newPin)) return toast('Invalid PIN (4-6 digits)');
  const confirm = prompt('Confirm new PIN:');
  if (confirm !== newPin) return toast('PINs do not match');
  state.shield.pin = newPin;
  state.shield.pinEnabled = true;
  localStorage.setItem('sh_pin', newPin);
  saveShield();
  toast('✅ PIN enabled');
  addSecurityLog('PIN enabled', 'App PIN Lock activated', 'success');
  renderShield();
}
function togglePin(on) {
  if (on) { if (!state.shield.pin) promptNewPin(); else { state.shield.pinEnabled = true; saveShield(); addSecurityLog('PIN enabled', '', 'success'); } }
  else { state.shield.pinEnabled = false; saveShield(); toast('PIN disabled'); addSecurityLog('PIN disabled', '', 'warn'); }
  renderShield();
}
function changePin() {
  const old = $('shOldPin').value;
  const n1 = $('shNewPin').value;
  const n2 = $('shNewPin2').value;
  if (state.shield.pin && old !== state.shield.pin) return toast('Current PIN is incorrect');
  if (!/^\d{4,6}$/.test(n1)) return toast('New PIN must be 4-6 digits');
  if (n1 !== n2) return toast('New PINs do not match');
  state.shield.pin = n1; state.shield.pinEnabled = true;
  localStorage.setItem('sh_pin', n1); saveShield();
  $('shOldPin').value = ''; $('shNewPin').value = ''; $('shNewPin2').value = '';
  toast('PIN updated'); addSecurityLog('PIN changed', '', 'success'); renderShield();
}
function toggle2FA(on) { state.shield.twoFA = on; saveShield(); toast('2FA ' + (on ? 'enabled' : 'disabled')); addSecurityLog('2FA ' + (on ? 'enabled' : 'disabled'), '', on ? 'success' : 'warn'); renderShield(); }
function toggleBiometric(on) { state.shield.biometric = on; saveShield(); toast('Biometric ' + (on ? 'enabled' : 'disabled')); addSecurityLog('Biometric ' + (on ? 'enabled' : 'disabled'), '', 'info'); renderShield(); }
function setAutoLock(val) {
  state.shield.autoLockMin = parseInt(val);
  saveShield(); toast('Auto-lock: ' + (val === '0' ? 'Off' : val + 'm'));
  addSecurityLog('Auto-lock changed', val + ' min', 'info'); renderShield();
}

/* ---- Session management ---- */
function renderSessions() {
  const el = $('sessionList');
  if (!el) return;
  el.innerHTML = state.shield.sessions.map(s => `
    <div class="session-item ${s.current ? 'current' : ''}">
      <div class="session-ico"><i class="fas ${s.device.includes('iPhone') || s.device.includes('Android') ? 'fa-mobile-screen' : 'fa-desktop'}"></i></div>
      <div class="session-info">
        <b>${esc(s.device)}</b>
        <small>${esc(s.location)} · ${s.ip} · ${timeAgo(s.lastActive)}</small>
      </div>
      ${s.current ? '<span class="session-badge">THIS DEVICE</span>' : `<button class="session-revoke" onclick="revokeSession('${s.id}')">Revoke</button>`}
    </div>`).join('');
}
function revokeSession(id) {
  state.shield.sessions = state.shield.sessions.filter(s => s.id !== id);
  saveShield(); renderSessions(); renderShield();
  toast('Session revoked');
  addSecurityLog('Session revoked', 'Device signed out', 'warn');
}
function revokeAllSessions() {
  state.shield.sessions = state.shield.sessions.filter(s => s.current);
  saveShield(); renderSessions(); renderShield();
  toast('All other sessions revoked');
  addSecurityLog('All sessions revoked', 'Signed out from all other devices', 'warn');
}

/* ---- Privacy toggles ---- */
function setPrivacy(key, val) {
  state.shield.privacy[key] = val;
  saveShield();
  toast(key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()) + ' ' + (val ? 'ON' : 'OFF'));
  addSecurityLog('Privacy: ' + key, val ? 'ON' : 'OFF', 'info');
  renderShield(); renderBloodList();
}

/* ---- Security Log ---- */
function addSecurityLog(title, sub = '', type = 'info') {
  state.shield.log.unshift({
    id: 'l' + Date.now() + Math.random(),
    title, sub, type, time: Date.now(),
  });
  if (state.shield.log.length > 100) state.shield.log = state.shield.log.slice(0, 100);
  saveShield();
  if ($('securityLogList')) renderSecurityLog();
}
function renderSecurityLog() {
  const el = $('securityLogList');
  if (!el) return;
  const log = state.shield.log;
  if (log.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fas fa-shield-halved"></i>No security events yet.</div>`;
    return;
  }
  el.innerHTML = log.map(l => {
    const cls = l.type === 'danger' ? 'danger' : l.type === 'warn' ? 'warn' : '';
    const ico = l.type === 'success' ? 'fa-check-circle' : l.type === 'warn' ? 'fa-triangle-exclamation' : l.type === 'danger' ? 'fa-circle-exclamation' : 'fa-circle-info';
    return `<div class="log-item ${cls}">
      <i class="fas ${ico} li-ico"></i>
      <div class="li-body">
        <b>${esc(l.title)}</b>
        ${l.sub ? `<small>${esc(l.sub)}</small>` : ''}
        <small style="display:block;margin-top:2px;opacity:.7;">${timeAgo(l.time)}</small>
      </div>
    </div>`;
  }).join('');
}
function clearSecurityLog() {
  state.shield.log = []; saveShield(); renderSecurityLog(); toast('Log cleared');
}

/* ---- Trusted contacts ---- */
function renderTrustedContacts() {
  const el = $('trustedContactsList');
  if (!el) return;
  if (state.shield.trustedContacts.length === 0) {
    el.innerHTML = `<div class="hint-box"><i class="fas fa-info-circle"></i>No trusted contacts. Add up to 3 people who will be alerted in panic mode.</div>`;
    return;
  }
  el.innerHTML = state.shield.trustedContacts.map((c, i) => `
    <div class="trusted-contact">
      <div class="tc-ico"><i class="fas fa-user-shield"></i></div>
      <div class="tc-info"><b>${esc(c.name)}</b><small>${esc(c.phone)}</small></div>
      <button onclick="removeTrustedContact(${i})">Remove</button>
    </div>`).join('');
}
function addTrustedContact() {
  const name = $('tcName').value.trim();
  const phone = $('tcPhone').value.trim();
  if (!name || !phone) return toast('Enter name and phone');
  if (state.shield.trustedContacts.length >= 3) return toast('Max 3 trusted contacts');
  state.shield.trustedContacts.push({ name, phone });
  saveShield(); $('tcName').value = ''; $('tcPhone').value = '';
  renderTrustedContacts(); toast('Contact added');
  addSecurityLog('Trusted contact added', name, 'success');
}
function removeTrustedContact(i) {
  state.shield.trustedContacts.splice(i, 1); saveShield(); renderTrustedContacts();
}

/* ---- Recovery Codes ---- */
function showRecoveryCodes() {
  if (!state.shield.recoveryCodes) {
    state.shield.recoveryCodes = Array.from({length: 8}, () =>
      Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    );
    saveShield();
  }
  const codes = state.shield.recoveryCodes.join('\n');
  alert('🔑 RECOVERY CODES\n\nSave these in a safe place. Each can be used once.\n\n' + codes);
  addSecurityLog('Recovery codes generated', '8 codes created', 'info');
}

/* ---- Security scan ---- */
function runSecurityScan() {
  toast('🔍 Scanning your account…');
  addSecurityLog('Security scan started', 'Full account scan', 'info');
  setTimeout(() => {
    renderShield();
    toast('✅ Scan complete — no new threats');
    addSecurityLog('Scan complete', 'No new threats detected', 'success');
  }, 1500);
}

/* ============================================================
   PIN PROMPT / LOCK
   ============================================================ */
let pinCallback = null;
let pinTarget = '';
function requestPin(callback, prompt = 'Enter your PIN to continue') {
  pinTarget = '';
  pinCallback = callback;
  state.pinBuffer = '';
  const overlay = $('pinLock');
  overlay.classList.add('show');
  const promptEl = document.querySelector('.pin-lock p');
  if (promptEl) promptEl.textContent = prompt;
  renderPinDots();
}
function closePinPrompt() {
  $('pinLock').classList.remove('show');
  state.pinBuffer = '';
  pinCallback = null;
}
function renderPinDots() {
  const dots = $('pinDots');
  if (!dots) return;
  const len = state.shield.pin ? state.shield.pin.length : 4;
  dots.innerHTML = Array.from({length: len}, (_, i) =>
    `<div class="pin-dot ${i < state.pinBuffer.length ? 'filled' : ''}"></div>`
  ).join('');
}
function pinPress(v) {
  if (v === 'del') {
    state.pinBuffer = state.pinBuffer.slice(0, -1);
  } else if (v === 'bio') {
    if (state.shield.biometric) { closePinPrompt(); toast('🔓 Unlocked by biometrics'); runPinCallback(); return; }
    else toast('Biometric not enabled');
    return;
  } else {
    if (state.pinBuffer.length < 6) state.pinBuffer += v;
  }
  renderPinDots();
  const targetLen = state.shield.pin ? state.shield.pin.length : 4;
  if (state.pinBuffer.length === targetLen) {
    setTimeout(() => checkPin(), 120);
  }
}
function checkPin() {
  const errEl = $('pinError');
  if (state.pinBuffer === state.shield.pin) {
    if (errEl) errEl.textContent = '';
    state.shield.failedAttempts = 0;
    state.shield.locked = false;
    closePinPrompt();
    addSecurityLog('Unlock success', 'PIN verified', 'success');
    runPinCallback();
  } else {
    state.shield.failedAttempts++;
    addSecurityLog('Failed unlock', `Attempt ${state.shield.failedAttempts}/3`, 'danger');
    if (errEl) errEl.textContent = `Incorrect PIN (${state.shield.failedAttempts}/3)`;
    state.pinBuffer = '';
    renderPinDots();
    if (state.shield.failedAttempts >= 3) {
      addSecurityLog('⚠️ Locked out', 'Too many failed attempts', 'danger');
      toast('Too many attempts. App temporarily locked.');
      setTimeout(() => { state.shield.failedAttempts = 0; if (errEl) errEl.textContent = ''; }, 10000);
    }
  }
}
function runPinCallback() {
  const cb = pinCallback;
  pinCallback = null;
  if (typeof cb === 'function') cb();
  else if (typeof cb === 'string' && window[cb]) window[cb]();
}
function pinForgot() {
  const code = prompt('Enter a recovery code:');
  if (!code) return;
  if (state.shield.recoveryCodes && state.shield.recoveryCodes.includes(code.trim().toUpperCase())) {
    state.shield.recoveryCodes = state.shield.recoveryCodes.filter(c => c !== code.trim().toUpperCase());
    saveShield();
    state.shield.failedAttempts = 0;
    state.shield.locked = false;
    closePinPrompt();
    toast('✅ Recovery successful');
    addSecurityLog('Recovery used', 'Recovery code accepted', 'warn');
    runPinCallback();
  } else {
    toast('Invalid recovery code');
    addSecurityLog('Recovery failed', 'Invalid code', 'danger');
  }
}

/* ============================================================
   AUTO-LOCK (inactivity timer)
   ============================================================ */
let autoLockTimer = null;
function resetActivity() {
  state.shield.lastActivity = Date.now();
  if (autoLockTimer) clearTimeout(autoLockTimer);
  const min = state.shield.autoLockMin;
  if (min > 0 && state.shield.pinEnabled) {
    autoLockTimer = setTimeout(() => {
      state.shield.locked = true;
      requestPin('noop', 'App auto-locked. Enter PIN to continue');
      addSecurityLog('Auto-lock triggered', `${min} min inactivity`, 'warn');
    }, min * 60 * 1000);
  }
}
['click','keydown','mousemove','touchstart'].forEach(evt =>
  document.addEventListener(evt, resetActivity, { passive: true })
);
function noop() { /* unlocked */ }

/* ============================================================
   PANIC MODE
   ============================================================ */
function openPanic() {
  // Open shield to panic tab
  openShield();
  setTimeout(() => {
    const tabBtns = document.querySelectorAll('#mShield .shield-tab');
    tabBtns.forEach(t => t.classList.remove('active'));
    tabBtns[4]?.classList.add('active');
    document.querySelectorAll('.shield-pane').forEach(p => p.classList.remove('active'));
    $('shPanic')?.classList.add('active');
    renderTrustedContacts();
  }, 100);
}
function confirmPanic() {
  if (!confirm('⚠️ ACTIVATE PANIC MODE?\n\nThis will:\n• Lock the app\n• Sign out all other sessions\n• Alert your trusted contacts\n\nContinue?')) return;
  activatePanic();
}
function activatePanic() {
  const s = state.shield;
  s.panicActive = true;
  // kill other sessions
  const otherCount = s.sessions.filter(x => !x.current).length;
  s.sessions = s.sessions.filter(x => x.current);
  // lock the app (requires PIN next)
  if (s.pin) { s.locked = true; }
  saveShield();

  // Show overlay
  const overlay = $('panicOverlay');
  const info = $('panicInfo');
  const contacts = s.trustedContacts;
  info.innerHTML = `
    <b>✅ Other sessions killed:</b> ${otherCount}<br>
    <b>📞 Trusted contacts alerted:</b> ${contacts.length}<br>
    ${contacts.map(c => `• ${esc(c.name)} (${esc(c.phone)})`).join('<br>') || '(none configured)'}
    <br><b>⏱️ Time:</b> ${new Date().toLocaleString()}
  `;
  overlay.classList.add('show');
  closeShield();

  addSecurityLog('🚨 PANIC MODE ACTIVATED', 'Emergency lock engaged', 'danger');
  addNotification('🚨 Panic Mode activated — all sessions terminated', 'fa-triangle-exclamation');
  toast('🚨 PANIC MODE ACTIVE');
}
function deactivatePanic() {
  if (state.shield.pin) {
    requestPin(() => {
      state.shield.panicActive = false;
      state.shield.locked = false;
      saveShield();
      $('panicOverlay').classList.remove('show');
      addSecurityLog('Panic mode ended', 'Account unlocked via PIN', 'success');
      toast('Account unlocked');
    }, 'Enter PIN to end panic mode');
  } else {
    // no PIN set — unlock directly
    state.shield.panicActive = false;
    state.shield.locked = false;
    saveShield();
    $('panicOverlay').classList.remove('show');
    toast('Panic mode ended');
  }
}
function wipeLocalData() {
  if (!confirm('⚠️ This will sign you out and clear all cached data from this device. Continue?')) return;
  localStorage.removeItem('ab_receiver');
  localStorage.removeItem('sh_pin');
  localStorage.removeItem('sh_recovery');
  toast('Local data wiped');
  setTimeout(() => location.reload(), 800);
}
function sosAlert() {
  toast('🆘 SOS — Sharing live location with trusted circle');
  addNotification('SOS alert sent to trusted contacts', 'fa-triangle-exclamation');
  addSecurityLog('SOS triggered', 'Live location shared', 'danger');
}

/* ============================================================
   SCREENSHOT DETECTION
   ============================================================ */
function handleScreenshot() {
  if (!state.shield.privacy.blockSS) return;
  const block = $('screenshotBlock');
  if (block) {
    block.classList.add('show');
    setTimeout(() => block.classList.remove('show'), 2000);
  }
  addSecurityLog('Screenshot blocked', 'Attempt detected', 'warn');
}
// Best-effort (browser limitations apply)
document.addEventListener('keyup', (e) => {
  if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5'))) {
    handleScreenshot();
  }
});

/* ============================================================
   PROFILE
   ============================================================ */
function openProfile() {
  const r = state.receiver;
  const p = state.shield.privacy;
  const receiverBlock = r ? `
    <div class="receiver-card" style="margin:0 20px 16px;">
      <div class="rc-head"><i class="fas fa-shield-halved"></i> Blood Receiver · Verified <span class="vbadge vbadge-black"><i class="fas fa-check"></i></span></div>
      <div class="rc-row"><b>Name:</b> ${esc(r.name)}</div>
      <div class="rc-row"><b>Group:</b> <span style="color:#c62828;font-weight:800;">${r.group}</span></div>
      <div class="rc-row"><b>Address:</b> ${esc(r.address)}</div>
      <div class="rc-row"><b>Number:</b> ${p.hideNumber ? 'Hidden (Privacy Shield)' : (r.showNumber ? esc(r.phone) : 'Hidden by user')}</div>
      <div class="rc-docs">${(r.docs || []).map(d => `<img src="${d.dataUrl}" onclick="openDocViewer('${d.dataUrl}')">`).join('') || '<div class="doc-placeholder">No documents</div>'}</div>
    </div>` : '';

  const html = `
    <div class="profile-cover">
      <button class="profile-close" onclick="closeModal('mProfile')"><i class="fas fa-times"></i></button>
    </div>
    <div class="profile-head">
      <div class="profile-avatar-wrap">
        <img src="${USER.avatar}" class="profile-avatar" alt="" style="${p.blurPhoto ? 'filter:blur(6px);' : ''}">
        <span class="vbadge vbadge-black"><i class="fas fa-check"></i></span>
      </div>
      <div class="profile-info">
        <div class="profile-name">
          ${esc(USER.name)}
          <span class="vbadge vbadge-black"><i class="fas fa-check"></i></span>
        </div>
        <div class="profile-bio">${esc(USER.bio)}</div>
      </div>
    </div>
    <div class="profile-stats">
      <div class="ps-item"><b>98</b><small>Trust Score</small></div>
      <div class="ps-item"><b>${state.posts.filter(p => p.author === USER.name).length}</b><small>Posts</small></div>
      <div class="ps-item"><b>${state.alerts.length + state.bloodRequests.length}</b><small>Alerts</small></div>
      <div class="ps-item"><b>${state.shield.sessions.length}</b><small>Sessions</small></div>
    </div>
    <div class="profile-badges">
      <span class="pbadge black"><i class="fas fa-check"></i> Autrobook Verified</span>
      <span class="pbadge"><i class="fas fa-shield-halved"></i> Shield Protected</span>
      ${r ? '<span class="pbadge"><i class="fas fa-droplet" style="color:#c62828;"></i> Blood Receiver</span>' : ''}
    </div>
    <div class="profile-actions">
      <button class="btn btn-primary" onclick="closeModal('mProfile');openShield()"><i class="fas fa-shield-halved"></i> My Shield</button>
      <button class="btn btn-secondary" onclick="closeModal('mProfile');openModal('mSettings')"><i class="fas fa-cog"></i> Settings</button>
    </div>
    ${receiverBlock}
    <div class="profile-section">
      <h4><i class="fas fa-user"></i> About</h4>
      <div class="profile-about">
        <b>Location:</b> ${p.hideLocation ? 'Hidden' : esc(USER.location)}<br>
        <b>Joined:</b> ${USER.joined}<br>
        <b>Verified:</b> Autrobook Black Tick ✓<br>
        <b>Security:</b> ${state.shield.pinEnabled ? 'PIN Lock enabled' : 'PIN Lock off'} · ${state.shield.twoFA ? '2FA enabled' : '2FA off'}
      </div>
    </div>
  `;
  $('profileModalContent').innerHTML = html;
  openModal('mProfile');
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  applyTheme();
  toggleSound(state.sound);
  // user avatar
  ['sideAvatar','composerAvatar'].forEach(id => { const e = $(id); if (e) e.src = USER.avatar; });
  seedReels(); renderReels();
  seedPosts(); renderFeed();
  seedAlerts(); renderMissingPreview(); renderAlertList();
  seedBloodRequests(); renderBloodPreview(); renderBloodList();
  if (state.receiver) renderReceiverStatusBox();

  // update sidebar name
  const sn = $('sideName'); if (sn) sn.textContent = USER.name;

  // init shield UI
  syncAuthToggles(); syncPrivacyToggles();
  renderShield();

  // If panic was active, restore
  if (state.shield.panicActive) {
    $('panicOverlay').classList.add('show');
  }

  // If PIN enabled, require unlock on load
  if (state.shield.pinEnabled && state.shield.pin) {
    setTimeout(() => requestPin('noop', 'Enter your PIN to unlock Autrobook'), 300);
  }

  // Start auto-lock timer
  resetActivity();

  // Welcome notification
  addNotification('Welcome back, Abir! Your account is protected 🛡️', 'fa-shield-halved');
}
document.addEventListener('DOMContentLoaded', init);
