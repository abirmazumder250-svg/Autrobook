// ===== AUTROBOOK INDEX.JS - 10 PROFILES + REELS + PEOPLE YOU MAY KNOW =====
var myName = localStorage.getItem('autro_user_name') || 'Abir Mazumder';

function showToast(m){ var t=document.getElementById('toast'); if(!t) return; t.textContent=m; t.classList.add('show'); setTimeout(function(){t.classList.remove('show')},3000); }
function scrollTopPage(){ window.scrollTo({top:0,behavior:'smooth'}); }
function openModal(id){ var el=document.getElementById(id); if(el) el.classList.add('active'); }
function closeModal(id){ var el=document.getElementById(id); if(el) el.classList.remove('active'); }
document.addEventListener('click',function(e){ if(e.target.classList && e.target.classList.contains('modal-back')) e.target.classList.remove('active'); });
function openShield(){ showToast('🛡️ My Shield: Protected'); }
function sosAlert(){ if(confirm('Send Emergency SOS?')) showToast('🆘 SOS Sent!'); }
function viewStory(n){ showToast('Viewing '+n+' story'); }
function handleSearch(e){ if(e.key!=='Enter') return; showToast('Searching: '+e.target.value); }

// THEME - SYSTEM DEFAULT
function applyTheme(){ var s=localStorage.getItem('autro_theme'); document.body.classList.remove('theme-dark','theme-light'); if(s==='dark') document.body.classList.add('theme-dark'); if(s==='light') document.body.classList.add('theme-light'); }
function toggleTheme(){ var cur=localStorage.getItem('autro_theme')||'system'; var next=cur==='system'?'dark':(cur==='dark'?'light':'system'); localStorage.setItem('autro_theme',next); applyTheme(); showToast('Theme: '+next); }
applyTheme();

// ===== 10 PROFILES =====
var feedData = [
  { id:1, name:'Rahim Khan', img:'https://i.pravatar.cc/100?img=11', time:'2 hours ago', type:'posts', postType:'text', text:'Turned on Zen Mode today and scrolled for 2 hours. No ads, no noise. Just calm. Autrobook is different. 🔥', likes:128, comments:24, shares:5 },
  { id:2, name:'Sumi Akter', img:'https://i.pravatar.cc/100?img=47', time:'3 hours ago', type:'posts', postType:'photo', text:'Morning walk at Hatirjheel. Fresh air, peaceful mind. Who wants to join tomorrow? 🌿', image:'https://picsum.photos/600/350?1', likes:245, comments:41, shares:12 },
  { id:3, name:'Karim Uddin', img:'https://i.pravatar.cc/100?img=13', time:'4 hours ago', type:'posts', postType:'long-video', text:'Full vlog: Dhaka to Cox\'s Bazar bike trip - 12 min full story. Watch till end! 🏍️', video:'https://cdn.coverr.co/videos/coverr-city-traffic-at-night-1585/1080p.mp4', duration:'12:34', likes:512, comments:89, shares:34 },
  { id:4, name:'Nusrat Jahan', img:'https://i.pravatar.cc/100?img=44', time:'5 hours ago', type:'posts', postType:'voice', text:'Voice Post: My thoughts on mindful social media. Listen with headphones 🎧', voiceDuration:'0:58', likes:98, comments:18, shares:3 },
  { id:5, name:'Tanvir Ahmed', img:'https://i.pravatar.cc/100?img=14', time:'6 hours ago', type:'posts', postType:'reel', text:'Quick Reel: 30 sec coding tip that will save you 2 hours daily! 💻', image:'https://picsum.photos/600/800?2', likes:890, comments:112, shares:67 },
  { id:6, name:'Sakib Hasan', img:'https://i.pravatar.cc/100?img=15', time:'7 hours ago', type:'blood', postType:'text', tag:'BLOOD NEEDED', tagClass:'blood', text:'Blood Needed: O+ 2 bags at Dhaka Medical. Please share. 🩸', likes:432, comments:78, shares:145 },
  { id:7, name:'Riya Chowdhury', img:'https://i.pravatar.cc/100?img=32', time:'8 hours ago', type:'posts', postType:'long-video', text:'My study routine for HSC 2026 - Full 18 min guide. How I study without phone addiction. 📚', video:'https://cdn.coverr.co/videos/coverr-designing-a-website-1588/1080p.mp4', duration:'18:22', likes:678, comments:134, shares:89 },
  { id:8, name:'Arif Rahman', img:'https://i.pravatar.cc/100?img=16', time:'9 hours ago', type:'posts', postType:'voice', text:'Voice Post: How I started my small business from Tongi with 5000 taka. 🎙️', voiceDuration:'2:14', likes:156, comments:29, shares:8 },
  { id:9, name:'Faria Karim', img:'https://i.pravatar.cc/100?img=48', time:'10 hours ago', type:'posts', postType:'photo', text:'New art! Digital painting of Dhaka in rain. Took me 6 hours. Rate it 1-10 🎨', image:'https://picsum.photos/600/350?4', likes:567, comments:98, shares:43 },
  { id:10, name:'Mim Islam', img:'https://i.pravatar.cc/100?img=45', time:'12 hours ago', type:'posts', postType:'photo', text:'Homemade biryani recipe! Comment if you want full recipe. 🍛', image:'https://picsum.photos/600/350?5', likes:321, comments:56, shares:21 }
];

