// ===== SAFE SUPABASE CLIENT INITIALIZATION (Fixes "supabase.from is not a function") =====
const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';

let db = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else if (window.supabase && typeof window.supabase.from === 'function') {
  db = window.supabase;
}

// ===== CURRENT USER STATE =====
let currentUser = {
  id: 'user_local_1',
  name: localStorage.getItem('autro_user_name') || 'Abir Mazumder',
  avatar: 'https://i.pravatar.cc/100?img=12'
};

async function initCurrentUser() {
  if (!db) return;
  try {
    const { data: { session } } = await db.auth.getSession();
    if (session && session.user) {
      currentUser.id = session.user.id;
      currentUser.name = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
      if (session.user.user_metadata?.avatar_url) {
        currentUser.avatar = session.user.user_metadata.avatar_url;
      }
      localStorage.setItem('autro_user_name', currentUser.name);
    }
  } catch (e) {
    console.warn('Session check fallback:', e);
  }
}

// ===== 1. STORIES SYSTEM (Gallery Upload + Real Views & Reactions + view-profile.html) =====
let storiesData = JSON.parse(localStorage.getItem('autro_stories') || 'null') || [
  {
    id: 'st_1',
    userId: 'u_101',
    userName: 'Nusrat Jahan',
    userAvatar: 'https://i.pravatar.cc/100?img=5',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    time: '2h ago',
    views: [
      { name: 'Tanvir Ahmed', reaction: '❤️', userId: 'u_102' },
      { name: 'Sadia Islam', reaction: '🥰', userId: 'u_103' },
      { name: 'Rafiul Hasan', reaction: '👍', userId: 'u_104' }
    ]
  },
  {
    id: 'st_2',
    userId: 'u_102',
    userName: 'Tanvir Ahmed',
    userAvatar: 'https://i.pravatar.cc/100?img=11',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80',
    time: '4h ago',
    views: [
      { name: 'Nusrat Jahan', reaction: '😮', userId: 'u_101' },
      { name: 'Mehedi Hasan', reaction: '👍', userId: 'u_105' }
    ]
  },
  {
    id: 'st_3',
    userId: 'u_103',
    userName: 'Sadia Islam',
    userAvatar: 'https://i.pravatar.cc/100?img=9',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80',
    time: '5h ago',
    views: [
      { name: 'Abir Mazumder', reaction: '❤️', userId: 'user_local_1' }
    ]
  }
];

let activeStoryIndex = 0;

function saveStories() {
  localStorage.setItem('autro_stories', JSON.stringify(storiesData));
}

function triggerStoryGallery() {
  document.getElementById('storyGalleryInput').click();
}

function handleStoryUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const newStory = {
      id: 'st_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      image: e.target.result,
      time: 'Just now',
      views: []
    };
    storiesData.unshift(newStory);
    saveStories();
    renderStories();
    showToast('Added to Storycard!');
    // Save active story for storycard.html
    localStorage.setItem('active_story_card', JSON.stringify(newStory));
  };
  reader.readAsDataURL(file);
}

function renderStories() {
  const row = document.getElementById('storiesRow');
  if (!row) return;

  // Keep the Add Story card first
  const addCard = row.firstElementChild.outerHTML;
  const cardsHTML = storiesData.map((st, idx) => `
    <div class="story-card-item" onclick="openStoryViewer(${idx})">
      <img class="story-bg" src="${st.image}" alt="${st.userName}">
      <img class="story-card-avatar" src="${st.userAvatar}" alt="${st.userName}">
      <span class="story-card-views"><i class="fas fa-eye"></i> ${st.views.length}</span>
      <span class="story-card-name">${st.userName}</span>
    </div>
  `).join('');

  row.innerHTML = addCard + cardsHTML;
}

