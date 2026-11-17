// ===== AUTROBOOK - INDEX.JS - FULL =====
var myName = localStorage.getItem('autro_user_name') || 'Abir Mazumder';
var currentFilter = 'all';
var currentCreateType = 'post';

// THEME
function applyTheme(){
  var s = localStorage.getItem('autro_theme');
  document.body.classList.remove('theme-dark','theme-light');
  if(s==='dark'){ document.body.classList.add('theme-dark'); var ic=document.getElementById('themeIcon'); if(ic) ic.className='fas fa-sun'; }
  if(s==='light'){ document.body.classList.add('theme-light'); var ic2=document.getElementById('themeIcon'); if(ic2) ic2.className='fas fa-moon'; }
}
function toggleTheme(){
  var cur = localStorage.getItem('autro_theme') || 'system';
  var next = cur==='system' ? 'dark' : (cur==='dark' ? 'light' : 'system');
  localStorage.setItem('autro_theme', next);
  applyTheme();
  showToast('Theme: ' + next);
}
applyTheme();
function scrollTopPage(){ window.scrollTo({top:0,behavior:'smooth'}); }
function showToast(t){ var el=document.getElementById('toast'); if(!el) return; el.textContent=t; el.classList.add('show'); setTimeout(function(){ el.classList.remove('show'); }, 2500); }
function openModal(id){ var el=document.getElementById(id); if(el) el.classList.add('show'); }
function closeModal(id){ var el=document.getElementById(id); if(el) el.classList.remove('show'); }
document.querySelectorAll('.modal-back').forEach(function(m){ m.addEventListener('click', function(e){ if(e.target===m) m.classList.remove('show'); }); });

// DEMO FEED
var demoPosts = [
  { name:'Karim Uddin', avatar:'https://i.pravatar.cc/60?img=13', time:'2h • Tongi', text:'Morning walk in Tongi Lake. Beautiful weather today! 🌅', img:'https://picsum.photos/600/400?10', likes:124, type:'posts' },
  { name:'Sumi Akter', avatar:'https://i.pravatar.cc/60?img=47', time:'4h • Dhaka', text:'New recipe tried today - Chicken Biryani 🍗 So tasty!', img:'https://picsum.photos/600/400?20', likes:89, type:'posts' },
  { name:'Autrobook Safety', avatar:'https://i.pravatar.cc/60?img=12', time:'1h • Alert', text:'⚠️ Missing Person: Sakib, Age 12, Last Seen: Tongi. Please share.', img:'https://picsum.photos/600/400?30', likes:540, type:'missing' },
  { name:'Blood Donors BD', avatar:'https://i.pravatar.cc/60?img=14', time:'30m • Emergency', text:'🩸 O+ Blood Needed - 2 Bags - Dhaka Medical. Please help!', img:'', likes:210, type:'blood' },
  { name:'Tanvir Ahmed', avatar:'https://i.pravatar.cc/60?img=15', time:'5h • Dhaka', text:'HSC Batch 2026 - Exam preparation going well? Let\'s study together 📚', img:'https://picsum.photos/600/400?40', likes:67, type:'posts' }
];
var userPosts = [];
try{ userPosts = JSON.parse(localStorage.getItem('autro_posts')||'[]'); }catch(e){ userPosts=[]; }
var commentsDB = {};
try{ commentsDB = JSON.parse(localStorage.getItem('autro_comments')||'{}'); }catch(e){ commentsDB={}; }
var currentCommentPost = 0;

