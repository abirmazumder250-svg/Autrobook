document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  
  setTimeout(() => {
    if(isLoggedIn === 'true'){
      // Already logged in = go to home
      window.location.href = 'index.html';
    } else {
      // Not logged in = go to welcome
      window.location.href = 'welcome.html';
    }
  }, 2000); // 2 seconds splash
});
