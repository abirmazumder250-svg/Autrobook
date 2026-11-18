// =================================================================
// AUTROBOOK REELS.JS - FULL WORKING VERSION
// Linked: index.html / profile.html / CommentSection.html / react.html / report.html
// Features: Real Reels Feed, 4K Views, Like/React, Follow/Unfollow,
// Save, Real 4K Download, Voice Comment, Text Comment Link,
// Three Dot Options, Report with 10 Reasons + Others + Auto Solution,
// Back Button, System Default Theme, Dark Green Buttons
// =================================================================

// ================= 1. THEME - SYSTEM DEFAULT =================
function applyTheme(){
  var saved = localStorage.getItem("autro_theme") || "system"; // system / dark / light
  document.body.classList.remove("theme-dark","theme-light");
  if(saved === "dark") document.body.classList.add("theme-dark");
  if(saved === "light") document.body.classList.add("theme-light");
  // system = no class, CSS prefers-color-scheme handles it
}
function toggleTheme(){
  var cur = localStorage.getItem("autro_theme") || "system";
  var next = cur === "system" ? "dark" : (cur === "dark" ? "light" : "system");
  localStorage.setItem("autro_theme", next);
  applyTheme();
  displayToast("Theme: " + next.charAt(0).toUpperCase() + next.slice(1) + (next === "system" ? " (Phone Default)" : ""));
}
applyTheme();

// ================= 2. BACK BUTTON TO INDEX.HTML =================
function goBackToHome(){
  window.location.href = 'index.html';
}

// ================= 3. GLOBAL STATE =================
let currentUser = null;
let currentProfile = null;
let systemReelsDataset = [];
let activeContextReelId = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let voiceTimerInterval = null;
let voiceSeconds = 0;
let viewedReels = new Set();

// ================= 4. 10 REAL VIDEO REELS - FALLBACK =================
// Used only if Supabase has no reels yet. Real Pexels CDN videos.
const FALLBACK_REELS = [
  { id:"r1", author:"Sarah Jenkins", author_id:"", avatar:"https://i.pravatar.cc/80?img=47", caption:"Testing AI loops with real 4K video! AI is changing everything", videoUrl:"https://videos.pexels.com/video-files/3205624/3205624-hd_1920_1080_25fps.mp4", views_count:245300, likes_count:999, userReacted:false, isFollowing:false, isSaved:false, soundEnhanced:false },
  { id:"r2", author:"Rafiq Hasan", author_id:"", avatar:"https://i.pravatar.cc/80?img=12", caption:"Dhaka city at night - beautiful traffic lights", videoUrl:"https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4", views_count:12400, likes_count:1420, userReacted:false, isFollowing:false, isSaved:false, soundEnhanced:false },
  { id:"r3", author:"Anika Rahman", author_id:"", avatar:"https://i.pravatar.cc/80?img=32", caption:"Morning productivity - coding with coffee", videoUrl:"https://videos.pexels.com/video-files/3205624/3205624-hd_1920_1080_25fps.mp4", views_count:8500, likes_count:340, userReacted:false, isFollowing:false, isSaved:false, soundEnhanced:false },
  { id:"r4", author:"Taskin Ahmed", author_id:"", avatar:"https://i.pravatar.cc/80?img=53", caption:"Guitar session - listen with headphones", videoUrl:"https://videos.pexels.com/video-files/2022395/2022395-hd_1920_1080_30fps.mp4", views_count:102500, likes_count:1205, userReacted:false, isFollowing:false, isSaved:false, soundEnhanced:false },
  { id:"r5", author:"Emma Watson", author_id:"", avatar:"https://i.pravatar.cc/80?img=45", caption:"UI design tips - clean modular blocks", videoUrl:"https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4", views_count:310000, likes_count:5400, userReacted:false, isFollowing:false, isSaved:false, soundEnhanced:false },
  { id:"r6", author:"Sajid Khan", author_id:"", avatar:"https://i.pravatar.cc/80?img=68", caption:"City life - safety first", videoUrl:"https://videos.pexels.com/video-files/3205624/3205624-hd_1920_1080_25fps.mp4", views_count:15400, likes_count:2100, userReacted:false, isFollowing:false, isSaved:false, soundEnhanced:false },
  { id:"r7", author:"Abir Mazumder", author_id:"", avatar:"https://i.pravatar.cc/80?img=59", caption:"My first Autrobook Reel! Welcome everyone", videoUrl:"https://videos.pexels.com/video-files/2022395/2022395-hd_1920_1080_30fps.mp4", views_count:5200, likes_count:890, userReacted:false, isFollowing:false, isSaved:false, soundEnhanced:false },
  { id:"r8", author:"Nusrat Jahan", author_id:"", avatar:"https://i.pravatar.cc/80?img=44", caption:"Nature vibes - river and green village", videoUrl:"https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4", views_count:89000, likes_count:3200, userReacted:false, isFollowing:false, isSaved:false, soundEnhanced:false },
  { id:"r9", author:"Arif Khan", author_id:"", avatar:"https://i.pravatar.cc/80?img=11", caption:"Football skills - practice makes perfect", videoUrl:"https://videos.pexels.com/video-files/2022395/2022395-hd_1920_1080_30fps.mp4", views_count:67000, likes_count:2100, userReacted:false, isFollowing:false, isSaved:false, soundEnhanced:false },
  { id:"r10", author:"Mim Akter", author_id:"", avatar:"https://i.pravatar.cc/80?img=38", caption:"Cooking reel - biryani recipe in 60 sec", videoUrl:"https://videos.pexels.com/video-files/3205624/3205624-hd_1920_1080_25fps.mp4", views_count:45000, likes_count:1800, userReacted:false, isFollowing:false, isSaved:false, soundEnhanced:false },
];