function renderFeed(){
  var box = document.getElementById('feedContainer'); if(!box) return;
  var all = userPosts.concat(demoPosts);
  var filtered = all.filter(function(p){ if(currentFilter==='all') return true; return p.type===currentFilter; });
  if(!filtered.length){ box.innerHTML='<div class="post-card" style="text-align:center;color:var(--muted)">No posts in this filter yet.</div>'; return; }
  box.innerHTML = filtered.map(function(p,i){
    var postId = 'post_' + all.indexOf(p);
    var cCount = (commentsDB[postId]||[]).length + 3;
    return '<div class="post-card">'
      + '<div class="post-head"><img src="'+(p.avatar||'https://i.pravatar.cc/60?img=12')+'" class="post-avatar"><div><b>'+(p.name||myName)+'</b><small>'+(p.time||'Just now')+'</small></div><span class="dots" onclick="openModal(\'mReport\')">•••</span></div>'
      + '<div class="post-text">'+(p.text||'')+'</div>'
      + (p.img ? '<img src="'+p.img+'" class="post-img">' : '')
      + '<div style="color:var(--muted);font-size:13px;margin-top:8px">❤️ '+(p.likes||0)+' Likes • 💬 <span id="ccount_'+postId+'">'+cCount+'</span> Comments</div>'
      + '<div class="post-actions"><button onclick="likePost(this)"><i class="fas fa-heart"></i> <span>'+(p.likes||0)+'</span></button><button onclick="openComment(\''+postId+'\')"><i class="fas fa-comment"></i> Comment</button><button onclick="showToast(\'Post shared!\')"><i class="fas fa-share"></i> Share</button></div>'
      + '</div>';
  }).join('');
}
function likePost(btn){
  btn.classList.toggle('liked');
  var span = btn.querySelector('span');
  var n = parseInt(span.textContent)||0;
  span.textContent = btn.classList.contains('liked') ? n+1 : n-1;
}
function filterFeed(type, btn){
  currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
  if(btn) btn.classList.add('active');
  renderFeed();
}
function publishPost(){
  var txtEl = document.getElementById('postText');
  var txt = txtEl ? txtEl.value.trim() : '';
  var fileEl = document.getElementById('postFile');
  var file = fileEl && fileEl.files ? fileEl.files[0] : null;
  if(!txt && !file){ showToast('Write something or add photo'); return; }
  var btn = document.querySelector('#mComposer .btn-primary');
  if(btn){ btn.textContent = 'Publishing...'; btn.disabled = true; }
  setTimeout(function(){
    userPosts.unshift({ name:myName, avatar:'https://i.pravatar.cc/60?img=12', time:'Just now', text:txt, img: file ? URL.createObjectURL(file) : '', likes:0, type:'posts' });
    localStorage.setItem('autro_posts', JSON.stringify(userPosts));
    closeModal('mComposer');
    if(txtEl) txtEl.value='';
    if(fileEl) fileEl.value='';
    if(btn){ btn.textContent = 'Publish Post'; btn.disabled = false; }
    currentFilter='all';
    document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
    var allBtn = document.querySelector('.filter-btn'); if(allBtn) allBtn.classList.add('active');
    renderFeed();
    showToast('✅ Post Published!');
  }, 500);
}
function handleSearch(e){
  if(e.key!=='Enter') return;
  var q = e.target.value.trim();
  if(q) showToast('Searching: ' + q);
}
function viewStory(name){ showToast(name + ' Story viewed'); }
function sosAlert(){ showToast('🆘 SOS Sent! Location shared with emergency contacts.'); }
function openShield(){ showToast('🛡️ Shield: Your account is protected'); }
function submitReport(){ closeModal('mReport'); showToast('Report submitted. Thank you!'); }
var people = [
  { name:'Rafiq Hasan', img:'https://i.pravatar.cc/60?img=13' },
  { name:'Nusrat Jahan', img:'https://i.pravatar.cc/60?img=47' },
  { name:'Mehedi Hasan', img:'https://i.pravatar.cc/60?img=14' }
];
function renderPeople(){
  var box = document.getElementById('sidebarPeople'); if(!box) return;
  box.innerHTML = people.map(function(p){ return '<div class="people-row"><img src="'+p.img+'"><b>'+p.name+'</b><button onclick="showToast(\'Friend request sent to '+p.name+'\')">Add</button></div>'; }).join('');
}

