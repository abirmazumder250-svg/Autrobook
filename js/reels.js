// ===== AUTROBOOK REELS.JS - SYSTEM DEFAULT THEME =====
const currentSessionUser = "Abir Mazumder";

// THEME - SYSTEM DEFAULT + MANUAL TOGGLE
function applyTheme(){
  var saved = localStorage.getItem("autro_theme"); // light / dark / system
  document.body.classList.remove("theme-dark","theme-light");
  if(saved==="dark") document.body.classList.add("theme-dark");
  if(saved==="light") document.body.classList.add("theme-light");
  // system = no class, CSS prefers-color-scheme will handle
}
function toggleTheme(){
  var cur = localStorage.getItem("autro_theme") || "system";
  var next = cur==="system" ? "dark" : (cur==="dark" ? "light" : "system");
  localStorage.setItem("autro_theme", next);
  applyTheme();
  displayToast("Theme: " + next.charAt(0).toUpperCase()+next.slice(1) + (next==="system" ? " (Phone Default)" : ""));
}
applyTheme();

// DATA - REAL VIDEOS
let systemReelsDataset = [
  { id:101, author:"Sarah Jenkins", caption:"Testing systemic matrix loops with AI resolution scaler! AI is changing everything 🚀", resolution:"4K Quad", videoUrl:"https://cdn.coverr.co/videos/coverr-a-woman-walking-in-a-park-1584/1080p.mp4", views:245300, reacts:999, userReacted:false, soundEnhanced:false, isFollowing:false },
  { id:102, author:"Rafiq Hasan", caption:"Exploring scenic stream layouts with real-time responsive CSS. Dhaka is beautiful ❤️", resolution:"8K Cinema", videoUrl:"https://cdn.coverr.co/videos/coverr-city-traffic-at-night-1585/1080p.mp4", views:12400, reacts:1420, userReacted:false, soundEnhanced:false, isFollowing:false },
  { id:103, author:"Anika Rahman", caption:"Morning productivity sprints using clean frontend setups! ☕ #coding #morning", resolution:"4K Quad", videoUrl:"https://cdn.coverr.co/videos/coverr-working-on-a-laptop-1586/1080p.mp4", views:8500, reacts:340, userReacted:false, soundEnhanced:false, isFollowing:false },
  { id:104, author:"Taskin Ahmed", caption:"AI enhanced sound mechanics showing 200% threshold performance. Listen with headphones 🎧", resolution:"16K Neural", videoUrl:"https://cdn.coverr.co/videos/coverr-a-man-playing-guitar-1587/1080p.mp4", views:102500, reacts:1205, userReacted:false, soundEnhanced:false, isFollowing:false },
  { id:105, author:"Emma Watson", caption:"Modular app design blocks look cleaner than standard configs. UI tips inside ✨", resolution:"4K Quad", videoUrl:"https://cdn.coverr.co/videos/coverr-designing-a-website-1588/1080p.mp4", views:310000, reacts:5400, userReacted:false, soundEnhanced:false, isFollowing:false },
  { id:106, author:"Sajid Khan", caption:"Emergency SOS tracking layers integrated into topbar successfully. Safety first! 🛡️", resolution:"16K Neural", videoUrl:"https://cdn.coverr.co/videos/coverr-emergency-vehicles-1589/1080p.mp4", views:15400, reacts:2100, userReacted:false, soundEnhanced:false, isFollowing:false },
  { id:107, author:"Abir Mazumder", caption:"My first Autrobook Reel! Welcome everyone to my new platform. Follow for more 🔥", resolution:"8K Cinema", videoUrl:"https://cdn.coverr.co/videos/coverr-a-man-talking-to-the-camera-1590/1080p.mp4", views:5200, reacts:890, userReacted:false, soundEnhanced:false, isFollowing:false }
];

document.addEventListener("DOMContentLoaded", () => {
  initializeReelDisplayGrid();
  setupVideoPlaybackObservers();
});

function initializeReelDisplayGrid(){
  const container=document.getElementById("reelsContainer"); if(!container) return;
  container.innerHTML="";
  systemReelsDataset.forEach(reel=>{
    const isOwnReel=reel.author===currentSessionUser;
    const card=document.createElement("div"); card.className="reel-viewport";
    card.innerHTML=`
      <div class="reel-video-container">
        <div class="ai-badge-indicator" id="resolutionTag-${reel.id}"><i class="fas fa-microchip"></i> AI Enhanced (${reel.resolution})</div>
        <video src="${reel.videoUrl}" loop muted playsinline preload="metadata" onclick="this.paused?this.play():this.pause()"></video>
      </div>
      <div class="reel-overlay">
        <div class="reel-profile">
          <div class="avatar"><i class="fas fa-user"></i></div>
          <span class="reel-username">@${reel.author} ${isOwnReel?'(You)':''}</span>
          ${!isOwnReel?`<button class="follow-btn ${reel.isFollowing?'following':''}" onclick="toggleFollowState(${reel.id},this)">${reel.isFollowing?'Following':'Follow'}</button>`:''}
        </div>
        <div class="reel-caption">${reel.caption}</div>
        <div class="views-hud-tag"><i class="fas fa-eye"></i> ${formatMetricDisplay(reel.views)} views</div>
      </div>
      <div class="reel-actions-sidebar">
        <div class="action-item" onclick="processIncrementalReact(${reel.id},this)">
          <button style="color:${reel.userReacted?'#4ade80':'#fff'}"><i class="${reel.userReacted?'fas':'far'} fa-thumbs-up"></i></button>
          <span class="react-counter-label">${formatMetricDisplay(reel.reacts)}</span>
        </div>
        <div class="action-item" onclick="triggerAiDownload(${reel.id})"><button><i class="fas fa-cloud-arrow-down"></i></button><span>Download</span></div>
        <div class="action-item" onclick="openOptionsContextLayer(${reel.id})"><button><i class="fas fa-ellipsis-h"></i></button><span>Options</span></div>
      </div>`;
    container.appendChild(card);
  });
}

