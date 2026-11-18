// =================================================================
// AUTROBOOK - index.js - FULL
// System Default Theme - Dark Green Button
// Post + Story + Reel + Live (LiveKit) + Note + Shortcut
// Three Dot + Cross + Report + React + Share + Comment
// LIVEKIT_URL: wss://autrobook-aij9raun.livekit.cloud
// REPORT EMAIL: autrobooksupport@gmail.com via /api/send-report
// =================================================================
const LIVEKIT_URL = "wss://autrobook-aij9raun.livekit.cloud";

// ---------- THEME ----------
function applyTheme(){
  var saved = localStorage.getItem("autro_theme") || "system";
  document.body.classList.remove("theme-dark","theme-light");
  if(saved === "dark") document.body.classList.add("theme-dark");
  if(saved === "light") document.body.classList.add("theme-light");
}
function toggleTheme(){
  var cur = localStorage.getItem("autro_theme") || "system";
  var next = cur === "system" ? "dark" : (cur === "dark" ? "light" : "system");
  localStorage.setItem("autro_theme", next);
  applyTheme();
  displayToast("Theme: " + next);
}
applyTheme();

// ---------- STATE ----------
let currentUser = null;
let currentProfile = null;
let allPosts = [];
let homeFilter = 'all';
let voiceRecorder = null;
let voiceChunks = [];
let isVoiceRecording = false;
let voiceTimerInt = null;
let voiceSeconds = 0;
let liveCounts = { reels: 0, friends: 0, groups: 0, notifications: 0, messages: 0 };
let lastSeen = {
  reels: parseInt(localStorage.getItem('fb_seen_reels')||'0'),
  friends: parseInt(localStorage.getItem('fb_seen_friends')||'0'),
  groups: parseInt(localStorage.getItem('fb_seen_groups')||'0'),
  notifications: parseInt(localStorage.getItem('fb_seen_notifications')||'0')
};
// Story / Reel
let storyFiles = [];
let storyTextColor = '#14532d';
let storyMusicSelected = null;
let storySelectMultiple = false;
let reelFiles = [];
let reelMusicSelected = null;
let reelTemplateSelected = null;
let reelSelectMultiple = false;
let reelStream = null;
// LiveKit
let liveRoom = null;
let liveLocalTracks = [];
let isLive = false;
let liveMicOn = true;
let liveCamOn = true;
let liveRoomName = "";
let liveIsHost = false;
// Three Dot / Cross / Report / React / Share / Comment
let currentPostId = null;
let currentPostAuthorId = null;
let currentPostAuthorName = "";
let hiddenPostIds = JSON.parse(localStorage.getItem('hidden_posts')||'[]');
let interestedPostIds = JSON.parse(localStorage.getItem('interested_posts')||'[]');
let notInterestedPostIds = JSON.parse(localStorage.getItem('not_interested_posts')||'[]');
let postNotifOn = JSON.parse(localStorage.getItem('post_notif_on')||'[]');
let userReaction = JSON.parse(localStorage.getItem('post_reactions')||'{}');
let reactionCounts = JSON.parse(localStorage.getItem('reaction_counts')||'{}');
let currentSharePostId = null;
let currentCommentPostId = null;
let pendingReportReason = "";

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUser();
  await Promise.all([loadStories(), loadSuggestions(), loadPosts(), loadLiveCounts(), loadLiveNow()]);
  subscribeLiveCounts();
  setActiveNav();
  document.addEventListener("click", (e)=>{
    const d = document.getElementById("menuDropdown");
    if(d && !e.target.closest(".fb-hamburger") && !e.target.closest(".fb-dropdown")) d.style.display = 'none';
  });
  if(typeof supabase !== 'undefined'){
    supabase.channel('posts-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => loadPosts())
      .subscribe();
  }
  const path = window.location.pathname.split('/').pop();
  const back = document.getElementById("globalBackBtn");
  if(back && (path === 'index.html' || path === '' || path === '/')) back.style.display = 'none';
  else if(back) back.style.display = 'block';
});

// ---------- NAV ----------
function setActiveNav(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  let page = path.replace('.html','') || 'index';
  if(page === 'friend-request') page = 'friends';
  document.querySelectorAll(".fb-bottom-item").forEach(a => {
    if(a.getAttribute("data-page") === page) a.classList.add("active");
    else a.classList.remove("active");
  });
}
function toggleMenu(){
  const m = document.getElementById("menuDropdown");
  if(!m) return;
  m.style.display = (m.style.display === 'none' || m.style.display === '') ? 'flex' : 'none';
}
function openShortcutPage(){ window.location.href = 'shortcut.html'; }
function goBackToHome(){ window.location.href = 'index.html'; }
function openSearch(){
  const o = document.getElementById("searchOverlay");
  if(o) o.style.display = 'block';
}
function closeSearch(){
  const o = document.getElementById("searchOverlay");
  if(o) o.style.display = 'none';
}
async function logoutUser(){
  if(!confirm("Log out?")) return;
  try{ if(typeof supabase !== 'undefined') await supabase.auth.signOut(); }catch(e){}
  window.location.href = 'login.html';
}

