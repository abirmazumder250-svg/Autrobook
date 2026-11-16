// ==================== GLOBAL STATE ====================
let currentTheme = localStorage.getItem('theme') || 'light';
let securityScore = 0;
let trustedContacts = JSON.parse(localStorage.getItem('trustedContacts')) || [];
let userPosts = JSON.parse(localStorage.getItem('userPosts')) || [];
let missingAlerts = JSON.parse(localStorage.getItem('missingAlerts')) || [];
let bloodRequests = JSON.parse(localStorage.getItem('bloodRequests')) || [];
let receiverData = JSON.parse(localStorage.getItem('receiverData')) || null;
let nidVerified = localStorage.getItem('nidVerified') === 'true';
let nidData = JSON.parse(localStorage.getItem('nidData')) || {};
let privacySettings = JSON.parse(localStorage.getItem('privacySettings')) || {
  profile: 'public',
  location: 'yes',
  blood: 'all'
};
let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
let currentFilter = 'all';

// ==================== THEME ====================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  localStorage.setItem('theme', theme);
  currentTheme = theme;
}

function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
}

// ==================== MODALS ====================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
  if (id === 'mShield') calculateSecurityScore();
  if (id === 'mNotifications') renderNotifications();
  if (id === 'mProfile') renderProfile();
  if (id === 'mSettings') {
    renderReceiverFields();
    renderPrivacyFields();
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

document.querySelectorAll('.modal-back').forEach(back => {
  back.addEventListener('click', (e) => {
    if (e.target === back) back.classList.remove('active');
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-back.active').forEach(m => m.classList.remove('active'));
  }
});

// ==================== TOAST ====================
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ==================== SCROLL ====================
function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== SEARCH ====================
function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  const container = document.getElementById('feedContainer');
  if (!query) {
    renderFeed();
    return;
  }
  const filtered = getAllPosts().filter(p =>
    p.text.toLowerCase().includes(query) || (p.author || '').toLowerCase().includes(query)
  );
  if (filtered.length === 0) {
    container.innerHTML = `<div class="post"><p class="text-muted" style="text-align:center;">No results found for "${query}"</p></div>`;
  } else {
    container.innerHTML = filtered.map(p => renderPostHTML(p)).join('');
  }
}

// ==================== SOS ====================
function sosAlert() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        showToast(`🚨 SOS! Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} — sent to trusted contacts.`);
        addNotification('SOS Activated', 'Your live location was shared with trusted contacts.');
      },
      () => {
        showToast('🚨 SOS activated! Could not get location. Sharing alert to contacts.');
        addNotification('SOS Activated', 'Location unavailable. Alert sent to contacts.');
      }
    );
  } else {
    showToast('🚨 SOS activated! Sharing alert to trusted contacts.');
    addNotification('SOS Activated', 'Alert sent to trusted contacts.');
  }
  securityScore = Math.min(100, securityScore + 5);
  saveSecurityScore();
}

// ==================== COMPOSER ====================
function attachType(type) {
  if (type === 'photo') showToast('📷 Photo attachment — feature coming soon!');
  if (type === 'location') showToast('📍 Location attachment — feature coming soon!');
}

function publishPost() {
  const text = document.getElementById('postText').value.trim();
  if (!text) {
    showToast('Please write something before publishing.');
    return;
  }
  const post = {
    id: Date.now(),
    text: text,
    time: new Date().toLocaleString(),
    author: 'Abir Mazumder',
    type: 'post'
  };
  userPosts.unshift(post);
  savePosts();
  renderFeed();
  document.getElementById('postText').value = '';
  closeModal('mComposer');
  showToast('Post published successfully!');
  securityScore = Math.min(100, securityScore + 2);
  saveSecurityScore();
  addNotification('Post Published', 'Your post is now live.');
}