// ===== CREATE MENU - POST / STORY / REEL / LIVE =====
function openCreateMenu(){ updateLiveAccess(); openModal('mCreateMenu'); }
function createType(type){
  currentCreateType = type;
  closeModal('mCreateMenu');
  if(type==='post'){ openModal('mComposer'); return; }
  if(type==='live'){
    if(!canGoLive()){ showToast('🔒 Live is locked. Your ID must be 90 days old.'); return; }
    openModal('mLive'); return;
  }
  var title = document.getElementById('storyReelTitle');
  var txt = document.getElementById('storyReelText');
  if(title) title.innerHTML = (type==='story' ? 'Create Story' : 'Create Reel') + ' <i class="fas fa-times close-x" onclick="closeModal(\'mStoryReel\')"></i>';
  if(txt) txt.placeholder = type==='story' ? 'Say something about your Story...' : 'Say something about your Reel...';
  openModal('mStoryReel');
}
function publishStoryReel(){
  var txt = document.getElementById('storyReelText').value.trim();
  var file = document.getElementById('storyReelFile').files[0];
  if(!txt && !file){ showToast('Write something or add photo/video'); return; }
  closeModal('mStoryReel');
  document.getElementById('storyReelText').value='';
  document.getElementById('storyReelFile').value='';
  var label = currentCreateType==='story' ? 'Story' : 'Reel';
  userPosts.unshift({ name:myName, time:'Just now', text:'['+label+'] ' + (txt || 'New '+label+' posted'), img: file ? URL.createObjectURL(file) : '', likes:0, type:'posts' });
  localStorage.setItem('autro_posts', JSON.stringify(userPosts));
  renderFeed();
  showToast(label + ' Published!');
}

// ===== LIVE - 90 DAYS RULE, OWNER BYPASS =====
function getAccountAgeDays(){
  var created = localStorage.getItem('autro_account_created');
  if(!created){ created = new Date().toISOString(); localStorage.setItem('autro_account_created', created); }
  var diff = Date.now() - new Date(created).getTime();
  return Math.floor(diff / (1000*60*60*24));
}
function isOwner(){
  var name = (localStorage.getItem('autro_user_name') || 'Abir Mazumder').toLowerCase();
  var email = (localStorage.getItem('autro_user_email') || '').toLowerCase();
  if(name.indexOf('abir') > -1) return true;
  if(email.indexOf('abir') > -1) return true;
  if(localStorage.getItem('autro_is_owner')==='yes') return true;
  return false;
}
function canGoLive(){ if(isOwner()) return true; return getAccountAgeDays() >= 90; }
function updateLiveAccess(){
  var sub = document.getElementById('liveSub');
  var note = document.getElementById('liveNote');
  var badge = document.getElementById('liveBadge');
  var opt = document.getElementById('liveOption');
  if(!sub) return;
  if(isOwner()){
    sub.textContent = 'Go Live Now • Owner Access';
    if(note) note.style.display='none';
    if(opt) opt.classList.remove('locked');
    if(badge){ badge.style.display='inline-block'; badge.textContent='LIVE'; }
    return;
  }
  var age = getAccountAgeDays();
  var left = 90 - age;
  if(left <= 0){
    sub.textContent = 'Go Live Now • Unlocked';
    if(note) note.style.display='none';
    if(opt) opt.classList.remove('locked');
    if(badge){ badge.style.display='inline-block'; badge.textContent='LIVE'; }
  } else {
    sub.textContent = 'Locked • ' + left + ' days left • Need 90 days old ID';
    if(note){ note.style.display='block'; note.textContent = '🔒 Live unlocks after your ID is 90 days old. Your ID is ' + age + ' days old. ' + left + ' days left.'; }
    if(opt) opt.classList.add('locked');
    if(badge) badge.textContent = '🔒 ' + left + 'd left';
  }
}
function startLive(){
  var title = document.getElementById('liveTitleInput').value.trim() || 'Live in Autrobook';
  closeModal('mLive');
  showToast('🔴 LIVE Started: ' + title);
  var v = 12;
  setInterval(function(){ v += Math.floor(Math.random()*5); var el=document.getElementById('liveViewers'); if(el) el.textContent=v; }, 3000);
}

