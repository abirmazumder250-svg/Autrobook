function toast(m){
  var t = document.getElementById('toast');
  t.innerText = m;
  t.style.display = 'block';
  setTimeout(function(){ t.style.display = 'none'; }, 2500);
}

function openModal(id){
  document.getElementById(id).style.display = 'flex';
  if(id === 'blockedModal') renderBlocked();
  if(id === 'dataModal') calculateStorage();
  loadModalValues();
}

function closeModal(id){
  document.getElementById(id).style.display = 'none';
}

function closeModalOutside(e, id){
  if(e.target.id === id) closeModal(id);
}

function getUser(){
  try { return JSON.parse(localStorage.getItem('autrobook_user')) || {}; } catch(e) { return {}; }
}

function getSettings(){
  try { return JSON.parse(localStorage.getItem('ab_settings') || '{}'); } catch(e) { return {}; }
}

function saveSettings(s){
  localStorage.setItem('ab_settings', JSON.stringify(s));
}

function saveUser(u){
  localStorage.setItem('autrobook_user', JSON.stringify(u));
}

function logout(){
  if(confirm('Are you sure you want to log out of Autrobook?')){
    localStorage.removeItem('autrobook_user');
    toast('Logged out successfully');
    setTimeout(function(){ window.location.href = '../login.html'; }, 600);
  }
}

function toggleSwitch(el, key){
  el.classList.toggle('on');
  var s = getSettings();
  s[key] = el.classList.contains('on');
  saveSettings(s);
  toast('Setting updated: ' + (s[key] ? 'ON' : 'OFF'));
}

function loadModalValues(){
  var u = getUser();
  var s = getSettings();

  // Account values
  document.getElementById('accName').value = u.name || '';
  document.getElementById('accUsername').value = u.username || '@user';
  document.getElementById('accEmail').value = u.email || '';
  document.getElementById('accPhone').value = u.phone || '';

  // Dropdown values
  document.getElementById('whoPost').value = s.whoPost || 'Public';
  document.getElementById('whoTag').value = s.whoTag || 'Friends';
  document.getElementById('profileVis').value = s.profileVis || 'Public';
  document.getElementById('langSelect').value = s.language || 'English';
  document.getElementById('fontSizeSelect').value = s.fontSize || 'Medium';
  document.getElementById('aiPersonality').value = s.aiPersonality || 'Friendly';

  // Toggle Switches Mapping
  var defaultOnKeys = ['tagReview', 'adultBlock', 'aiFeedOpt', 'aiEnabled', 'aiSmartReply', 'aiSummary', 'aiTranslate', 'activeStatus', 'showFriends', 'pushNoti', 'likeNoti', 'emergencyNoti', 'loginAlert'];
  var map = {
    tagReview: 'tagReviewSwitch',
    adultBlock: 'adultBlockSwitch',
    aiFeedOpt: 'aiFeedSwitch',
    aiEnabled: 'aiMasterSwitch',
    aiSmartReply: 'aiReplySwitch',
    aiSummary: 'aiSummarySwitch',
    aiTranslate: 'aiTranslateSwitch',
    profileLock: 'profileLockSwitch',
    activeStatus: 'activeStatusSwitch',
    showFriends: 'showFriendsSwitch',
    pushNoti: 'pushSwitch',
    likeNoti: 'likeNotiSwitch',
    emergencyNoti: 'emergencyNotiSwitch',
    twoFA: 'twoFASwitch',
    loginAlert: 'loginAlertSwitch',
    dataSaver: 'dataSaverSwitch'
  };

  Object.keys(map).forEach(function(k){
    var el = document.getElementById(map[k]);
    if(el){
      var val = s[k];
      if(val === undefined) val = defaultOnKeys.indexOf(k) > -1;
      if(val) el.classList.add('on'); else el.classList.remove('on');
    }
  });

  // Theme switch sync
  var darkEl = document.getElementById('darkSwitch');
  if(darkEl){
    if(document.body.classList.contains('light')) darkEl.classList.add('on');
    else darkEl.classList.remove('on');
  }
}