// ==================== MISSING PERSON ====================
function submitMissing() {
  const name = document.getElementById('miName').value.trim();
  const location = document.getElementById('miLastSeen').value.trim();
  const phone = document.getElementById('miPhone').value.trim();
  const desc = document.getElementById('miDesc').value.trim();

  if (!name || !location || !phone) {
    showToast('Please fill all required fields (*).');
    return;
  }

  const alert = {
    id: Date.now(),
    name,
    location,
    phone,
    desc,
    time: new Date().toLocaleString()
  };

  missingAlerts.unshift(alert);
  localStorage.setItem('missingAlerts', JSON.stringify(missingAlerts));

  const post = {
    id: Date.now() + 1,
    text: `🔍 MISSING PERSON ALERT: ${name} was last seen at ${location}. ${desc ? 'Details: ' + desc + '. ' : ''}Contact: ${phone}`,
    time: new Date().toLocaleString(),
    author: 'Alert System',
    type: 'missing'
  };
  userPosts.unshift(post);
  savePosts();
  renderFeed();

  document.getElementById('miName').value = '';
  document.getElementById('miLastSeen').value = '';
  document.getElementById('miPhone').value = '';
  document.getElementById('miDesc').value = '';
  closeModal('mMissing');
  showToast('Missing person alert published!');
  securityScore = Math.min(100, securityScore + 3);
  saveSecurityScore();
  addNotification('Missing Alert', `Alert for ${name} published.`);
}

// ==================== BLOOD REQUEST ====================
function submitBloodRequest() {
  const patient = document.getElementById('blPatient').value.trim();
  const group = document.getElementById('blGroup').value;
  const hospital = document.getElementById('blHospital').value.trim();
  const phone = document.getElementById('blPhone').value.trim();
  const urgency = document.getElementById('blUrgency').value;

  if (!patient || !hospital || !phone) {
    showToast('Please fill all required fields (*).');
    return;
  }

  const request = {
    id: Date.now(),
    patient,
    group,
    hospital,
    phone,
    urgency,
    time: new Date().toLocaleString()
  };

  bloodRequests.unshift(request);
  localStorage.setItem('bloodRequests', JSON.stringify(bloodRequests));

  const post = {
    id: Date.now() + 2,
    text: `🩸 BLOOD REQUEST (${urgency}): Patient ${patient} needs ${group} blood at ${hospital}. Contact: ${phone}`,
    time: new Date().toLocaleString(),
    author: 'Blood Bank',
    type: 'blood'
  };
  userPosts.unshift(post);
  savePosts();
  renderFeed();

  document.getElementById('blPatient').value = '';
  document.getElementById('blGroup').value = 'A+';
  document.getElementById('blHospital').value = '';
  document.getElementById('blPhone').value = '';
  document.getElementById('blUrgency').value = 'Normal';
  closeModal('mBlood');
  showToast('Blood request published!');
  securityScore = Math.min(100, securityScore + 3);
  saveSecurityScore();
  addNotification('Blood Request', `${group} needed at ${hospital}.`);
}

// ==================== NID VERIFICATION ====================
function submitNID() {
  const name = document.getElementById('verifyName').value.trim();
  const front = document.getElementById('nidFrontInput').files[0];
  const back = document.getElementById('nidBackInput').files[0];
  const selfie = document.getElementById('selfieInput').files[0];

  if (!name || !front || !selfie) {
    showToast('Please fill all required fields (*) and upload NID Front & Selfie.');
    return;
  }

  nidData = { name, front: front.name, back: back ? back.name : null, selfie: selfie.name, time: new Date().toLocaleString() };
  nidVerified = true;
  localStorage.setItem('nidVerified', 'true');
  localStorage.setItem('nidData', JSON.stringify(nidData));

  document.getElementById('submitNidBtn').textContent = '✅ Verified';
  document.getElementById('submitNidBtn').style.background = '#2e7d32';
  showToast('NID verification submitted successfully! You are now verified.');
  securityScore = Math.min(100, securityScore + 20);
  saveSecurityScore();
  calculateSecurityScore();
  addNotification('NID Verified', 'Your identity has been verified.');
}

