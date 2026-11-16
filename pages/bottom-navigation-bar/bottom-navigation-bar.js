// Switch Tab and Set Active Class
function switchNavTab(element, targetPage) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  element.classList.add('active');
  
  // Simulate navigation or update URL hash
  window.location.hash = targetPage;
}

function openCreateModal() {
  alert('Opening Autrobook Create Post Studio...');
}

function openNotificationsModal() {
  alert('You have 3 unread notifications.');
}

// Automatically sync active state based on current URL hash on load
window.addEventListener('DOMContentLoaded', () => {
  const currentHash = window.location.hash.substring(1);
  if (!currentHash) return;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    const onclickAttr = item.getAttribute('onclick') || '';
    if (onclickAttr.includes(currentHash)) {
      item.classList.add('active');
    }
  });
});
