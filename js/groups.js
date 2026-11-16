/* ============================================================
   AUTROBOOK - GROUPS PAGE JAVASCRIPT
   ============================================================ */

// ===== MOCK DATA =====
let myGroups = [
  { id: 1, name: 'Tech Enthusiasts BD', privacy: 'Public', members: '12K', cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80' },
  { id: 2, name: 'Dhaka Foodies', privacy: 'Private', members: '8.5K', cover: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80' }
];

let discoverGroups = [
  { id: 3, name: 'Bangladesh Cricket Fans', privacy: 'Public', members: '50K', cover: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80' },
  { id: 4, name: 'Photography Lovers', privacy: 'Public', members: '22K', cover: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80' },
  { id: 5, name: 'Startup Founders BD', privacy: 'Private', members: '5K', cover: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80' },
  { id: 6, name: 'Gamers United', privacy: 'Public', members: '35K', cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80' }
];

let currentTab = 'myGroups';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Set dynamic year
  document.getElementById('dynamicYear').textContent = new Date().getFullYear();
  renderTab('myGroups');
});

// ===== TAB SWITCHING =====
function switchTab(tab, btn) {
  currentTab = tab;
  
  // Update active button
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Clear search input when switching tabs
  document.getElementById('groupSearchInput').value = '';

  // Render content
  renderTab(tab);
}

// ===== RENDER CONTENT =====
function renderTab(tab) {
  const container = document.getElementById('groupsContent');

  if (tab === 'myGroups') {
    if (myGroups.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:var(--muted); margin-top:20px;">You haven't joined any groups yet.</p>`;
      return;
    }
    container.innerHTML = `<div class="group-grid">` + myGroups.map(group => `
      <div class="group-card">
        <div class="group-cover">
          <img src="${group.cover}" alt="${group.name}">
        </div>
        <div class="group-info">
          <div class="group-name">${group.name}</div>
          <div class="group-meta">
            <i class="fas fa-${group.privacy === 'Private' ? 'lock' : 'globe-americas'}"></i> ${group.privacy} group · ${group.members} members
          </div>
        </div>
        <div class="group-actions">
          <button class="btn btn-primary" onclick="alert('Viewing ${group.name}')"><i class="fas fa-eye"></i> View Group</button>
        </div>
      </div>
    `).join('') + `</div>`;
  } 
  
  else if (tab === 'discover') {
    if (discoverGroups.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:var(--muted); margin-top:20px;">No suggestions available right now.</p>`;
      return;
    }
    container.innerHTML = `<div class="group-grid">` + discoverGroups.map(group => `
      <div class="group-card">
        <div class="group-cover">
          <img src="${group.cover}" alt="${group.name}">
        </div>
        <div class="group-info">
          <div class="group-name">${group.name}</div>
          <div class="group-meta">
            <i class="fas fa-${group.privacy === 'Private' ? 'lock' : 'globe-americas'}"></i> ${group.privacy} group · ${group.members} members
          </div>
        </div>
        <div class="group-actions">
          <button class="btn btn-primary" onclick="joinGroup(${group.id})"><i class="fas fa-plus"></i> Join Group</button>
        </div>
      </div>
    `).join('') + `</div>`;
  }
}

// ===== ACTIONS =====
function joinGroup(id) {
  const group = discoverGroups.find(g => g.id === id);
  if (!group) return;
  
  // Remove from discover
  discoverGroups = discoverGroups.filter(g => g.id !== id);
  
  // Add to myGroups
  myGroups.push(group);
  
  // Re-render
  renderTab('discover');
  alert(`✅ You have joined "${group.name}"!`);
}

function createGroup() {
  const name = document.getElementById('newGroupName').value.trim();
  const privacy = document.getElementById('newGroupPrivacy').value;

  if (!name) {
    alert("⚠️ Please enter a group name.");
    return;
  }

  const newGroup = {
    id: Date.now(),
    name: name,
    privacy: privacy,
    members: '1', // Just you initially
    cover: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80' // Default cover
  };

  myGroups.unshift(newGroup);
  
  // Clean up UI
  document.getElementById('newGroupName').value = '';
  closeModal('mCreateGroup');
  
  // Switch to My Groups tab
  switchTab('myGroups', document.querySelector('.tab-btn'));
  
  alert(`✅ Group "${name}" created successfully!`);
}

// ===== SEARCH FILTER =====
function filterGroups() {
  const query = document.getElementById('groupSearchInput').value.toLowerCase();
  const container = document.getElementById('groupsContent');

  let filteredList = [];
  
  if (currentTab === 'myGroups') {
    filteredList = myGroups.filter(g => g.name.toLowerCase().includes(query));
  } else {
    filteredList = discoverGroups.filter(g => g.name.toLowerCase().includes(query));
  }

  if (filteredList.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--muted); margin-top:20px;">No groups found matching "${query}".</p>`;
    return;
  }

  // Re-render the grid with filtered results
  container.innerHTML = `<div class="group-grid">` + filteredList.map(group => `
    <div class="group-card">
      <div class="group-cover">
        <img src="${group.cover}" alt="${group.name}">
      </div>
      <div class="group-info">
        <div class="group-name">${group.name}</div>
        <div class="group-meta">
          <i class="fas fa-${group.privacy === 'Private' ? 'lock' : 'globe-americas'}"></i> ${group.privacy} group · ${group.members} members
        </div>
      </div>
      <div class="group-actions">
        ${currentTab === 'myGroups' 
          ? `<button class="btn btn-primary" onclick="alert('Viewing ${group.name}')"><i class="fas fa-eye"></i> View Group</button>`
          : `<button class="btn btn-primary" onclick="joinGroup(${group.id})"><i class="fas fa-plus"></i> Join Group</button>`
        }
      </div>
    </div>
  `).join('') + `</div>`;
}

// ===== MODAL CONTROLS =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
