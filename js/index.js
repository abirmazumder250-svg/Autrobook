// ===== 15 MOCK PROFILES =====
const users = [
  { id: 'u1', name: 'Tech Chronicles', avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&q=80', bio: 'Latest tech news & reviews', isFollowing: false },
  { id: 'u2', name: 'Mita Mitra', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', bio: 'Travel & Lifestyle', isFollowing: true },
  { id: 'u3', name: 'Tripurna Mazumder', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80', bio: 'Fashion Designer', isFollowing: false },
  { id: 'u4', name: 'Rahul Khan', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', bio: 'Musician & Producer', isFollowing: true },
  { id: 'u5', name: 'Daily Sports', avatar: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=100&q=80', bio: 'Cricket & Football updates', isFollowing: false }
];

// ===== MOCK STORIES =====
const mockStories = [
  { user: users[1], img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' },
  { user: users[2], img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80' },
  { user: users[3], img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80' },
  { user: users[4], img: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80' }
];

// ===== MOCK POSTS =====
const mockPosts = [
  { id: 'p1', userId: 'u1', text: 'AI is reshaping creativity — but the best ideas still come from humans who pause, think, and feel. 🌱', media: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80', time: Date.now() - 3600000, reactions: { '👍': 1200, '❤️': 340, '😮': 84 }, views: 15000, viral: 12 },
  { id: 'p2', userId: 'u2', text: 'Sunset at Cox\'s Bazar. Sometimes you just need to pause and take it all in. 🌇', media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', time: Date.now() - 7200000, reactions: { '❤️': 3400, '🥰': 1200, '😮': 210 }, views: 45000, viral: 28 },
  { id: 'p3', userId: 'u3', text: 'New collection dropping this Friday! 💃 What do you think?', media: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80', time: Date.now() - 14400000, reactions: { '😆': 850, '🥰': 400, '👍': 120 }, views: 8000, viral: 5 },
  { id: 'p4', userId: 'u4', text: 'Studio vibes today. Making some magic. 🎶🎧', media: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80', time: Date.now() - 86400000, reactions: { '👍': 560, '❤️': 250 }, views: 5000, viral: 8 }
];

// ===== RENDER STORIES =====
function renderStories() {
  const container = document.getElementById('storiesContainer');
  container.innerHTML = `
    <div class="story create" onclick="alert('Create story feature opened')">
      <div class="story-avatar"><i class="fas fa-plus"></i></div>
      <span>Create Story</span>
    </div>
  `;
  
  mockStories.forEach((story, index) => {
    container.innerHTML += `
      <div class="story" onclick="openStoryViewer(${index})">
        <img src="${story.img}" class="bg-img">
        <img src="${story.user.avatar}" class="story-avatar">
        <span>${story.user.name.split(' ')[0]}</span>
      </div>
    `;
  });
}

// ===== STORY VIEWER LOGIC =====
let currentStoryIndex = 0;
let storyInterval;

function openStoryViewer(index) {
  currentStoryIndex = index;
  document.getElementById('storyViewer').classList.add('open');
  loadStory();
}

function closeStoryViewer() {
  document.getElementById('storyViewer').classList.remove('open');
  clearInterval(storyInterval);
}

function loadStory() {
  clearInterval(storyInterval);
  const story = mockStories[currentStoryIndex];
  
  document.getElementById('storyUserImg').src = story.user.avatar;
  document.getElementById('storyUserName').innerText = story.user.name;
  document.getElementById('storyMainImg').src = story.img;

  // Generate Progress Bars
  const progressContainer = document.getElementById('storyProgress');
  progressContainer.innerHTML = '';
  mockStories.forEach((_, i) => {
    const fillWidth = i < currentStoryIndex ? '100%' : i === currentStoryIndex ? '0%' : '0%';
    progressContainer.innerHTML += `
      <div class="bar"><div class="fill" id="fill-${i}" style="width:${fillWidth}; transition:${i === currentStoryIndex ? 'width 5s linear' : 'none'};"></div></div>
    `;
  });

  // Animate current bar
  setTimeout(() => {
    const currentFill = document.getElementById(`fill-${currentStoryIndex}`);
    if (currentFill) currentFill.style.width = '100%';
  }, 50);

  // Auto advance after 5s
  storyInterval = setTimeout(() => {
    navStory(1);
  }, 5000);
}

function navStory(dir) {
  currentStoryIndex += dir;
  if (currentStoryIndex < 0) currentStoryIndex = 0;
  if (currentStoryIndex >= mockStories.length) {
    closeStoryViewer();
    return;
  }
  loadStory();
}

// ===== RENDER FEED =====
function renderFeed() {
  const container = document.getElementById('feedContainer');
  container.innerHTML = '';

  mockPosts.forEach(post => {
    const user = users.find(u => u.id === post.userId);
    if (!user) return;

    const postEl = document.createElement('div');
    postEl.className = 'post';
    
    const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0);
    const formattedViews = post.views >= 1000 ? (post.views / 1000).toFixed(1) + 'K' : post.views;

    let reactionHTML = '';
    let reactionCount = 0;
    for (const [emoji] of Object.entries(post.reactions)) {
      if (reactionCount >= 3) break;
      reactionHTML += `<span>${emoji}</span>`;
      reactionCount++;
    }

    const followBtnClass = user.isFollowing ? 'following' : 'not-following';
    const followBtnText = user.isFollowing ? 'Following' : 'Follow';

    postEl.innerHTML = `
      <div class="post-header">
        <div class="post-user" onclick="showProfile('${user.id}')">
          <img src="${user.avatar}" class="avatar" alt="${user.name}">
          <div>
            <div style="font-weight:600;font-size:15px;">${user.name}</div>
            <div class="post-meta live-time" data-time="${post.time}">Calculating...</div>
          </div>
        </div>
        <div>
          <button class="follow-btn ${followBtnClass}" onclick="toggleFollow(this, '${user.id}')">${followBtnText}</button>
          <button class="icon-btn" style="width:30px; height:30px; background:transparent;" onclick="openModal('mPostOptions')"><i class="fas fa-ellipsis-h"></i></button>
        </div>
      </div>
      
      <div class="post-text">${post.text}</div>
      ${post.media ? `<img src="${post.media}" class="post-media" loading="lazy">` : ''}
      
      <div class="reactions-row">
        <div class="reaction-stack" onclick="openModal('mReactionList')">
          ${reactionHTML} <span class="count">${totalReactions}</span>
        </div>
        <div class="stats-right">
          <span onclick="openModal('mInsights')"><i class="fas fa-eye"></i> ${formattedViews} Views</span>
          <span style="color:var(--success);" onclick="openModal('mInsights')"><i class="fas fa-chart-line"></i> ${post.viral}% Viral</span>
        </div>
      </div>

      <div class="post-actions">
        <div class="reaction-wrapper">
          <button class="action-btn" onclick="toggleReactionPicker(this)"><i class="far fa-thumbs-up"></i> Like</button>
          <div class="reaction-picker">
            <span onclick="addReaction(this, '👍')">👍</span>
            <span onclick="addReaction(this, '❤️')">❤️</span>
            <span onclick="addReaction(this, '😆')">😆</span>
            <span onclick="addReaction(this, '🥰')">🥰</span>
            <span onclick="addReaction(this, '😮')">😮</span>
            <span onclick="addReaction(this, '😢')">😢</span>
            <span onclick="addReaction(this, '😠')">😠</span>
          </div>
        </div>
        <button class="action-btn" onclick="openModal('mVoice')"><i class="far fa-comment"></i> Comment</button>
        <button class="action-btn"><i class="fas fa-share"></i> Share</button>
      </div>
    `;
    container.appendChild(postEl);
  });
  updateLiveTimes();
}

// ===== LIVE TIME UPDATER =====
function updateLiveTimes() {
  document.querySelectorAll('.live-time').forEach(el => {
    const timeStr = el.getAttribute('data-time');
    if (!timeStr) return;
    
    const diff = Date.now() - parseInt(timeStr);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    
    let text = "";
    if (mins < 1) text = "Just now";
    else if (mins < 60) text = mins + "m ago";
    else if (hours < 24) text = hours + "h ago";
    else if (days < 7) text = days + "d ago";
    else text = Math.floor(days / 7) + "w ago";
    
    el.innerHTML = `${text} · <i class="fas fa-globe-americas"></i>`;
  });
}
setInterval(updateLiveTimes, 60000);

// ===== UTILS =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function toggleFollow(btn, userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;
  user.isFollowing = !user.isFollowing;
  btn.className = `follow-btn ${user.isFollowing ? 'following' : 'not-following'}`;
  btn.innerText = user.isFollowing ? 'Following' : 'Follow';
}

function showProfile(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;
  document.getElementById('profileModalImg').src = user.avatar;
  document.getElementById('profileModalName').innerText = user.name;
  document.getElementById('profileModalBio').innerText = user.bio;
  openModal('mUserProfile');
}

function toggleReactionPicker(btn) {
  const picker = btn.nextElementSibling;
  const isOpen = picker.style.display === 'flex';
  document.querySelectorAll('.reaction-picker').forEach(p => p.style.display = 'none');
  if (!isOpen) picker.style.display = 'flex';
}

function addReaction(emojiEl, emoji) {
  emojiEl.closest('.reaction-picker').style.display = 'none';
  const btn = emojiEl.closest('.reaction-wrapper').querySelector('.action-btn');
  btn.innerHTML = `<span>${emoji}</span> Reacted`;
  btn.style.color = 'var(--primary)';
  
  const post = emojiEl.closest('.post');
  const stack = post.querySelector('.reaction-stack');
  const countSpan = stack.querySelector('.count');
  countSpan.innerText = parseInt(countSpan.innerText) + 1;
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.reaction-wrapper')) {
    document.querySelectorAll('.reaction-picker').forEach(p => p.style.display = 'none');
  }
});

function submitReport(reason) {
  closeModal('mReport');
  alert(`Thank you. This content has been reported for: ${reason}`);
}

function publishPost() {
  const text = document.getElementById('postText').value.trim();
  if (!text) return alert("Write something first!");
  
  mockPosts.unshift({
    id: 'p' + Date.now(),
    userId: 'me', text: text, media: null, time: Date.now(),
    reactions: { '👍': 0 }, views: 0, viral: 0
  });

  if (!users.find(u => u.id === 'me')) {
    users.push({ id: 'me', name: 'Abir Mazumder', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80', bio: 'Creator', isFollowing: false });
  }

  document.getElementById('postText').value = '';
  closeModal('mComposer');
  renderFeed();
}

function setVoice(btn, preset) {
  document.querySelectorAll('.vp-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function recordVoice() {
  const status = document.getElementById('recStatus');
  status.innerHTML = '🔴 Recording... (0:00)';
  status.style.color = 'var(--error)';
  setTimeout(() => {
    status.innerHTML = `✅ Voice comment added!`;
    status.style.color = 'var(--success)';
    setTimeout(() => closeModal('mVoice'), 1200);
  }, 2000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderStories();
  renderFeed();
});
