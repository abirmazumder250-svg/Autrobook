/* ============================================================
   AUTROBOOK - MESSAGES PAGE JAVASCRIPT
   ============================================================ */

// ===== MOCK DATA =====
const chatListData = [
  { id: 1, name: 'Mita Mitra', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', snippet: 'See you tomorrow!', time: '2m', unread: 2, online: true },
  { id: 2, name: 'Tripurna Mazumder', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', snippet: 'That design was amazing 🔥', time: '1h', unread: 0, online: true },
  { id: 3, name: 'Rahul Khan', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', snippet: 'Sent you the track', time: '3h', unread: 0, online: false },
  { id: 4, name: 'Tech Chronicles', avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80', snippet: 'AI article is live now.', time: '1d', unread: 1, online: false },
  { id: 5, name: 'Daily Sports', avatar: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&q=80', snippet: 'What a match yesterday!', time: '2d', unread: 0, online: true }
];

let activeChatId = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderChatList(chatListData);
});

// ===== RENDER CHAT LIST =====
function renderChatList(chats) {
  const container = document.getElementById('chatListContainer');
  
  if (chats.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--muted); margin-top:20px;">No chats found.</p>`;
    return;
  }

  container.innerHTML = chats.map(chat => `
    <div class="chat-item" onclick="openChat(${chat.id})">
      <div style="position:relative;">
        <img src="${chat.avatar}" class="chat-item-avatar" alt="${chat.name}">
        ${chat.online ? '<div class="online-dot"></div>' : ''}
      </div>
      <div class="chat-item-info">
        <div class="chat-item-name">${chat.name}</div>
        <div class="chat-item-snippet" style="${chat.unread > 0 ? 'font-weight:600; color:var(--text);' : ''}">${chat.snippet}</div>
      </div>
      <div style="text-align:right;">
        <div class="chat-item-time">${chat.time}</div>
        ${chat.unread > 0 ? `<div class="unread-badge">${chat.unread}</div>` : ''}
      </div>
    </div>
  `).join('');
}

// ===== SEARCH FILTER =====
function filterChats() {
  const query = document.getElementById('chatSearchInput').value.toLowerCase();
  const filtered = chatListData.filter(c => c.name.toLowerCase().includes(query));
  renderChatList(filtered);
}

// ===== OPEN CHAT =====
function openChat(id) {
  const chat = chatListData.find(c => c.id === id);
  if (!chat) return;
  
  activeChatId = id;

  // Switch views
  document.getElementById('chatListView').classList.remove('active');
  document.getElementById('chatWindowView').classList.add('active');

  // Set header info
  document.getElementById('activeChatAvatar').src = chat.avatar;
  document.getElementById('activeChatName').textContent = chat.name;
  document.getElementById('activeChatStatus').textContent = chat.online ? 'Active now' : 'Offline';

  // Render messages (Mock conversation)
  const messageArea = document.getElementById('messageArea');
  messageArea.innerHTML = `
    <div class="msg-bubble msg-received">Hey Abir! How are you?</div>
    <div class="msg-bubble msg-sent">I'm good! Just working on the new Autrobook update. 🚀 <span class="msg-time">10:30 AM</span></div>
    <div class="msg-bubble msg-received">That sounds awesome. Let me know if you need help testing!</div>
  `;

  // Show AI suggestions if enabled
  document.getElementById('aiSuggestions').style.display = 'flex';
}

function closeChat() {
  document.getElementById('chatWindowView').classList.remove('active');
  document.getElementById('chatListView').classList.add('active');
  activeChatId = null;
}

// ===== SEND MESSAGE =====
function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  const messageArea = document.getElementById('messageArea');
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Append sent message
  const msgDiv = document.createElement('div');
  msgDiv.className = 'msg-bubble msg-sent';
  msgDiv.innerHTML = `${text} <span class="msg-time">${now}</span>`;
  messageArea.appendChild(msgDiv);

  // Clear input and scroll to bottom
  input.value = '';
  messageArea.scrollTop = messageArea.scrollHeight;

  // Simulate Auto-Reply (if not secret chat)
  setTimeout(() => {
    const replyDiv = document.createElement('div');
    replyDiv.className = 'msg-bubble msg-received';
    replyDiv.textContent = "Got it! I'll reply soon. 👍";
    messageArea.appendChild(replyDiv);
    messageArea.scrollTop = messageArea.scrollHeight;
  }, 1500);
}

function handleEnter(e) {
  if (e.key === 'Enter') sendMessage();
}

// ===== AI SUGGESTIONS =====
function useAISuggestion(text) {
  document.getElementById('chatInput').value = text;
  document.getElementById('chatInput').focus();
}

// ===== EXCLUSIVE CHAT SETTINGS =====
function toggleExclusive(element, featureName) {
  const toggle = element.querySelector('.toggle-switch');
  toggle.classList.toggle('active');
  
  const isActive = toggle.classList.contains('active');
  alert(`${featureName} is now ${isActive ? 'ON' : 'OFF'}`);
}

// ===== MODAL CONTROLS =====
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