// ---------- LIVE BADGE ----------
async function loadLiveCounts(){
  try{
    if(typeof supabase === 'undefined' || !currentUser){ updateAllBadges(); return; }
    const { count: totalReels } = await supabase.from('reels').select('*', { count: 'exact', head: true });
    liveCounts.reels = Math.max(0, (totalReels || 0) - lastSeen.reels);
    const { count: frCount } = await supabase.from('friend_requests').select('*', { count: 'exact', head: true }).eq('receiver_id', currentUser.id).eq('status', 'pending');
    liveCounts.friends = frCount || 0;
    try{
      const { count: gCount } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('status', 'pending');
      liveCounts.groups = gCount || 0;
    }catch(e){ liveCounts.groups = 0; }
    const { count: nCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id).eq('is_read', false);
    liveCounts.notifications = nCount || 0;
    try{
      const { count: mCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', currentUser.id).eq('is_read', false);
      liveCounts.messages = mCount || 0;
    }catch(e){ liveCounts.messages = 0; }
    updateAllBadges();
  }catch(e){ updateAllBadges(); }
}
function updateBadge(id, count){
  const el = document.getElementById(id);
  if(!el) return;
  if(count > 0){ el.textContent = count > 99 ? '99+' : count; el.style.display = 'flex'; }
  else { el.style.display = 'none'; }
}
function updateAllBadges(){
  updateBadge("fbReelsBadge", liveCounts.reels);
  updateBadge("fbFriendBadge", liveCounts.friends);
  updateBadge("fbGroupBadge", liveCounts.groups);
  updateBadge("fbNotifBadge", liveCounts.notifications);
  updateBadge("msgBadge", liveCounts.messages);
}
function subscribeLiveCounts(){
  try{
    if(typeof supabase === 'undefined' || !currentUser) return;
    supabase.channel('fb-live-badges')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reels' }, () => {
        liveCounts.reels++; updateBadge("fbReelsBadge", liveCounts.reels); displayToast("New Reel");
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend_requests' }, (p) => {
        if(p.new && p.new.receiver_id === currentUser.id){
          liveCounts.friends++; updateBadge("fbFriendBadge", liveCounts.friends); displayToast("New Friend Request");
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (p) => {
        if(p.new && p.new.user_id === currentUser.id){
          liveCounts.notifications++; updateBadge("fbNotifBadge", liveCounts.notifications); displayToast("New Notification");
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_streams' }, () => { loadLiveNow(); })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'live_streams' }, () => { loadLiveNow(); })
      .subscribe();
  }catch(e){}
}

// ---------- CURRENT USER ----------
async function loadCurrentUser(){
  try{
    if(typeof supabase === 'undefined') return;
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;
    currentUser = user;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    currentProfile = prof;
    const initial = (prof?.full_name || 'A').charAt(0).toUpperCase();
    const av = document.querySelector(".fb-create-avatar-text");
    if(av) av.textContent = initial;
  }catch(e){}
}

// ---------- STORIES ----------
async function loadStories(){
  const row = document.getElementById("storiesRow");
  if(!row) return;
  const addBtn = row.querySelector(".story-add");
  row.innerHTML = "";
  if(addBtn) row.appendChild(addBtn);
  try{
    if(typeof supabase === 'undefined') return;
    const { data: stories } = await supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(15);
    if(!stories || !stories.length) return;
    const userIds = [...new Set(stories.map(s => s.user_id))];
    const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
    let map = {};
    (profs||[]).forEach(p => map[p.id] = p);
    stories.forEach(s => {
      const p = map[s.user_id] || {};
      const div = document.createElement("div");
      div.className = "story-item";
      div.onclick = () => { if(s.image_url) window.open(s.image_url, '_blank'); };
      div.innerHTML = `<img src="${p.avatar_url || s.image_url || ''}" class="story-circle" onerror="this.style.display='none'">`;
      row.appendChild(div);
    });
  }catch(e){}
}
function openStoryUpload(){
  const inp = document.getElementById("storyInput");
  if(inp) inp.click();
}
async function uploadStory(event){
  const file = event.target.files[0];
  if(!file) return;
  if(!currentUser){ displayToast("Login first"); return; }
  displayToast("Uploading...");
  try{
    const fileName = `${currentUser.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('posts').upload(fileName, file);
    if(upErr){ displayToast(upErr.message); return; }
    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
    await supabase.from('stories').insert({ user_id: currentUser.id, image_url: urlData.publicUrl });
    displayToast("Story added");
    loadStories();
  }catch(e){ displayToast(e.message); }
}

// ---------- SUGGESTIONS ----------
async function loadSuggestions(){
  const row = document.getElementById("suggestionsRow");
  if(!row) return;
  try{
    if(typeof supabase === 'undefined'){ row.innerHTML = ''; return; }
    const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url, bio').order('created_at', { ascending: false }).limit(10);
    if(!profs || !profs.length){ row.innerHTML = ''; return; }
    let list = profs.filter(p => !currentUser || p.id !== currentUser.id);
    if(currentUser){
      const { data: fr } = await supabase.from('friend_requests').select('sender_id, receiver_id').or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
      let sentIds = new Set();
      (fr||[]).forEach(f => { sentIds.add(f.sender_id); sentIds.add(f.receiver_id); });
      list = list.filter(p => !sentIds.has(p.id));
    }
    if(!list.length){ row.innerHTML = ''; return; }
    row.innerHTML = list.slice(0,8).map(p => `
      <div class="suggest-card">
        <img src="${p.avatar_url || ''}" onerror="this.style.display='none'" onclick="window.location.href='profile.html?id=${p.id}'">
        <br>
        <button class="btn-green" onclick="sendFriendRequest('${p.id}', this)">+</button>
        <button class="btn-gray" onclick="window.location.href='profile.html?id=${p.id}'" style="margin-top:6px;">→</button>
      </div>
    `).join('');
  }catch(e){}
}
async function sendFriendRequest(receiverId, btn){
  if(!currentUser){ displayToast("Login first"); return; }
  if(btn) btn.disabled = true;
  try{
    const { error } = await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: receiverId, status: 'pending' });
    if(error){
      if(error.code === '23505') displayToast("Already sent");
      else displayToast(error.message);
      if(btn) btn.disabled = false;
      return;
    }
    if(btn) btn.textContent = "✓";
    displayToast("Request sent");
  }catch(e){ displayToast(e.message); if(btn) btn.disabled = false; }
}

// ---------- SEARCH ----------
async function searchPeople(query){
  const box = document.getElementById("searchResults");
  if(!box) return;
  query = (query || '').trim();
  if(!query){ box.innerHTML = ''; return; }
  try{
    const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url').ilike('full_name', `%${query}%`).limit(8);
    if(!profs || !profs.length){ box.innerHTML = `<div class="card">No results</div>`; return; }
    box.innerHTML = profs.map(p => `
      <div class="fb-search-person" onclick="window.location.href='profile.html?id=${p.id}'">
        <div class="fb-search-avatar-text">${(p.full_name||'U').charAt(0).toUpperCase()}</div>
        <b>${escapeHtml(p.full_name || '')}</b>
      </div>
    `).join('');
  }catch(e){}
}

// ---------- CREATE MENU ----------
function toggleCreateMenu(event){
  if(event) event.stopPropagation();
  const m = document.getElementById("createMenu");
  if(!m) return;
  const isOpen = m.style.display === 'block';
  m.style.display = isOpen ? 'none' : 'block';
  if(!isOpen) document.addEventListener("click", closeCreateMenuOnOutside, { once: true });
}
function closeCreateMenu(){
  const m = document.getElementById("createMenu");
  if(m) m.style.display = 'none';
}
function closeCreateMenuOnOutside(e){
  const m = document.getElementById("createMenu");
  if(m && !e.target.closest(".create-menu") && !e.target.closest(".fb-top-icon")) m.style.display = 'none';
}

// ---------- CREATE POST ----------
function openCreatePost(){ openModal('createPostModal'); }
function previewPostImage(event){
  const file = event.target.files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  const prev = document.getElementById("postPreview");
  if(prev){ prev.src = url; prev.style.display = 'block'; }
}
async function publishPost(){
  const text = document.getElementById("postText")?.value.trim() || "";
  const fileInput = document.getElementById("postImageInput");
  const file = fileInput && fileInput.files[0] ? fileInput.files[0] : null;
  if(!text && !file){ displayToast("Write something"); return; }
  if(!currentUser){ displayToast("Login first"); return; }
  const btn = document.getElementById("publishBtn");
  if(btn){ btn.disabled = true; btn.textContent = "..."; }
  try{
    let imageUrl = null;
    if(file){
      const fileName = `${currentUser.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('posts').upload(fileName, file);
      if(upErr) throw new Error(upErr.message);
      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from('posts').insert({ user_id: currentUser.id, content: text, image_url: imageUrl, likes_count: 0, comments_count: 0 });
    if(error) throw new Error(error.message);
    displayToast("Posted");
    closeModal('createPostModal');
    document.getElementById("postText").value = "";
    document.getElementById("postPreview").style.display = 'none';
    if(fileInput) fileInput.value = "";
    await loadPosts();
  }catch(e){ displayToast(e.message); }
  finally { if(btn){ btn.disabled = false; btn.textContent = "Post"; } }
}

// ---------- VOICE POST ----------
async function startVoicePostRecording(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    voiceRecorder = new MediaRecorder(stream);
    voiceChunks = [];
    voiceRecorder.ondataavailable = e => { if(e.data.size > 0) voiceChunks.push(e.data); };
    voiceRecorder.onstop = async () => await uploadVoicePost();
    voiceRecorder.start();
    isVoiceRecording = true;
    voiceSeconds = 0;
    clearInterval(voiceTimerInt);
    voiceTimerInt = setInterval(()=>{
      voiceSeconds++;
      const m = String(Math.floor(voiceSeconds/60)).padStart(2,'0');
      const s = String(voiceSeconds%60).padStart(2,'0');
      const el = document.getElementById("voicePostTimer");
      if(el) el.textContent = `${m}:${s}`;
    },1000);
    document.getElementById("voicePostBox").style.display = 'block';
  }catch(e){ displayToast("Mic needed"); }
}
function stopVoicePostRecording(){
  if(voiceRecorder && isVoiceRecording){
    voiceRecorder.stop();
    isVoiceRecording = false;
    clearInterval(voiceTimerInt);
    if(voiceRecorder.stream) voiceRecorder.stream.getTracks().forEach(t => t.stop());
  }
}
async function uploadVoicePost(){
  if(!currentUser || !voiceChunks.length) return;
  const blob = new Blob(voiceChunks, { type: 'audio/webm' });
  const fileName = `${currentUser.id}/${Date.now()}.webm`;
  const { error: upErr } = await supabase.storage.from('voice').upload(fileName, blob);
  if(upErr){ displayToast(upErr.message); return; }
  const { data: urlData } = supabase.storage.from('voice').getPublicUrl(fileName);
  const { data: post, error } = await supabase.from('posts').insert({ user_id: currentUser.id, content: "🎤", image_url: null, likes_count: 0, comments_count: 0 }).select().single();
  if(error){ displayToast(error.message); return; }
  await supabase.from('voice_comments').insert({ post_id: post.id, user_id: currentUser.id, audio_url: urlData.publicUrl, duration: voiceSeconds });
  displayToast("Voice posted");
  closeModal('createPostModal');
  loadPosts();
}

// ---------- STORY ----------
function openCreateStory(){ closeCreateMenu(); openModal('createStoryModal'); }
function openStorySettings(){ displayToast("Story Settings"); }
function openStoryText(event){
  const box = document.getElementById("storyTextBox");
  if(!box) return;
  const isOpen = box.style.display === 'block';
  box.style.display = isOpen ? 'none' : 'block';
  document.getElementById("storyMusicBox").style.display = 'none';
  document.querySelectorAll(".story-tool").forEach(b => b.classList.remove("active"));
  if(!isOpen && event) event.currentTarget.classList.add("active");
}
function setStoryTextColor(color){
  storyTextColor = color;
  const input = document.getElementById("storyTextInput");
  if(input) input.style.color = color;
}
function openStoryMusic(){
  const box = document.getElementById("storyMusicBox");
  if(!box) return;
  const isOpen = box.style.display === 'block';
  box.style.display = isOpen ? 'none' : 'block';
  document.getElementById("storyTextBox").style.display = 'none';
  if(!isOpen) loadStoryMusicList('');
}
function searchStoryMusic(q){ loadStoryMusicList(q); }
function loadStoryMusicList(q){
  const musics = [
    { title: "TRASHXRL - Deus do...", artist: "TRASHXRL" },
    { title: "Calm Piano", artist: "Relax" },
    { title: "Bangla Pop", artist: "Various" },
    { title: "Lo-Fi Beat", artist: "Chill" },
    { title: "Islamic Nasheed", artist: "Nasheed" }
  ];
  const list = document.getElementById("storyMusicList");
  if(!list) return;
  const filtered = musics.filter(m => m.title.toLowerCase().includes((q||'').toLowerCase()));
  list.innerHTML = filtered.map(m => `<div class="music-item" onclick="selectStoryMusic('${m.title}')"><span><b>${m.title}</b><br><small>${m.artist}</small></span><span>▶</span></div>`).join('') || '<p>No music</p>';
}
function selectStoryMusic(title){
  storyMusicSelected = title;
  displayToast("Music: " + title);
  document.getElementById("storyMusicBox").style.display = 'none';
}
function openStoryCollage(){
  displayToast("Collage: Select multiple");
  if(!storySelectMultiple) toggleSelectMultiple();
  document.getElementById('storyGalleryInput').click();
}
function toggleGallerySource(){
  const l = document.getElementById("gallerySourceList");
  if(l) l.style.display = l.style.display === 'none' ? 'flex' : 'none';
}
function setGallerySource(src){
  displayToast("Source: " + src);
  document.getElementById("gallerySourceList").style.display = 'none';
  if(src === 'Camera') document.getElementById('storyGalleryInput').click();
}
function toggleSelectMultiple(){
  storySelectMultiple = !storySelectMultiple;
  const btn = document.getElementById("storyMultiBtn");
  if(btn) btn.classList.toggle("active", storySelectMultiple);
  const inp = document.getElementById("storyGalleryInput");
  if(inp) inp.multiple = storySelectMultiple;
  displayToast(storySelectMultiple ? "Select multiple ON" : "Select multiple OFF");
}
function previewStoryGallery(event){
  storyFiles = Array.from(event.target.files);
  const preview = document.getElementById("storyGalleryPreview");
  if(!preview) return;
  preview.innerHTML = '';
  storyFiles.forEach(f => {
    const url = URL.createObjectURL(f);
    const el = f.type.startsWith('video') ? document.createElement('video') : document.createElement('img');
    el.src = url;
    if(el.tagName === 'VIDEO') el.controls = true;
    preview.appendChild(el);
  });
}
async function publishStory(){
  const text = document.getElementById("storyTextInput")?.value.trim() || "";
  if(!currentUser){ displayToast("Login first"); return; }
  if(!storyFiles.length && !text){ displayToast("Select photo or write text"); return; }
  try{
    if(storyFiles.length){
      for(let file of storyFiles){
        const fileName = `${currentUser.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from('posts').upload(fileName, file);
        if(upErr) throw new Error(upErr.message);
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
        await supabase.from('stories').insert({ user_id: currentUser.id, image_url: urlData.publicUrl, content: text, music: storyMusicSelected, text_color: storyTextColor });
      }
    } else {
      await supabase.from('stories').insert({ user_id: currentUser.id, image_url: null, content: text, music: storyMusicSelected, text_color: storyTextColor });
    }
    displayToast("Story shared");
    closeModal('createStoryModal');
    storyFiles = [];
    document.getElementById("storyGalleryPreview").innerHTML = '';
    document.getElementById("storyTextInput").value = '';
    loadStories();
  }catch(e){ displayToast(e.message); }
}

// ---------- REEL ----------
function openCreateReel(){ closeCreateMenu(); openModal('createReelModal'); }
function openReelSettings(){ displayToast("Reel Settings"); }
async function openReelCamera(){
  const box = document.getElementById("reelCameraBox");
  if(!box) return;
  const isOpen = box.style.display === 'block';
  if(isOpen){ stopReelCamera(); box.style.display = 'none'; return; }
  box.style.display = 'block';
  try{
    reelStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const video = document.getElementById("reelCameraVideo");
    if(video) video.srcObject = reelStream;
  }catch(e){ displayToast("Camera permission needed"); }
}
function stopReelCamera(){
  if(reelStream){ reelStream.getTracks().forEach(t => t.stop()); reelStream = null; }
  const video = document.getElementById("reelCameraVideo");
  if(video) video.srcObject = null;
  const box = document.getElementById("reelCameraBox");
  if(box) box.style.display = 'none';
}
function captureReelPhoto(){
  const video = document.getElementById("reelCameraVideo");
  if(!video) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  canvas.toBlob(blob => {
    const file = new File([blob], `reel-${Date.now()}.png`, { type: 'image/png' });
    reelFiles = [file];
    const preview = document.getElementById("reelGalleryPreview");
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
    displayToast("Captured");
  }, 'image/png');
}
function openReelMusic(){
  const box = document.getElementById("reelMusicBox");
  if(!box) return;
  const isOpen = box.style.display === 'block';
  box.style.display = isOpen ? 'none' : 'block';
  if(!isOpen) loadReelMusicList('');
}
function searchReelMusic(q){ loadReelMusicList(q); }
function loadReelMusicList(q){
  const musics = [
    { title: "TRASHXRL - Deus do...", artist: "TRASHXRL" },
    { title: "Trending Reel Sound", artist: "Reels" },
    { title: "Bangla Beat", artist: "Various" },
    { title: "Viral Sound", artist: "Trending" }
  ];
  const list = document.getElementById("reelMusicList");
  if(!list) return;
  const filtered = musics.filter(m => m.title.toLowerCase().includes((q||'').toLowerCase()));
  list.innerHTML = filtered.map(m => `<div class="music-item" onclick="selectReelMusic('${m.title}')"><span><b>${m.title}</b><br><small>${m.artist}</small></span><span>▶</span></div>`).join('');
}
function selectReelMusic(title){
  reelMusicSelected = title;
  displayToast("Music: " + title);
  document.getElementById("reelMusicBox").style.display = 'none';
}
function openReelTemplates(){
  const box = document.getElementById("reelTemplatesBox");
  if(!box) return;
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}
function applyReelTemplate(name, event){
  reelTemplateSelected = name;
  document.querySelectorAll(".template-card").forEach(b => b.classList.remove("active"));
  if(event) event.currentTarget.classList.add("active");
  displayToast("Template: " + name);
}
function openReelDrafts(){
  const box = document.getElementById("reelDraftsBox");
  if(!box) return;
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
  if(box.style.display === 'block') loadReelDrafts();
}
function loadReelDrafts(){
  const drafts = JSON.parse(localStorage.getItem('reel_drafts')||'[]');
  const list = document.getElementById("reelDraftsList");
  if(!list) return;
  if(!drafts.length){ list.innerHTML = 'No drafts'; return; }
  list.innerHTML = drafts.map((d, i) => `<div class="music-item" onclick="loadReelDraft(${i})"><span><b>${d.caption || 'Draft'}</b><br><small>${d.date}</small></span><span>→</span></div>`).join('');
}
function loadReelDraft(index){
  const drafts = JSON.parse(localStorage.getItem('reel_drafts')||'[]');
  const d = drafts[index];
  if(!d) return;
  document.getElementById("reelCaption").value = d.caption || '';
  displayToast("Draft loaded");
}
function toggleReelGallerySource(){
  const l = document.getElementById("reelGallerySourceList");
  if(l) l.style.display = l.style.display === 'none' ? 'flex' : 'none';
}
function setReelGallerySource(src){
  displayToast("Source: " + src);
  document.getElementById("reelGallerySourceList").style.display = 'none';
  if(src === 'Camera') openReelCamera();
}
function toggleReelSelectMultiple(){
  reelSelectMultiple = !reelSelectMultiple;
  const btn = document.getElementById("reelMultiBtn");
  if(btn) btn.classList.toggle("active", reelSelectMultiple);
  const inp = document.getElementById("reelGalleryInput");
  if(inp) inp.multiple = reelSelectMultiple;
  displayToast(reelSelectMultiple ? "Select multiple ON" : "Select multiple OFF");
}
function previewReelGallery(event){
  reelFiles = Array.from(event.target.files);
  const preview = document.getElementById("reelGalleryPreview");
  if(!preview) return;
  preview.innerHTML = '';
  reelFiles.forEach(f => {
    const url = URL.createObjectURL(f);
    const el = f.type.startsWith('video') ? document.createElement('video') : document.createElement('img');
    el.src = url;
    if(el.tagName === 'VIDEO') el.controls = true;
    preview.appendChild(el);
  });
}
function saveReelDraft(){
  const caption = document.getElementById("reelCaption")?.value || '';
  let drafts = JSON.parse(localStorage.getItem('reel_drafts')||'[]');
  drafts.push({ caption, date: new Date().toLocaleString(), music: reelMusicSelected, template: reelTemplateSelected });
  localStorage.setItem('reel_drafts', JSON.stringify(drafts));
  displayToast("Draft saved");
  loadReelDrafts();
}
async function publishReel(){
  const caption = document.getElementById("reelCaption")?.value.trim() || "";
  if(!currentUser){ displayToast("Login first"); return; }
  if(!reelFiles.length){ displayToast("Select video / photo"); return; }
  displayToast("Uploading reel...");
  try{
    for(let file of reelFiles){
      const fileName = `${currentUser.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('reels').upload(fileName, file);
      if(upErr) throw new Error(upErr.message);
      const { data: urlData } = supabase.storage.from('reels').getPublicUrl(fileName);
      await supabase.from('reels').insert({ user_id: currentUser.id, video_url: urlData.publicUrl, caption: caption, music: reelMusicSelected, template: reelTemplateSelected, likes_count: 0, views_count: 0 });
    }
    displayToast("Reel shared");
    closeModal('createReelModal');
    reelFiles = [];
    document.getElementById("reelGalleryPreview").innerHTML = '';
    document.getElementById("reelCaption").value = '';
    stopReelCamera();
    liveCounts.reels++;
    updateBadge("fbReelsBadge", liveCounts.reels);
  }catch(e){ displayToast(e.message); }
}

// ---------- LIVE - LIVEKIT ----------
function openLive(){ closeCreateMenu(); openModal('liveModal'); }
async function getLiveKitToken(roomName, userName){
  try{
    const res = await fetch('/api/livekit-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomName, identity: userName })
    });
    if(res.ok){
      const data = await res.json();
      if(data.token) return data.token;
    }
  }catch(e){ console.log("Token endpoint not found, demo mode", e); }
  return null;
}
async function toggleLive(){
  if(!isLive) await startLiveKit();
  else await endLiveKit();
}
async function startLiveKit(){
  const title = document.getElementById("liveTitle")?.value.trim() || "Live";
  const roomInput = document.getElementById("liveRoomName")?.value.trim();
  liveRoomName = roomInput || `autrobook-live-${currentUser ? currentUser.id.slice(0,8) : 'guest'}-${Date.now()}`;
  const userName = currentProfile?.full_name || currentUser?.email || `user-${Date.now()}`;
  const status = document.getElementById("liveStatus");
  if(status) status.textContent = "Connecting to LiveKit...";
  try{
    if(typeof LivekitClient === 'undefined' && typeof window.LivekitClient === 'undefined') throw new Error("LiveKit SDK not loaded");
    const LK = window.LivekitClient || LivekitClient;
    const token = await getLiveKitToken(liveRoomName, userName);
    liveRoom = new LK.Room({ adaptiveStream: true, dynacast: true });
    liveRoom.on(LK.RoomEvent.TrackSubscribed, (track) => {
      if(track.kind === LK.Track.Kind.Video || track.kind === LK.Track.Kind.Audio){
        const el = track.attach();
        el.style.width = '100%';
        el.style.borderRadius = '12px';
        const container = document.getElementById("liveRemoteVideos");
        if(container) container.appendChild(el);
        updateLiveViewerCount();
      }
    });
    liveRoom.on(LK.RoomEvent.TrackUnsubscribed, (track) => { track.detach().forEach(el => el.remove()); updateLiveViewerCount(); });
    liveRoom.on(LK.RoomEvent.ParticipantConnected, () => updateLiveViewerCount());
    liveRoom.on(LK.RoomEvent.ParticipantDisconnected, () => updateLiveViewerCount());
    liveRoom.on(LK.RoomEvent.Disconnected, () => { isLive = false; updateLiveUI(false); });
    if(token){
      await liveRoom.connect(LIVEKIT_URL, token);
      liveLocalTracks = await LK.createLocalTracks({ audio: true, video: true });
      for(let track of liveLocalTracks){
        await liveRoom.localParticipant.publishTrack(track);
        if(track.kind === LK.Track.Kind.Video){
          const video = document.getElementById("liveVideo");
          track.attach(video);
        }
      }
      if(status) status.textContent = "Connected to LiveKit - LIVE";
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const video = document.getElementById("liveVideo");
      if(video) video.srcObject = stream;
      liveLocalTracks = [];
      window._demoLiveStream = stream;
      if(status) status.textContent = "Demo Live - Local Camera Only";
      displayToast("Demo Live - Add /api/livekit-token for real live");
    }
    isLive = true;
    liveIsHost = true;
    updateLiveUI(true);
    if(typeof supabase !== 'undefined' && currentUser){
      try{ await supabase.from('live_streams').insert({ user_id: currentUser.id, room_name: liveRoomName, title: title, is_live: true, viewer_count: 0 }); }catch(e){}
    }
    const roomInfo = document.getElementById("liveRoomInfo");
    if(roomInfo) roomInfo.textContent = "Room: " + liveRoomName + " | URL: " + LIVEKIT_URL;
    document.getElementById("liveBtn").textContent = "End Live";
    const overlay = document.getElementById("liveOverlay");
    if(overlay) overlay.style.display = 'block';
    const viewers = document.getElementById("liveViewerCount");
    if(viewers) viewers.style.display = 'inline-block';
    displayToast("You are Live");
    loadLiveNow();
  }catch(e){
    if(status) status.textContent = "Live failed: " + e.message;
    displayToast(e.message);
  }
}
async function endLiveKit(){
  try{
    if(liveRoom){ await liveRoom.disconnect(); liveRoom = null; }
    liveLocalTracks.forEach(t => { try{ t.stop(); }catch(e){} });
    liveLocalTracks = [];
    if(window._demoLiveStream){ window._demoLiveStream.getTracks().forEach(t => t.stop()); window._demoLiveStream = null; }
    const video = document.getElementById("liveVideo");
    if(video) video.srcObject = null;
    const remote = document.getElementById("liveRemoteVideos");
    if(remote) remote.innerHTML = '';
  }catch(e){}
  isLive = false;
  liveIsHost = false;
  updateLiveUI(false);
  const btn = document.getElementById("liveBtn");
  if(btn) btn.textContent = "Go Live";
  const st = document.getElementById("liveStatus");
  if(st) st.textContent = "Live Ended";
  const overlay = document.getElementById("liveOverlay");
  if(overlay) overlay.style.display = 'none';
  if(typeof supabase !== 'undefined' && currentUser){
    try{ await supabase.from('live_streams').delete().eq('room_name', liveRoomName); }catch(e){}
  }
  displayToast("Live ended");
  loadLiveNow();
}
function updateLiveUI(live){
  const btn = document.getElementById("liveBtn");
  if(btn) btn.textContent = live ? "End Live" : "Go Live";
}
function updateLiveViewerCount(){
  if(!liveRoom) return;
  const count = liveRoom.remoteParticipants.size + 1;
  const el = document.getElementById("liveViewerNum");
  if(el) el.textContent = count;
}
async function closeLiveModal(){
  if(isLive){
    if(!confirm("End Live?")) return;
    await endLiveKit();
  }
  closeModal('liveModal');
}
function toggleLiveMic(){
  liveMicOn = !liveMicOn;
  if(liveRoom && liveRoom.localParticipant){
    liveRoom.localParticipant.getTrackPublications().forEach(pub => {
      if(pub.track && pub.track.kind === 'audio'){
        if(liveMicOn) pub.track.unmute(); else pub.track.mute();
      }
    });
  }
  const btn = document.getElementById("liveMicBtn");
  if(btn) btn.style.opacity = liveMicOn ? '1' : '0.4';
  displayToast(liveMicOn ? "Mic On" : "Mic Muted");
}
function toggleLiveCam(){
  liveCamOn = !liveCamOn;
  if(liveRoom && liveRoom.localParticipant){
    liveRoom.localParticipant.getTrackPublications().forEach(pub => {
      if(pub.track && pub.track.kind === 'video'){
        if(liveCamOn) pub.track.unmute(); else pub.track.mute();
      }
    });
  }
  const btn = document.getElementById("liveCamBtn");
  if(btn) btn.style.opacity = liveCamOn ? '1' : '0.4';
  displayToast(liveCamOn ? "Camera On" : "Camera Off");
}
function toggleLiveChat(){
  const box = document.getElementById("liveChatBox");
  if(box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
}
async function sendLiveChat(){
  const input = document.getElementById("liveChatInput");
  if(!input) return;
  const text = input.value.trim();
  if(!text) return;
  const name = currentProfile?.full_name || "You";
  addLiveChatMessage(name, text);
  if(liveRoom && isLive){
    try{
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ type: 'chat', name: name, text: text }));
      await liveRoom.localParticipant.publishData(data, { reliable: true });
    }catch(e){}
  }
  input.value = '';
}
function addLiveChatMessage(name, text){
  const box = document.getElementById("liveChatMessages");
  if(!box) return;
  const div = document.createElement("div");
  div.className = "live-chat-item";
  div.innerHTML = `<b>${escapeHtml(name)}:</b> ${escapeHtml(text)}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
async function loadLiveNow(){
  const section = document.getElementById("liveNowSection");
  const list = document.getElementById("liveNowList");
  if(!section || !list) return;
  try{
    if(typeof supabase === 'undefined'){ section.style.display = 'none'; return; }
    const { data: lives } = await supabase.from('live_streams').select('*').eq('is_live', true).order('created_at', { ascending: false }).limit(10);
    if(!lives || !lives.length){ section.style.display = 'none'; return; }
    section.style.display = 'block';
    list.innerHTML = lives.map(l => `
      <div class="live-now-card">
        <span>● LIVE</span>
        <b>${escapeHtml(l.title || 'Live')}</b>
        <button class="btn-green" onclick="joinLive('${escapeHtml(l.room_name)}')">Watch</button>
      </div>
    `).join('');
  }catch(e){ section.style.display = 'none'; }
}
async function joinLive(roomName){
  const userName = currentProfile?.full_name || `viewer-${Date.now()}`;
  try{
    const LK = window.LivekitClient || LivekitClient;
    const token = await getLiveKitToken(roomName, userName);
    if(!token){ displayToast("Viewer needs token endpoint"); return; }
    liveRoom = new LK.Room();
    liveRoom.on(LK.RoomEvent.TrackSubscribed, (track) => {
      const el = track.attach();
      el.style.width = '100%';
      el.style.borderRadius = '12px';
      document.getElementById("liveRemoteVideos").appendChild(el);
    });
    await liveRoom.connect(LIVEKIT_URL, token);
    openModal('liveModal');
    document.getElementById("liveStatus").textContent = "Watching Live: " + roomName;
    document.getElementById("liveBtn").textContent = "Leave Live";
    isLive = true;
    liveIsHost = false;
  }catch(e){ displayToast(e.message); }
}

// ---------- NOTE ----------
function openNote(){ closeCreateMenu(); openModal('noteModal'); }
async function publishNote(){
  const text = document.getElementById("noteText")?.value.trim() || "";
  if(!text){ displayToast("Write note"); return; }
  if(!currentUser){ displayToast("Login first"); return; }
  try{
    await supabase.from('posts').insert({ user_id: currentUser.id, content: text, image_url: null, likes_count: 0, comments_count: 0 });
    displayToast("Note shared");
    closeModal('noteModal');
    document.getElementById("noteText").value = '';
    loadPosts();
  }catch(e){ displayToast(e.message); }
}

// ---------- LOAD POSTS ----------
async function loadPosts(){
  const feed = document.getElementById("postsFeed");
  if(!feed) return;
  try{
    if(typeof supabase === 'undefined'){ feed.innerHTML = `<div class="card">No connection</div>`; return; }
    const { data: posts, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
    if(error) throw new Error(error.message);
    if(!posts || !posts.length){
      feed.innerHTML = `<div class="card" style="text-align:center;">No posts yet</div>`;
      allPosts = [];
      return;
    }
    allPosts = posts;
    const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))];
    let profilesMap = {};
    if(userIds.length){
      const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
      (profs||[]).forEach(p => profilesMap[p.id] = p);
    }
    let likedSet = new Set();
    if(currentUser){
      const postIds = posts.map(p => p.id);
      const { data: likes } = await supabase.from('likes').select('post_id').eq('user_id', currentUser.id).in('post_id', postIds);
      (likes||[]).forEach(l => likedSet.add(l.post_id));
    }
    let commentsMap = {};
    for(let p of posts){
      const { data: txt } = await supabase.from('text_comments').select('id, comment_text, user_id, created_at').eq('post_id', p.id).order('created_at', { ascending: true }).limit(3);
      const { data: vc } = await supabase.from('voice_comments').select('id, audio_url, user_id, created_at').eq('post_id', p.id).order('created_at', { ascending: true }).limit(2);
      commentsMap[p.id] = { text: txt || [], voice: vc || [] };
    }
    let filtered = posts;
    // Hide / Not Interested / Blocked filter
    filtered = filtered.filter(p => !hiddenPostIds.includes(p.id));
    filtered = filtered.filter(p => !notInterestedPostIds.includes(p.id));
    let blockedUsers = JSON.parse(localStorage.getItem('blocked_users')||'[]');
    filtered = filtered.filter(p => !blockedUsers.includes(p.user_id));
    // Feed settings
    const feedSettings = JSON.parse(localStorage.getItem('feed_settings')||'{}');
    if(feedSettings.friendsFirst && currentUser){
      filtered.sort((a,b) => {
        const aFriend = a.user_id === currentUser.id ? 1 : 0;
        const bFriend = b.user_id === currentUser.id ? 1 : 0;
        return bFriend - aFriend;
      });
    }
    if(homeFilter === 'friends' && currentUser){
      const { data: fr } = await supabase.from('friend_requests').select('sender_id, receiver_id').eq('status','accepted').or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
      let friendIds = new Set([currentUser.id]);
      (fr||[]).forEach(f => { friendIds.add(f.sender_id); friendIds.add(f.receiver_id); });
      filtered = filtered.filter(p => friendIds.has(p.user_id));
    }
    if(homeFilter === 'saved' && currentUser){
      filtered = filtered.filter(p => likedSet.has(p.id));
    }
    if(!filtered.length){
      feed.innerHTML = `<div class="card" style="text-align:center;">No posts</div>`;
      return;
    }
    feed.innerHTML = filtered.map(p => {
      const author = profilesMap[p.user_id] || {};
      const isLiked = likedSet.has(p.id);
      const isOwn = currentUser && p.user_id === currentUser.id;
      const cmts = commentsMap[p.id] || { text: [], voice: [] };
      const time = new Date(p.created_at).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
      return `
      <article class="post-card" id="post-${p.id}">
        <div class="post-header">
          <img src="${author.avatar_url || ''}" onerror="this.style.display='none'" onclick="window.location.href='profile.html?id=${p.user_id}'">
          <div class="post-user"><span>${time}</span></div>
          <div class="post-header-right">
            <button class="post-dot-btn" onclick="openPostOptions('${p.id}', '${p.user_id}', event)">⋯</button>
            <button class="post-cross-btn" onclick="hidePostFromFeed('${p.id}', event)">✕</button>
          </div>
        </div>
        ${p.content ? `<div class="post-text">${escapeHtml(p.content)}</div>` : ''}
        ${p.image_url ? `<img src="${p.image_url}" class="post-image" onclick="window.open('${p.image_url}','_blank')">` : ''}
        <div class="post-stats">
          <span class="reaction-summary" id="reactionSummary-${p.id}">${getReactionSummaryHtml(p.id)}</span>
          <span onclick="openCommentSheet('${p.id}')" style="cursor:pointer;">${(p.comments_count || cmts.text.length + cmts.voice.length)} Comments</span>
        </div>
        <div class="post-actions">
          <div style="flex:1;position:relative;">
            <button id="reactBtn-${p.id}" class="${userReaction[p.id] ? 'reacted' : ''}" onclick="toggleReactionBar('${p.id}', event)" oncontextmenu="toggleReactionBar('${p.id}', event); return false;">${userReaction[p.id] ? userReaction[p.id] + ' React' : '👍 React'}</button>
            <div class="reaction-bar" id="reactionBar-${p.id}">
              <button onclick="setReaction('${p.id}', '👍')">👍</button>
              <button onclick="setReaction('${p.id}', '❤️')">❤️</button>
              <button onclick="setReaction('${p.id}', '🥰')">🥰</button>
              <button onclick="setReaction('${p.id}', '😆')">😆</button>
              <button onclick="setReaction('${p.id}', '😮')">😮</button>
              <button onclick="setReaction('${p.id}', '😢')">😢</button>
              <button onclick="setReaction('${p.id}', '😠')">😠</button>
            </div>
          </div>
          <button onclick="openCommentSheet('${p.id}')"><i class="far fa-comment"></i> Comment</button>
          <button onclick="openShareSheet('${p.id}')"><i class="fas fa-share"></i> Share</button>
        </div>
        <div class="comments-box" id="comments-${p.id}" style="display:none;">
          ${cmts.text.map(c => `<div class="comment-item"><div class="comment-bubble">${escapeHtml(c.comment_text)}</div></div>`).join('')}
          ${cmts.voice.map(v => `<div class="comment-item"><div class="comment-bubble"><audio controls src="${v.audio_url}" style="width:200px;"></audio></div></div>`).join('')}
          <div class="comment-input-row">
            <input type="text" id="commentInput-${p.id}" placeholder="Write a comment..." onkeypress="if(event.key==='Enter') sendComment('${p.id}')">
            <button onclick="sendComment('${p.id}')">→</button>
            <button onclick="startInlineVoiceComment('${p.id}')">🎤</button>
          </div>
          <div id="inlineVoice-${p.id}" style="display:none;margin-top:8px;"><button class="btn-green" onclick="stopInlineVoiceComment('${p.id}')">⏹</button></div>
        </div>
      </article>`;
    }).join('');
  }catch(e){
    feed.innerHTML = `<div class="card">${escapeHtml(e.message)} <br><button class="btn-green" onclick="loadPosts()" style="margin-top:10px;">↻</button></div>`;
  }
}

// ---------- POST THREE DOT + CROSS ----------
function openPostOptions(postId, authorId, event){
  if(event) event.stopPropagation();
  currentPostId = postId;
  currentPostAuthorId = authorId;
  const sheet = document.getElementById("postOptionsSheet");
  if(sheet) sheet.classList.add("active");
  const more = document.getElementById("postMoreOptionsSheet");
  if(more) more.classList.remove("active");
  updatePostNotifLabel();
  setTimeout(()=>{
    document.addEventListener("click", closePostSheetOnOutside, { once: true });
  }, 100);
}
function closePostSheetOnOutside(e){
  if(!e.target.closest(".bottom-sheet") && !e.target.closest(".post-dot-btn")){
    closePostSheets();
  }
}
function closePostSheets(){
  const s1 = document.getElementById("postOptionsSheet");
  if(s1) s1.classList.remove("active");
  const s2 = document.getElementById("postMoreOptionsSheet");
  if(s2) s2.classList.remove("active");
}
function openPostMoreOptions(){
  const s1 = document.getElementById("postOptionsSheet");
  if(s1) s1.classList.remove("active");
  const s2 = document.getElementById("postMoreOptionsSheet");
  if(s2) s2.classList.add("active");
}
function backToPostOptions(){
  const s2 = document.getElementById("postMoreOptionsSheet");
  if(s2) s2.classList.remove("active");
  const s1 = document.getElementById("postOptionsSheet");
  if(s1) s1.classList.add("active");
}
function hidePostFromFeed(postId, event){
  if(event) event.stopPropagation();
  if(!hiddenPostIds.includes(postId)){
    hiddenPostIds.push(postId);
    localStorage.setItem('hidden_posts', JSON.stringify(hiddenPostIds));
  }
  if(!notInterestedPostIds.includes(postId)){
    notInterestedPostIds.push(postId);
    localStorage.setItem('not_interested_posts', JSON.stringify(notInterestedPostIds));
  }
  const card = document.getElementById(`post-${postId}`);
  if(card){
    card.style.transition = "0.3s";
    card.style.opacity = "0";
    card.style.transform = "translateX(-100%)";
    setTimeout(()=> { card.remove(); }, 300);
  }
  if(typeof supabase !== 'undefined' && currentUser){
    supabase.from('hidden_posts').insert({ user_id: currentUser.id, post_id: postId, reason: 'cross_hide' }).then(()=>{});
  }
  displayToast("Post hidden - You won't see this again");
  setTimeout(()=>{
    const toast = document.getElementById("toast");
    if(toast){
      toast.innerHTML = `Post hidden <button onclick="undoHidePost('${postId}')" style="background:#fff;color:#14532d;border:none;padding:4px 10px;border-radius:12px;margin-left:8px;font-weight:700;cursor:pointer;">Undo</button>`;
      toast.classList.add("show");
      setTimeout(()=> toast.classList.remove("show"), 5000);
    }
  }, 400);
}
function undoHidePost(postId){
  hiddenPostIds = hiddenPostIds.filter(id => id !== postId);
  notInterestedPostIds = notInterestedPostIds.filter(id => id !== postId);
  localStorage.setItem('hidden_posts', JSON.stringify(hiddenPostIds));
  localStorage.setItem('not_interested_posts', JSON.stringify(notInterestedPostIds));
  if(typeof supabase !== 'undefined' && currentUser){
    supabase.from('hidden_posts').delete().eq('user_id', currentUser.id).eq('post_id', postId).then(()=>{});
  }
  displayToast("Post restored");
  loadPosts();
}
function markPostInterested(){
  if(!currentPostId) return;
  if(!interestedPostIds.includes(currentPostId)){
    interestedPostIds.push(currentPostId);
    localStorage.setItem('interested_posts', JSON.stringify(interestedPostIds));
  }
  notInterestedPostIds = notInterestedPostIds.filter(id => id !== currentPostId);
  localStorage.setItem('not_interested_posts', JSON.stringify(notInterestedPostIds));
  closePostSheets();
  displayToast("Thanks - We'll show you more like this");
  if(typeof supabase !== 'undefined' && currentUser){
    supabase.from('post_feedback').insert({ user_id: currentUser.id, post_id: currentPostId, feedback: 'interested' }).then(()=>{});
  }
}
function markPostNotInterested(){
  if(!currentPostId) return;
  hidePostFromFeed(currentPostId);
  closePostSheets();
}
function savePostFromSheet(){
  if(!currentPostId) return;
  let saved = JSON.parse(localStorage.getItem('saved_posts')||'[]');
  if(!saved.includes(currentPostId)){
    saved.push(currentPostId);
    localStorage.setItem('saved_posts', JSON.stringify(saved));
    displayToast("Post saved");
  } else {
    displayToast("Already saved");
  }
  closePostSheets();
}
function whyAmISeeingThisPost(){
  closePostSheets();
  const text = document.getElementById("whySeeingText");
  if(text){
    text.textContent = "You are seeing this post because you follow similar pages, you interacted with similar posts, or this post is popular. Autrobook shows posts based on your interests, friends, and activity. You can manage your feed to see less of this type.";
  }
  openModal('whySeeingModal');
}
function updatePostNotifLabel(){
  const label = document.getElementById("postNotifLabel");
  if(!label) return;
  if(postNotifOn.includes(currentPostId)) label.textContent = "Turn off notifications for this post";
  else label.textContent = "Turn on notifications for this post";
}
function togglePostNotifications(){
  if(!currentPostId) return;
  if(postNotifOn.includes(currentPostId)){
    postNotifOn = postNotifOn.filter(id => id !== currentPostId);
    displayToast("Notifications off for this post");
  } else {
    postNotifOn.push(currentPostId);
    displayToast("Notifications on for this post - You'll get updates");
  }
  localStorage.setItem('post_notif_on', JSON.stringify(postNotifOn));
  updatePostNotifLabel();
  closePostSheets();
}
async function copyPostLink(){
  if(!currentPostId) return;
  const url = `${window.location.origin}/index.html?post=${currentPostId}`;
  try{ await navigator.clipboard.writeText(url); displayToast("Link copied"); }
  catch(e){ displayToast(url); }
  closePostSheets();
}
function manageYourFeed(){
  closePostSheets();
  const settings = JSON.parse(localStorage.getItem('feed_settings')||'{}');
  const f1 = document.getElementById("feedFriendsFirst");
  if(f1) f1.checked = !!settings.friendsFirst;
  const f2 = document.getElementById("feedShowReels");
  if(f2) f2.checked = settings.showReels !== false;
  const f3 = document.getElementById("feedShowSuggested");
  if(f3) f3.checked = settings.showSuggested !== false;
  const f4 = document.getElementById("feedReduceSensitive");
  if(f4) f4.checked = !!settings.reduceSensitive;
  openModal('manageFeedModal');
}
function saveFeedSettings(){
  const settings = {
    friendsFirst: document.getElementById("feedFriendsFirst")?.checked || false,
    showReels: document.getElementById("feedShowReels")?.checked || false,
    showSuggested: document.getElementById("feedShowSuggested")?.checked || false,
    reduceSensitive: document.getElementById("feedReduceSensitive")?.checked || false
  };
  localStorage.setItem('feed_settings', JSON.stringify(settings));
  displayToast("Feed settings saved");
  loadPosts();
}
function hidePostFromSheet(){
  if(!currentPostId) return;
  closePostSheets();
  hidePostFromFeed(currentPostId);
}
async function unfollowAuthorFromSheet(){
  if(!currentPostAuthorId || !currentUser) { displayToast("Login first"); return; }
  if(currentPostAuthorId === currentUser.id){ displayToast("This is your post"); return; }
  try{
    if(typeof supabase !== 'undefined'){
      await supabase.from('friend_requests').delete().or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${currentPostAuthorId}),and(sender_id.eq.${currentPostAuthorId},receiver_id.eq.${currentUser.id})`);
    }
  }catch(e){}
  closePostSheets();
  hidePostFromFeed(currentPostId);
  displayToast("Unfollowed - You won't see their posts");
}
async function blockAuthorFromSheet(){
  if(!currentPostAuthorId || !currentUser) { displayToast("Login first"); return; }
  if(!confirm("Block this user? You won't see their posts.")) return;
  try{
    if(typeof supabase !== 'undefined'){
      await supabase.from('blocked_users').insert({ blocker_id: currentUser.id, blocked_id: currentPostAuthorId });
    }
  }catch(e){}
  let blocked = JSON.parse(localStorage.getItem('blocked_users')||'[]');
  if(!blocked.includes(currentPostAuthorId)){
    blocked.push(currentPostAuthorId);
    localStorage.setItem('blocked_users', JSON.stringify(blocked));
  }
  closePostSheets();
  hidePostFromFeed(currentPostId);
  displayToast("User blocked");
}