// ===== COMMENTS - READ OTHERS + 6 REACTIONS + UNDO + REPLY + REPORT =====
var REACTIONS = [
  { id:'like', emoji:'👍', label:'Like' },
  { id:'love', emoji:'❤️', label:'Love' },
  { id:'haha', emoji:'😆', label:'Haha' },
  { id:'wow', emoji:'😮', label:'Wow' },
  { id:'sad', emoji:'😢', label:'Sad' },
  { id:'angry', emoji:'😠', label:'Angry' }
];
var REPORT_REASONS = [
  { id:'harassment', label:'Harassment / Bullying', desc:'Threat, insult, targeting a person' },
  { id:'hate', label:'Hate Speech / Discrimination', desc:'Attack based on religion, race, gender, origin' },
  { id:'violence', label:'Violence / Threat to Life', desc:'Threat to kill, hurt, or violent content' },
  { id:'sexual', label:'Sexual Harassment / Nudity', desc:'Unwanted sexual content, harassment' },
  { id:'child', label:'Child Safety Violation', desc:'Harmful content involving minors - Zero Tolerance' },
  { id:'misinformation', label:'False Information / Rumor', desc:'Fake news, misleading health / election info' },
  { id:'fraud', label:'Fraud / Scam / Fake Account', desc:'Fake profile, scam, money fraud' },
  { id:'spam', label:'Spam / Unwanted Promotion', desc:'Repeated spam, ads, links' },
  { id:'privacy', label:'Privacy Violation / Doxxing', desc:'Phone, address, photo without permission' },
  { id:'illegal', label:'Illegal Activity (ICT Act / Law)', desc:'Drug, weapons, illegal activity under BD Law' }
];
var selectedReportReason = null;
var currentReportComment = null;
var currentReportIndex = -1;
var demoComments = [
  { name:'Mizanur Rahman', avatar:'https://i.pravatar.cc/60?img=13', text:'প্রাণ থাকলেই প্রাণী হওয়া যায়, মন না থাকলে মানুষ হওয়া যায় না। মানুষ হওয়া বড় ব্যাপার!', time:'23h', author:true, reactions:{like:8}, replies:[{name:'Abir Mazumder', text:'একদম ঠিক বলছেন ভাই ❤️', time:'22h'}] },
  { name:'Mainuddin Lablu', avatar:'https://i.pravatar.cc/60?img=14', text:'দাঁড়িয়ে আছে ২৫ বছরের যুবক আর বসে আছে জাতির কথিত মেরুদণ্ড গুলো 👏', time:'22h', reactions:{like:12, love:2}, replies:[] },
  { name:'Sumi Akter', avatar:'https://i.pravatar.cc/60?img=47', text:'Beautiful post! Keep it up ✨', time:'20h', reactions:{love:5}, replies:[] }
];
function getAllCommentsForPost(postId){
  var mine = commentsDB[postId] || [];
  return demoComments.concat(mine.map(function(c){ return Object.assign({}, c, { isMine:true }); }));
}
function openComment(postId){
  currentCommentPost = postId;
  var all = userPosts.concat(demoPosts);
  var idx = parseInt(postId.replace('post_',''));
  var p = all[idx];
  var prev = document.getElementById('commentPostPreview');
  if(prev && p) prev.innerHTML = '<b>'+(p.name||myName)+'</b> — ' + (p.text||'').substring(0,100);
  renderComments();
  openModal('mComment');
  setTimeout(function(){ var inp=document.getElementById('commentInput'); if(inp) inp.focus(); }, 300);
}
function renderComments(){
  var box = document.getElementById('commentList'); if(!box) return;
  var list = getAllCommentsForPost(currentCommentPost);
  if(!list.length){ box.innerHTML='<div class="empty-comment">No comments yet.<br>Be the first!</div>'; return; }
  box.innerHTML = list.map(function(c,i){
    var myReact = c.myReaction || '';
    var reactCount = Object.values(c.reactions||{}).reduce(function(a,b){return a+b},0);
    var reactEmojis = Object.keys(c.reactions||{}).map(function(k){ var r=REACTIONS.find(function(x){return x.id===k}); return r?r.emoji:''; }).join('');
    var repliesHtml = (c.replies||[]).map(function(r){ return '<div class="reply-box"><b>'+r.name+'</b> • <span style="color:var(--muted);font-size:12px">'+r.time+'</span><div>'+r.text+'</div></div>'; }).join('');
    var voiceHtml = c.voiceUrl ? '<div class="voice-comment"><button onclick="playVoiceWithEffect(\''+c.voiceUrl+'\',\''+(c.voiceEffect||'normal')+'\',this)" style="border:none;background:var(--primary);color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer">▶</button><span class="voice-effect-tag">'+effectLabel(c.voiceEffect||'normal')+'</span><span>Voice</span></div>' : '';
    var imgHtml = c.img ? '<img src="'+c.img+'" style="width:120px;border-radius:12px;margin-top:4px">' : '';
    return '<div class="comment-card" id="commentCard_'+i+'">'
      + '<div class="comment-top"><img src="'+c.avatar+'"><div class="comment-body"><b>'+c.name+'</b> <span class="time">• '+c.time+'</span>'+(c.author?' <span style="color:var(--primary);font-size:12px">• by author</span>':'')+'<div class="comment-text">'+(c.text||'')+'</div>'+voiceHtml+imgHtml+'</div>'
      + '<span style="cursor:pointer;color:var(--muted)" onclick="openReportComment('+i+')">•••</span></div>'
      + '<div class="comment-actions-row">'
      + '<span onclick="toggleReactionPicker(event,'+i+',this)">'+(myReact ? REACTIONS.find(function(r){return r.id===myReact}).emoji+' '+REACTIONS.find(function(r){return r.id===myReact}).label : '👍 Like')+'</span>'
      + '<span onclick="replyComment(\''+c.name+'\')">Reply</span>'
      + '<span onclick="openReportComment('+i+')">Report</span>'
      + (reactCount>0 ? '<span class="reaction-bubble" onclick="openReactionsModal('+i+')">'+reactEmojis+' '+reactCount+'</span>' : '')
      + '</div>'
      + '<div id="replies_'+i+'">'+repliesHtml+'</div>'
      + (c.replies && c.replies.length ? '<div style="margin:6px 0 0 50px;color:var(--muted);font-size:13px;cursor:pointer" onclick="document.getElementById(\'replies_'+i+'\').style.display=document.getElementById(\'replies_'+i+'\').style.display===\'none\'?\'block\':\'none\'">▼ View '+c.replies.length+' replies</div>' : '')
      + '</div>';
  }).join('');
  box.scrollTop = box.scrollHeight;
}
function toggleReactionPicker(e, idx, el){
  e.stopPropagation();
  var old = document.querySelector('.reaction-picker'); if(old) old.remove();
  var picker = document.createElement('div');
  picker.className='reaction-picker';
  picker.innerHTML = REACTIONS.map(function(r){ return '<span onclick="reactToComment('+idx+',\''+r.id+'\')">'+r.emoji+'</span>'; }).join('');
  var rect = el.getBoundingClientRect();
  picker.style.left = rect.left+'px'; picker.style.top = (rect.top-50)+'px'; picker.style.position='fixed';
  document.body.appendChild(picker);
  setTimeout(function(){ document.addEventListener('click', function h(){ var p=document.querySelector('.reaction-picker'); if(p) p.remove(); document.removeEventListener('click',h); }); }, 100);
}
function reactToComment(idx, reactionId){
  var list = getAllCommentsForPost(currentCommentPost);
  var c = list[idx]; if(!c) return;
  if(!c.reactions) c.reactions={};
  if(c.myReaction===reactionId){
    c.reactions[reactionId] = Math.max(0,(c.reactions[reactionId]||1)-1);
    if(c.reactions[reactionId]===0) delete c.reactions[reactionId];
    c.myReaction = '';
    showToast('Reaction removed');
  } else {
    if(c.myReaction && c.reactions[c.myReaction]){ c.reactions[c.myReaction]--; if(c.reactions[c.myReaction]===0) delete c.reactions[c.myReaction]; }
    c.reactions[reactionId]=(c.reactions[reactionId]||0)+1;
    c.myReaction=reactionId;
    var r = REACTIONS.find(function(x){return x.id===reactionId});
    showToast(r.emoji+' '+r.label+' added');
  }
  if(idx >= demoComments.length){
    var mineIdx = idx - demoComments.length;
    if(commentsDB[currentCommentPost] && commentsDB[currentCommentPost][mineIdx]){
      commentsDB[currentCommentPost][mineIdx].myReaction = c.myReaction;
      commentsDB[currentCommentPost][mineIdx].reactions = c.reactions;
      localStorage.setItem('autro_comments', JSON.stringify(commentsDB));
    }
  } else {
    demoComments[idx].myReaction = c.myReaction;
    demoComments[idx].reactions = c.reactions;
  }
  var p=document.querySelector('.reaction-picker'); if(p) p.remove();
  renderComments();
}
function openCommentMenu(idx){ openReportComment(idx); }
function likeComment(el){
  if(el.textContent.indexOf('❤️')>-1){ el.textContent='👍 Like'; }
  else { el.textContent='❤️ Liked'; }
}
function replyComment(name){
  var inp = document.getElementById('commentInput');
  if(inp){ inp.value = '@' + name + ' '; inp.focus(); }
}
function sendComment(){
  var inp = document.getElementById('commentInput');
  var txt = inp.value.trim();
  if(voiceBlobUrl && voiceBlob){
    if(!commentsDB[currentCommentPost]) commentsDB[currentCommentPost] = [];
    commentsDB[currentCommentPost].push({ name:myName, avatar:'https://i.pravatar.cc/60?img=12', voiceUrl:voiceBlobUrl, voiceEffect:voiceEffect, voiceDur:recSeconds+'s', time:'Just now' });
    localStorage.setItem('autro_comments', JSON.stringify(commentsDB));
    inp.value=''; voiceBlob=null; voiceBlobUrl=null;
    document.getElementById('voicePreview').style.display='none';
    renderComments();
    var cc = document.getElementById('ccount_' + currentCommentPost);
    if(cc) cc.textContent = parseInt(cc.textContent||0)+1;
    showToast('🎙️ Voice Comment ('+effectLabel(voiceEffect)+') posted!');
    return;
  }
  if(!txt){ showToast('Write a comment or record voice'); return; }
  if(!commentsDB[currentCommentPost]) commentsDB[currentCommentPost] = [];
  commentsDB[currentCommentPost].push({ name:myName, avatar:'https://i.pravatar.cc/60?img=12', text:txt, time:'Just now' });
  localStorage.setItem('autro_comments', JSON.stringify(commentsDB));
  inp.value='';
  renderComments();
  var cc2 = document.getElementById('ccount_' + currentCommentPost);
  if(cc2) cc2.textContent = parseInt(cc2.textContent||0)+1;
  showToast('Comment posted!');
}
function sendPhotoComment(input){
  var file = input.files[0]; if(!file) return;
  var url = URL.createObjectURL(file);
  if(!commentsDB[currentCommentPost]) commentsDB[currentCommentPost]=[];
  commentsDB[currentCommentPost].push({ name:myName, avatar:'https://i.pravatar.cc/60?img=12', text:'', img:url, time:'Just now' });
  localStorage.setItem('autro_comments', JSON.stringify(commentsDB));
  renderComments();
  showToast('Photo comment posted!');
  input.value='';
}
function insertEmoji(e){
  var inp = document.getElementById('commentInput');
  if(inp) inp.value += e;
  inp.focus();
}