// ===== REELS - পাশাপাশি ঘর =====
var feedReels = [
  { name:'Karim Uddin', img:'https://picsum.photos/300/500?10', views:'12.4k', duration:'0:32' },
  { name:'Sumi Akter', img:'https://picsum.photos/300/500?11', views:'8.9k', duration:'0:45' },
  { name:'Tanvir Ahmed', img:'https://picsum.photos/300/500?12', views:'24k', duration:'0:28' },
  { name:'Faria Karim', img:'https://picsum.photos/300/500?13', views:'5.2k', duration:'0:51' },
  { name:'Rahim Khan', img:'https://picsum.photos/300/500?14', views:'9.1k', duration:'0:39' }
];

// ===== PEOPLE YOU MAY KNOW - অন্য নাম, অন্য ছবি =====
var peopleMayKnow = [
  { name:'Saruar Hossain', img:'https://picsum.photos/300/400?21', mutual:'2 mutual friends', mutualImg:'https://i.pravatar.cc/30?img=11' },
  { name:'Arnab Mallick', img:'https://picsum.photos/300/400?22', mutual:'1 mutual friend', mutualImg:'https://i.pravatar.cc/30?img=13' },
  { name:'Priya Das', img:'https://picsum.photos/300/400?23', mutual:'3 mutual friends', mutualImg:'https://i.pravatar.cc/30?img=47' },
  { name:'Jahid Hasan', img:'https://picsum.photos/300/400?24', mutual:'4 mutual friends', mutualImg:'https://i.pravatar.cc/30?img=15' },
  { name:'Nadia Akter', img:'https://picsum.photos/300/400?25', mutual:'2 mutual friends', mutualImg:'https://i.pravatar.cc/30?img=32' }
];

var currentFilter='all';
var userPosts = JSON.parse(localStorage.getItem('autro_posts')||'[]');

function postCardHTML(p){
  var media='';
  if(p.image && p.postType!=='reel') media='<img class="post-img" src="'+p.image+'">';
  if(p.postType==='reel' && p.image) media='<div class="reel-post-wrap"><img class="post-img" src="'+p.image+'" style="max-height:500px"><span class="reel-badge">▶ Reel</span></div>';
  if(p.video) media='<div class="video-wrap"><video controls preload="metadata" poster="https://picsum.photos/600/350?9"><source src="'+p.video+'" type="video/mp4"></video><span class="video-duration">'+p.duration+'</span></div>';
  if(p.postType==='voice') media='<div class="voice-post"><button onclick="playVoice(this)">▶</button><div><b>Voice Post • '+p.voiceDuration+'</b><div class="voice-wave"></div><small>Tap play to listen</small></div></div>';
  var tagHtml = p.tag ? '<div class="post-tag '+(p.tagClass||'')+'">'+p.tag+'</div>' : '';
  var typeLabel = p.postType==='voice'?' 🎙️ Voice':p.postType==='reel'?' 🎬 Reel':p.postType==='long-video'?' 🎥 Long Video':p.postType==='photo'?' 📷 Photo':' 📝 Text';
  return '<div class="post-card">'
    + '<div class="post-header"><img src="'+p.img+'" class="post-avatar"><div><b>'+p.name+'</b><br><small>'+p.time+' • 🌍 • '+typeLabel+'</small></div><span class="more" onclick="openReport('+p.id+')">•••</span></div>'
    + tagHtml + '<p class="post-text">'+p.text+'</p>' + media
    + '<div class="post-stats"><span id="like-'+p.id+'">👍❤️ '+p.likes+' Likes</span><span>'+p.comments+' Comments • '+p.shares+' Shares</span></div>'
    + '<div class="post-actions"><button onclick="toggleLike(this,\'like-'+p.id+'\','+p.likes+')">👍 Like</button><button onclick="focusComment(this)">💬 Comment</button><button onclick="sharePost(this)">↗️ Share</button><button onclick="suggestAI()">🤖 AI Reply</button><button onclick="savePost(this)">🔖 Save</button></div>'
    + '<div class="comments" id="comments-'+p.id+'"></div>'
    + '<div class="comment-box"><div class="avatar sm"><i class="fas fa-user"></i></div><input placeholder="Write a comment..." onkeydown="if(event.key===\'Enter\')addComment(this,\'comments-'+p.id+'\')"><button class="voice-btn" onclick="recordVoice()">🎤</button></div></div>';
}

// REELS ROW - FACEBOOK STYLE, পাশাপাশি
function reelsRowHTML(){
  return '<div class="feed-section">'
    + '<div class="section-head"><b>🎬 Reels</b><span><span class="dot3">•••</span> <span onclick="closeSection(this)" style="cursor:pointer">✕</span></span></div>'
    + '<div class="reels-scroll">' + feedReels.map(function(r){
      return '<div class="feed-reel-card" onclick="location.href=\'reels.html\'"><img src="'+r.img+'"><div class="reel-play">▶</div><div class="reel-bottom"><b>'+r.name+'</b><small>👁 '+r.views+' • '+r.duration+'</small></div></div>';
    }).join('') + '</div></div>';
}