// ---------- REPORT - 9 POINTS - Yes | No - Email ----------
function openReportSheet(){
  closePostSheets();
  const s = document.getElementById("reportSheet");
  if(s) s.classList.add("active");
}
function closeReportSheet(){
  const s = document.getElementById("reportSheet");
  if(s) s.classList.remove("active");
}
function reportPostFromSheet(){ openReportSheet(); }
function askReportConfirm(reason){
  pendingReportReason = reason;
  closeReportSheet();
  const t = document.getElementById("reportConfirmText");
  if(t) t.textContent = reason;
  openModal('reportConfirmModal');
}
function cancelReportConfirm(){
  pendingReportReason = "";
  closeModal('reportConfirmModal');
  openReportSheet();
}
async function confirmReportYes(){
  closeModal('reportConfirmModal');
  if(!currentPostId || !pendingReportReason) return;
  const postId = currentPostId;
  const reason = pendingReportReason;
  const post = allPosts.find(p => p.id === postId);
  const postContent = post ? (post.content || '') : '';
  const postImage = post ? (post.image_url || '') : '';
  const reporterName = currentProfile?.full_name || currentUser?.email || 'Anonymous';
  const reporterId = currentUser ? currentUser.id : 'anonymous';
  const postUrl = `${window.location.origin}/index.html?post=${postId}`;
  try{
    if(typeof supabase !== 'undefined' && currentUser){
      await supabase.from('reports').insert({ user_id: currentUser.id, post_id: postId, reason: reason, status: 'pending' });
    }
  }catch(e){ console.log(e); }
  try{
    await fetch('/api/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'autrobooksupport@gmail.com',
        postId: postId,
        reason: reason,
        postContent: postContent,
        postImage: postImage,
        postUrl: postUrl,
        reporterName: reporterName,
        reporterId: reporterId,
        reportedAt: new Date().toISOString()
      })
    });
  }catch(e){ console.log("Email send failed, saved to DB", e); }
  openModal('reportSubmittedModal');
  hidePostFromFeed(postId);
  pendingReportReason = "";
}
async function submitPostReport(reason){ askReportConfirm(reason); }