function openStoryViewer(index) {
  activeStoryIndex = index;
  const story = storiesData[index];
  if (!story) return;

  // Record real view if not already viewed by currentUser
  const alreadyViewed = story.views.some(v => v.name === currentUser.name);
  if (!alreadyViewed) {
    story.views.push({
      name: currentUser.name,
      reaction: '',
      userId: currentUser.id
    });
    saveStories();
    renderStories();
  }

  localStorage.setItem('active_story_card', JSON.stringify(story));

  document.getElementById('storyViewerAvatar').src = story.userAvatar;
  document.getElementById('storyViewerName').textContent = story.userName;
  document.getElementById('storyViewerTime').textContent = story.time;
  document.getElementById('storyViewerImg').src = story.image;
  document.getElementById('storyViewCount').textContent = story.views.length;
  document.getElementById('storyAuthorLink').href = `view-profile.html?user=${encodeURIComponent(story.userId)}&name=${encodeURIComponent(story.userName)}`;

  renderStoryInsights(story);
  document.getElementById('storyViewerModal').classList.add('open');
}

function reactToStory(emoji) {
  const story = storiesData[activeStoryIndex];
  if (!story) return;

  const existing = story.views.find(v => v.name === currentUser.name);
  if (existing) {
    existing.reaction = emoji;
  } else {
    story.views.push({ name: currentUser.name, reaction: emoji, userId: currentUser.id });
  }

  saveStories();
  renderStories();
  renderStoryInsights(story);
  document.getElementById('storyViewCount').textContent = story.views.length;
  showToast('Reacted ' + emoji + ' to story');
}