function saveAutroAccount(){
  var u = getUser();
  var name = document.getElementById('accName').value.trim();
  var username = document.getElementById('accUsername').value.trim();
  var email = document.getElementById('accEmail').value.trim();
  var phone = document.getElementById('accPhone').value.trim();

  if(!name) return toast('Please enter your full name');
  if(username && !username.startsWith('@')) username = '@' + username;

  u.name = name;
  u.username = username;
  u.email = email;
  u.phone = phone;
  saveUser(u);

  document.getElementById('accSub').innerText = name + ' • ' + username;
  toast('Autro Account updated successfully ✅');
  closeModal('autroAccountModal');
}

function changePassword(){
  var np = document.getElementById('newPass').value;
  var cp = document.getElementById('confirmPass').value;
  if(!np || np.length < 6) return toast('New password must be at least 6 characters');
  if(np !== cp) return toast('Passwords do not match');

  var u = getUser();
  u.password = np;
  saveUser(u);

  document.getElementById('oldPass').value = '';
  document.getElementById('newPass').value = '';
  document.getElementById('confirmPass').value = '';
  toast('Password & security settings updated 🛡️');
  closeModal('securityModal');
}

function submitVerification(){
  var cat = document.getElementById('verifyCategory').value;
  var docId = document.getElementById('verifyDocId').value.trim();
  if(!docId) return toast('Please enter your Government ID Number');

  var s = getSettings();
  s.verificationStatus = 'Pending (' + cat + ')';
  saveSettings(s);

  document.getElementById('verifySub').innerText = 'Status: Pending Review ✅';
  toast('Verification request submitted! Review takes 24h.');
  closeModal('verifyModal');
}

// SPECIAL FEATURE: Save Autro AI Settings
function saveAutroAiSettings(){
  var s = getSettings();
  s.aiPersonality = document.getElementById('aiPersonality').value;
  saveSettings(s);

  var statusText = (s.aiEnabled !== false) ? ('Active • ' + s.aiPersonality + ' Mode') : 'Disabled';
  document.getElementById('aiStatusSub').innerText = statusText;
  toast('Autro AI preferences saved ✨');
  closeModal('autroAiModal');
}

function clearAiMemory(){
  if(!confirm('Clear all saved Autro AI conversation history?')) return;
  localStorage.removeItem('autro_ai_history');
  toast('Autro AI memory cleared 🗑️');
}

function saveTagging(){
  var s = getSettings();
  s.whoPost = document.getElementById('whoPost').value;
  s.whoTag = document.getElementById('whoTag').value;
  saveSettings(s);
  toast('Tagging settings saved ✅');
  closeModal('profileTagModal');
}

function savePrivacy(){
  var s = getSettings();
  s.profileVis = document.getElementById('profileVis').value;
  saveSettings(s);
  toast('Privacy settings saved 🔒');
  closeModal('privacyModal');
}

function saveDisplaySettings(){
  var s = getSettings();
  s.fontSize = document.getElementById('fontSizeSelect').value;
  saveSettings(s);
  updateDisplaySub();
  toast('Display settings applied 🎨');
  closeModal('displayModal');
}

function updateDisplaySub(){
  var s = getSettings();
  var mode = document.body.classList.contains('light') ? 'Light Mode' : 'Dark Green Theme';
  document.getElementById('themeSub').innerText = mode + ' • ' + (s.fontSize || 'Medium') + ' Text';
}

function saveLang(){
  var s = getSettings();
  s.language = document.getElementById('langSelect').value;
  saveSettings(s);
  document.getElementById('langSub').innerText = s.language;
  toast('Language changed to ' + s.language);
  closeModal('langModal');
}

function blockUser(){
  var v = document.getElementById('blockInput').value.trim();
  if(!v) return toast('Enter a name or username to block');
  var list = [];
  try { list = JSON.parse(localStorage.getItem('ab_blocked') || '[]'); } catch(e) { list = []; }
  list.unshift({ id: Date.now(), name: v });
  localStorage.setItem('ab_blocked', JSON.stringify(list));
  document.getElementById('blockInput').value = '';
  renderBlocked();
  toast('Blocked ' + v + ' 🚫');
}