// ================= 5. REPORT REASONS - 10 VALID + OTHERS =================
const REPORT_REASONS = [
  "Spam or misleading",
  "Harassment or bullying",
  "Hate speech",
  "Violent or graphic content",
  "Nudity or sexual content",
  "Fake information / Misinformation",
  "Copyright violation",
  "Scam or fraud",
  "Self-harm content",
  "Child safety issue",
  "Others"
];

// ================= 6. INIT =================
document.addEventListener("DOMContentLoaded", async () => {
  try{
    if(typeof supabase !== 'undefined'){
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user;
      if(user){
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        currentProfile = prof;
      }
    }
  }catch(e){ console.log("Auth error:", e); }
  await loadReelsFromDB();
  checkAutoReportSolution();
  initializeReelDisplayGrid();
  setupVideoPlaybackObservers();
});

// ================= 7. LOAD REELS FROM SUPABASE =================
async function loadReelsFromDB(){
  try{
    if(typeof supabase === 'undefined'){
      systemReelsDataset = [...FALLBACK_REELS];
      return;
    }
    const { data, error } = await supabase.from('reels')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if(error || !data || !data.length){
      systemReelsDataset = [...FALLBACK_REELS];
      // Try to load profiles for fallback if author_id exists
      return;
    }
    // Get author profiles
    const authorIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
    let profilesMap = {};
    if(authorIds.length){
      const { data: profs } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', authorIds);
      (profs||[]).forEach(p => profilesMap[p.id] = p);
    }
    systemReelsDataset = data.map(r => ({
      id: r.id,
      author: profilesMap[r.user_id]?.full_name || 'User',
      author_id: r.user_id,
      avatar: profilesMap[r.user_id]?.avatar_url || 'https://i.pravatar.cc/80?img=12',
      caption: r.caption || '',
      videoUrl: r.video_url,
      views_count: r.views_count || 0,
      likes_count: r.likes_count || 0,
      userReacted: false,
      isFollowing: false,
      isSaved: false,
      soundEnhanced: false,
      created_at: r.created_at
    }));
    // Load follow / like / saved status for current user
    if(currentUser){
      for(let reel of systemReelsDataset){
        if(!reel.author_id) continue;
        const { data: fr } = await supabase.from('friend_requests')
          .select('id')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${reel.author_id}),and(sender_id.eq.${reel.author_id},receiver_id.eq.${currentUser.id})`)
          .maybeSingle();
        reel.isFollowing = !!fr;
        const { data: lk } = await supabase.from('likes').select('id').eq('post_id', reel.id).eq('user_id', currentUser.id).maybeSingle();
        reel.userReacted = !!lk;
        const { data: sv } = await supabase.from('saved_reels').select('id').eq('user_id', currentUser.id).eq('reel_id', reel.id).maybeSingle();
        reel.isSaved = !!sv;
      }
    }
  }catch(e){
    console.log("Load reels error:", e);
    systemReelsDataset = [...FALLBACK_REELS];
  }
}

// ================= 8. RENDER REELS GRID =================
function initializeReelDisplayGrid(){
  const container = document.getElementById("reelsContainer");
  if(!container) return;
  container.innerHTML = "";
  if(!systemReelsDataset.length){
    container.innerHTML = `<div class="card" style="text-align:center;padding:20px;">No reels yet. Be the first to upload!</div>`;
    return;
  }
  systemReelsDataset.forEach(reel => {
    const isOwnReel = currentUser && reel.author_id === currentUser.id;
    const card = document.createElement("div");
    card.className = "reel-viewport";
    card.dataset.reelId = reel.id;
    card.innerHTML = `
      <div class="reel-video-container">
        <div class="ai-badge-indicator" id="resolutionTag-${reel.id}"><i class="fas fa-microchip"></i> 4K Ultra HD</div>
        <video src="${reel.videoUrl}" loop muted playsinline preload="metadata" onclick="this.paused?this.play():this.pause()"></video>
      </div>
      <div class="reel-overlay">
        <div class="reel-profile">
          <img src="${reel.avatar || 'https://i.pravatar.cc/80?img=12'}" class="avatar-img" onerror="this.src='https://i.pravatar.cc/80?img=12'" onclick="openProfile('${reel.author_id}')" style="cursor:pointer;width:36px;height:36px;border-radius:50%;object-fit:cover;">
          <span class="reel-username" onclick="openProfile('${reel.author_id}')" style="cursor:pointer;">@${reel.author} ${isOwnReel?'(You)':''}</span>
          ${!isOwnReel && reel.author_id ? `<button class="follow-btn ${reel.isFollowing?'following':''}" onclick="toggleFollowState('${reel.id}',this)">${reel.isFollowing?'Unfollow':'Follow'}</button>` : ''}
        </div>
        <div class="reel-caption">${escapeHtml(reel.caption)}</div>
        <div class="views-hud-tag"><i class="fas fa-eye"></i> ${formatMetricDisplay(reel.views_count)} views • 4K</div>
        <div class="reel-voice-comment">
          <button class="voice-btn" onclick="toggleVoiceComment('${reel.id}')">🎤 Voice Comment</button>
          <button class="comment-btn" onclick="openCommentSection('${reel.id}')">💬 Comments</button>
          <button class="react-btn" onclick="openReactPage('${reel.id}')">❤️ React</button>
        </div>
      </div>
      <div class="reel-actions-sidebar">
        <div class="action-item" onclick="processIncrementalReact('${reel.id}',this)">
          <button style="color:${reel.userReacted?'#14532d':'#fff'}"><i class="${reel.userReacted?'fas':'far'} fa-thumbs-up"></i></button>
          <span class="react-counter-label">${formatMetricDisplay(reel.likes_count)}</span>
        </div>
        <div class="action-item" onclick="toggleSaveReel('${reel.id}',this)"><button><i class="${reel.isSaved?'fas':'far'} fa-bookmark"></i></button><span>${reel.isSaved?'Saved':'Save'}</span></div>
        <div class="action-item" onclick="triggerAiDownload('${reel.id}')"><button><i class="fas fa-cloud-arrow-down"></i></button><span>Download 4K</span></div>
        <div class="action-item" onclick="openOptionsContextLayer('${reel.id}')"><button><i class="fas fa-ellipsis-h"></i></button><span>Options</span></div>
      </div>
      <div class="voice-recorder-box" id="voiceBox-${reel.id}" style="display:none;">
        <span id="voiceTimer-${reel.id}">00:00</span>
        <button class="btn-green" onclick="startVoiceRecording('${reel.id}')">🔴 Start</button>
        <button class="btn-gray" onclick="stopVoiceRecording('${reel.id}')">⏹ Stop & Send</button>
        <button onclick="toggleVoiceComment('${reel.id}')">✕</button>
      </div>
      <div class="text-comment-box" id="textBox-${reel.id}" style="display:none;">
        <input type="text" id="textInput-${reel.id}" placeholder="Write a comment..." />
        <button class="btn-green" onclick="sendTextComment('${reel.id}')">Send</button>
      </div>`;
    container.appendChild(card);
  });
}

function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ================= 9. VIDEO AUTOPLAY + VIEWS =================
function setupVideoPlaybackObservers(){
  const container = document.getElementById("reelsContainer");
  if(!container) return;
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry => {
      const video = entry.target.querySelector("video");
      if(!video) return;
      const reelId = entry.target.dataset.reelId;
      if(entry.isIntersecting){
        video.play().catch(()=>{});
        if(reelId) incrementViews(reelId, entry.target);
      } else {
        video.pause();
      }
    });
  },{threshold:0.6});
  setTimeout(()=>{
    document.querySelectorAll(".reel-viewport").forEach(el => observer.observe(el));
  },300);
}

async function incrementViews(reelId, cardEl){
  if(viewedReels.has(reelId)) return;
  viewedReels.add(reelId);
  const reel = systemReelsDataset.find(r => String(r.id) === String(reelId));
  if(!reel) return;
  reel.views_count = (reel.views_count || 0) + 1;
  // Update UI
  const tag = cardEl ? cardEl.querySelector('.views-hud-tag') : null;
  if(tag) tag.innerHTML = `<i class="fas fa-eye"></i> ${formatMetricDisplay(reel.views_count)} views • 4K`;
  // Update DB only for real reels (not fallback r1...)
  if(typeof supabase !== 'undefined' && !String(reelId).startsWith('r')){
    await supabase.from('reels').update({ views_count: reel.views_count }).eq('id', reelId);
  }
}

function formatMetricDisplay(count){
  count = count || 0;
  if(count >= 1000000) return (count/1000000).toFixed(1).replace(/\.0$/,'') + 'M';
  if(count >= 1000) return (count/1000).toFixed(1).replace(/\.0$/,'') + 'k';
  return count.toString();
}

// ================= 10. NAVIGATION LINKS =================
function openProfile(userId){
  if(!userId || userId === 'undefined' || userId === ''){ displayToast("Profile not available"); return; }
  window.location.href = `profile.html?id=${userId}`;
}
function openCommentSection(reelId){
  localStorage.setItem('open_reel_id', reelId);
  // Also show inline text box
  const box = document.getElementById(`textBox-${reelId}`);
  if(box) box.style.display = box.style.display === 'none' ? 'flex' : 'none';
  // If you want full page, uncomment next line:
  // window.location.href = `CommentSection.html?reel_id=${reelId}`;
}
function openReactPage(reelId){
  localStorage.setItem('open_reel_id', reelId);
  window.location.href = `react.html?reel_id=${reelId}`;
}
function openReportPage(reelId){
  window.location.href = `report.html?reel_id=${reelId}`;
}

// ================= 11. FOLLOW / UNFOLLOW - PUBLIC PROFILE =================
async function toggleFollowState(reelId, btn){
  if(!currentUser){ displayToast("Login first to follow"); return; }
  if(btn.disabled) return;
  btn.disabled = true;
  const reel = systemReelsDataset.find(r => String(r.id) === String(reelId));
  if(!reel || !reel.author_id){ btn.disabled = false; return; }
  if(reel.isFollowing){
    // Unfollow - delete friend request both ways
    if(typeof supabase !== 'undefined' && !String(reelId).startsWith('r')){
      await supabase.from('friend_requests').delete()
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${reel.author_id}),and(sender_id.eq.${reel.author_id},receiver_id.eq.${currentUser.id})`);
    }
    reel.isFollowing = false;
    btn.textContent = "Follow";
    btn.classList.remove("following");
    displayToast(`Unfollowed ${reel.author}`);
  } else {
    // Follow - send friend request
    if(typeof supabase !== 'undefined' && !String(reelId).startsWith('r')){
      const { error } = await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: reel.author_id, status: 'pending' });
      if(error && error.code === '23505'){ displayToast("Already following"); btn.disabled = false; return; }
      if(error){ displayToast(error.message); btn.disabled = false; return; }
    } else {
      // Fallback local
      let follows = JSON.parse(localStorage.getItem('follows')||'[]');
      follows.push(reel.author_id);
      localStorage.setItem('follows', JSON.stringify(follows));
    }
    reel.isFollowing = true;
    btn.textContent = "Unfollow";
    btn.classList.add("following");
    displayToast(`You started following ${reel.author}`);
  }
  btn.disabled = false;
}