// ==================== BLOOD RECEIVER ====================
function submitReceiver() {
  const name = document.getElementById('rcName').value.trim();
  const group = document.getElementById('rcGroup').value;
  const address = document.getElementById('rcAddress').value.trim();
  const phone = document.getElementById('rcPhone').value.trim();

  if (!name || !address || !phone) {
    showToast('Please fill all required fields (*).');
    return;
  }

  receiverData = { name, group, address, phone, time: new Date().toLocaleString() };
  localStorage.setItem('receiverData', JSON.stringify(receiverData));
  showToast('Registered as blood receiver successfully!');
  securityScore = Math.min(100, securityScore + 10);
  saveSecurityScore();
  calculateSecurityScore();
  addNotification('Blood Receiver', 'You are registered as a blood receiver.');
  renderReceiverFields();
}

// ==================== PRIVACY ====================
function savePrivacy() {
  privacySettings = {
    profile: document.getElementById('privacyLevel').value,
    location: document.getElementById('privacyLocation').value,
    blood: document.getElementById('privacyBlood').value
  };
  localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
  showToast('Privacy settings saved.');
  addNotification('Privacy Updated', 'Your privacy preferences were saved.');
}

function renderPrivacyFields() {
  document.getElementById('privacyLevel').value = privacySettings.profile;
  document.getElementById('privacyLocation').value = privacySettings.location;
  document.getElementById('privacyBlood').value = privacySettings.blood;
}

// ==================== SHIELD / SECURITY SCORE ====================
function saveSecurityScore() {
  localStorage.setItem('securityScore', securityScore);
}

function loadSecurityScore() {
  const saved = localStorage.getItem('securityScore');
  if (saved) securityScore = parseInt(saved, 10) || 0;
}

function calculateSecurityScore() {
  let score = 0;
  if (nidVerified) score += 40;
  score += Math.min(30, trustedContacts.length * 10);
  if (receiverData) score += 15;
  if (userPosts.length > 0) score += 15;
  securityScore = Math.min(100, score);
  saveSecurityScore();

  const scoreEl = document.getElementById('securityScore');
  const barEl = document.getElementById('scoreBar');
  const msgEl = document.getElementById('scoreMsg');
  const shieldIcon = document.getElementById('shieldIcon');

  if (scoreEl) scoreEl.textContent = `${securityScore}/100`;
  if (barEl) barEl.style.width = `${securityScore}%`;

  if (msgEl) {
    if (securityScore >= 80) {
      msgEl.textContent = 'Excellent! Your account is highly secure.';
      msgEl.style.color = '#2e7d32';
      if (shieldIcon) shieldIcon.style.color = '#2e7d32';
    } else if (securityScore >= 50) {
      msgEl.textContent = 'Good, but you can improve by verifying NID or adding contacts.';
      msgEl.style.color = '#e6a017';
      if (shieldIcon) shieldIcon.style.color = '#e6a017';
    } else {
      msgEl.textContent = 'Low security. Complete your profile and add trusted contacts.';
      msgEl.style.color = '#d42b2b';
      if (shieldIcon) shieldIcon.style.color = '#d42b2b';
    }
  }
  renderTrustedList();
}

// ==================== TRUSTED CONTACTS ====================
function addTrustedContact() {
  const name = document.getElementById('tcName').value.trim();
  const phone = document.getElementById('tcPhone').value.trim();
  if (!name || !phone) {
    showToast('Please enter both name and phone number.');
    return;
  }
  trustedContacts.push({ name, phone });
  localStorage.setItem('trustedContacts', JSON.stringify(trustedContacts));
  document.getElementById('tcName').value = '';
  document.getElementById('tcPhone').value = '';
  showToast(`Trusted contact "${name}" added.`);
  securityScore = Math.min(100, securityScore + 10);
  saveSecurityScore();
  calculateSecurityScore();
  addNotification('Contact Added', `${name} is now a trusted contact.`);
}

function removeTrustedContact(index) {
  const removed = trustedContacts.splice(index, 1)[0];
  localStorage.setItem('trustedContacts', JSON.stringify(trustedContacts));
  showToast(`Removed ${removed.name}.`);
  calculateSecurityScore();
}

