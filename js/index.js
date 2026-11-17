// ---------- Helpers ----------
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.display = 'none'; }, 3000);
}
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const icon = document.getElementById('themeIcon');
  icon.classList.toggle('fa-moon');
  icon.classList.toggle('fa-sun');
}
function scrollTopPage() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ---------- Feed ----------
function filterFeed(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else if (type === 'all') {
    const first = document.querySelector('.filter-btn');
    if (first) first.classList.add('active');
  }
  document.querySelectorAll('#feedContainer .post').forEach(p => {
    p.style.display = (type === 'all' || p.dataset.type === type) ? '' : 'none';
  });
}

function addPost(type, authorLine, bodyHtml) {
  const post = document.createElement('div');
  post.className = 'post';
  post.dataset.type = type;
  post.innerHTML = `
    <div class="post-header">
      <div class="avatar sm"><i class="fas fa-user"></i></div>
      <div>
        <div class="post-author">Abir Mazumder <span class="vbadge"><i class="fas fa-check"></i></span></div>
        <div class="post-meta"><i class="fas fa-clock"></i> Just now ${authorLine}</div>
      </div>
    </div>
    ${bodyHtml}
    <div class="post-actions-bar">
      <button onclick="likePost(this)"><i class="far fa-thumbs-up"></i> Like</button>
      <button onclick="toggleComments(this)"><i class="far fa-comment"></i> Comment</button>
      <button onclick="sharePost()"><i class="far fa-share-from-square"></i> Share</button>
    </div>`;
  document.getElementById('feedContainer').prepend(post);
  return post;
}

function previewPostImage(event) {
  const file = event.target.files[0];
  if (!file || !file.type.startsWith('image/')) { showToast('Video preview is not shown here'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const out = document.getElementById('postImagePreview');
    out.src = reader.result;
    out.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function publishPost() {
  const text = document.getElementById('postText').value;
  if (!text.trim()) { showToast('Please enter something to post!'); return; }
  const img = document.getElementById('postImagePreview');
  const imgHtml = img.style.display !== 'none' && img.src
    ? `<img class="post-image" alt="" src="${img.src}">` : '';
  addPost('posts', '• Public', `<p>${esc(text)}</p>${imgHtml}`);
  document.getElementById('postText').value = '';
  img.style.display = 'none';
  img.removeAttribute('src');
  closeModal('mComposer');
  const n = document.getElementById('statPosts');
  n.textContent = (parseInt(n.textContent, 10) || 0) + 1;
  showToast('Post published!');
}

function submitMissing() {
  const name = document.getElementById('miName').value.trim();
  const place = document.getElementById('miLastSeen').value.trim();
  const phone = document.getElementById('miPhone').value.trim();
  const desc = document.getElementById('miDesc').value.trim();
  if (!name || !place || !phone) { showToast('Fill name, last seen location and contact number'); return; }
  addPost('missing', '• Missing alert', `
    <h4 style="margin-top:10px;color:#e74c3c;"><i class="fas fa-user-magnifying-glass"></i> Missing: ${esc(name)}</h4>
    <p><b>Last seen:</b> ${esc(place)}<br><b>Contact:</b> ${esc(phone)}${desc ? '<br>' + esc(desc) : ''}</p>`);
  ['miName','miLastSeen','miPhone','miDesc'].forEach(id => document.getElementById(id).value = '');
  closeModal('mMissing');
  const a = document.getElementById('statAlerts');
  a.textContent = (parseInt(a.textContent, 10) || 0) + 1;
  showToast('Alert added to your feed (not saved to a server yet)');
}

function submitBloodRequest() {
  const patient = document.getElementById('blPatient').value.trim();
  const hospital = document.getElementById('blHospital').value.trim();
  const phone = document.getElementById('blPhone').value.trim();
  const group = document.getElementById('blGroup').value;
  const urgency = document.getElementById('blUrgency').value;
  if (!patient || !hospital || !phone) { showToast('Fill patient, hospital and contact number'); return; }
  addPost('blood', '• Blood request', `
    <h4 style="margin-top:10px;color:#e74c3c;"><i class="fas fa-droplet"></i> ${esc(group)} needed — ${esc(urgency)}</h4>
    <p><b>Patient:</b> ${esc(patient)}<br><b>Hospital:</b> ${esc(hospital)}<br><b>Contact:</b> ${esc(phone)}</p>`);
  ['blPatient','blHospital','blPhone'].forEach(id => document.getElementById(id).value = '');
  closeModal('mBlood');
  showToast('Request added to your feed (not saved to a server yet)');
}

// ---------- Settings ----------
function submitNID() {
  const name = document.getElementById('verifyName').value.trim();
  const front = document.getElementById('nidFrontInput').files.length;
  const selfie = document.getElementById('selfieInput').files.length;
  if (!name || !front || !selfie) { showToast('Add your name, NID front and selfie'); return; }
  showToast('Not uploaded yet: connect a private storage first');
}
function submitReceiver() {
  const ok = ['rcName','rcAddress','rcPhone'].every(id => document.getElementById(id).value.trim());
  if (!ok) { showToast('Fill all required fields'); return; }
  showToast('Saved on this device only');
  closeModal('mSettings');
}
function savePrivacy() {
  showToast('Privacy settings saved on this device only');
  closeModal('mSettings');
}
function mmTab(btn, paneId) {
  document.querySelectorAll('.mm-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.mm-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(paneId).classList.add('active');
}

// ---------- Shield ----------
function openShield() { openModal('mShield'); }
function addTrustedContact() {
  const name = document.getElementById('tcName').value.trim();
  const phone = document.getElementById('tcPhone').value.trim();
  if (!name || !phone) { showToast('Fill contact details'); return; }
  const item = document.createElement('p');
  item.innerHTML = `<i class="fas fa-user-shield"></i> ${esc(name)} (${esc(phone)})`;
  document.getElementById('trustedList').appendChild(item);
  document.getElementById('tcName').value = '';
  document.getElementById('tcPhone').value = '';
  showToast('Trusted contact added');
}
function triggerPanic() {
  if (confirm('Trigger PANIC MODE?')) showToast('Demo only: no alert was sent. Call 999 in an emergency.');
}
function sosAlert() {
  if (confirm('Trigger Emergency SOS?')) showToast('Demo only: no alert was sent. Call 999 in an emergency.');
}

// ---------- Misc ----------
function viewStory(name) { showToast('Reel by ' + name); }
function likePost(btn) {
  const on = btn.classList.toggle('liked');
  btn.style.color = on ? 'var(--primary)' : '';
  btn.querySelector('i').className = on ? 'fas fa-thumbs-up' : 'far fa-thumbs-up';
}
function toggleComments() { showToast('Comments coming soon'); }
function sharePost() { showToast('Sharing coming soon'); }
function attachLocation() { showToast('Location attach coming soon'); }
function handleSearch(e) {
  if (e.key === 'Enter') showToast('Searching for: ' + e.target.value);
  }
