// ===== AUTROBOOK SHORTCUT.JS - AUTO SORT BY TIME SPENT =====
var myName = localStorage.getItem('autro_user_name') || 'Abir Mazumder';
if(document.getElementById('drawerName')) document.getElementById('drawerName').textContent = myName;

// THEME - SYSTEM DEFAULT
function applyTheme(){
  var saved = localStorage.getItem('autro_theme');
  document.body.classList.remove('theme-dark','theme-light');
  if(saved==='dark') document.body.classList.add('theme-dark');
  if(saved==='light') document.body.classList.add('theme-light');
}
function toggleTheme(){
  var cur = localStorage.getItem('autro_theme') || 'system';
  var next = cur==='system' ? 'dark' : (cur==='dark' ? 'light' : 'system');
  localStorage.setItem('autro_theme', next);
  applyTheme(); showToast('Theme: ' + next + (next==='system' ? ' (Phone Default)' : ''));
}
applyTheme();

// GROUPS - NEW NAMES + NEW IMAGES (NOT META GROUP)
var groups = [
  { id:'tongi', name:'Tongi Riders', img:'https://picsum.photos/200/200?11', link:'groups.html#tongi', desc:'Bike & Travel' },
  { id:'foodies', name:'Dhaka Foodies', img:'https://picsum.photos/200/200?22', link:'groups.html#foodies', desc:'Food Lovers' },
  { id:'hsc', name:'HSC Batch 2026', img:'https://picsum.photos/200/200?33', link:'groups.html#hsc', desc:'Study Group' },
  { id:'gamers', name:'Autro Gamers', img:'https://picsum.photos/200/200?44', link:'groups.html#gamers', desc:'Gaming Zone' },
  { id:'blood', name:'Blood Donors BD', img:'https://picsum.photos/200/200?55', link:'blood.html', desc:'Save Life' },
  { id:'jobs', name:'Jobs in Dhaka', img:'https://picsum.photos/200/200?66', link:'groups.html#jobs', desc:'Career' }
];

// TIME TRACKING - localStorage: autro_time_spent = { tongi: 120, foodies: 45 ... }
function getTimes(){
  try{ return JSON.parse(localStorage.getItem('autro_time_spent')||'{}'); }catch(e){ return {}; }
}
function saveTimes(t){ localStorage.setItem('autro_time_spent', JSON.stringify(t)); }

// Call this when user opens a group/page - auto tracks
function trackTime(groupId, seconds){
  var t = getTimes();
  t[groupId] = (t[groupId]||0) + (seconds||10);
  saveTimes(t);
  renderShortcuts();
  renderDebug();
}

// For demo: simulate spending time
function spendTime(id){
  trackTime(id, 30);
  var g = groups.find(x=>x.id===id);
  showToast('Spent 30s on ' + (g?g.name:id) + ' • Shortcuts updated!');
}
function resetTimes(){
  localStorage.removeItem('autro_time_spent');
  renderShortcuts(); renderDebug();
  showToast('Times reset. Default order restored.');
}

// RENDER - SORTED BY MOST TIME
function renderShortcuts(){
  var box = document.getElementById('shortcutsRow'); if(!box) return;
  var times = getTimes();
  var sorted = [...groups].sort(function(a,b){
    return (times[b.id]||0) - (times[a.id]||0);
  });
  box.innerHTML = sorted.map(function(g,i){
    var sec = times[g.id]||0;
    var label = sec>0 ? Math.floor(sec/60)+'m '+ (sec%60)+'s' : 'Not visited yet';
    return '<div class="shortcut-item" onclick="trackTime(\''+g.id+'\',10);location.href=\''+g.link+'\'">'
      + '<div class="shortcut-wrap"><span class="rank">#'+(i+1)+'</span><img src="'+g.img+'"></div>'
      + '<b>'+g.name+'</b><div class="time">'+label+'</div></div>';
  }).join('');
}
function renderDebug(){
  var el = document.getElementById('timeDebug'); if(!el) return;
  var times = getTimes();
  if(!Object.keys(times).length){ el.innerHTML='No time tracked yet. Click a button above.'; return; }
  el.innerHTML = groups.map(function(g){
    var s = times[g.id]||0;
    return '<b>'+g.name+':</b> '+s+'s &nbsp;';
  }).join('<br>');
}

// DRAWER
function toggleDrawer(){
  var d = document.getElementById('drawer');
  var b = document.getElementById('backdrop');
  var isOpen = d.classList.contains('open');
  if(isOpen) closeDrawer(); else { d.classList.add('open'); b.classList.add('show'); }
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('backdrop').classList.remove('show');
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

// LOG OUT - SAME AS SCREENSHOT
function doLogout(){
  if(!confirm('Are you sure you want to log out?')) return;
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

// INIT - Auto open drawer on first load like FB screenshot (optional, remove if not needed)
renderShortcuts(); renderDebug();