// ---------- REACTIONS ----------
function toggleReactionBar(postId, event){
  if(event) event.stopPropagation();
  document.querySelectorAll(".reaction-bar").forEach(b => {
    if(b.id !== `reactionBar-${postId}`) b.classList.remove("active");
  });
  const bar = document.getElementById(`reactionBar-${postId}`);
  if(bar) bar.classList.toggle("active");
  setTimeout(()=>{
    document.addEventListener("click", (e)=>{
      if(!e.target.closest(".reaction-bar") && !e.target.closest(`#reactBtn-${postId}`)){
        if(bar) bar.classList.remove("active");
      }
    }, { once: true });
  }, 100);
}
async function setReaction(postId, emoji){
  userReaction[postId] = emoji;
  localStorage.setItem('post_reactions', JSON.stringify(userReaction));
  if(!reactionCounts[postId]) reactionCounts[postId] = {};
  reactionCounts[postId][emoji] = (reactionCounts[postId][emoji] || 0) + 1;
  localStorage.setItem('reaction_counts', JSON.stringify(reactionCounts));
  const btn = document.getElementById(`reactBtn-${postId}`);
  if(btn){ btn.innerHTML = `${emoji} React`; btn.classList.add("reacted"); }
  const bar = document.getElementById(`reactionBar-${postId}`);
  if(bar) bar.classList.remove("active");
  const sum = document.getElementById(`reactionSummary-${postId}`);
  if(sum) sum.innerHTML = getReactionSummaryHtml(postId);
  try{
    if(typeof supabase !== 'undefined' && currentUser){
      await supabase.from('post_reactions').upsert({ post_id: postId, user_id: currentUser.id, reaction: emoji }, { onConflict: 'post_id,user_id' });
    }
  }catch(e){}
  displayToast(`Reacted ${emoji}`);
}
function reactFromComment(emoji){
  if(currentCommentPostId) setReaction(currentCommentPostId, emoji);
}
function getReactionSummaryHtml(postId){
  const counts = reactionCounts[postId] || {};
  const keys = Object.keys(counts);
  if(!keys.length && !userReaction[postId]) return `0`;
  if(!keys.length && userReaction[postId]) return `${userReaction[postId]} 1`;
  let html = keys.slice(0,3).map(k => `<span>${k}</span>`).join('');
  let total = Object.values(counts).reduce((a,b)=>a+b,0);
  if(userReaction[postId] && total === 0) total = 1;
  return `${html} ${total}`;
}