// ===== VOICE COMMENT - NORMAL / ECHO / DEEP =====
var voiceEffect = 'normal';
var mediaRecorder = null;
var voiceChunks = [];
var voiceBlobUrl = null;
var voiceBlob = null;
var recTimer = null;
var recSeconds = 0;
var audioCtx = null;
function selectVoiceEffect(effect, btn){
  voiceEffect = effect;
  document.querySelectorAll('.effect-btn').forEach(function(b){ b.classList.remove('active'); });
  if(btn) btn.classList.add('active');
  var label = document.getElementById('voicePreviewLabel');
  if(label && voiceBlobUrl) label.textContent = effectLabel(effect) + ' • Ready to send';
  showToast('Voice Effect: ' + effectLabel(effect));
}
function effectLabel(e){ return e==='echo' ? 'Echo' : (e==='deep' ? 'Deep' : 'Normal'); }
async function toggleVoiceRecording(){
  var bar = document.getElementById('recordingBar');
  if(mediaRecorder && mediaRecorder.state==='recording'){ stopVoiceRecording(); return; }
  try{
    var stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    mediaRecorder = new MediaRecorder(stream);
    voiceChunks = [];
    mediaRecorder.ondataavailable = function(e){ if(e.data.size>0) voiceChunks.push(e.data); };
    mediaRecorder.onstop = function(){
      stream.getTracks().forEach(function(t){ t.stop(); });
      voiceBlob = new Blob(voiceChunks, { type:'audio/webm' });
      voiceBlobUrl = URL.createObjectURL(voiceBlob);
      var prev = document.getElementById('voicePreview');
      var aud = document.getElementById('voicePreviewAudio');
      var label = document.getElementById('voicePreviewLabel');
      if(prev) prev.style.display='flex';
      if(aud) aud.src = voiceBlobUrl;
      if(label) label.textContent = effectLabel(voiceEffect) + ' • Ready to send';
      applyVoiceEffectToAudio(aud, voiceEffect);
    };
    mediaRecorder.start();
    recSeconds = 0;
    if(bar) bar.style.display='flex';
    document.getElementById('micBtn').classList.add('recording');
    recTimer = setInterval(function(){
      recSeconds++;
      var t = document.getElementById('recTime'); if(t) t.textContent = recSeconds + 's';
      if(recSeconds >= 60) stopVoiceRecording();
    }, 1000);
    showToast('🎙️ Recording... Tap Mic again to Stop');
  }catch(err){ showToast('Mic permission needed for Voice Comment'); }
}
function stopVoiceRecording(){
  if(mediaRecorder && mediaRecorder.state==='recording') mediaRecorder.stop();
  clearInterval(recTimer);
  document.getElementById('recordingBar').style.display='none';
  document.getElementById('micBtn').classList.remove('recording');
}
function cancelVoiceRecording(){
  if(mediaRecorder && mediaRecorder.state==='recording') mediaRecorder.stop();
  clearInterval(recTimer);
  voiceBlob = null; voiceBlobUrl = null;
  document.getElementById('recordingBar').style.display='none';
  document.getElementById('voicePreview').style.display='none';
  document.getElementById('micBtn').classList.remove('recording');
}
function applyVoiceEffectToAudio(audioEl, effect){
  if(effect==='normal'){ audioEl.playbackRate = 1; return; }
  if(effect==='deep'){ audioEl.playbackRate = 0.75; return; }
  if(effect==='echo'){ audioEl.playbackRate = 1; return; }
}
function playVoiceWithEffect(url, effect, btn){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(audioCtx.state==='suspended') audioCtx.resume();
  fetch(url).then(function(r){ return r.arrayBuffer(); }).then(function(buf){ return audioCtx.decodeAudioData(buf); }).then(function(decoded){
    var src = audioCtx.createBufferSource();
    src.buffer = decoded;
    var out = audioCtx.destination;
    if(effect==='deep'){
      src.playbackRate.value = 0.75;
      var filter = audioCtx.createBiquadFilter();
      filter.type='lowpass'; filter.frequency.value=800;
      src.connect(filter); filter.connect(out);
    } else if(effect==='echo'){
      var delay = audioCtx.createDelay(1.0);
      delay.delayTime.value = 0.28;
      var feedback = audioCtx.createGain(); feedback.gain.value = 0.45;
      var wet = audioCtx.createGain(); wet.gain.value = 0.6;
      src.connect(out);
      src.connect(delay); delay.connect(feedback); feedback.connect(delay);
      delay.connect(wet); wet.connect(out);
    } else { src.connect(out); }
    src.start();
    if(btn) btn.textContent = '⏸ Playing...';
    src.onended = function(){ if(btn) btn.textContent = '▶'; };
  }).catch(function(){ var a = new Audio(url); a.play(); });
}