function renderTrustedList() {
  const list = document.getElementById('trustedList');
  if (!list) return;
  if (trustedContacts.length === 0) {
    list.innerHTML = '<p class="text-muted" style="text-align:center;font-size:0.8rem;">No trusted contacts added yet.</p>';
    return;
  }
  list.innerHTML = trustedContacts.map((c, i) =>
    `<div class="trusted-item"><span><i class="fas fa-user-shield" style="color:var(--primary);margin-right:6px;"></i>${c.name} — ${c.phone}</span><i class="fas fa-trash" onclick="removeTrustedContact(${i})"></i></div>`
  ).join('');
}

// ==================== PANIC MODE ====================
function triggerPanic() {
  if (trustedContacts.length === 0) {
    showToast('⚠️ Please add at least one trusted contact before using Panic Mode.');
    return;
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        showToast(`🚨 PANIC MODE ACTIVATED! Live location sent to ${trustedContacts.length} trusted contact(s).`);
        addNotification('Panic Mode', `Live location shared with ${trustedContacts.length} contact(s).`);
        console.log('Panic alert:', trustedContacts, 'Location:', latitude, longitude);
      },
      () => {
        showToast(`🚨 PANIC MODE ACTIVATED! Alert sent to ${trustedContacts.length} contact(s).`);
        addNotification('Panic Mode', `Alert sent to ${trustedContacts.length} contact(s).`);
      }
    );
  } else {
    showToast(`🚨 PANIC MODE ACTIVATED! Alert sent to ${trustedContacts.length} contact(s).`);
    addNotification('Panic Mode', `Alert sent to ${trustedContacts.length} contact(s).`);
  }
  securityScore = Math.min(100, securityScore + 5);
  saveSecurityScore();
  calculateSecurityScore();
}

// ==================== NOTIFICATIONS ====================
function addNotification(title, body) {
  notifications.unshift({
    id: Date.now(),
    title,
    body,
    time: new Date().toLocaleString(),
    read: false
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));
  updateNotifDot();
}

function updateNotifDot() {
  const dot = document.getElementById('notifDot');
  const unread = notifications.filter(n => !n.read).length;
  if (dot) dot.classList.toggle('show', unread > 0);
}

function renderNotifications() {
  const list = document.getElementById('notifList');
  if (!list) return;
  if (notifications.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:var(--muted); padding:20px 0;">No new notifications.</p>';
    return;
  }
  list.innerHTML = notifications.slice(0, 20).map(n => `
    <div class="trusted-item" style="flex-direction:column; align-items:flex-start; gap:4px; ${n.read ? 'opacity:0.6;' : ''}">
      <div style="display:flex; justify-content:space-between; width:100%;">
        <b style="color:var(--primary); font-size:0.9rem;">${n.title}</b>
        <small style="color:var(--muted); font-size:0.7rem;">${n.time}</small>
      </div>
      <span style="font-size:0.85rem;">${n.body}</span>
    </div>
  `).join('');
  notifications = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem('notifications', JSON.stringify(notifications));
  updateNotifDot();
}

// ==================== PROFILE ====================
function renderProfile() {
  document.getElementById('statPosts').textContent = userPosts.filter(p => p.type === 'post').length;
  document.getElementById('statAlerts').textContent = userPosts.filter(p => p.type === 'missing' || p.type === 'blood').length;
  document.getElementById('statScore').textContent = securityScore;

  const nidBadge = document.getElementById('badgeNid');
  nidBadge.innerHTML = `NID: <span style="color:${nidVerified ? 'var(--success)' : 'var(--danger)'};">${nidVerified ? 'Verified' : 'Unverified'}</span>`;

  const bloodBadge = document.getElementById('badgeBlood');
  bloodBadge.innerHTML = `Blood: <span style="color:${receiverData ? 'var(--success)' : 'var(--muted)'};">${receiverData ? receiverData.group : 'Not Set'}</span>`;
}

// ==================== RECEIVER FIELDS ====================
function renderReceiverFields() {
  if (receiverData) {
    document.getElementById('rcName').value = receiverData.name || '';
    document.getElementById('rcGroup').value = receiverData.group || 'A+';
    document.getElementById('rcAddress').value = receiverData.address || '';
    document.getElementById('rcPhone').value = receiverData.phone || '';
  }
}

