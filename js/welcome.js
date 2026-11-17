/* ========== SUPABASE & RECAPTCHA CONFIG ========== */
const SUPABASE_URL = "https://gemyqaniztqrsilayblx.supabase.co";
const SUPABASE_KEY = "sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ========== THEME LOGIC (FIXED) ========== */
function applyTheme() {
  const savedTheme = localStorage.getItem('autro_theme');
  const icon = document.getElementById('themeIcon');
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Default to system preference if no saved theme
  const isDark = savedTheme ? savedTheme === 'dark' : isSystemDark;

  if (isDark) {
    document.body.classList.add('theme-dark');
    if (icon) icon.className = 'fas fa-sun'; // Sun means "click to go light"
  } else {
    document.body.classList.remove('theme-dark');
    if (icon) icon.className = 'fas fa-moon'; // Moon means "click to go dark"
  }
}

function toggleTheme() {
  const isCurrentlyDark = document.body.classList.contains('theme-dark');
  // If it's currently dark, switch to light. Otherwise switch to dark.
  localStorage.setItem('autro_theme', isCurrentlyDark ? 'light' : 'dark');
  applyTheme();
}

/* ========== PROFILE RENDER & LONG PRESS ========== */
function showLogin(clearFields) {
  document.getElementById('profileScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('backBtn').style.display = 'block';
  if (clearFields) {
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authEmail').focus();
  }
}

function showProfiles() {
  const email = localStorage.getItem('autro_user_email');
  if (!email || email === 'guest@autrobook.com') {
    showLogin();
    document.getElementById('backBtn').style.display = 'none';
    return;
  }
  document.getElementById('profileScreen').style.display = 'block';
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('backBtn').style.display = 'none';
}

function renderProfiles() {
  const email = localStorage.getItem('autro_user_email');
  const name = localStorage.getItem('autro_user_name') || 'User';
  
  if (email && email !== 'guest@autrobook.com') {
    const list = document.getElementById('profileList');
    list.innerHTML = `
      <div class="profile-wrap" id="mainProfileCard">
        <button class="profile">
          <img src="https://i.pravatar.cc/100?img=12" alt="Profile">
          <span>
            <b>${name}</b>
            <span><span class="dot">●</span> 7 notifications</span>
          </span>
          <span class="arr"><i class="fas fa-chevron-right"></i></span>
        </button>
      </div>`;
      
    setupLongPress();
    showProfiles();
  } else {
    showLogin();
  }
}

/* --- LONG PRESS LOGIC --- */
function setupLongPress() {
  const card = document.getElementById('mainProfileCard');
  if (!card) return;

  let pressTimer;

  const startPress = (e) => {
    // Prevent default mobile context menu
    if(e.type === 'touchstart') e.preventDefault(); 
    
    card.classList.add('pressing');
    pressTimer = setTimeout(() => {
      card.classList.remove('pressing');
      document.getElementById('mRemoveProfile').style.display = 'flex';
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate(50); 
    }, 800); // 800ms hold time
  };

  const cancelPress = () => {
    clearTimeout(pressTimer);
    card.classList.remove('pressing');
  };

  // Mouse events
  card.addEventListener('mousedown', startPress);
  card.addEventListener('mouseup', cancelPress);
  card.addEventListener('mouseleave', cancelPress);
  
  // Touch events
  card.addEventListener('touchstart', startPress);
  card.addEventListener('touchend', cancelPress);
  card.addEventListener('touchcancel', cancelPress);
}

/* ========== DELETE / REMOVE PROFILE ========== */
function closeRemoveProfile() {
  document.getElementById('mRemoveProfile').style.display = 'none';
}

function removeProfileOnly() {
  localStorage.removeItem('autro_user_email');
  localStorage.removeItem('autro_user_name');
  localStorage.removeItem('autro_user_id');
  closeRemoveProfile();
  showToast('Profile removed from this device');
  setTimeout(() => { location.reload(); }, 800);
}

async function deleteAccountPermanently() {
  if (!confirm('Warning: This will permanently delete your account from the server. Are you sure?')) return;
  
  try {
    // 1. Delete user data from 'profiles' table
    const { data: userData } = await supabase.auth.getUser();
    
    if (userData && userData.user) {
      await supabase.from('profiles').delete().eq('id', userData.user.id);
    }
    
    // 2. Sign out locally (Actual Auth deletion requires backend admin privileges usually, 
    // but we will clear all local data and log them out)
    await supabase.auth.signOut();
    localStorage.clear(); // Clear all autrobook related data
    
    closeRemoveProfile();
    showToast('Account deleted permanently.');
    setTimeout(() => { location.reload(); }, 1000);
    
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

/* ========== AUTH & UI HELPERS ========== */
function switchTab(tab) {
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
  document.getElementById('signupNameWrap').style.display = tab === 'signup' ? 'block' : 'none';
  
  const btn = document.getElementById('authSubmitBtn');
  btn.textContent = tab === 'signup' ? 'Create new account' : 'Log in';
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function onCaptchaSuccess() { window.captchaOk = true; }
function onCaptchaExpired() { window.captchaOk = false; }

async function submitAuth() {
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPassword').value.trim();
  const nameInput = document.getElementById('authName');
  const name = nameInput ? nameInput.value.trim() : '';
  const btn = document.getElementById('authSubmitBtn');
  const isSignup = document.getElementById('tabSignup').classList.contains('active');

  if (!email || !pass) { showToast('Please enter email and password'); return; }
  if (!window.captchaOk) { showToast('Please complete reCAPTCHA'); return; }
  if (isSignup && !name) { showToast('Please enter your full name'); return; }

  btn.disabled = true;
  const oldText = btn.textContent;
  btn.textContent = 'Please wait...';

  try {
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password: pass, 
        options: { data: { full_name: name } } 
      });
      if (error) throw error;
      
      if(data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, email: email, full_name: name });
      }
      showToast('Account created! Please log in.');
      switchTab('login');
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      
      const user = data.user;
      const userName = user.user_metadata?.full_name || email.split('@')[0];
      
      localStorage.setItem('autro_user_email', user.email);
      localStorage.setItem('autro_user_name', userName);
      localStorage.setItem('autro_user_id', user.id);
      
      showToast('Welcome back, ' + userName + '!');
      setTimeout(() => { window.location.href = 'home.html'; }, 800); // Assuming you have a home.html
    }
  } catch (err) {
    showToast(err.message || 'Authentication failed');
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
    if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
    window.captchaOk = false;
  }
}

function forgotPassword() {
  showToast('Password reset feature requires backend setup.');
}

function continueAsGuest() {
  localStorage.setItem('autro_user_email', 'guest@autrobook.com');
  localStorage.setItem('autro_user_name', 'Guest');
  window.location.href = 'home.html';
}

function loginWithFingerprint() {
  showToast('Biometric authentication requires device setup.');
}

function openLang() { document.getElementById('langModal').style.display = 'flex'; }
function closeLang() { document.getElementById('langModal').style.display = 'none'; }

function setupPasskeyFromWelcome() {
  document.getElementById('mSetupPasskey').style.display = 'none';
  window.location.href = 'home.html';
}
function closePasskeyModal() {
  document.getElementById('mSetupPasskey').style.display = 'none';
  window.location.href = 'home.html';
}

/* ========== INITIALIZATION ========== */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  renderProfiles();
  switchTab('login');
});