// ---------- SHARE ----------
function openShareSheet(postId){
  currentSharePostId = postId;
  currentPostId = postId;
  const s = document.getElementById("shareSheet");
  if(s) s.classList.add("active");
}
function closeShareSheet(){
  const s = document.getElementById("shareSheet");
  if(s) s.classList.remove("active");
}
function sharePost(postId){ openShareSheet(postId); }
function getShareUrl(postId){
  return `${window.location.origin}/index.html?post=${postId}`;
}
async function shareCopyLink(){
  if(!currentSharePostId) return;
  const url = getShareUrl(currentSharePostId);
  try{ await navigator.clipboard.writeText(url); displayToast("Link copied"); }
  catch(e){ displayToast(url); }
  closeShareSheet();
}
function shareToMessenger(){
  if(!currentSharePostId) return;
  const url = encodeURIComponent(getShareUrl(currentSharePostId));
  window.open(`https://www.messenger.com/t/?link=${url}`, '_blank');
  closeShareSheet();
}
function shareToWhatsApp(){
  if(!currentSharePostId) return;
  const url = encodeURIComponent(getShareUrl(currentSharePostId));
  window.open(`https://wa.me/?text=${url}`, '_blank');
  closeShareSheet();
}
async function shareNative(){
  if(!currentSharePostId) return;
  const url = getShareUrl(currentSharePostId);
  try{
    if(navigator.share) await navigator.share({ title: 'Autrobook', url });
    else { await navigator.clipboard.writeText(url); displayToast("Copied"); }
  }catch(e){}
  closeShareSheet();
}
async function shareToFeed(){
  if(!currentSharePostId || !currentUser) { displayToast("Login first"); return; }
  const post = allPosts.find(p => p.id === currentSharePostId);
  if(!post) return;
  try{
    await supabase.from('posts').insert({ user_id: currentUser.id, content: `Shared: ${post.content || ''}`, image_url: post.image_url || null, likes_count: 0, comments_count: 0, shared_from: currentSharePostId });
    displayToast("Shared to Feed");
    closeShareSheet();
    loadPosts();
  }catch(e){ displayToast(e.message); }
}
async function shareToStory(){
  if(!currentSharePostId) return;
  const post = allPosts.find(p => p.id === currentSharePostId);
  if(!post) return;
  try{
    if(typeof supabase !== 'undefined' && currentUser){
      await supabase.from('stories').insert({ user_id: currentUser.id, image_url: post.image_url || null, content: post.content || '' });
      displayToast("Shared to Story");
    }
  }catch(e){ displayToast(e.message); }
  closeShareSheet();
}