// ==================== TABS ====================
function mmTab(btn, paneId) {
  document.querySelectorAll('.mm-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.mm-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const pane = document.getElementById(paneId);
  if (pane) pane.classList.add('active');
}

// ==================== FEED RENDERING ====================
function savePosts() {
  localStorage.setItem('userPosts', JSON.stringify(userPosts));
}

function getAllPosts() {
  return [...userPosts].sort((a, b) => b.id - a.id);
}

function renderPostHTML(post) {
  let cls = 'post';
  let badge = '';
  if (post.type === 'missing') {
    cls += ' is-missing';
    badge = ' <span style="background:#e6a017;color:white;font-size:0.65rem;padding:2px 6px;border-radius:10px;margin-left:6px;">MISSING</span>';
  } else if (post.type === 'blood') {
    cls += ' is-blood';
    badge = ' <span style="background:#c0392b;color:white;font-size:0.65rem;padding:2px 6px;border-radius:10px;margin-left:6px;">BLOOD</span>';
  }
  return `
    <div class="${cls}">
      <h4>${post.author || 'User'}${badge}</h4>
      <p>${post.text}</p>
      <div class="post-meta"><i class="fas fa-clock"></i> ${post.time || 'Just now'}</div>
    </div>
  `;
}

function renderFeed() {
  const container = document.getElementById('feedContainer');
  if (!container) return;

  let posts = getAllPosts();

  if (currentFilter !== 'all') {
    if (currentFilter === 'posts') posts = posts.filter(p => p.type === 'post');
    if (currentFilter === 'missing') posts = posts.filter(p => p.type === 'missing');
    if (currentFilter === 'blood') posts = posts.filter(p => p.type === 'blood');
  }

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="post">
        <h4>Welcome to Autrobook!</h4>
        <p>Try creating a post, reporting an alert, or uploading your NID in settings.</p>
        <div class="post-meta"><i class="fas fa-clock"></i> Just now</div>
      </div>
    `;
    return;
  }

  container.innerHTML = posts.map(p => renderPostHTML(p)).join('');
}

function filterFeed(type, btn) {
  currentFilter = type;
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderFeed();
}

// ==================== INITIALIZATION ====================
window.addEventListener('load', () => {
  applyTheme(currentTheme);
  loadSecurityScore();
  renderFeed();
  calculateSecurityScore();
  updateNotifDot();

  if (nidVerified) {
    const btn = document.getElementById('submitNidBtn');
    if (btn) {
      btn.textContent = '✅ Verified';
      btn.style.background = '#2e7d32';
    }
    if (nidData.name) {
      const nameInput = document.getElementById('verifyName');
      if (nameInput) nameInput.value = nidData.name;
    }
  }

  renderReceiverFields();
  renderPrivacyFields();
  renderTrustedList();

  if (!localStorage.getItem('visited')) {
    showToast('Welcome to Autrobook! Complete your profile to boost your safety score.');
    localStorage.setItem('visited', 'true');
  }

  // Logo fallback
  const logoImg = document.querySelector('.logo-img');
  if (logoImg) {
    logoImg.onerror = function () {
      this.style.display = 'none';
      const brandName = this.parentElement.querySelector('.brand-name');
      if (brandName) brandName.style.marginLeft = '0';
    };
  }
});

// ==================== EXPOSE GLOBAL FUNCTIONS ====================
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleTheme = toggleTheme;
window.sosAlert = sosAlert;
window.publishPost = publishPost;
window.submitMissing = submitMissing;
window.submitBloodRequest = submitBloodRequest;
window.submitNID = submitNID;
window.submitReceiver = submitReceiver;
window.addTrustedContact = addTrustedContact;
window.removeTrustedContact = removeTrustedContact;
window.triggerPanic = triggerPanic;
window.mmTab = mmTab;
window.openShield = () => openModal('mShield');
window.scrollTop = scrollTop;
window.handleSearch = handleSearch;
window.filterFeed = filterFeed;
window.attachType = attachType;
window.savePrivacy = savePrivacy;