// PEOPLE YOU MAY KNOW - FACEBOOK STYLE, পাশাপাশি
function peopleRowHTML(){
  return '<div class="feed-section">'
    + '<div class="section-head"><b>👥 People you may know</b><span><span class="dot3">•••</span> <span onclick="closeSection(this)" style="cursor:pointer">✕</span></span></div>'
    + '<div class="people-scroll">' + peopleMayKnow.map(function(u,i){
      return '<div class="people-card" id="people-'+i+'"><img src="'+u.img+'"><div class="people-info"><b>'+u.name+'</b><div class="mutual"><img src="'+u.mutualImg+'"><small>'+u.mutual+'</small></div><button class="btn-add" onclick="addFriendBtn(this)">👤+ Add friend</button><button class="btn-remove" onclick="removePeopleCard(\'people-'+i+'\')">Remove</button></div></div>';
    }).join('') + '</div><div class="see-all" onclick="location.href=\'friends.html\'">See all ></div></div>';
}

function closeSection(el){ el.closest('.feed-section').style.display='none'; }
function removePeopleCard(id){ document.getElementById(id).style.display='none'; showToast('Suggestion removed'); }
function addFriendBtn(btn){
  if(btn.textContent.includes('Request')){ btn.textContent='👤+ Add friend'; btn.classList.remove('sent'); showToast('Request cancelled'); return; }
  btn.textContent='✓ Request Sent'; btn.classList.add('sent'); showToast('Friend request sent!');
}

function renderFeed(){
  var container=document.getElementById('feedContainer'); if(!container) return;
  var all=[];
  userPosts.forEach(function(p){ all.push({id:99, name:myName, img:'https://i.pravatar.cc/100?img=12', time:'Just now', type:'posts', postType:'text', text:p.text, likes:0, comments:0, shares:0}); });
  feedData.forEach(function(p){ all.push(p); });
  var filtered = all.filter(function(p){ if(currentFilter==='all') return true; return p.type===currentFilter; });
  if(!filtered.length){ container.innerHTML='<div class="post-card" style="text-align:center;color:var(--muted)">No posts yet.</div>'; return; }
  var html='';
  filtered.forEach(function(p, idx){
    html += postCardHTML(p);
    if(currentFilter==='all'){
      if(idx===1) html += reelsRowHTML();      // 2 Post পর Reels
      if(idx===3) html += peopleRowHTML();     // 4 Post পর People You May Know
      if(idx===6) html += reelsRowHTML();      // 7 Post পর আবার Reels
    }
  });
  container.innerHTML = html;
}
function filterFeed(type, btn){ currentFilter=type; document.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); }); if(btn) btn.classList.add('active'); renderFeed(); }
function toggleLike(btn,countId,base){ var liked=btn.classList.toggle('liked'); btn.innerHTML=liked?'❤️ Liked':'👍 Like'; var el=document.getElementById(countId); if(el) el.textContent='👍❤️ '+(liked?base+1:base)+' Likes'; }
function focusComment(btn){ var c=btn.closest('.post-card'); var inp=c.querySelector('.comment-box input'); if(inp) inp.focus(); }
function addComment(input,listId){ var txt=input.value.trim(); if(!txt) return; var list=document.getElementById(listId); var d=document.createElement('div'); d.className='comment-item'; d.innerHTML='<div class="avatar sm"><i class="fas fa-user"></i></div><div><b>'+myName+'</b><br>'+txt+'</div>'; list.appendChild(d); input.value=''; showToast('Comment posted'); }
function sharePost(btn){ if(navigator.clipboard) navigator.clipboard.writeText(location.href); showToast('Link copied!'); }
function savePost(btn){ btn.classList.toggle('liked'); showToast(btn.classList.contains('liked')?'Saved!':'Removed'); }
function suggestAI(){ var r=['Great post! 🔥','Totally agree 👌','Zen Mode is best','I will try this too']; showToast('AI: '+r[Math.floor(Math.random()*r.length)]); }
function playVoice(btn){ var playing=btn.textContent==='⏸'; btn.textContent=playing?'▶':'⏸'; showToast(playing?'Voice paused':'Playing voice...'); }
async function recordVoice(){ try{ await navigator.mediaDevices.getUserMedia({audio:true}); showToast('Recording...'); }catch(e){ showToast('Voice: Normal | Eco | Deep'); } }
function publishPost(){ var txt=document.getElementById('postText').value.trim(); if(!txt){ showToast('Write something!'); return; } userPosts.unshift({text:txt}); localStorage.setItem('autro_posts',JSON.stringify(userPosts)); document.getElementById('postText').value=''; closeModal('mComposer'); renderFeed(); showToast('Post Published!'); }
var reportingId=null;
function openReport(id){ reportingId=id; openModal('mReport'); }
function submitReport(){ closeModal('mReport'); showToast('Report sent. Review in 24-48 hrs.'); }
renderFeed();