// ---------- COMMENT ----------
function openCommentSheet(postId){
  currentCommentPostId = postId;
  currentPostId = postId;
  const list = document.getElementById("commentSheetList");
  if(list){
    list.innerHTML = `<p style="text-align:center;color:#65676b;">Loading comments...</p>`;
    loadCommentsForSheet(postId);
  }
  const s = document.getElementById("commentSheet");
  if(s) s.classList.add("active");
  const input = document.getElementById("commentSheetInput");
  if(input) setTimeout(()=> input.focus(), 300);
}
function closeCommentSheet(){
  const s = document.getElementById("commentSheet");
  if(s) s.classList.remove("active");
}
async function loadCommentsForSheet(postId){
  const list = document.getElementById("commentSheetList");
  if(!list) return;
  try{
    if(typeof supabase === 'undefined'){ list.innerHTML = ''; return; }
    const { data: txt } = await supabase.from('text_comments').select('id, comment_text, user_id, created_at').eq('post_id', postId).order('created_at', { ascending: true });
    const { data: vc } = await supabase.from('voice_comments').select('id, audio_url, user_id, created_at').eq('post_id', postId).order('created_at', { ascending: true });
    let html = '';
    (txt||[]).forEach(c => { html += `<div class="comment-sheet-list-item"><div class="comment-bubble">${escapeHtml(c.comment_text)}</div></div>`; });
    (vc||[]).forEach(v => { html += `<div class="comment-sheet-list-item"><div class="comment-bubble"><audio controls src="${v.audio_url}" style="width:200px;"></audio></div></div>`; });
    if(!html) html = `<p style="text-align:center;color:#65676b;">No comments yet - Be first</p>`;
    list.innerHTML = html;
  }catch(e){ list.innerHTML = ''; }
}
async function sendCommentFromSheet(){
  const input = document.getElementById("commentSheetInput");
  if(!input) return;
  const text = input.value.trim();
  if(!text || !currentCommentPostId) return;
  if(!currentUser){ displayToast("Login first"); return; }
  try{
    await supabase.from('text_comments').insert({ post_id: currentCommentPostId, user_id: currentUser.id, comment_text: text });
    input.value = "";
    displayToast("Comment sent");
    loadCommentsForSheet(currentCommentPostId);
    loadPosts();
  }catch(e){ displayToast(e.message); }
}
function toggleComments(postId){ openCommentSheet(postId); }
async function togglePostLike(postId, btn){
  if(!currentUser){ displayToast("Login first"); return; }
  const isLiked = btn.classList.contains('liked');
  btn.classList.toggle('liked');
  btn.innerHTML = `<i class="${!isLiked?'fas':'far'} fa-thumbs-up"></i>`;
  try{
    if(!isLiked) await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
    else await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
    setTimeout(()=> loadPosts(), 400);
  }catch(e){ displayToast(e.message); btn.classList.toggle('liked'); }
}
async function sendComment(postId){
  const input = document.getElementById(`commentInput-${postId}`);
  if(!input) return;
  const text = input.value.trim();
  if(!text) return;
  if(!currentUser){ displayToast("Login first"); return; }
  try{
    const { error } = await supabase.from('text_comments').insert({ post_id: postId, user_id: currentUser.id, comment_text: text });
    if(error) throw new Error(error.message);
    input.value = "";
    displayToast("Sent");
    loadPosts();
  }catch(e){ displayToast(e.message); }
}
let inlineRecorder = null;
let inlineChunks = [];
async function startInlineVoiceComment(postId){
  const box = document.getElementById(`inlineVoice-${postId}`);
  if(box) box.style.display = 'block';
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    inlineRecorder = new MediaRecorder(stream);
    inlineChunks = [];
    inlineRecorder.ondataavailable = e => { if(e.data.size > 0) inlineChunks.push(e.data); };
    inlineRecorder.onstop = () => sendInlineVoiceComment(postId);
    inlineRecorder.start();
  }catch(e){ displayToast("Mic needed"); }
}
function stopInlineVoiceComment(postId){
  if(inlineRecorder){
    inlineRecorder.stop();
    if(inlineRecorder.stream) inlineRecorder.stream.getTracks().forEach(t => t.stop());
  }
}
async function sendInlineVoiceComment(postId){
  if(!inlineChunks.length) return;
  const blob = new Blob(inlineChunks, { type: 'audio/webm' });
  const fileName = `${currentUser.id}/${Date.now()}.webm`;
  const { error: upErr } = await supabase.storage.from('voice').upload(fileName, blob);
  if(upErr){ displayToast(upErr.message); return; }
  const { data: urlData } = supabase.storage.from('voice').getPublicUrl(fileName);
  const { error } = await supabase.from('voice_comments').insert({ post_id: postId, user_id: currentUser.id, audio_url: urlData.publicUrl, duration: 0 });
  if(error){ displayToast(error.message); return; }
  displayToast("Voice sent");
  loadPosts();
}