// ===== REPORT - 10 LEGAL REASONS =====
function openReportComment(idx){
  currentReportIndex = idx;
  var list = getAllCommentsForPost(currentCommentPost);
  currentReportComment = list[idx];
  var prev = document.getElementById('reportCommentPreview');
  if(prev && currentReportComment) prev.innerHTML = '<b>'+currentReportComment.name+'</b> — ' + (currentReportComment.text||'[Voice/Photo Comment]').substring(0,120);
  var box = document.getElementById('reportReasonList');
  box.innerHTML = REPORT_REASONS.map(function(r){
    return '<div class="report-item" onclick="selectReportReason(\''+r.id+'\',this)"><input type="radio" name="repReason"><div><b>'+r.label+'</b><small>'+r.desc+'</small></div></div>';
  }).join('');
  selectedReportReason = null;
  var emailEl = document.getElementById('reportEmail');
  if(emailEl && !emailEl.value) emailEl.value = localStorage.getItem('autro_user_email')||'';
  openModal('mReportComment');
}
function selectReportReason(id, el){
  selectedReportReason = REPORT_REASONS.find(function(r){return r.id===id});
  document.querySelectorAll('.report-item').forEach(function(x){ x.classList.remove('selected'); });
  el.classList.add('selected');
  el.querySelector('input').checked = true;
}
async function submitCommentReport(){
  if(!selectedReportReason){ showToast('Please select a reason'); return; }
  var email = document.getElementById('reportEmail').value.trim();
  var details = document.getElementById('reportDetails').value.trim();
  if(!email || email.indexOf('@')===-1){ showToast('Please enter your email for update'); document.getElementById('reportEmail').focus(); return; }
  var btn = document.querySelector('#mReportComment .btn-primary');
  btn.textContent='Sending...'; btn.disabled=true;
  try{
    var res = await fetch('/api/report', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        type:'comment',
        postId: currentCommentPost,
        commentId: 'comment_' + currentReportIndex,
        commentText: currentReportComment ? (currentReportComment.text||'[Voice/Photo]') : '',
        reportedUser: currentReportComment ? currentReportComment.name : '',
        reporterName: myName,
        reporterEmail: email,
        reason: selectedReportReason.id,
        reasonLabel: selectedReportReason.label,
        details: details
      })
    });
    var data = await res.json();
    if(!res.ok) throw new Error(data.error||'Failed');
    closeModal('mReportComment');
    showToast('✅ Report Sent! ID: '+data.reportId+' • Check your email');
    setTimeout(function(){ showToast('📧 Email sent from autrobooksupport@gmail.com • Review in 24-48h'); }, 2000);
  }catch(err){
    var reports = JSON.parse(localStorage.getItem('autro_reports')||'[]');
    reports.push({ id:'AB-'+Date.now().toString().slice(-6), reason:selectedReportReason.label, email:email, details:details, time:new Date().toISOString(), comment: currentReportComment?currentReportComment.text:'' });
    localStorage.setItem('autro_reports', JSON.stringify(reports));
    closeModal('mReportComment');
    showToast('Report saved (offline). Email will be sent when online.');
  }
  btn.textContent='Submit Report'; btn.disabled=false;
}
function openReactionsModal(idx){
  var list = getAllCommentsForPost(currentCommentPost);
  var c = list[idx]; if(!c) return;
  var tabs = document.getElementById('reactionTabs');
  var total = Object.values(c.reactions||{}).reduce(function(a,b){return a+b},0);
  tabs.innerHTML = '<button class="reaction-tab active">All '+total+'</button>' + REACTIONS.map(function(r){
    var n = (c.reactions||{})[r.id]||0;
    return n>0 ? '<button class="reaction-tab">'+r.emoji+' '+n+'</button>' : '';
  }).join('');
  var peopleEl = document.getElementById('reactionPeopleList');
  var names = ['Abdullah Abir','Shiplu Nandy','Munia Islam','Mah Fuj','Sabrina Kashem','Sumon Hossain Ali'];
  var reactKeys = Object.keys(c.reactions||{});
  peopleEl.innerHTML = names.slice(0, Math.min(6, total||3)).map(function(n,i){
    var rid = reactKeys[i % reactKeys.length] || 'like';
    var r = REACTIONS.find(function(x){return x.id===rid});
    return '<div class="reaction-person"><img src="https://i.pravatar.cc/60?img='+(10+i)+'"><b>'+n+'</b><span class="react-icon">'+(r?r.emoji:'👍')+'</span></div>';
  }).join('');
  openModal('mReactions');
}

// ===== LIVE SHORTCUT TRACKING =====
(function(){
  var start = Date.now();
  function save(){
    var hash = location.hash.replace('#','');
    var id = ['tongi','foodies','hsc','gamers','jobs'].indexOf(hash) > -1 ? hash : (location.pathname.indexOf('blood')>-1 ? 'blood' : null);
    if(!id) return;
    var spent = Math.floor((Date.now()-start)/1000);
    if(spent < 2) return;
    var t = JSON.parse(localStorage.getItem('autro_time_spent')||'{}');
    t[id] = (t[id]||0) + spent;
    localStorage.setItem('autro_time_spent', JSON.stringify(t));
    start = Date.now();
  }
  setInterval(save, 5000);
  document.addEventListener('visibilitychange', function(){ if(document.hidden) save(); else start = Date.now(); });
  window.addEventListener('beforeunload', save);
})();

renderFeed();
renderPeople();
updateLiveAccess();
