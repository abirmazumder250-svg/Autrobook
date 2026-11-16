function toast(m){var t=document.getElementById('toast');t.innerText=m;t.style.display='block';setTimeout(function(){t.style.display='none'},2500);}
function openModal(id){document.getElementById(id).style.display='flex'; if(id==='blockedModal') renderBlocked(); loadModalValues();}
function closeModal(id){document.getElementById(id).style.display='none';}
function closeModalOutside(e, id){if(e.target.id===id) closeModal(id);}

function getUser(){try{return JSON.parse(localStorage.getItem('autrobook_user'))||{};}catch(e){return {};}}
function getSettings(){try{return JSON.parse(localStorage.getItem('ab_settings')||'{}');}catch(e){return {};}}
function saveSettings(s){localStorage.setItem('ab_settings',JSON.stringify(s));}
function saveUser(u){localStorage.setItem('autrobook_user',JSON.stringify(u));}

function logout(){ 
  if(confirm('Are you sure you want to log out of Autrobook?')){ 
    localStorage.removeItem('autrobook_user'); 
    toast('Logged out successfully'); 
    setTimeout(function(){window.location.href='../login.html';},600); 
  } 
}

function toggleSwitch(el,key){ 
  el.classList.toggle('on'); 
  var s=getSettings(); 
  s[key]=el.classList.contains('on'); 
  saveSettings(s); 
  toast(key+' '+(s[key]?'Enabled':'Disabled')); 
}

function loadModalValues(){
  var u=getUser(); var s=getSettings();
  document.getElementById('accName').value=u.name||''; 
  document.getElementById('accUsername').value=u.username||'@user';
  document.getElementById('accEmail').value=u.email||''; 
  document.getElementById('accPhone').value=u.phone||'';
  
  var map={tagReview:'tagReviewSwitch', adultBlock:'adultBlockSwitch', aiFeedOpt:'aiFeedSwitch', showFriends:'showFriendsSwitch', pushNoti:'pushSwitch', likeNoti:'likeNotiSwitch'};
  Object.keys(map).forEach(function(k){ 
    var el=document.getElementById(map[k]); 
    if(el){ 
      var val=s[k]; 
      if(val===undefined) val=true; // default on for safety & features
      if(val) el.classList.add('on'); else el.classList.remove('on');
    } 
  });
}

function saveAutroAccount(){
  var u=getUser(); 
  var name=document.getElementById('accName').value.trim(); 
  var username=document.getElementById('accUsername').value.trim();
  var email=document.getElementById('accEmail').value.trim(); 
  var phone=document.getElementById('accPhone').value.trim();
  if(!name) return toast('Please enter your name');
  u.name=name; u.username=username; u.email=email; u.phone=phone; saveUser(u); 
  document.getElementById('accSub').innerText=name+' • '+username; 
  toast('Autro Account updated successfully ✅'); 
  closeModal('autroAccountModal');
}

function saveTagging(){ 
  var s=getSettings(); 
  s.whoPost=document.getElementById('whoPost').value; 
  s.whoTag=document.getElementById('whoTag').value; 
  saveSettings(s); 
  toast('Tagging settings saved ✅'); 
  closeModal('profileTagModal'); 
}

function savePrivacy(){ 
  var s=getSettings(); 
  s.profileVis=document.getElementById('profileVis').value; 
  saveSettings(s); 
  toast('Privacy settings saved ✅'); 
  closeModal('privacyModal'); 
}

function saveLang(){ 
  var s=getSettings(); 
  s.language=document.getElementById('langSelect').value; 
  saveSettings(s); 
  document.getElementById('langSub').innerText=s.language; 
  toast('Language changed to '+s.language); 
  closeModal('langModal'); 
}

function blockUser(){ 
  var v=document.getElementById('blockInput').value.trim(); 
  if(!v) return toast('Enter a name to block'); 
  var list=[]; 
  try{list=JSON.parse(localStorage.getItem('ab_blocked')||'[]');}catch(e){list=[];} 
  list.unshift({id:Date.now(),name:v}); 
  localStorage.setItem('ab_blocked',JSON.stringify(list)); 
  document.getElementById('blockInput').value=''; 
  renderBlocked(); 
  toast('Blocked '+v+' successfully 🚫'); 
}

function renderBlocked(){ 
  var list=[]; 
  try{list=JSON.parse(localStorage.getItem('ab_blocked')||'[]');}catch(e){list=[];} 
  document.getElementById('blockedCount').innerText=list.length+' blocked users'; 
  document.getElementById('blockedList').innerHTML=list.length ? list.map(function(b){
    return '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg);padding:10px;border-radius:8px;margin:6px 0"><b>'+b.name+'</b><button onclick="unblock('+b.id+')" style="background:#ef4444;border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px">Unblock</button></div>';
  }).join('') : '<p style="color:var(--text2);text-align:center;padding:10px">No blocked accounts</p>'; 
}

function unblock(id){ 
  var list=JSON.parse(localStorage.getItem('ab_blocked')||'[]'); 
  list=list.filter(function(x){return x.id!==id;}); 
  localStorage.setItem('ab_blocked',JSON.stringify(list)); 
  renderBlocked(); 
  toast('Account unblocked'); 
}

function sendHelp(){ 
  var v=document.getElementById('helpText').value.trim(); 
  if(!v) return toast('Please describe your issue'); 
  toast('Report submitted successfully ✅ Thank you!'); 
  document.getElementById('helpText').value=''; 
  closeModal('helpModal'); 
}

function toggleTheme(){ 
  var isLight=document.body.classList.toggle('light'); 
  localStorage.setItem('theme',isLight?'light':'dark'); 
  document.getElementById('themeSub').innerText=isLight?'Light Mode':'Dark Green Theme'; 
  toast(isLight?'Light Mode ☀️':'Dark Green Theme 🌙'); 
}

function toggleThemeFromModal(){ 
  var isLight=document.body.classList.contains('light'); 
  if(isLight){document.body.classList.remove('light'); localStorage.setItem('theme','dark');} 
  else {document.body.classList.add('light'); localStorage.setItem('theme','light');} 
  loadModalValues(); 
}

function filterMain(q){
  var items=document.querySelectorAll('#mainList .item'); 
  items.forEach(function(it){ 
    var txt=it.innerText.toLowerCase(); 
    var show=txt.indexOf(q.toLowerCase())>-1; 
    it.style.display=show?'flex':'none'; 
  });
  document.querySelectorAll('#mainList .section').forEach(function(sec){ 
    var vis=[].slice.call(sec.querySelectorAll('.item')).some(function(i){return i.style.display!=='none';}); 
    sec.style.display=vis?'block':'none'; 
  });
}

// Live Dynamic Year Update for Autrobook Brand
document.getElementById('footerBrand').innerText = 'Autrobook ' + new Date().getFullYear();
if(localStorage.getItem('theme')=='light') document.body.classList.add('light');

var _s=getSettings(); 
document.getElementById('langSub').innerText=_s.language||'English'; 
document.getElementById('themeSub').innerText=localStorage.getItem('theme')=='light'?'Light Mode':'Dark Green Theme'; 
document.getElementById('accSub').innerText=(getUser().name||'User')+' • '+(getUser().username||'@autrobook');
renderBlocked();