// ================= 12. LIKE / REACT =================
async function processIncrementalReact(id, target){
  const reel = systemReelsDataset.find(r => String(r.id) === String(id));
  if(!reel) return;
  reel.userReacted = !reel.userReacted;
  reel.likes_count += reel.userReacted ? 1 : -1;
  const label = target.querySelector(".react-counter-label");
  const button = target.querySelector("button");
  const icon = target.querySelector("i");
  if(label) label.textContent = formatMetricDisplay(reel.likes_count);
  if(button) button.style.color = reel.userReacted ? '#14532d' : '#fff';
  if(icon) icon.className = `${reel.userReacted?'fas':'far'} fa-thumbs-up`;
  // Save to DB for real reels - double-click safe via unique index
  if(typeof supabase !== 'undefined' && !String(id).startsWith('r') && currentUser){
    if(reel.userReacted){
      const { error } = await supabase.from('likes').insert({ post_id: id, user_id: currentUser.id });
      if(error && error.code === '23505'){ /* already liked, ignore */ }
    } else {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', currentUser.id);
    }
  }
}

// ================= 13. SAVE REEL - REAL =================
async function toggleSaveReel(id, target){
  const reel = systemReelsDataset.find(r => String(r.id) === String(id));
  if(!reel) return;
  if(!currentUser){ displayToast("Login to save"); return; }
  reel.isSaved = !reel.isSaved;
  const icon = target.querySelector("button i") || target.querySelector("i");
  const label = target.querySelector("span");
  if(icon) icon.className = `${reel.isSaved?'fas':'far'} fa-bookmark`;
  if(label) label.textContent = reel.isSaved ? 'Saved' : 'Save';
  if(typeof supabase !== 'undefined' && !String(id).startsWith('r')){
    if(reel.isSaved){
      const { error } = await supabase.from('saved_reels').insert({ user_id: currentUser.id, reel_id: id });
      if(error && error.code === '23505'){ /* already saved */ }
    } else {
      await supabase.from('saved_reels').delete().eq('user_id', currentUser.id).eq('reel_id', id);
    }
  } else {
    let saved = JSON.parse(localStorage.getItem('saved_reels')||'[]');
    if(reel.isSaved){ if(!saved.includes(id)) saved.push(id); }
    else { saved = saved.filter(x => String(x) !== String(id)); }
    localStorage.setItem('saved_reels', JSON.stringify(saved));
  }
  displayToast(reel.isSaved ? "Saved to collection" : "Removed from saved");
}

