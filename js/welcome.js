// ========== Supabase Config ==========
const SUPABASE_URL = 'https://gemyqaniztqrsilayblx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Page Load
document.addEventListener('DOMContentLoaded', init);

async function init(){
  await checkActiveSession(); // Check if already logged in
  loadAccounts();
}

// Check if user has active session
async function checkActiveSession(){
  const { data: { session } } = await supabase.auth.getSession();
  
  if(session){
    // Session exists = Go directly to home
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('current_user', session.user.email);
    window.location.href = 'index.html';
  }
}

// Load saved accounts from localStorage
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

// Quick Login - Click on account card
async function quickLogin(email){
  // No session, go to login page with email prefilled
  window.location.href = `login.html?email=${encodeURIComponent(email)}`;
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

// Remove All - Only removes from device, NOT from Supabase
async function removeAllAccounts(){
  if(confirm('Remove all saved profiles from this device?')){
    // 1. Sign out from Supabase - ends session only
    await supabase.auth.signOut();
    
    // 2. Clear local storage
    localStorage.removeItem('autro_saved_accounts');
    localStorage.removeItem('current_user');
    localStorage.removeItem('isLoggedIn');
    
    loadAccounts(); // Refresh UI
    closeSheet();
  }
}

// Call this from login.html after successful login
function addAccountToHistory(email, name = "User", avatar = "logo.png"){
  let accounts = JSON.parse(localStorage.getItem('autro_saved_accounts') || '[]');
  accounts = accounts.filter(acc => acc.email !== email);
  accounts.unshift({name, email, avatar});
  if(accounts.length > 5) accounts.pop();
  localStorage.setItem('autro_saved_accounts', JSON.stringify(accounts));
                                                                }
