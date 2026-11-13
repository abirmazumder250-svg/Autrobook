// ========== AUTROBOOK HELPER FUNCTIONS ==========

// 1. Get data from LocalStorage
function getData(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return localStorage.getItem(key);
  }
}

// 2. Save data to LocalStorage
function saveData(key, value) {
  if (typeof value === 'object') {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.setItem(key, value);
  }
}

// 3. Delete data from LocalStorage
function removeData(key) {
  localStorage.removeItem(key);
}

// 4. Format Time - "2 hours ago"
function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
}

// 5. Generate Random ID
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

// 6. Toggle Dark Mode - System Default + Manual
function toggleTheme() {
  document.body.classList.toggle('dark');
  if(document.body.classList.contains('dark')){
    saveData('theme', 'dark');
    showToast('Dark Mode ON');
  } else {
    saveData('theme', 'light');
    showToast('Light Mode ON');
  }
}

// 7. Check Login Status
function isLoggedIn() {
  return getData('user') ? true : false;
}

// 8. Get Current User
function getCurrentUser() {
  return getData('user') || { name: 'Guest', avatar: 'https://i.pravatar.cc/40' };
}

// 9. Logout User
function logout() {
  removeData('user');
  showToast('Logged Out');
  navigateTo('pages/59-login.html');
}

// 10. Format Number - 1500 -> 1.5K
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
}

// 11. Copy to Clipboard
function copyText(text) {
  navigator.clipboard.writeText(text);
  showToast('Copied!');
}

// 12. Scroll to Top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load theme on start
window.addEventListener('DOMContentLoaded', () => {
  if(getData('theme') === 'dark' || (!getData('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)){
    document.body.classList.add('dark');
  }
});