// ---------- SHARE / SAVE / DELETE ----------
async function savePost(postId, btn){
  if(!currentUser){ displayToast("Login first"); return; }
  let saved = JSON.parse(localStorage.getItem('saved_posts')||'[]');
  if(saved.includes(postId)){
    saved = saved.filter(id => id !== postId);
    displayToast("Removed");
    if(btn) btn.innerHTML = `<i class="far fa-bookmark"></i>`;
  } else {
    saved.push(postId);
    displayToast("Saved");
    if(btn) btn.innerHTML = `<i class="fas fa-bookmark"></i>`;
  }
  localStorage.setItem('saved_posts', JSON.stringify(saved));
}
async function deletePost(postId){
  if(!confirm("Delete?")) return;
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if(error){ displayToast(error.message); return; }
  displayToast("Deleted");
  loadPosts();
}

// ---------- FILTER ----------
function filterHomeFeed(type, btn){
  homeFilter = type;
  document.querySelectorAll('.home-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  loadPosts();
}

// ---------- HELPERS ----------
function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function displayToast(msg){
  const c = document.getElementById("toast");
  if(!c) return;
  c.textContent = msg;
  c.classList.add("show");
  setTimeout(()=> c.classList.remove("show"), 3000);
}
function openModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.add("active");
}
function closeModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove("active");
}
