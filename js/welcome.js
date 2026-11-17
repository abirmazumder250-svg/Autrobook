// ========== Account Switcher Logic ==========

// Load accounts when page loads
document.addEventListener('DOMContentLoaded', loadAccounts);

// Load saved accounts and show in UI
function loadAccounts(){
  const accounts = JSON.parse(localStorage.getItem('autro_saved_accounts') || '[]');
  const list = document.getElementById('accountsList');
  
  if(accounts.length === 0){ 
    list.innerHTML = ''; 
    return; 
  }

  list.innerHTML = accounts.map(acc => `
    <div class="account-card" onclick="quickLogin('${acc.email}')">
      <img src="${acc.avatar || 'logo.png'}" alt="${acc.name}">
      <div class="account-info">
        <div class="name">${acc.name}</div>
        ${acc.notif ? `<div class="note"><span class="dot">●</span>${acc.notif} notifications</div>` : ''}
      </div>
      <div class="arrow">›</div>
    </div>
  `).join('');
}

// Quick Login - When you click on account card
function quickLogin(email){
  // Later you can check Token from Supabase here
  // For now it directly goes to index.html
  
  // Set current user
  localStorage.setItem('current_user', email);
  localStorage.setItem('isLoggedIn', 'true');
  
  // Add to login history
  addAccountToHistory(email);
  
  window.location.href = 'index.html';
}

// "Use another profile" button
function goToLogin(){
  window.location.href = 'login.html';
}

// ========== Bottom Sheet Logic ==========
function openSheet(){ 
  document.getElementById('overlay').style.display='block';
  setTimeout(() => {
    document.getElementById('bottomSheet').classList.add('show');
  }, 10);
}

function closeSheet(){
  document.getElementById('bottomSheet').classList.remove('show');
  setTimeout(() => {
    document.getElementById('overlay').style.display='none';
  }, 300);
}

// Remove All Profiles
function removeAllAccounts(){
  if(confirm('Remove all saved profiles from this device?')){
    localStorage.removeItem('autro_saved_accounts');
    localStorage.removeItem('current_user');
    loadAccounts(); // Refresh UI
    closeSheet();
  }
}

// ========== Helper Functions ==========

// Call this after successful login from login.html
function addAccountToHistory(email, name = "User", avatar = "logo.png"){
  let accounts = JSON.parse(localStorage.getItem('autro_saved_accounts') || '[]');
  
  // Remove if already exists
  accounts = accounts.filter(acc => acc.email !== email);
  
  // Add new account to top
  accounts.unshift({name, email, avatar});
  
  // Keep max 5 accounts
  if(accounts.length > 5) accounts.pop();
  
  localStorage.setItem('autro_saved_accounts', JSON.stringify(accounts));
}

// ========== Demo Data - For Testing ==========
// Enable this line once for testing, then comment it out

function addDemoAccount(){
  const demo = [
    {name: "Abir Mazumder", email: "abir1@mail.com", avatar: "logo.png"},
    {name: "Abir Mazumder", email: "abir2@mail.com", avatar: "logo.png", notif: 7}
  ];
  localStorage.setItem('autro_saved_accounts', JSON.stringify(demo));
}

// addDemoAccount(); // <-- Enable this only for first test
