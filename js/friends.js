/* ============================================================
   AUTROBOOK - FRIENDS PAGE JAVASCRIPT
   ============================================================ */

// ===== MOCK DATA =====
const friendRequests = [
  { id: 1, name: 'Sadia Islam', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', mutual: '12 mutual friends' },
  { id: 2, name: 'Tanvir Ahmed', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', mutual: '5 mutual friends' }
];

const friendSuggestions = [
  { id: 3, name: 'Nusrat Jahan', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', mutual: '24 mutual friends' },
  { id: 4, name: 'Rakib Hasan', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', mutual: '8 mutual friends' },
  { id: 5, name: 'Farhana Yasmin', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80', mutual: '3 mutual friends' }
];

let allFriends = [
  { id: 6, name: 'Mita Mitra', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', mutual: '45 mutual friends' },
  { id: 7, name: 'Tripurna Mazumder', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', mutual: '30 mutual friends' },
  { id: 8, name: 'Rahul Khan', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', mutual: '18 mutual friends' },
  { id: 9, name: 'Tech Chronicles', avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80', mutual: '10 mutual friends' }
];

let currentTab = 'requests';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderTab('requests');
});

// ===== TAB SWITCHING =====
function switchTab(tab, btn) {
  currentTab = tab;
  
  // Update active button
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Show/Hide search bar
  const searchBar = document.getElementById('friendSearchBar');
  if (tab === 'all') {
    searchBar.style.display = 'flex';
  } else {
    searchBar.style.display = 'none';
  }

  // Render content
  renderTab(tab);
}

// ===== RENDER CONTENT =====
function renderTab(tab) {
  const container = document.getElementById('friendsContent');

  if (tab === 'requests') {
    if (friendRequests.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:var(--muted); margin-top:20px;">No friend requests right now.</p>`;
      return;
    }
    container.innerHTML = `<div class="friend-grid">` + friendRequests.map(user => `
      <div class="friend-card" id="req-card-${user.id}">
        <div class="friend-cover"></div>
        <div class="friend-info">
          <img src="${user.avatar}" class="friend-avatar" alt="${user.name}">
          <div class="friend-name">${user.name}</div>
          <div class="friend-mutual">${user.mutual}</div>
        </div>
        <div class="friend-actions">
          <button class="btn-action btn-accept" onclick="acceptRequest(${user.id})"><i class="fas fa-check"></i> Confirm</button>
          <button class="btn-action btn-decline" onclick="declineRequest(${user.id})"><i class="fas fa-times"></i> Delete</button>
        </div>
      </div>
    `).join('') + `</div>`;
  } 
  
  else if (tab === 'suggestions') {
    container.innerHTML = `<div class="friend-grid">` + friendSuggestions.map(user => `
      <div class="friend-card" id="sug-card-${user.id}">
        <div class="friend-cover"></div>
        <div class="friend-info">
          <img src="${user.avatar}" class="friend-avatar" alt="${user.name}">
          <div class="friend-name">${user.name}</div>
          <div class="friend-mutual">${user.mutual}</div>
        </div>
        <div class="friend-actions">
          <button class="btn-action btn-accept" onclick="addFriend(${user.id})"><i class="fas fa-user-plus"></i> Add Friend</button>
          <button class="btn-action btn-decline" onclick="removeSuggestion(${user.id})"><i class="fas fa-times"></i> Remove</button>
        </div>
      </div>
    `).join('') + `</div>`;
  } 
  
  else if (tab === 'all') {
    renderAllFriends(allFriends);
  }
}

function renderAllFriends(friends) {
  const container = document.getElementById('friendsContent');
  
  if (friends.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--muted); margin-top:20px;">No friends found.</p>`;
    return;
  }

  container.innerHTML = `<div class="friend-grid">` + friends.map(user => `
    <div class="friend-card">
      <div class="friend-cover"></div>
      <div class="friend-info">
        <img src="${user.avatar}" class="friend-avatar" alt="${user.name}">
        <div class="friend-name">${user.name}</div>
        <div class="friend-mutual">${user.mutual}</div>
      </div>
      <div class="friend-actions">
        <button class="btn-action btn-secondary" onclick="alert('Message sent to ${user.name}')"><i class="fas fa-comment"></i> Message</button>
        <button class="btn-action btn-decline" onclick="unfriend(${user.id})"><i class="fas fa-user-minus"></i> Unfriend</button>
      </div>
    </div>
  `).join('') + `</div>`;
}

// ===== ACTIONS =====
function acceptRequest(id) {
  const user = friendRequests.find(u => u.id === id);
  if (!user) return;
  
  // Remove from requests
  friendRequests.splice(friendRequests.findIndex(u => u.id === id), 1);
  
  // Add to all friends
  allFriends.push(user);
  
  // Re-render
  renderTab('requests');
  alert(`✅ You are now friends with ${user.name}`);
}

function declineRequest(id) {
  friendRequests.splice(friendRequests.findIndex(u => u.id === id), 1);
  renderTab('requests');
}

function addFriend(id) {
  const user = friendSuggestions.find(u => u.id === id);
  if (!user) return;
  
  friendSuggestions.splice(friendSuggestions.findIndex(u => u.id === id), 1);
  allFriends.push(user);
  renderTab('suggestions');
  alert(`✅ Friend request sent to ${user.name}`);
}

function removeSuggestion(id) {
  friendSuggestions.splice(friendSuggestions.findIndex(u => u.id === id), 1);
  renderTab('suggestions');
}

function unfriend(id) {
  if (confirm("Are you sure you want to unfriend this person?")) {
    allFriends = allFriends.filter(u => u.id !== id);
    renderTab('all');
  }
}

// ===== SEARCH FILTER =====
function filterFriends() {
  const query = document.getElementById('friendSearchInput').value.toLowerCase();
  const filtered = allFriends.filter(u => u.name.toLowerCase().includes(query));
  renderAllFriends(filtered);
}
