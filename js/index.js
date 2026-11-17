// Global State
let currentUser = {
  name: "Abir Mazumder",
  isVerified: true, // Black verified
  avatar: "fa-user"
};

// Mock Database
let posts = [
  {
    id: 1,
    author: "Autrobook Official",
    isOfficial: true,
    time: Date.now() - 5000,
    content: "Welcome to Autrobook Social! A safety-first social network built for community protection and instant emergency dispatch.",
    reactions: { "❤️": 1200, "👍": 850, "😮": 15 },
    userReaction: null,
    comments: [
      {
        id: 101,
        author: "Rafiq Hasan",
        text: "Great initiative! Stay safe everyone.",
        time: Date.now() - 20000,
        reactions: { "👍": 12 },
        userReaction: null,
        replies: []
      }
    ]
  }
];

// --- UTILITIES ---
function formatCount(num) {
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'k';
  return num;
}

function timeAgo(timestamp) {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

// Live Time Counter
setInterval(() => {
  document.querySelectorAll('.live-time').forEach(el => {
    const timestamp = parseInt(el.getAttribute('data-time'));
    el.innerText = timeAgo(timestamp);
  });
}, 60000);

// --- RENDER FEED ---
function renderFeed() {
  const container = document.getElementById('feedContainer');
  container.innerHTML = '';

  posts.forEach(post => {
    const postEl = document.createElement('div');
    postEl.className = 'post';
    postEl.innerHTML = `
      <div class="post-header">
        <div style="display:flex; gap:10px; align-items:center;">
          <div class="avatar sm"><i class="fas ${post.isOfficial ? 'fa-shield-halved' : 'fa-user'}"></i></div>
          <div>
            <div class="post-author">${post.author} ${post.isOfficial ? '<span class="vbadge"><i class="fas fa-check"></i></span>' : ''}</div>
            <div class="post-meta"><i class="far fa-clock"></i> <span class="live-time" data-time="${post.time}">${timeAgo(post.time)}</span> • Public</div>
          </div>
        </div>
        <div style="position: relative;">
          <button class="post-menu-btn" onclick="togglePostMenu(${post.id})"><i class="fas fa-ellipsis-h"></i></button>
          <div class="dropdown-menu" id="menu-${post.id}">
            <div class="dropdown-item" onclick="savePost(${post.id})"><i class="fas fa-bookmark"></i> Save Post</div>
            <div class="dropdown-item" onclick="sharePost()"><i class="fas fa-share"></i> Share Post</div>
            ${!post.isOfficial ? `<div class="dropdown-item" style="color:red;" onclick="openReportModal()"><i class="fas fa-flag"></i> Report</div>` : ''}
          </div>
        </div>
      </div>
      
      <div class="post-content">${post.content}</div>
      
      <div class="post-stats">
        <div class="reaction-summary">
          ${Object.entries(post.reactions).map(([emoji, count]) => count > 0 ? emoji : '').join('')} 
          ${formatCount(Object.values(post.reactions).reduce((a, b) => a + b, 0))}
        </div>
        <div class="comment-summary" onclick="toggleComments(${post.id})">
          ${post.comments.length} Comments
        </div>
      </div>

      <div class="post-actions-bar">
        <div class="action-btn" onmouseleave="hideReactionPopup(${post.id})">
          <div class="reaction-popup" id="reaction-popup-${post.id}">
            <span class="reaction-icon" onclick="reactToPost(${post.id}, '❤️')">❤️</span>
            <span class="reaction-icon" onclick="reactToPost(${post.id}, '👍')">👍</span>
            <span class="reaction-icon" onclick="reactToPost(${post.id}, '😆')">😆</span>
            <span class="reaction-icon" onclick="reactToPost(${post.id}, '😮')">😮</span>
            <span class="reaction-icon" onclick="reactToPost(${post.id}, '😢')">😢</span>
            <span class="reaction-icon" onclick="reactToPost(${post.id}, '😠')">😠</span>
          </div>
          <div onmouseenter="showReactionPopup(${post.id})" onclick="reactToPost(${post.id}, '👍')" id="main-react-${post.id}" style="display:flex; align-items:center; gap:8px; ${post.userReaction ? 'color:var(--primary);' : ''}">
            ${post.userReaction ? post.userReaction : '<i class="far fa-thumbs-up"></i>'} 
            ${post.userReaction ? 'Reacted' : 'Like'}
          </div>
        </div>
        <button class="action-btn" onclick="toggleComments(${post.id})"><i class="far fa-comment"></i> Comment</button>
        <button class="action-btn" onclick="sharePost()"><i class="far fa-share-from-square"></i> Share</button>
      </div>

      <div class="comments-section" id="comments-${post.id}">
        <div class="comment-box">
          <div class="avatar sm"><i class="fas fa-user"></i></div>
          <div class="comment-input-wrapper">
            <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." onkeypress="handleCommentEnter(event, ${post.id})">
            <button class="voice-btn" onclick="toggleVoiceRecord(this, ${post.id})" title="Record Voice"><i class="fas fa-microphone"></i></button>
            <button class="send-btn" onclick="addTextComment(${post.id})"><i class="fas fa-paper-plane"></i></button>
          </div>
        </div>
        <div id="comments-list-${post.id}">
          ${renderComments(post.comments, post.id)}
        </div>
      </div>
    `;
    container.appendChild(postEl);
  });
}

function renderComments(comments, postId) {
  return comments.map(comment => `
    <div class="comment-item">
      <div class="avatar sm"><i class="fas fa-user"></i></div>
      <div class="comment-content">
        <div class="comment-bubble">
          <div class="comment-author">${comment.author}</div>
          <div class="comment-text">${comment.text}</div>
        </div>
        <div class="comment-actions">
          <span onclick="likeComment(${postId}, ${comment.id})" style="${comment.userReaction ? 'color:var(--primary);' : ''}">
            ${comment.userReaction ? comment.userReaction : 'Like'} (${formatCount(Object.values(comment.reactions).reduce((a,b)=>a+b,0))})
          </span>
          <span onclick="toggleReplyInput(${postId}, ${comment.id})">Reply</span>
          <span>Report</span>
        </div>
        <!-- Reply Input -->
        <div id="reply-input-${comment.id}" style="display:none; margin-top:8px;" class="comment-box">
          <div class="comment-input-wrapper">
            <input type="text" id="reply-text-${comment.id}" placeholder="Write a reply...">
            <button class="send-btn" onclick="addReply(${postId}, ${comment.id})"><i class="fas fa-paper-plane"></i></button>
          </div>
        </div>
        <!-- Nested Replies -->
        <div class="replies-container" id="replies-${comment.id}">
          ${comment.replies.map(reply => `
            <div class="comment-item" style="margin-top:10px;">
              <div class="avatar sm" style="width:24px; height:24px; font-size:10px;"><i class="fas fa-user"></i></div>
              <div class="comment-content">
                <div class="comment-bubble">
                  <div class="comment-author">${reply.author}</div>
                  <div class="comment-text">${reply.text}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

// --- INTERACTIONS ---
function publishPost() {
  const text = document.getElementById('postText').value;
  if (!text.trim()) return alert("Post cannot be empty!");

  posts.unshift({
    id: Date.now(),
    author: currentUser.name,
    isOfficial: false,
    time: Date.now(),
    content: text,
    reactions: { "❤️": 0, "👍": 0, "😆": 0, "😮": 0, "😢": 0, "😠": 0 },
    userReaction: null,
    comments: []
  });

  document.getElementById('postText').value = '';
  closeModal('mComposer');
  renderFeed();
}

function showReactionPopup(postId) {
  document.getElementById(`reaction-popup-${postId}`).style.display = 'flex';
}

function hideReactionPopup(postId) {
  setTimeout(() => {
    document.getElementById(`reaction-popup-${postId}`).style.display = 'none';
  }, 500);
}

function reactToPost(postId, emoji) {
  const post = posts.find(p => p.id === postId);
  
  // Undo Feature
  if (post.userReaction === emoji) {
    post.reactions[emoji]--;
    post.userReaction = null;
  } else {
    // Remove previous reaction if exists
    if (post.userReaction) post.reactions[post.userReaction]--;
    // Add new reaction
    post.reactions[emoji] = (post.reactions[emoji] || 0) + 1;
    post.userReaction = emoji;
  }
  renderFeed();
}

function togglePostMenu(postId) {
  const menu = document.getElementById(`menu-${postId}`);
  const isShown = menu.classList.contains('show');
  
  // Close all menus
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
  
  if (!isShown) menu.classList.add('show');
}

function savePost(postId) {
  showToast("Post saved successfully!");
}

function sharePost() {
  showToast("Post shared to your timeline!");
}

function openReportModal() {
  document.getElementById('mReport').classList.add('show');
}

function submitReport() {
  closeModal('mReport');
  showToast("Report submitted. Thank you for keeping the community safe.");
}

// --- COMMENTS LOGIC ---
function toggleComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  section.classList.toggle('show');
}

function handleCommentEnter(e, postId) {
  if (e.key === 'Enter') addTextComment(postId);
}

function addTextComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return;

  const post = posts.find(p => p.id === postId);
  post.comments.push({
    id: Date.now(),
    author: currentUser.name,
    text: text,
    time: Date.now(),
    reactions: {},
    userReaction: null,
    replies: []
  });

  input.value = '';
  renderFeed();
  document.getElementById(`comments-${postId}`).classList.add('show');
}

function toggleReplyInput(postId, commentId) {
  const replyBox = document.getElementById(`reply-input-${commentId}`);
  replyBox.style.display = replyBox.style.display === 'none' ? 'flex' : 'none';
}

function addReply(postId, commentId) {
  const input = document.getElementById(`reply-text-${commentId}`);
  const text = input.value.trim();
  if (!text) return;

  const post = posts.find(p => p.id === postId);
  const comment = post.comments.find(c => c.id === commentId);
  
  comment.replies.push({
    author: currentUser.name,
    text: text
  });

  renderFeed();
  document.getElementById(`comments-${postId}`).classList.add('show');
}

function likeComment(postId, commentId) {
  const post = posts.find(p => p.id === postId);
  const comment = post.comments.find(c => c.id === commentId);
  
  if (comment.userReaction) {
    comment.reactions[comment.userReaction]--;
    comment.userReaction = null;
  } else {
    comment.userReaction = "❤️";
    comment.reactions["❤️"] = (comment.reactions["❤️"] || 0) + 1;
  }
  renderFeed();
  document.getElementById(`comments-${postId}`).classList.add('show');
}

// --- VOICE COMMENT LOGIC ---
let recordingTimers = {};

function toggleVoiceRecord(btn, postId) {
  const isRecording = btn.classList.contains('recording');

  if (isRecording) {
    // Stop recording
    clearTimeout(recordingTimers[postId]);
    btn.classList.remove('recording');
    btn.innerHTML = '<i class="fas fa-microphone"></i>';
    
    // Simulate sending voice message
    const post = posts.find(p => p.id === postId);
    post.comments.push({
      id: Date.now(),
      author: currentUser.name,
      text: "🎤 Voice Message",
      time: Date.now(),
      reactions: {},
      userReaction: null,
      replies: []
    });
    renderFeed();
    document.getElementById(`comments-${postId}`).classList.add('show');
  } else {
    // Start recording
    btn.classList.add('recording');
    btn.innerHTML = '<i class="fas fa-stop"></i>';
    
    // Duration: 1 min (60000ms) for black verified, 30s (30000ms) for others
    const maxTime = currentUser.isVerified ? 60000 : 30000; 
    
    showToast(currentUser.isVerified ? "Recording (Max 1 min)..." : "Recording (Max 30s)...");

    recordingTimers[postId] = setTimeout(() => {
      if (btn.classList.contains('recording')) {
        toggleVoiceRecord(btn, postId); // Auto stop and send
      }
    }, maxTime);
  }
}

// --- UTILS ---
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 3000);
}

// Close dropdowns on outside click
window.addEventListener('click', function(e) {
  if (!e.target.matches('.post-menu-btn') && !e.target.matches('.post-menu-btn i')) {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
  }
});

// Init
window.onload = () => {
  renderFeed();
};