function setupVideoPlaybackObservers(){
  const container=document.getElementById("reelsContainer"); if(!container) return;
  const observer=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      const video=entry.target.querySelector("video"); if(!video) return;
      if(entry.isIntersecting){ video.play().catch(()=>{}); } else { video.pause(); }
    });
  },{threshold:0.6});
  setTimeout(()=>{ document.querySelectorAll(".reel-viewport").forEach(el=>observer.observe(el)); },300);
}

function formatMetricDisplay(count){ if(count>=1000) return (count/1000).toFixed(1).replace(/\.0$/,'')+'k'; return count.toString(); }

function toggleFollowState(id,btn){
  const reel=systemReelsDataset.find(r=>r.id===id); if(!reel) return;
  reel.isFollowing=!reel.isFollowing;
  btn.classList.toggle("following",reel.isFollowing);
  btn.textContent=reel.isFollowing?"Following":"Follow";
  displayToast(reel.isFollowing?`You started following ${reel.author}`:`Unfollowed ${reel.author}`);
}

function processIncrementalReact(id,target){
  const reel=systemReelsDataset.find(r=>r.id===id); if(!reel) return;
  reel.userReacted=!reel.userReacted; reel.reacts+=reel.userReacted?1:-1;
  const label=target.querySelector(".react-counter-label"); const button=target.querySelector("button"); const icon=target.querySelector("i");
  label.textContent=formatMetricDisplay(reel.reacts);
  button.style.color=reel.userReacted?'#4ade80':'#fff';
  icon.className=`${reel.userReacted?'fas':'far'} fa-thumbs-up`;
}

let activeContextReelId=null;
function openOptionsContextLayer(id){
  activeContextReelId=id;
  const reel=systemReelsDataset.find(r=>r.id===id); if(!reel) return;
  document.getElementById("resolutionScaler").value=reel.resolution.includes("16K")?"16K":(reel.resolution.includes("8K")?"8K":"4K");
  document.getElementById("soundEnhanceToggle").checked=reel.soundEnhanced;
  const menu=document.getElementById("reelActionsMenu");
  if(reel.author===currentSessionUser){
    menu.innerHTML=`
      <button class="menu-action-row" onclick="executeMockAction('Shared with Friends successfully')"><i class="fas fa-user-group"></i> Share with Friends</button>
      <button class="menu-action-row" onclick="executeMockAction('Saved to Collection')"><i class="fas fa-bookmark"></i> Save</button>
      <button class="menu-action-row" onclick="executeMockAction('Edit module opened')"><i class="fas fa-pen"></i> Edit</button>
      <button class="menu-action-row danger" onclick="deleteReelInstance(${reel.id})"><i class="fas fa-trash-can"></i> Delete</button>`;
  } else {
    menu.innerHTML=`
      <button class="menu-action-row" onclick="executeMockAction('Link forwarded to contacts')"><i class="fas fa-share"></i> Share with Friends</button>
      <button class="menu-action-row" onclick="executeMockAction('Saved to Collection')"><i class="fas fa-bookmark"></i> Save</button>
      <button class="menu-action-row danger" onclick="invokeReportMatrix()"><i class="fas fa-triangle-exclamation"></i> Report</button>`;
  }
  openModal("mReelOptions");
}
function changeResolutionProfile(){
  const select=document.getElementById("resolutionScaler");
  const reel=systemReelsDataset.find(r=>r.id===activeContextReelId); if(!reel) return;
  reel.resolution=select.value==="16K"?"16K Neural":(select.value==="8K"?"8K Cinema":"4K Quad");
  const tag=document.getElementById(`resolutionTag-${reel.id}`);
  if(tag) tag.innerHTML=`<i class="fas fa-microchip"></i> AI Enhanced (${reel.resolution})`;
  displayToast(`Resolution scaled to ${reel.resolution}`);
}
function toggleSoundEnhancement(){
  const toggle=document.getElementById("soundEnhanceToggle");
  const reel=systemReelsDataset.find(r=>r.id===activeContextReelId); if(!reel) return;
  reel.soundEnhanced=toggle.checked;
  displayToast(reel.soundEnhanced?"Enhance Sound 200% ON":"Enhance Sound 100% OFF");
}
function executeMockAction(msg){ closeModal("mReelOptions"); displayToast(msg); }
function deleteReelInstance(id){
  systemReelsDataset=systemReelsDataset.filter(r=>r.id!==id);
  closeModal("mReelOptions"); initializeReelDisplayGrid(); setupVideoPlaybackObservers(); displayToast("Reel deleted permanently");
}
function invokeReportMatrix(){ closeModal("mReelOptions"); openModal("mReelReport"); }
function submitReelReport(){
  const reason=document.getElementById("reelReportReason").value;
  closeModal("mReelReport"); displayToast("Report sent. Review in 24-48 hrs.");
  localStorage.setItem(`reported_reel_reason_${activeContextReelId}`, reason);
  document.getElementById("reelReportReason").value="";
}
function triggerAiUpload(){ displayToast("Processing: Upscaling to 4K-16K + Enhancing..."); }
function triggerAiDownload(id){ displayToast("Downloading AI Enhanced Reel..."); }
function displayToast(msg){ const c=document.getElementById("toast"); if(!c) return; c.textContent=msg; c.classList.add("show"); setTimeout(()=>c.classList.remove("show"),3500); }
function openModal(id){ document.getElementById(id)?.classList.add("active"); }
function closeModal(id){ document.getElementById(id)?.classList.remove("active"); }