function toggleStoryInsights() {
  const box = document.getElementById('storyInsightsBox');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function renderStoryInsights(story) {
  const list = document.getElementById('storyViewersList');
  if (!story.views.length) {
    list.innerHTML = '<p style="font-size:12px;color:#aaa;">No views yet.</p>';
    return;
  }
  list.innerHTML = story.views.map(v => `
    <div class="viewer-row">
      <a href="view-profile.html?user=${encodeURIComponent(v.userId)}&name=${encodeURIComponent(v.name)}">${v.name}</a>
      <span>${v.reaction ? v.reaction : '<small style="color:#9ca3af;">Viewed</small>'}</span>
    </div>
  `).join('');
}

// ===== 2. FACEBOOK-STYLE REELS SHELF (8 Reels -> reels.html & view-profile.html) =====
const sampleReels = [
  { id: 'r1', creatorId: 'u_201', creatorName: 'Ayaan Rahman', avatar: 'https://i.pravatar.cc/100?img=14', thumb: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80', views: '12.4K' },
  { id: 'r2', creatorId: 'u_202', creatorName: 'Mehnaz Kabir', avatar: 'https://i.pravatar.cc/100?img=20', thumb: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&q=80', views: '8.9K' },
  { id: 'r3', creatorId: 'u_203', creatorName: 'Farhan Sadik', avatar: 'https://i.pravatar.cc/100?img=33', thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=80', views: '24.1K' },
  { id: 'r4', creatorId: 'u_204', creatorName: 'Tania Akter', avatar: 'https://i.pravatar.cc/100?img=32', thumb: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&q=80', views: '5.2K' },
  { id: 'r5', creatorId: 'u_205', creatorName: 'Shakil Mahmud', avatar: 'https://i.pravatar.cc/100?img=52', thumb: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500&q=80', views: '19.7K' },
  { id: 'r6', creatorId: 'u_206', creatorName: 'Nabila Chowdhury', avatar: 'https://i.pravatar.cc/100?img=44', thumb: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&q=80', views: '15.0K' },
  { id: 'r7', creatorId: 'u_207', creatorName: 'Zayed Khan', avatar: 'https://i.pravatar.cc/100?img=59', thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&q=80', views: '31.8K' },
  { id: 'r8', creatorId: 'u_208', creatorName: 'Sumaiya Haque', avatar: 'https://i.pravatar.cc/100?img=47', thumb: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=500&q=80', views: '9.6K' }
];

function renderReelsShelf() {
  const row = document.getElementById('reelsShelfRow');
  if (!row) return;

  row.innerHTML = sampleReels.map(reel => `
    <div class="reel-card">
      <a href="reels.html?id=${reel.id}" class="reel-thumb-link">
        <img src="${reel.thumb}" alt="${reel.creatorName}">
      </a>
      <span class="reel-views-badge"><i class="fas fa-play"></i> ${reel.views}</span>
      <a href="view-profile.html?user=${encodeURIComponent(reel.creatorId)}&name=${encodeURIComponent(reel.creatorName)}" class="reel-creator-bar">
        <img src="${reel.avatar}" alt="${reel.creatorName}">
        <span>${reel.creatorName}</span>
      </a>
    </div>
  `).join('');
}

// ===== 3. POSTS FEED + SEND POST + SEND COMMENT =====
let postsData = JSON.parse(localStorage.getItem('autro_posts') || 'null') || [
  {
    id: 'post_1',
    authorId: 'u_101',
    authorName: 'Nusrat Jahan',
    authorAvatar: 'https://i.pravatar.cc/100?img=5',
    time: '1 hr ago',
    text: 'Enjoying a peaceful morning walk in Dhaka! Wishing everyone a productive and mindful day on Autrobook.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    likes: 24,
    liked: false,
    comments: [
      { author: 'Tanvir Ahmed', text: 'Amazing view!' },
      { author: 'Sadia Islam', text: 'Have a great day!' }
    ]
  },
  {
    id: 'post_2',
    authorId: 'u_203',
    authorName: 'Farhan Sadik',
    authorAvatar: 'https://i.pravatar.cc/100?img=33',
    time: '3 hrs ago',
    text: 'Building clean, ad-free social experiences for everyone. Drop your thoughts below!',
    image: '',
    likes: 18,
    liked: false,
    comments: [
      { author: 'Abir Mazumder', text: 'Keep up the great work!' }
    ]
  }
];

let pendingPostImage = '';
let activeCommentPostId = null;

function savePosts() {
  localStorage.setItem('autro_posts', JSON.stringify(postsData));
}

function renderPosts() {
  const feed = document.getElementById('postsFeed');
  if (!feed) return;

  feed.innerHTML = postsData.map(post => `
    <article class="post-card">
      <div class="post-header">
        <a href="view-profile.html?user=${encodeURIComponent(post.authorId)}&name=${encodeURIComponent(post.authorName)}" class="post-author-link">
          <img src="${post.authorAvatar}" alt="${post.authorName}">
          <div class="post-author-meta">
            <strong>${post.authorName}</strong>
            <small>${post.time}</small>
          </div>
        </a>
        <a href="reels.html" title="Watch Reels" style="color:var(--muted);text-decoration:none;font-size:14px;">
          <i class="fas fa-clapperboard"></i>
        </a>
      </div>

      ${post.text ? `<p class="post-body-text">${post.text}</p>` : ''}
      ${post.image ? `<img class="post-media-img" src="${post.image}" alt="Post media">` : ''}

      <div class="post-stats-row">
        <span><i class="fas fa-thumbs-up" style="color:#16a34a;"></i> ${post.likes} Likes</span>
        <span onclick="openCommentSheet('${post.id}')" style="cursor:pointer;">${post.comments.length} Comments</span>
      </div>

      <div class="post-actions-row">
        <button class="post-action-btn ${post.liked ? 'liked' : ''}" onclick="toggleLikePost('${post.id}')">
          <i class="${post.liked ? 'fas' : 'far'} fa-thumbs-up"></i> Like
        </button>
        <button class="post-action-btn" onclick="openCommentSheet('${post.id}')">
          <i class="far fa-comment"></i> Comment
        </button>
        <button class="post-action-btn" onclick="openShareSheet('${post.id}')">
          <i class="fas fa-share"></i> Share
        </button>
      </div>

      <!-- Direct Quick Comment Input + Send Button -->
      <div class="post-quick-comment">
        <input type="text" id="quickInput_${post.id}" placeholder="Write a comment..." onkeypress="if(event.key==='Enter') sendQuickComment('${post.id}')">
        <button onclick="sendQuickComment('${post.id}')" title="Send Comment">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </article>
  `).join('');
}

// Create & Send Post
function openCreatePost() {
  document.getElementById('createPostModal').classList.add('open');
}

function previewPostImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    pendingPostImage = e.target.result;
    const img = document.getElementById('postPreview');
    img.src = pendingPostImage;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function publishPost() {
  const textEl = document.getElementById('postText');
  const text = textEl.value.trim();

  if (!text && !pendingPostImage) {
    showToast('Write something or attach a photo first.');
    return;
  }

  const newPost = {
    id: 'post_' + Date.now(),
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorAvatar: currentUser.avatar,
    time: 'Just now',
    text: text,
    image: pendingPostImage,
    likes: 0,
    liked: false,
    comments: []
  };

  // Attempt Supabase insert if table exists, always update feed immediately
  if (db) {
    try {
      await db.from('posts').insert([{
        user_id: currentUser.id,
        author_name: currentUser.name,
        content: text,
        image_url: pendingPostImage
      }]);
    } catch (e) {
      console.warn('Saved locally:', e);
    }
  }

  postsData.unshift(newPost);
  savePosts();
  renderPosts();

  // Reset modal
  textEl.value = '';
  pendingPostImage = '';
  document.getElementById('postPreview').style.display = 'none';
  closeModal('createPostModal');
  showToast('Post sent!');
}

function toggleLikePost(postId) {
  const post = postsData.find(p => p.id === postId);
  if (!post) return;
  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;
  savePosts();
  renderPosts();
}

// Comment Sheet & Send Comment
function openCommentSheet(postId) {
  activeCommentPostId = postId;
  const post = postsData.find(p => p.id === postId);
  if (!post) return;

  localStorage.setItem('active_comment_post', JSON.stringify(post));
  renderCommentSheetList(post);
  document.getElementById('commentSheet').classList.add('open');
}

function closeCommentSheet() {
  document.getElementById('commentSheet').classList.remove('open');
}

function renderCommentSheetList(post) {
  const list = document.getElementById('commentSheetList');
  if (!post.comments.length) {
    list.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:10px 0;">No comments yet. Be the first to comment!</p>';
    return;
  }
  list.innerHTML = post.comments.map(c => `
    <div class="comment-bubble-item">
      <strong>${c.author}</strong>
      <p>${c.text}</p>
    </div>
  `).join('');
}

function sendCommentFromSheet() {
  const input = document.getElementById('commentSheetInput');
  const text = input.value.trim();
  if (!text || !activeCommentPostId) return;

  const post = postsData.find(p => p.id === activeCommentPostId);
  if (!post) return;

  post.comments.push({ author: currentUser.name, text: text });
  savePosts();
  renderPosts();
  renderCommentSheetList(post);
  input.value = '';
  showToast('Comment sent!');
}

function sendQuickComment(postId) {
  const input = document.getElementById('quickInput_' + postId);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const post = postsData.find(p => p.id === postId);
  if (!post) return;

  post.comments.push({ author: currentUser.name, text: text });
  savePosts();
  renderPosts();
  showToast('Comment sent!');
}

// ===== 4. UI HELPERS (Menus, Modals, Share, Toast) =====
function toggleCreateMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById('createMenu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function closeCreateMenu() {
  const menu = document.getElementById('createMenu');
  if (menu) menu.style.display = 'none';
}

document.addEventListener('click', closeCreateMenu);

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function openLive() {
  document.getElementById('liveModal').classList.add('open');
}

function startLiveStream() {
  closeModal('liveModal');
  showToast('Live stream started!');
}

function openNote() {
  document.getElementById('noteModal').classList.add('open');
}

function publishNote() {
  const txt = document.getElementById('noteText').value.trim();
  if (!txt) return;
  document.getElementById('noteText').value = '';
  closeModal('noteModal');
  showToast('Note shared!');
}

function openShareSheet(postId) {
  document.getElementById('shareSheet').classList.add('open');
}

function closeShareSheet() {
  document.getElementById('shareSheet').classList.remove('open');
}

function shareToFeed() {
  closeShareSheet();
  showToast('Shared to your Feed!');
}

function shareCopyLink() {
  navigator.clipboard?.writeText(window.location.href);
  closeShareSheet();
  showToast('Link copied!');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== INITIALIZE PAGE =====
document.addEventListener('DOMContentLoaded', async () => {
  await initCurrentUser();
  renderStories();
  renderReelsShelf();
  renderPosts();
});