function renderBlocked(){
  var list = [];
  try { list = JSON.parse(localStorage.getItem('ab_blocked') || '[]'); } catch(e) { list = []; }
  document.getElementById('blockedCount').innerText = list.length + ' blocked users';
  document.getElementById('blockedList').innerHTML = list.length ? list.map(function(b){
    return '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg);padding:10px;border-radius:8px;margin:6px 0"><b>' + b.name + '</b><button onclick="unblock(' + b.id + ')" style="background:#ef4444;border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px">Unblock</button></div>';
  }).join('') : '<p style="color:var(--text2);text-align:center;padding:10px">No blocked accounts</p>';
}

function unblock(id){
  var list = JSON.parse(localStorage.getItem('ab_blocked') || '[]');
  list = list.filter(function(x){ return x.id !== id; });
  localStorage.setItem('ab_blocked', JSON.stringify(list));
  renderBlocked();
  toast('Account unblocked');
}

function calculateStorage(){
  var total = 0;
  for(var k in localStorage){
    if(localStorage.hasOwnProperty(k)){
      total += (localStorage[k] ? localStorage[k].length : 0);
    }
  }
  document.getElementById('storageStats').innerText = 'Storage Used: ' + (total / 1024).toFixed(2) + ' KB • Cached Keys: ' + localStorage.length;
}

function downloadArchive(){
  var archive = {
    user: getUser(),
    settings: getSettings(),
    blocked: JSON.parse(localStorage.getItem('ab_blocked') || '[]'),
    exportedAt: new Date().toISOString()
  };
  var blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'autrobook-data-archive.json';
  a.click();
  toast('Account archive downloaded ⬇️');
}

function clearAppCache(){
  if(!confirm('Clear cached feed & reels? Your account login will stay safe.')) return;
  ['ab_posts', 'ab_reels', 'ab_stories'].forEach(function(k){ localStorage.removeItem(k); });
  calculateStorage();
  toast('App cache cleared 🧹');
}

function sendHelp(){
  var v = document.getElementById('helpText').value.trim();
  if(!v) return toast('Please describe your issue');
  toast('Report submitted successfully ✅ Thank you!');
  document.getElementById('helpText').value = '';
  closeModal('helpModal');
}

function toggleTheme(){
  var isLight = document.body.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  updateDisplaySub();
  toast(isLight ? 'Light Mode ☀️' : 'Dark Green Theme 🌙');
}

function toggleThemeFromModal(){
  var isLight = document.body.classList.contains('light');
  if(isLight){
    document.body.classList.remove('light');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.add('light');
    localStorage.setItem('theme', 'light');
  }
  updateDisplaySub();
  loadModalValues();
}

function filterMain(q){
  var items = document.querySelectorAll('#mainList .item');
  items.forEach(function(it){
    var txt = it.innerText.toLowerCase();
    var show = txt.indexOf(q.toLowerCase()) > -1;
    it.style.display = show ? 'flex' : 'none';
  });
  document.querySelectorAll('#mainList .section').forEach(function(sec){
    var vis = [].slice.call(sec.querySelectorAll('.item')).some(function(i){ return i.style.display !== 'none'; });
    sec.style.display = vis ? 'block' : 'none';
  });
}

// Initialization on Page Load
document.getElementById('footerBrand').innerText = 'Autrobook ' + new Date().getFullYear();
if(localStorage.getItem('theme') === 'light') document.body.classList.add('light');

var _s = getSettings();
var _u = getUser();

document.getElementById('langSub').innerText = _s.language || 'English';
document.getElementById('accSub').innerText = (_u.name || 'User') + ' • ' + (_u.username || '@autrobook');
if(_s.verificationStatus) document.getElementById('verifySub').innerText = 'Status: ' + _s.verificationStatus;
document.getElementById('aiStatusSub').innerText = (_s.aiEnabled !== false) ? ('Active • ' + (_s.aiPersonality || 'Friendly') + ' Mode') : 'Disabled';

updateDisplaySub();
renderBlocked();
