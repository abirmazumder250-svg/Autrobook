// ===== SHORTCUT.JS - 100% LIVE - NO HARDCODED GROUPS =====
var myName = localStorage.getItem('autro_user_name') || 'Abir Mazumder';
if(document.getElementById('drawerName')) document.getElementById('drawerName').textContent = myName;

// THEME - SYSTEM DEFAULT
function applyTheme(){
  var s = localStorage.getItem('autro_theme');
  document.body.classList.remove('theme-dark','theme-light');
  if(s==='dark') document.body.classList.add('theme-dark');
  if(s==='light') document.body.classList.add('theme-light');
}
function toggleTheme(){
  var cur = localStorage.getItem('autro_theme') || 'system';
  var next = cur==='system' ? 'dark' : (cur==='dark' ? 'light' : 'system');
  localStorage.setItem('autro_theme', next);
  applyTheme();
  showToast('Theme: ' + next);
}
applyTheme();

// ===== LIVE GROUPS - EMPTY AT START, ADDED ON LIVE VISIT =====
function getGroups(){ try{ return JSON.parse(localStorage.getItem('autro_live_groups')||'[]'); }catch(e){ return []; } }
function saveGroups(g){ localStorage.setItem('autro_live_groups', JSON.stringify(g)); }
function getTimes(){ try{ return JSON.parse(localStorage.getItem('autro_time_spent')||'{}'); }catch(e){ return {}; } }
function saveTimes(t){ localStorage.setItem('autro_time_spent', JSON.stringify(t)); }

// Called from groups.html when a user opens a group
function registerLiveGroup(id, name, img, link){
  var groups = getGroups();
  var found = groups.find(function(g){ return g.id===id; });
  if(!found){
    groups.push({ id:id, name:name, img:img, link:link });
    saveGroups(groups);
  }
}

// LIVE TRACKING
var liveId = null;
var liveStart = Date.now();
function startLiveTracking(){
  var hash = location.hash.replace('#','');
  var page = location.pathname.split('/').pop().replace('.html','');
  if(page==='groups' && hash) liveId = hash;
  else if(page==='blood') liveId = 'blood';
  else liveId = null;
  liveStart = Date.now();
}
function saveLiveTime(){
  if(!liveId) return;
  var spent = Math.floor((Date.now()-liveStart)/1000);
  if(spent < 2) return;
  var t = getTimes();
  t[liveId] = (t[liveId]||0) + spent;
  saveTimes(t);
  liveStart = Date.now();
  renderShortcuts();
}
setInterval(saveLiveTime, 5000);
document.addEventListener('visibilitychange', function(){ if(document.hidden) saveLiveTime(); else liveStart = Date.now(); });
window.addEventListener('beforeunload', saveLiveTime);
window.addEventListener('pagehide', saveLiveTime);

function renderShortcuts(){
  var box = document.getElementById('shortcutsRow'); if(!box) return;
  var groups = getGroups();
  var times = getTimes();
  if(!groups.length){
    box.innerHTML = '<p class="empty-shortcuts">No shortcuts yet.<br>Visit any Group, it will appear here automatically.</p>';
    return;
  }
  var sorted = [...groups].sort(function(a,b){ return (times[b.id]||0)-(times[a.id]||0); });
  box.innerHTML = sorted.map(function(g,i){
    var sec = times[g.id]||0;
    var label = sec>0 ? (sec>=60 ? Math.floor(sec/60)+'m '+(sec%60)+'s' : sec+'s') : 'Just visited';
    return '<div class="shortcut-item" onclick="saveLiveTime();location.href=\''+g.link+'\'"><div class="shortcut-wrap"><span class="rank">#'+(i+1)+'</span><img src="'+g.img+'"></div><b>'+g.name+'</b><div class="time">'+label+'</div></div>';
  }).join('');
}

function toggleSection(id, btn){
  var el = document.getElementById(id);
  var isOpen = el.style.display==='block';
  el.style.display = isOpen ? 'none' : 'block';
  var arrow = btn.querySelector('.arrow');
  if(arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}
function toggleMore(){
  var m = document.getElementById('moreMenu');
  var btn = document.getElementById('seeMoreBtn');
  var isOpen = m.style.display==='block';
  m.style.display = isOpen ? 'none' : 'block';
  btn.textContent = isOpen ? 'See more' : 'See less';
}
function doLogout(){
  if(!confirm('Are you sure you want to log out?')) return;
  saveLiveTime();
  localStorage.removeItem('autro_logged_in');
  localStorage.removeItem('autro_user_email');
  localStorage.removeItem('autro_user_name');
  showToast('Logged out. See you soon!');
  setTimeout(function(){ location.href='welcome.html'; }, 800);
}
function showToast(t){
  var el=document.getElementById('toast'); if(!el) return;
  el.textContent=t; el.classList.add('show');
  setTimeout(function(){ el.classList.remove('show'); }, 2500);
}

startLiveTracking();
renderShortcuts();