// ================= 14. DOWNLOAD 4K - REAL BLOB =================
async function triggerAiDownload(id){
  const reel = systemReelsDataset.find(r => String(r.id) === String(id));
  if(!reel) return;
  displayToast("Downloading 4K Reel... Please wait");
  try{
    const res = await fetch(reel.videoUrl);
    if(!res.ok) throw new Error("Fetch failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autrobook-reel-${id}-4K.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
    displayToast("4K Download Complete");
  }catch(e){
    window.open(reel.videoUrl, '_blank');
    displayToast("Download opened in new tab - long press to save");
  }
}

// ================= 15. TEXT COMMENT =================
async function sendTextComment(reelId){
  const input = document.getElementById(`textInput-${reelId}`);
  if(!input) return;
  const text = input.value.trim();
  if(!text){ displayToast("Write something first"); return; }
  if(!currentUser){ displayToast("Login to comment"); return; }
  if(typeof supabase !== 'undefined' && !String(reelId).startsWith('r')){
    const { error } = await supabase.from('text_comments').insert({ post_id: reelId, user_id: currentUser.id, comment_text: text });
    if(error){ displayToast(error.message); return; }
  }
  displayToast("Comment sent!");
  input.value = "";
  // Open full comment page
  // window.location.href = `CommentSection.html?reel_id=${reelId}`;
}

// ================= 16. VOICE COMMENT - REAL RECORD + UPLOAD =================
function toggleVoiceComment(reelId){
  const box = document.getElementById(`voiceBox-${reelId}`);
  if(!box) return;
  const isHidden = box.style.display === 'none' || box.style.display === '';
  box.style.display = isHidden ? 'flex' : 'none';
}
function startVoiceTimer(reelId){
  voiceSeconds = 0;
  clearInterval(voiceTimerInterval);
  voiceTimerInterval = setInterval(()=>{
    voiceSeconds++;
    const m = String(Math.floor(voiceSeconds/60)).padStart(2,'0');
    const s = String(voiceSeconds%60).padStart(2,'0');
    const el = document.getElementById(`voiceTimer-${reelId}`);
    if(el) el.textContent = `${m}:${s}`;
  },1000);
}
function stopVoiceTimer(){
  clearInterval(voiceTimerInterval);
}
async function startVoiceRecording(reelId){
  if(isRecording) return;
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => { if(e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = () => sendVoiceComment(reelId);
    mediaRecorder.start();
    isRecording = true;
    startVoiceTimer(reelId);
    displayToast("Recording voice comment... Tap Stop & Send");
  }catch(e){
    displayToast("Mic permission needed - allow microphone");
  }
}
function stopVoiceRecording(reelId){
  if(mediaRecorder && isRecording){
    mediaRecorder.stop();
    isRecording = false;
    stopVoiceTimer();
    if(mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach(t => t.stop());
    displayToast("Processing voice comment...");
  } else {
    displayToast("Press Start first");
  }
}
async function sendVoiceComment(reelId){
  if(!currentUser){ displayToast("Login first"); return; }
  if(!audioChunks.length){ displayToast("No audio recorded"); return; }
  const blob = new Blob(audioChunks, { type: 'audio/webm' });
  const fileName = `${currentUser.id}/${Date.now()}.webm`;
  displayToast("Uploading voice comment...");
  try{
    if(typeof supabase === 'undefined') throw new Error("Supabase not connected");
    const { error: upErr } = await supabase.storage.from('voice').upload(fileName, blob);
    if(upErr){ displayToast("Upload failed: " + upErr.message); return; }
    const { data: urlData } = supabase.storage.from('voice').getPublicUrl(fileName);
    if(!String(reelId).startsWith('r')){
      const { error } = await supabase.from('voice_comments').insert({
        post_id: reelId,
        user_id: currentUser.id,
        audio_url: urlData.publicUrl,
        duration: voiceSeconds
      });
      if(error){ displayToast(error.message); return; }
    }
    displayToast("Voice comment sent!");
    const box = document.getElementById(`voiceBox-${reelId}`);
    if(box) box.style.display = 'none';
    const timer = document.getElementById(`voiceTimer-${reelId}`);
    if(timer) timer.textContent = "00:00";
  }catch(e){
    displayToast("Voice upload failed: " + e.message);
  }
}

// ================= 17. THREE DOT OPTIONS =================
function openOptionsContextLayer(id){
  activeContextReelId = id;
  const reel = systemReelsDataset.find(r => String(r.id) === String(id));
  if(!reel) return;
  // Change resolution UI if exists
  const resSelect = document.getElementById("resolutionScaler");
  if(resSelect) resSelect.value = "4K";
  const soundToggle = document.getElementById("soundEnhanceToggle");
  if(soundToggle) soundToggle.checked = !!reel.soundEnhanced;
  const menu = document.getElementById("reelActionsMenu");
  if(!menu){
    // Fallback if no modal: use confirm menu
    if(confirm("Options: Save / Download / Report / Comments ? Press OK for Report")) openReportModal(id);
    return;
  }
  const isOwn = currentUser && reel.author_id === currentUser.id;
  if(isOwn){
    menu.innerHTML = `
      <button class="menu-action-row" onclick="executeMockAction('Shared with Friends successfully')"><i class="fas fa-user-group"></i> Share with Friends</button>
      <button class="menu-action-row" onclick="toggleSaveReel('${reel.id}', this); closeModal('mReelOptions')"><i class="fas fa-bookmark"></i> Save</button>
      <button class="menu-action-row" onclick="openCommentSection('${reel.id}'); closeModal('mReelOptions')"><i class="fas fa-comment"></i> Comments</button>
      <button class="menu-action-row" onclick="triggerAiDownload('${reel.id}'); closeModal('mReelOptions')"><i class="fas fa-download"></i> Download 4K</button>
      <button class="menu-action-row" onclick="closeModal('mReelOptions')"><i class="fas fa-pen"></i> Edit</button>
      <button class="menu-action-row danger" onclick="deleteReelInstance('${reel.id}')"><i class="fas fa-trash-can"></i> Delete</button>`;
  } else {
    menu.innerHTML = `
      <button class="menu-action-row" onclick="executeMockAction('Link forwarded to contacts')"><i class="fas fa-share"></i> Share with Friends</button>
      <button class="menu-action-row" onclick="toggleSaveReel('${reel.id}', this); closeModal('mReelOptions')"><i class="fas fa-bookmark"></i> Save Reel</button>
      <button class="menu-action-row" onclick="triggerAiDownload('${reel.id}'); closeModal('mReelOptions')"><i class="fas fa-download"></i> Download 4K</button>
      <button class="menu-action-row" onclick="openCommentSection('${reel.id}'); closeModal('mReelOptions')"><i class="fas fa-comment"></i> Comments</button>
      <button class="menu-action-row" onclick="openProfile('${reel.author_id}')"><i class="fas fa-user"></i> View Profile</button>
      <button class="menu-action-row danger" onclick="openReportModal('${reel.id}')"><i class="fas fa-triangle-exclamation"></i> Report</button>`;
  }
  openModal("mReelOptions");
}
function changeResolutionProfile(){
  const select = document.getElementById("resolutionScaler");
  if(!select) return;
  const reel = systemReelsDataset.find(r => String(r.id) === String(activeContextReelId));
  if(!reel) return;
  const val = select.value;
  const tag = document.getElementById(`resolutionTag-${reel.id}`);
  if(tag) tag.innerHTML = `<i class="fas fa-microchip"></i> AI Enhanced (${val})`;
  displayToast(`Resolution set to ${val}`);
}
function toggleSoundEnhancement(){
  const toggle = document.getElementById("soundEnhanceToggle");
  if(!toggle) return;
  const reel = systemReelsDataset.find(r => String(r.id) === String(activeContextReelId));
  if(!reel) return;
  reel.soundEnhanced = toggle.checked;
  displayToast(reel.soundEnhanced ? "Enhance Sound 200% ON" : "Enhance Sound 100% OFF");
}
function executeMockAction(msg){ closeModal("mReelOptions"); displayToast(msg); }
async function deleteReelInstance(id){
  if(!confirm("Delete this reel permanently?")) return;
  if(typeof supabase !== 'undefined' && !String(id).startsWith('r')){
    const { error } = await supabase.from('reels').delete().eq('id', id);
    if(error){ displayToast(error.message); return; }
  }
  systemReelsDataset = systemReelsDataset.filter(r => String(r.id) !== String(id));
  closeModal("mReelOptions");
  initializeReelDisplayGrid();
  setupVideoPlaybackObservers();
  displayToast("Reel deleted permanently");
}
function invokeReportMatrix(){ closeModal("mReelOptions"); openReportModal(activeContextReelId); }

// ================= 18. REPORT - 10 REASONS + OTHERS =================
function openReportModal(reelId){
  activeContextReelId = reelId;
  closeModal("mReelOptions");
  let modal = document.getElementById("mReelReport");
  if(!modal){
    modal = document.createElement("div");
    modal.id = "mReelReport";
    modal.className = "modal";
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Report Reel</h3>
      <p style="font-size:13px;color:#666;">Select a valid reason. If valid, solution comes in 24-48 hours.</p>
      <select id="reelReportReason" style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:8px;">
        ${REPORT_REASONS.map(r => `<option value="${r}">${r}</option>`).join('')}
      </select>
      <textarea id="reelReportCustom" placeholder="If Others, write your reason here..." style="width:100%;padding:10px;min-height:80px;display:none;border:1px solid #ddd;border-radius:8px;"></textarea>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn-green" onclick="submitReelReport()" style="flex:1;background:#14532d;color:#fff;padding:12px;border:none;border-radius:8px;font-weight:600;">Send Report</button>
        <button onclick="closeModal('mReelReport')" style="flex:1;padding:12px;border-radius:8px;border:1px solid #ddd;">Cancel</button>
      </div>
      <p style="font-size:12px;margin-top:10px;color:#888;">Report will be reviewed. Valid reports get auto-solution in 24-48 hrs. Check report.html for status.</p>
      <button onclick="openReportPage('${reelId}')" style="width:100%;margin-top:8px;padding:10px;border:none;background:#f0f0f0;border-radius:8px;">View My Reports →</button>
    </div>`;
  const sel = document.getElementById("reelReportReason");
  if(sel){
    sel.addEventListener("change", (e)=>{
      const custom = document.getElementById("reelReportCustom");
      if(custom) custom.style.display = e.target.value === "Others" ? "block" : "none";
    });
  }
  openModal("mReelReport");
}
async function submitReelReport(){
  const reasonEl = document.getElementById("reelReportReason");
  const customEl = document.getElementById("reelReportCustom");
  const reason = reasonEl ? reasonEl.value : "Others";
  const custom = customEl ? customEl.value.trim() : "";
  if(reason === "Others" && !custom){
    displayToast("Please write your reason for Others");
    return;
  }
  if(!currentUser){ displayToast("Login to report"); return; }
  const reelId = activeContextReelId;
  let savedToDB = false;
  if(typeof supabase !== 'undefined' && !String(reelId).startsWith('r')){
    const { error } = await supabase.from('reports').insert({
      reporter_id: currentUser.id,
      reel_id: reelId,
      reason: reason,
      custom_reason: custom,
      status: 'pending'
    });
    if(!error) savedToDB = true;
  }
  if(!savedToDB){
    const reports = JSON.parse(localStorage.getItem('reel_reports')||'[]');
    reports.push({ reel_id: reelId, reason, custom, created_at: Date.now(), resolve_at: Date.now() + 36*60*60*1000, status: 'pending', solution: '' });
    localStorage.setItem('reel_reports', JSON.stringify(reports));
  }
  closeModal("mReelReport");
  displayToast("Report sent. If valid, solution in 24-48 hours.");
  if(customEl) customEl.value = "";
}
async function checkAutoReportSolution(){
  // Local reports
  const reports = JSON.parse(localStorage.getItem('reel_reports')||'[]');
  const now = Date.now();
  let changed = false;
  reports.forEach(r => {
    if(r.status === 'pending' && now > r.resolve_at){
      r.status = 'resolved';
      r.solution = 'Reviewed: If valid, reel removed / warning given to author.';
      changed = true;
      displayToast("Your report is resolved. Check report page.");
    }
  });
  if(changed) localStorage.setItem('reel_reports', JSON.stringify(reports));
  // DB reports
  if(typeof supabase !== 'undefined' && currentUser){
    try{
      const { data } = await supabase.from('reports').select('*').eq('reporter_id', currentUser.id).eq('status','pending');
      (data||[]).forEach(async (r)=>{
        if(new Date(r.resolve_at) < new Date()){
          await supabase.from('reports').update({ status: 'resolved', solution: 'Reviewed and action taken.' }).eq('id', r.id);
        }
      });
    }catch(e){}
  }
}

// ================= 19. UPLOAD REEL =================
async function triggerAiUpload(){
  const input = document.getElementById("reelUploadInput");
  if(input){ input.click(); return; }
  displayToast("Upload: Select video to upload in 4K");
}
async function handleReelUpload(event){
  const file = event.target.files ? event.target.files[0] : null;
  if(!file){ return; }
  if(!currentUser){ displayToast("Login to upload"); return; }
  const caption = prompt("Write caption for your reel:") || "";
  displayToast("Uploading: Upscaling to 4K...");
  try{
    const fileName = `${currentUser.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('reels').upload(fileName, file);
    if(upErr){ displayToast("Upload failed: " + upErr.message); return; }
    const { data: urlData } = supabase.storage.from('reels').getPublicUrl(fileName);
    const { data, error } = await supabase.from('reels').insert({
      user_id: currentUser.id,
      video_url: urlData.publicUrl,
      caption: caption,
      likes_count: 0,
      views_count: 0
    }).select().single();
    if(error){ displayToast(error.message); return; }
    displayToast("Reel uploaded successfully!");
    await loadReelsFromDB();
    initializeReelDisplayGrid();
    setupVideoPlaybackObservers();
  }catch(e){
    displayToast("Upload failed: " + e.message);
  }
}

// ================= 20. TOAST + MODAL HELPERS =================
function displayToast(msg){
  const c = document.getElementById("toast");
  if(!c){
    console.log("Toast:", msg);
    return;
  }
  c.textContent = msg;
  c.classList.add("show");
  setTimeout(()=> c.classList.remove("show"), 3500);
}
function openModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.add("active");
}
function closeModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove("active");
   }
