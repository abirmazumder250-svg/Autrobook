// ========== REACTION + SOUND SYSTEM ==========
function playSound(id){
  const sound = document.getElementById(id);
  if(sound){
    sound.currentTime = 0; // restart
    sound.play().catch(e => console.log("Sound error:", e));
  }
}

// Like / Dislike React
function reactPost(btn, type){
  const postCard = btn.closest('.post-card');
  
  // 1. Add pop animation
  btn.classList.add('pop');
  setTimeout(() => btn.classList.remove('pop'), 300);

  // 2. Play Sound + Toggle Active
  if(type === 'like'){
    playSound('like-sound');
    btn.classList.toggle('like-active');
    // remove dislike if active
    const dislikeBtn = postCard.querySelector('.action-btn[onclick*="dislike"]');
    dislikeBtn.classList.remove('dislike-active');
    btn.innerHTML = btn.classList.contains('like-active') ? '👍 Liked' : '👍 Like';
  }
  
  if(type === 'dislike'){
    playSound('dislike-sound');
    btn.classList.toggle('dislike-active');
    // remove like if active
    const likeBtn = postCard.querySelector('.action-btn[onclick*="like"]');
    likeBtn.classList.remove('like-active');
    btn.innerHTML = btn.classList.contains('dislike-active') ? '👎 Disliked' : '👎 Dislike';
  }
  
  // TODO: Here send to backend to save reaction
}

// ========== POST MENU SYSTEM ==========
function togglePostMenu(btn){
  const dropdown = btn.nextElementSibling;
  document.querySelectorAll('.post-menu-dropdown').forEach(d => {
    if(d !== dropdown) d.classList.add('hidden');
  });
  dropdown.classList.toggle('hidden');
}

// Close menu when clicking outside
document.addEventListener('click', function(e){
  if(!e.target.closest('.post-menu-wrapper')){
    document.querySelectorAll('.post-menu-dropdown').forEach(d => d.classList.add('hidden'));
  }
});

// ========== REPORT SYSTEM ==========
let reportTarget = {type: '', id: ''};

function reportPost(postId){
  reportTarget = {type: 'post', id: postId};
  document.getElementById('report-modal').classList.remove('hidden');
  togglePostMenu(document.querySelector(`[data-post-id="${postId}"] .post-menu`));
}

function reportComment(commentId){
  reportTarget = {type: 'comment', id: commentId};
  document.getElementById('report-modal').classList.remove('hidden');
}

function submitReport(reason){
  console.log(`Reporting ${reportTarget.type} ID: ${reportTarget.id} for: ${reason}`);
  closeModal();
  showToast(`Thank you. We received your report: ${reason}`);
  // TODO: Send to backend
}

function closeModal(){
  document.getElementById('report-modal').classList.add('hidden');
}

// ========== COMMENT SYSTEM ==========
function toggleComments(btn){
  const postCard = btn.closest('.post-card');
  const commentSection = postCard.querySelector('.comment-section');
  const disabledMsg = postCard.querySelector('.comments-disabled');
  
  commentSection.classList.toggle('hidden');
  disabledMsg.classList.toggle('hidden');
  
  const isHidden = commentSection.classList.contains('hidden');
  btn.innerText = isHidden ? '🔓 Turn On Comments' : '🔒 Turn Off Comments';
  showToast(isHidden ? 'Comments turned off' : 'Comments turned on');
}

function openComments(){
  showToast('Comment box focused');
}

// ========== VOICE COMMENT 30s ==========
let mediaRecorder;
let audioChunks = [];
let recordingTimer;
let recordingSeconds = 0;

async function startVoiceComment(btn){
  if(mediaRecorder && mediaRecorder.state === "recording"){
    // Stop recording
    mediaRecorder.stop();
    clearInterval(recordingTimer);
    btn.innerText = '🎤';
    return;
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    recordingSeconds = 0;
    
    btn.innerText = '⏹️ 0s';
    btn.style.background = 'var(--danger)';
    
    // 30 second timer
    recordingTimer = setInterval(() => {
      recordingSeconds++;
      btn.innerText = `⏹️ ${recordingSeconds}s`;
      if(recordingSeconds >= 30){
        mediaRecorder.stop();
        clearInterval(recordingTimer);
      }
    }, 1000);
    
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      console.log('Voice comment recorded:', audioBlob);
      btn.innerText = '🎤';
      btn.style.background = 'var(--brand)';
      stream.getTracks().forEach(track => track.stop());
      showToast('Voice comment ready to send!');
      // TODO: Upload audioBlob to server
    };
    
    mediaRecorder.start();
    showToast('Recording... Hold max 30s');
    
  } catch(err){
    console.error('Mic error:', err);
    showToast('Microphone permission denied');
  }
}

// ========== OTHER HELPERS ==========
function savePost(){
  showToast('Post saved!');
  closeModal();
}
function sharePost(){
  showToast('Share options coming soon!');
}
