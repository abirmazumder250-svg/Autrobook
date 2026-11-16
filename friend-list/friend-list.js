let currentTab = 'all';

// Mock Data Initialization in LocalStorage
if (!localStorage.getItem('my_friends')) {
  localStorage.setItem('my_friends', JSON.stringify([
    { id: 1, name: 'Sadia Afrin', bio: 'UI/UX Designer | Dhaka', avatar: 'https://i.pravatar.cc/130?img=2', mutual: 5, online: true },
    { id: 2, name: 'Nayeem Hasan', bio: 'Travel Lover ✈️', avatar: 'https://i.pravatar.cc/130?img=3', mutual: 2, online: false }
  ]));
}

if (!localStorage.getItem('friend_requests')) {
  localStorage.setItem('friend_requests', JSON.stringify([
    { id: 3, name: 'Fatema Begum', bio: 'Chef 🍛', avatar: 'https://i.pravatar.cc/130?img=4', mutual: 8, online: true }
  ]));
}

if (!localStorage.getItem('friend_suggestions')) {
  localStorage.setItem('friend_suggestions', JSON.stringify([
    { id: 4, name: 'Karim Uddin', bio: 'Software Engineer', avatar: 'https://i.pravatar.cc/130?img=5', mutual: 12, online: false }
  ]));
}

if (!localStorage.getItem('blocked_friends')) {
  localStorage.setItem('blocked_friends', JSON.stringify([]));
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2000);
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tabAll').classList.toggle('active', tab === 'all');
  document.getElementById('tabReq').classList.toggle('active', tab === 'requests');
  document.getElementById('tabSugg').classList.toggle('active', tab === 'suggestions');
  document.getElementById('tabBlocked').classList.toggle('active', tab === 'blocked');
  document.getElementById('searchInput').value = '';
  renderList();
}

function renderList() {
  let friends = JSON.parse(localStorage.getItem('my_friends') || '[]');
  let requests = JSON.parse(localStorage.getItem('friend_requests') || '[]');
  let suggestions = JSON.parse(localStorage.getItem('friend_suggestions') || '[]');
  let blocked = JSON.parse(localStorage.getItem('blocked_friends') || '[]');

  document.getElementById('friendTotal').innerText = friends.length;
  document.getElementById('reqCount').innerText = requests.length;

  const container = document.getElementById('friendContainer');
  container.innerHTML = '';

  let dataset = currentTab === 'all' ? friends : 
                (currentTab === 'requests' ? requests : 
                (currentTab === 'suggestions' ? suggestions : blocked));

  let query = document.getElementById('searchInput').value.toLowerCase();
  let filtered = dataset.filter(item => item.name.toLowerCase().includes(query));

  if (filtered.length === 0) {
    container.innerHTML = `<div class="no-data">No ${currentTab} found.</div>`;
    return;
  }

  filtered.forEach((item) => {
    let card = document.createElement('div');
    card.className = 'friend-item';

    let buttonsHTML = '';
    if (currentTab === 'all') {
      buttonsHTML = `
        <button class="btn btn-gray" onclick="openChat('${item.name}')"><i class="fa-solid fa-message"></i> Message</button>
        <button class="btn btn-danger" onclick="blockFriend(${item.id})">Block</button>
        <button class="btn btn-gray" onclick="removeFriend(${item.id})">Remove</button>
      `;
    } else if (currentTab === 'requests') {
      buttonsHTML = `
        <button class="btn" onclick="acceptRequest(${item.id})">Confirm</button>
        <button class="btn btn-danger" onclick="deleteRequest(${item.id})">Delete</button>
      `;
    } else if (currentTab === 'suggestions') {
      buttonsHTML = `<button class="btn" onclick="addFriend(${item.id})"><i class="fa-solid fa-user-plus"></i> Add Friend</button>`;
    } else if (currentTab === 'blocked') {
      buttonsHTML = `<button class="btn" onclick="unblockFriend(${item.id})">Unblock</button>`;
    }

    let onlineBadge = (currentTab === 'all' && item.online) ? `<div class="online-dot" title="Online"></div>` : '';

    card.innerHTML = `
      <div class="avatar-wrapper">
        <img src="${item.avatar}" alt="Avatar">
        ${onlineBadge}
      </div>
      <div class="friend-info">
        <b>${item.name}</b>
        <p>${item.bio || 'Autrobook Member'}</p>
        <p style="color:var(--green-bright); margin-top:2px;">${item.mutual || 0} mutual friends</p>
      </div>
      <div class="btn-group">${buttonsHTML}</div>
    `;
    container.appendChild(card);
  });
}

function filterFriends() {
  renderList();
}

function removeFriend(id) {
  if (!confirm('Are you sure you want to remove this friend?')) return;
  let friends = JSON.parse(localStorage.getItem('my_friends') || '[]');
  friends = friends.filter(f => f.id !== id);
  localStorage.setItem('my_friends', JSON.stringify(friends));
  toast('Friend removed successfully');
  renderList();
}

function blockFriend(id) {
  if (!confirm('Block this user? They will no longer be able to interact with you.')) return;
  let friends = JSON.parse(localStorage.getItem('my_friends') || '[]');
  let blocked = JSON.parse(localStorage.getItem('blocked_friends') || '[]');
  let user = friends.find(f => f.id === id);
  if (user) {
    blocked.push(user);
    friends = friends.filter(f => f.id !== id);
    localStorage.setItem('my_friends', JSON.stringify(friends));
    localStorage.setItem('blocked_friends', JSON.stringify(blocked));
    toast('User blocked');
    renderList();
  }
}

function unblockFriend(id) {
  let blocked = JSON.parse(localStorage.getItem('blocked_friends') || '[]');
  let friends = JSON.parse(localStorage.getItem('my_friends') || '[]');
  let user = blocked.find(b => b.id === id);
  if (user) {
    friends.push(user);
    blocked = blocked.filter(b => b.id !== id);
    localStorage.setItem('blocked_friends', JSON.stringify(blocked));
    localStorage.setItem('my_friends', JSON.stringify(friends));
    toast('User unblocked');
    renderList();
  }
}

function acceptRequest(id) {
  let requests = JSON.parse(localStorage.getItem('friend_requests') || '[]');
  let friends = JSON.parse(localStorage.getItem('my_friends') || '[]');
  let req = requests.find(r => r.id === id);
  if (req) {
    friends.push(req);
    requests = requests.filter(r => r.id !== id);
    localStorage.setItem('my_friends', JSON.stringify(friends));
    localStorage.setItem('friend_requests', JSON.stringify(requests));
    toast('Friend request accepted! 🎉');
    renderList();
  }
}

function deleteRequest(id) {
  let requests = JSON.parse(localStorage.getItem('friend_requests') || '[]');
  requests = requests.filter(r => r.id !== id);
  localStorage.setItem('friend_requests', JSON.stringify(requests));
  toast('Request deleted');
  renderList();
}

function addFriend(id) {
  let suggestions = JSON.parse(localStorage.getItem('friend_suggestions') || '[]');
  let sugg = suggestions.find(s => s.id === id);
  if (sugg) {
    suggestions = suggestions.filter(s => s.id !== id);
    localStorage.setItem('friend_suggestions', JSON.stringify(suggestions));
    toast('Friend request sent! 🤝');
    renderList();
  }
}

function openChat(name) {
  alert(`Opening chat window with ${name}...`);
}

// Initial load
renderList();
