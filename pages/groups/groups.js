/* ==========================================================
   AUTROBOOK - GROUPS INTERACTIVE SCRIPT
   ========================================================== */

// Toggle Join / Joined State
function toggleGroupJoin() {
    const btn = document.getElementById('joinGroupBtn');
    if (btn.textContent.includes('Joined')) {
        btn.textContent = '+ Join Group';
        btn.style.background = 'var(--hover-bg)';
        btn.style.color = 'var(--text-primary)';
    } else {
        btn.textContent = 'Joined ✓';
        btn.style.background = 'var(--brand-green)';
        btn.style.color = '#fff';
    }
}

// Switch Tabs (Discussion, Members, Media)
function switchGroupTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    console.log(`Switched to group tab: ${tabName}`);
}

// Submit New Post inside Group Feed
function submitGroupPost() {
    const input = document.getElementById('groupPostInput');
    const feed = document.getElementById('groupFeed');
    
    if (!input.value.trim()) return alert('Please write something to post!');

    const newPostCard = document.createElement('div');
    newPostCard.className = 'card post-card';
    newPostCard.innerHTML = `
        <div class="post-header">
            <div class="avatar"></div>
            <div>
                <h4 class="author">Abir Mazumder</h4>
                <span class="timestamp">Just now · 🌐 Group Post</span>
            </div>
        </div>
        <div class="post-content">${input.value}</div>
        <div class="post-actions">
            <button class="interaction-btn">👍 Like</button>
            <button class="interaction-btn">💬 Comment</button>
            <button class="interaction-btn">↩️ Share</button>
        </div>
    `;

    feed.prepend(newPostCard);
    input.value = '';
}

function insertGroupSticker(emoji) {
    const input = document.getElementById('groupPostInput');
    input.value += ` ${emoji} `;
    input.focus();
}

function openCreateGroupModal() {
    const groupName = prompt('Enter new group name:');
    if (groupName) {
        alert(`Group "${groupName}" created successfully!`);
    }
  }
